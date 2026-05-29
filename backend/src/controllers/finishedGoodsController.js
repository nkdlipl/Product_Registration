const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

const hardwareInventoryConfig = {
    pcb: {
        table: 'PCB_MASTER',
        idColumn: 'pcb_id',
        nameExpression: "COALESCE(NULLIF(TRIM(pcb_name), ''), NULLIF(TRIM(part_no), ''), 'Unnamed PCB')"
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
        
        const finishedGoods = await Promise.all(result.rows.map(async (fg) => {
            const hardware = await db.query('SELECT * FROM finished_goods_hardware WHERE finished_good_id = $1', [fg.id]);
            const serials = await db.query('SELECT * FROM finished_goods_serials WHERE finished_good_id = $1', [fg.id]);
            
            return {
                ...fg,
                hardware_features: hardware.rows,
                serial_numbers: serials.rows.map(s => s.serial_number)
            };
        }));

        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        sendSuccess(res, finishedGoods, { page, limit, total });
    } catch (error) {
        next(error);
    }
};

const updateHardwareInventory = async (hardwareFeatures, qty, isRefund = false) => {
    const amount = parseQuantity(qty);
    if (amount <= 0 || !Array.isArray(hardwareFeatures)) return;
    
    for (const feature of hardwareFeatures) {
        const type = feature.type || feature.component_type;
        const id = feature.id || feature.component_id;
        
        const config = hardwareInventoryConfig[type];
        if (config) {
            if (isRefund) {
                await db.query(`UPDATE ${config.table} SET stock_quantity = COALESCE(stock_quantity, 0) + $1 WHERE ${config.idColumn} = $2`, [amount, id]);
            } else {
                await db.query(`UPDATE ${config.table} SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - $1, 0) WHERE ${config.idColumn} = $2`, [amount, id]);
            }
        }
    }
};

const createFinishedGood = async (req, res, next) => {
    const { product_id, quantity, hardware_features, communication_details, power_controller, motherboard_id, is_iot } = req.body;

    try {
        const inventoryCheck = await validateHardwareInventory(hardware_features, quantity);
        if (inventoryCheck) {
            return sendError(res, 'INSUFFICIENT_INVENTORY', inventoryCheck.message, 400);
        }

        await db.query('BEGIN');

        const isIotEnabled = is_iot === true || is_iot === 'true';

        const fgResult = await db.query(
            'INSERT INTO finished_goods (product_id, quantity, is_iot, communication_details, power_controller, motherboard_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [
                product_id, 
                quantity || 1, 
                isIotEnabled,
                isIotEnabled ? JSON.stringify(communication_details || []) : '[]',
                isIotEnabled ? !!power_controller : false,
                isIotEnabled ? (motherboard_id || null) : null
            ]
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
            await updateHardwareInventory(hardware_features, quantity, false);
        }

        if (isIotEnabled && motherboard_id) {
            await updateHardwareInventory([{ type: 'pcb', id: motherboard_id }], quantity, false);
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
        
        // PCB Master (Distinct by pcb_name)
        const pcbs = await db.query(`
            SELECT DISTINCT ON (LOWER(TRIM(pcb_name))) pcb_id as id, TRIM(pcb_name) as name, COALESCE(stock_quantity, 0) AS stock_quantity 
            FROM PCB_MASTER 
            WHERE is_active = TRUE AND pcb_name IS NOT NULL AND TRIM(pcb_name) != ''
            ORDER BY LOWER(TRIM(pcb_name))
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

        // Check if referenced by book_a_sale
        const saleCheck = await db.query('SELECT 1 FROM book_a_sale WHERE finished_good_id = $1 LIMIT 1', [id]);
        if (saleCheck.rows.length > 0) {
            await db.query('ROLLBACK');
            return sendError(res, 'FOREIGN_KEY_VIOLATION', 'Cannot delete this Finished Good because it has already been sold (referenced in Book a Sale).', 400);
        }

        const existing = await db.query('SELECT quantity, motherboard_id, is_iot FROM finished_goods WHERE id = $1', [id]);
        if (existing.rows.length > 0) {
            const oldQty = existing.rows[0].quantity;
            const oldFeaturesRes = await db.query('SELECT component_type as type, component_id as id FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);
            await updateHardwareInventory(oldFeaturesRes.rows, oldQty, true);
            
            if (existing.rows[0].is_iot && existing.rows[0].motherboard_id) {
                await updateHardwareInventory([{ type: 'pcb', id: existing.rows[0].motherboard_id }], oldQty, true);
            }
        }

        // Remove serials and hardware entries
        await db.query('DELETE FROM finished_goods_serials WHERE finished_good_id = $1', [id]);
        await db.query('DELETE FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);

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
    const { product_id, quantity, hardware_features, communication_details, power_controller, motherboard_id, is_iot } = req.body;

    try {
        const inventoryCheck = await validateHardwareInventory(hardware_features, quantity);
        if (inventoryCheck) {
            return sendError(res, 'INSUFFICIENT_INVENTORY', inventoryCheck.message, 400);
        }

        await db.query('BEGIN');

        // Check if finished good exists
        const existing = await db.query('SELECT * FROM finished_goods WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await db.query('ROLLBACK');
            return sendError(res, 'NOT_FOUND', 'Finished Good not found', 404);
        }

        const oldQty = existing.rows[0].quantity;
        const oldProductId = existing.rows[0].product_id;
        const isIotEnabled = is_iot === true || is_iot === 'true';

        // Refund old features
        const oldFeaturesRes = await db.query('SELECT component_type as type, component_id as id FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);
        await updateHardwareInventory(oldFeaturesRes.rows, oldQty, true);
        if (existing.rows[0].is_iot && existing.rows[0].motherboard_id) {
            await updateHardwareInventory([{ type: 'pcb', id: existing.rows[0].motherboard_id }], oldQty, true);
        }

        // Update finished goods table
        await db.query(
            'UPDATE finished_goods SET product_id = $1, quantity = $2, is_iot = $3, communication_details = $4, power_controller = $5, motherboard_id = $6, updated_at = NOW() WHERE id = $7',
            [
                product_id, 
                quantity || 1, 
                isIotEnabled,
                isIotEnabled ? JSON.stringify(communication_details || []) : '[]',
                isIotEnabled ? !!power_controller : false,
                isIotEnabled ? (motherboard_id || null) : null,
                id
            ]
        );

        // Update hardware features
        await db.query('DELETE FROM finished_goods_hardware WHERE finished_good_id = $1', [id]);
        if (hardware_features && Array.isArray(hardware_features)) {
            for (const feature of hardware_features) {
                await db.query(
                    'INSERT INTO finished_goods_hardware (finished_good_id, component_type, component_id) VALUES ($1, $2, $3)',
                    [id, feature.type, feature.id]
                );
            }
            await updateHardwareInventory(hardware_features, quantity, false);
        }

        if (isIotEnabled && motherboard_id) {
            await updateHardwareInventory([{ type: 'pcb', id: motherboard_id }], quantity, false);
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
