const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

const hardwareInventoryConfig = {
    pcb: {
        table: 'PCB_MASTER',
        idColumn: 'pcb_id',
        nameExpression: "COALESCE(NULLIF(TRIM(part_no), ''), NULLIF(TRIM(pcb_name), ''), 'Unnamed PCB')"
    },
    electrical: {
        table: 'electrical_part_master',
        idColumn: 'part_id',
        nameExpression: "TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END"
    },
    electronics: {
        table: 'electronics_part_master',
        idColumn: 'part_id',
        nameExpression: "TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END"
    },
    structural: {
        table: 'structural_part_master',
        idColumn: 'part_id',
        nameExpression: "TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END"
    }
};

const parseQuantity = (value) => Number.parseInt(value, 10) || 0;

const getHardwareInventoryState = async (hardwareFeatures = []) => {
    const rows = await Promise.all(hardwareFeatures.map(async (feature) => {
        const config = hardwareInventoryConfig[feature.type];
        if (!config) {
            return {
                ...feature,
                name: feature.name || `ID: ${feature.id}`,
                stockQuantity: 0
            };
        }

        const result = await db.query(
            `SELECT ${config.nameExpression} AS name, COALESCE(stock_quantity, 0) AS stock_quantity
             FROM ${config.table}
             WHERE ${config.idColumn} = $1`,
            [feature.id]
        );

        const row = result.rows[0];
        return {
            ...feature,
            name: row?.name || feature.name || `ID: ${feature.id}`,
            stockQuantity: parseQuantity(row?.stock_quantity)
        };
    }));

    return rows;
};

const validateHardwareInventory = async (hardwareFeatures = [], quantity = 1) => {
    const requestedQuantity = Math.max(parseQuantity(quantity), 1);
    if (!Array.isArray(hardwareFeatures) || hardwareFeatures.length === 0) {
        return null;
    }

    const inventoryState = await getHardwareInventoryState(hardwareFeatures);
    const shortage = inventoryState.find((feature) => feature.stockQuantity < requestedQuantity);

    if (!shortage) {
        return null;
    }

    return {
        message: `${shortage.name} quantity is not enough in the inventory. Required ${requestedQuantity}, available ${shortage.stockQuantity}.`,
        feature: shortage
    };
};

const getFinishedGoods = async (req, res, next) => {
    const { page, limit, offset } = parsePagination(req);
    const { search } = req.query;

    try {
        let queryText = `
            SELECT fg.*, p.product_name, p.product_code,
            COUNT(*) OVER() as total_count 
            FROM finished_goods fg
            JOIN products p ON fg.product_id = p.product_id
            WHERE 1=1
        `;
        const params = [limit, offset];

        if (search) {
            queryText += ` AND (p.product_name ILIKE $3 OR p.product_code ILIKE $3)`;
            params.push(`%${search}%`);
        }

        queryText += ` ORDER BY fg.created_at DESC LIMIT $1 OFFSET $2`;

        const result = await db.query(queryText, params);
        
        // For each finished good, fetch hardware, software and serials
        const finishedGoods = await Promise.all(result.rows.map(async (fg) => {
            const hardware = await db.query('SELECT * FROM finished_goods_hardware WHERE finished_good_id = $1', [fg.id]);
            const software = await db.query('SELECT * FROM finished_goods_software WHERE finished_good_id = $1', [fg.id]);
            const serials = await db.query('SELECT * FROM finished_goods_serials WHERE finished_good_id = $1', [fg.id]);
            
            return {
                ...fg,
                hardware_features: hardware.rows,
                software_features: software.rows,
                serial_numbers: serials.rows.map(s => s.serial_number)
            };
        }));

        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        sendSuccess(res, finishedGoods, { page, limit, total });
    } catch (error) {
        next(error);
    }
};

const createFinishedGood = async (req, res, next) => {
    const { product_id, quantity, hardware_features, software_features, is_iot } = req.body;
    
    // hardware_features: [{type: 'pcb', id: 1}, {type: 'electrical', id: 5}]
    // software_features: ['feature 1', 'feature 2']

    try {
        const inventoryCheck = await validateHardwareInventory(hardware_features, quantity);
        if (inventoryCheck) {
            return sendError(res, 'INSUFFICIENT_INVENTORY', inventoryCheck.message, 400);
        }

        await db.query('BEGIN');

        const fgResult = await db.query(
            'INSERT INTO finished_goods (product_id, quantity, is_iot) VALUES ($1, $2, $3) RETURNING id',
            [product_id, quantity || 1, is_iot === true || is_iot === 'true']
        );
        const finished_good_id = fgResult.rows[0].id;

        // Insert hardware features
        if (hardware_features && Array.isArray(hardware_features)) {
            for (const feature of hardware_features) {
                await db.query(
                    'INSERT INTO finished_goods_hardware (finished_good_id, component_type, component_id) VALUES ($1, $2, $3)',
                    [finished_good_id, feature.type, feature.id]
                );
            }
        }

        // Insert software features
        if (software_features && Array.isArray(software_features)) {
            for (const featureName of software_features) {
                await db.query(
                    'INSERT INTO finished_goods_software (finished_good_id, feature_name) VALUES ($1, $2)',
                    [finished_good_id, featureName]
                );
            }
        }

        // Generate serial numbers based on quantity
        const serialNumbers = [];
        const qty = parseInt(quantity) || 1;
        for (let i = 0; i < qty; i++) {
            const serialNumber = `FG-${product_id}-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`;
            serialNumbers.push(serialNumber);
            await db.query(
                'INSERT INTO finished_goods_serials (finished_good_id, serial_number) VALUES ($1, $2)',
                [finished_good_id, serialNumber]
            );
        }

        await db.query('COMMIT');

        sendSuccess(res, { id: finished_good_id, serial_numbers: serialNumbers }, 'Finished Good created successfully');
    } catch (error) {
        await db.query('ROLLBACK');
        next(error);
    }
};

const getComponentOptions = async (req, res, next) => {
    try {
        const products = await db.query('SELECT product_id as id, product_name as name FROM products WHERE is_active = TRUE ORDER BY product_name');
        
        // PCB Master (Distinct by part_no)
        const pcbs = await db.query(`
            SELECT DISTINCT ON (LOWER(TRIM(part_no))) pcb_id as id, TRIM(part_no) as name, COALESCE(stock_quantity, 0) AS stock_quantity 
            FROM PCB_MASTER 
            WHERE is_active = TRUE AND part_no IS NOT NULL AND TRIM(part_no) != ''
            ORDER BY LOWER(TRIM(part_no))
        `);
        
        // Electrical Parts (Distinct by part_name and part_number)
        const electrical = await db.query(`
            SELECT DISTINCT ON (LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))) 
                   part_id as id, 
                   TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END as name,
                   COALESCE(stock_quantity, 0) AS stock_quantity
            FROM electrical_part_master 
            WHERE is_active = TRUE AND part_name IS NOT NULL AND TRIM(part_name) != ''
            ORDER BY LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))
        `);
        
        // Electronics Parts (Distinct by part_name and part_number)
        const electronics = await db.query(`
            SELECT DISTINCT ON (LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))) 
                   part_id as id, 
                   TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END as name,
                   COALESCE(stock_quantity, 0) AS stock_quantity
            FROM electronics_part_master 
            WHERE is_active = TRUE AND part_name IS NOT NULL AND TRIM(part_name) != ''
            ORDER BY LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))
        `);
        
        // Structural Parts (Distinct by part_name and part_number)
        const structural = await db.query(`
            SELECT DISTINCT ON (LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))) 
                   part_id as id, 
                   TRIM(part_name) || CASE WHEN part_number IS NOT NULL AND TRIM(part_number) != '' THEN ' (' || TRIM(part_number) || ')' ELSE '' END as name,
                   COALESCE(stock_quantity, 0) AS stock_quantity
            FROM structural_part_master 
            WHERE is_active = TRUE AND part_name IS NOT NULL AND TRIM(part_name) != ''
            ORDER BY LOWER(TRIM(part_name)), LOWER(TRIM(COALESCE(part_number, '')))
        `);

        sendSuccess(res, {
            products: products.rows,
            pcb: pcbs.rows,
            electrical: electrical.rows,
            electronics: electronics.rows,
            structural: structural.rows
        });
    } catch (error) {
        next(error);
    }
};

const deleteFinishedGood = async (req, res, next) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');

        // Remove serials, hardware and software entries
        await db.query('DELETE FROM finished_goods_serials WHERE finished_good_id = $1', [id]);
        await db.query('DELETE FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);
        await db.query('DELETE FROM finished_goods_software WHERE finished_good_id = $1', [id]);

        // Remove the finished good record
        await db.query('DELETE FROM finished_goods WHERE id = $1', [id]);

        await db.query('COMMIT');
        sendSuccess(res, { id }, 'Finished Good deleted successfully');
    } catch (err) {
        await db.query('ROLLBACK');
        next(err);
    }
};

const updateFinishedGood = async (req, res, next) => {
    const { id } = req.params;
    const { product_id, quantity, hardware_features, software_features, is_iot } = req.body;

    try {
        const inventoryCheck = await validateHardwareInventory(hardware_features, quantity);
        if (inventoryCheck) {
            return sendError(res, 'INSUFFICIENT_INVENTORY', inventoryCheck.message, 400);
        }

        await db.query('BEGIN');

        // Check if finished good exists
        const fgCheck = await db.query('SELECT * FROM finished_goods WHERE id = $1', [id]);
        if (fgCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Finished Good not found' });
        }

        const oldQty = fgCheck.rows[0].quantity;
        const oldProductId = fgCheck.rows[0].product_id;

        // Update finished_goods table
        await db.query(
            'UPDATE finished_goods SET product_id = $1, quantity = $2, is_iot = $3, updated_at = NOW() WHERE id = $4',
            [product_id, quantity || 1, is_iot === true || is_iot === 'true', id]
        );

        // Update hardware features (delete existing and insert new ones)
        await db.query('DELETE FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);
        if (hardware_features && Array.isArray(hardware_features)) {
            for (const feature of hardware_features) {
                await db.query(
                    'INSERT INTO finished_goods_hardware (finished_good_id, component_type, component_id) VALUES ($1, $2, $3)',
                    [id, feature.type, feature.id]
                );
            }
        }

        // Update software features (delete existing and insert new ones)
        await db.query('DELETE FROM finished_goods_software WHERE finished_good_id = $1', [id]);
        if (is_iot && software_features && Array.isArray(software_features)) {
            for (const featureName of software_features) {
                await db.query(
                    'INSERT INTO finished_goods_software (finished_good_id, feature_name) VALUES ($1, $2)',
                    [id, featureName]
                );
            }
        }

        // Handle serial numbers
        if (parseInt(oldQty) !== parseInt(quantity) || parseInt(oldProductId) !== parseInt(product_id)) {
            await db.query('DELETE FROM finished_goods_serials WHERE finished_good_id = $1', [id]);
            const serialNumbers = [];
            const qty = parseInt(quantity) || 1;
            for (let i = 0; i < qty; i++) {
                const serialNumber = `FG-${product_id}-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`;
                serialNumbers.push(serialNumber);
                await db.query(
                    'INSERT INTO finished_goods_serials (finished_good_id, serial_number) VALUES ($1, $2)',
                    [id, serialNumber]
                );
            }
        }

        await db.query('COMMIT');
        sendSuccess(res, null, 'Finished Good updated successfully');
    } catch (error) {
        await db.query('ROLLBACK');
        next(error);
    }
};

module.exports = {
    getFinishedGoods,
    createFinishedGood,
    getComponentOptions,
    deleteFinishedGood,
    updateFinishedGood
};
