const db = require('../config/db');
const { sendSuccess } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

const getStructuralParts = async (req, res, next) => {
  const { page, limit, offset } = parsePagination(req);
  const { search } = req.query;

  try {
    let queryText = `
      SELECT p.*, 
      (SELECT image_url FROM STRUCTURAL_IMAGES WHERE part_id = p.part_id LIMIT 1) as image_url,
      COUNT(*) OVER() as total_count 
      FROM STRUCTURAL_PART_MASTER p
      WHERE p.is_active = TRUE
    `;
    const params = [limit, offset];

    if (search) {
      queryText += ` AND (p.part_name ILIKE $3 OR p.part_number ILIKE $3 OR p.part_category ILIKE $3 OR p.internal_part_code ILIKE $3)`;
      params.push(`%${search}%`);
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`;

    const result = await db.query(queryText, params);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    sendSuccess(res, result.rows.map(({ total_count, ...rest }) => rest), { page, limit, total });
  } catch (error) {
    next(error);
  }
};

const getStructuralPartById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const partResult = await db.query(`
            SELECT * FROM STRUCTURAL_PART_MASTER WHERE part_id = $1 AND is_active = TRUE
        `, [id]);

        if (partResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Structural Part not found' } });
        }

        const part = partResult.rows[0];

        const techSpecResult = await db.query('SELECT * FROM STRUCTURAL_TECH_SPEC WHERE part_id = $1', [id]);
        
        // Dynamic Category Fetching
        const categorySpecResult = await db.query('SELECT category_name, spec_data FROM STRUCTURAL_CATEGORY_SPEC WHERE part_id = $1', [id]);
        const categorySpec = categorySpecResult.rows[0];

        // Fetch specialized data if table exists
        let categoryData = {};
        if (categorySpec) {
            const tableMap = {
                'Cabinet Body': 'cabinet_body_specs',
                'Front Door': 'front_door_specs',
                'Side Panel': 'side_panel_specs',
                'Top Cover': 'top_cover_specs',
                'Base Frame': 'base_frame_specs',
                'Internal Mounting Plate': 'internal_mounting_plate_specs',
                'Nozzle Holder': 'nozzle_holder_specs',
                'Hose Entry Plate': 'hose_entry_plate_specs',
                'Display': 'display_specs',
                'Lock': 'lock_specs'
            };

            const tableName = tableMap[categorySpec.category_name];
            if (tableName) {
                const specRes = await db.query(`SELECT * FROM ${tableName} WHERE part_id = $1`, [id]);
                if (specRes.rows.length > 0) {
                    categoryData = specRes.rows[0];
                }
            }
        }

        // Fetch Images
        const imagesResult = await db.query('SELECT image_url FROM STRUCTURAL_IMAGES WHERE part_id = $1', [id]);
        
        sendSuccess(res, {
            ...part,
            techSpec: techSpecResult.rows[0],
            categorySpec: categorySpec,
            categoryData: categoryData,
            images: imagesResult.rows.map(r => r.image_url)
        });
    } catch (error) {
        next(error);
    }
};

const createStructuralPart = async (req, res, next) => {
    const body = req.body;
    const { category_name, spec_data, ...masterData } = body;

    try {
        await db.query('BEGIN');

        // 1. Insert Master
        const masterFields = ['part_category', 'part_name', 'part_number', 'internal_part_code', 'compatible_dispenser_model', 'assembly_group', 'part_position', 'part_description', 'manufacturer_fabricator', 'brand', 'status'];
        const masterValues = masterFields.map(f => body[f]);
        const masterPlaceholders = masterFields.map((_, i) => `$${i + 1}`).join(', ');
        
        const masterResult = await db.query(
            `INSERT INTO STRUCTURAL_PART_MASTER (${masterFields.join(', ')}) VALUES (${masterPlaceholders}) RETURNING part_id`,
            masterValues
        );
        const partId = masterResult.rows[0].part_id;

        // 2. Insert Tech Spec
        const techFields = ['material_type', 'material_grade', 'sheet_thickness', 'surface_finish', 'paint_coating_color', 'coating_thickness', 'corrosion_protection', 'rust_proof_treatment', 'welding_required', 'bending_required', 'laser_cutting_required', 'cnc_cutting_required', 'edge_finish', 'waterproof_sealing_required', 'rubber_gasket_required', 'length', 'width', 'height', 'thickness', 'weight', 'tolerance', 'hole_count', 'hole_diameter', 'cutout_available', 'cutout_type', 'cutout_size', 'bend_angle', 'bend_count', 'mounting_hole_pattern'];
        const techValues = techFields.map(f => body[f]);
        const techPlaceholders = techFields.map((_, i) => `$${i + 2}`).join(', ');

        await db.query(
            `INSERT INTO STRUCTURAL_TECH_SPEC (part_id, ${techFields.join(', ')}) VALUES ($1, ${techPlaceholders})`,
            [partId, ...techValues]
        );

        // 3. Category Spec & Specialized Routing
        if (category_name) {
            const parsedData = typeof spec_data === 'string' ? JSON.parse(spec_data) : spec_data;
            
            await db.query(
                `INSERT INTO STRUCTURAL_CATEGORY_SPEC (part_id, category_name, spec_data) VALUES ($1, $2, $3)`,
                [partId, category_name, JSON.stringify(parsedData || {})]
            );

            // Mapping for specialized tables
            const mapping = {
                'Cabinet Body': { table: 'cabinet_body_specs', columns: ['cabinet_type', 'cabinet_material', 'cabinet_height', 'cabinet_width', 'cabinet_depth', 'door_opening_side', 'ventilation_available', 'number_of_vents', 'ip_protection_target', 'internal_mounting_plate_available', 'base_stand_available', 'locking_arrangement', 'cable_entry_holes', 'hose_entry_hole', 'earthing_point_available'] },
                'Front Door': { table: 'front_door_specs', columns: ['door_type', 'door_material', 'door_opening_direction', 'lock_type', 'look_count', 'hinge_type', 'hinge_count', 'rubber_gasket_available', 'display_cutout_available', 'printer_cutout_available', 'keypad_cutout_available', 'sticker_area_available', 'door_stopper_available'] },
                'Side Panel': { table: 'side_panel_specs', columns: ['panel_side', 'panel_type', 'ventilation_slot_available', 'number_of_vent_slots', 'access_opening_available', 'hose_pipe_opening_available', 'nozzle_holder_mounting_available', 'fastner_type', 'panel_reinforcement_available'] },
                'Top Cover': { table: 'top_cover_specs', columns: ['cover_type', 'rain_protection_design', 'overhang_available', 'mounting_type', 'sealing_gasket_available', 'cable_entry_available', 'ventilation_available', 'branding_area_available'] },
                'Base Frame': { table: 'base_frame_specs', columns: ['base_type', 'base_material', 'load_capacity', 'foot_stand_count', 'floor_mounting_hole_available', 'anchor_bolt_size', 'anti_vibration_pad_available', 'leveling_foot_available', 'bottom_clearance', 'drain_hole_available'] },
                'Internal Mounting Plate': { table: 'internal_mounting_plate_specs', columns: ['plate_usage', 'plate_material', 'mounting_hole_pattern', 'component_mounting_slots', 'cable_routing_holes', 'din_rail_mounting_available', 'earthing_stud_available', 'removable_plate'] },
                'Nozzle Holder': { table: 'nozzle_holder_specs', columns: ['holder_type', 'nozzle_compatibility', 'holder_material', 'mounting_side', 'nozzle_sensor_mount_available', 'drain_hole_available', 'locking_support_available', 'rubber_padding_available', 'cutout_size'] },
                'Hose Entry Plate': { table: 'hose_entry_plate_specs', columns: ['hose_entry_type', 'hose_diameter_support', 'grommet_available', 'pipe_clamp_mount_available', 'swivel_mount_support', 'hole_diameter', 'reinforcement_plate_available', 'leak_drain_path_available'] },
                'Display': { table: 'display_specs', columns: ['panel_usage', 'display_cutout_size', 'keypad_cutout_available', 'printer_cutout_available', 'acrylic_window_available', 'window_material', 'window_thickness', 'sticker_branding_area', 'button_hole_count', 'indicator_hole_count'] },
                'Lock': { table: 'lock_specs', columns: ['hardware_type', 'material', 'size', 'load_capacity', 'opening_angle', 'fastener_size', 'finish', 'quantity_per_dispenser', 'replacement_required'] }
            };

            const target = mapping[category_name];
            if (target) {
                const files = req.files || {};
                const fileFields = ['file_2d_drawing', 'file_3d_model', 'file_fabrication_drawing', 'file_assembly_drawing', 'file_cutting'];
                
                const colNames = ['part_id', ...target.columns, ...fileFields, 'part_images_gallery'];
                const values = [
                    partId,
                    ...target.columns.map(c => parsedData[c]),
                    ...fileFields.map(f => files[f] ? `/uploads/inventory/${files[f][0].filename}` : null),
                    JSON.stringify(files['part_images'] ? files['part_images'].map(f => `/uploads/inventory/${f.filename}`) : [])
                ];
                const placeholders = colNames.map((_, i) => `$${i + 1}`).join(', ');

                await db.query(
                    `INSERT INTO ${target.table} (${colNames.join(', ')}) VALUES (${placeholders})`,
                    values
                );
            }
        }

        // 4. Handle Images for Master Gallery
        if (req.files && req.files['part_images']) {
            const imageValues = req.files['part_images'].map(f => `(${partId}, '/uploads/inventory/${f.filename}')`).join(', ');
            await db.query(`INSERT INTO STRUCTURAL_IMAGES (part_id, image_url) VALUES ${imageValues}`);
        }

        await db.query('COMMIT');
        sendSuccess(res, { part_id: partId }, 'Structural Part registered successfully', 201);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Create Error:', error);
        next(error);
    }
};

const updateStructuralPart = async (req, res, next) => {
    const { id } = req.params;
    const body = req.body;
    const { category_name, spec_data } = body;

    try {
        await db.query('BEGIN');

        // 1. Update Master
        const masterFields = ['part_category', 'part_name', 'part_number', 'internal_part_code', 'compatible_dispenser_model', 'assembly_group', 'part_position', 'part_description', 'manufacturer_fabricator', 'brand', 'status'];
        let masterSetParts = masterFields.map((f, i) => `${f}=$${i+1}`);
        let masterValues = masterFields.map(f => body[f]);
        masterValues.push(id);

        await db.query(
            `UPDATE STRUCTURAL_PART_MASTER SET ${masterSetParts.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE part_id=$${masterValues.length}`,
            masterValues
        );

        // 2. Update Tech Spec
        const techFields = ['material_type', 'material_grade', 'sheet_thickness', 'surface_finish', 'paint_coating_color', 'coating_thickness', 'corrosion_protection', 'rust_proof_treatment', 'welding_required', 'bending_required', 'laser_cutting_required', 'cnc_cutting_required', 'edge_finish', 'waterproof_sealing_required', 'rubber_gasket_required', 'length', 'width', 'height', 'thickness', 'weight', 'tolerance', 'hole_count', 'hole_diameter', 'cutout_available', 'cutout_type', 'cutout_size', 'bend_angle', 'bend_count', 'mounting_hole_pattern'];
        let techSetParts = techFields.map((f, i) => `${f}=$${i+2}`);
        let techValues = techFields.map(f => body[f]);
        
        await db.query(
            `UPDATE STRUCTURAL_TECH_SPEC SET ${techSetParts.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE part_id=$1`,
            [id, ...techValues]
        );

        // 3. Update Category Spec & Specialized Table
        if (category_name) {
            const parsedData = typeof spec_data === 'string' ? JSON.parse(spec_data) : spec_data;
            await db.query(
                `UPDATE STRUCTURAL_CATEGORY_SPEC SET spec_data=$1 WHERE part_id=$2`,
                [JSON.stringify(parsedData || {}), id]
            );

            const mapping = {
                'Cabinet Body': { table: 'cabinet_body_specs', columns: ['cabinet_type', 'cabinet_material', 'cabinet_height', 'cabinet_width', 'cabinet_depth', 'door_opening_side', 'ventilation_available', 'number_of_vents', 'ip_protection_target', 'internal_mounting_plate_available', 'base_stand_available', 'locking_arrangement', 'cable_entry_holes', 'hose_entry_hole', 'earthing_point_available'] },
                'Front Door': { table: 'front_door_specs', columns: ['door_type', 'door_material', 'door_opening_direction', 'lock_type', 'look_count', 'hinge_type', 'hinge_count', 'rubber_gasket_available', 'display_cutout_available', 'printer_cutout_available', 'keypad_cutout_available', 'sticker_area_available', 'door_stopper_available'] },
                'Side Panel': { table: 'side_panel_specs', columns: ['panel_side', 'panel_type', 'ventilation_slot_available', 'number_of_vent_slots', 'access_opening_available', 'hose_pipe_opening_available', 'nozzle_holder_mounting_available', 'fastner_type', 'panel_reinforcement_available'] },
                'Top Cover': { table: 'top_cover_specs', columns: ['cover_type', 'rain_protection_design', 'overhang_available', 'mounting_type', 'sealing_gasket_available', 'cable_entry_available', 'ventilation_available', 'branding_area_available'] },
                'Base Frame': { table: 'base_frame_specs', columns: ['base_type', 'base_material', 'load_capacity', 'foot_stand_count', 'floor_mounting_hole_available', 'anchor_bolt_size', 'anti_vibration_pad_available', 'leveling_foot_available', 'bottom_clearance', 'drain_hole_available'] },
                'Internal Mounting Plate': { table: 'internal_mounting_plate_specs', columns: ['plate_usage', 'plate_material', 'mounting_hole_pattern', 'component_mounting_slots', 'cable_routing_holes', 'din_rail_mounting_available', 'earthing_stud_available', 'removable_plate'] },
                'Nozzle Holder': { table: 'nozzle_holder_specs', columns: ['holder_type', 'nozzle_compatibility', 'holder_material', 'mounting_side', 'nozzle_sensor_mount_available', 'drain_hole_available', 'locking_support_available', 'rubber_padding_available', 'cutout_size'] },
                'Hose Entry Plate': { table: 'hose_entry_plate_specs', columns: ['hose_entry_type', 'hose_diameter_support', 'grommet_available', 'pipe_clamp_mount_available', 'swivel_mount_support', 'hole_diameter', 'reinforcement_plate_available', 'leak_drain_path_available'] },
                'Display': { table: 'display_specs', columns: ['panel_usage', 'display_cutout_size', 'keypad_cutout_available', 'printer_cutout_available', 'acrylic_window_available', 'window_material', 'window_thickness', 'sticker_branding_area', 'button_hole_count', 'indicator_hole_count'] },
                'Lock': { table: 'lock_specs', columns: ['hardware_type', 'material', 'size', 'load_capacity', 'opening_angle', 'fastener_size', 'finish', 'quantity_per_dispenser', 'replacement_required'] }
            };

            const target = mapping[category_name];
            if (target) {
                const files = req.files || {};
                const fileFields = ['file_2d_drawing', 'file_3d_model', 'file_fabrication_drawing', 'file_assembly_drawing', 'file_cutting'];
                
                let setParts = target.columns.map((c, i) => `${c}=$${i+2}`);
                let values = target.columns.map(c => parsedData[c]);

                // Handle Files in update
                fileFields.forEach(f => {
                    if (files[f]) {
                        setParts.push(`${f}=$${values.length + 2}`);
                        values.push(`/uploads/inventory/${files[f][0].filename}`);
                    }
                });

                if (files['part_images']) {
                    setParts.push(`part_images_gallery=$${values.length + 2}`);
                    values.push(JSON.stringify(files['part_images'].map(f => `/uploads/inventory/${f.filename}`)));
                }

                await db.query(
                    `UPDATE ${target.table} SET ${setParts.join(', ')} WHERE part_id=$1`,
                    [id, ...values]
                );
            }
        }

        await db.query('COMMIT');
        sendSuccess(res, null, 'Structural Part updated successfully');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Update Error:', error);
        next(error);
    }
};

const deleteStructuralPart = async (req, res, next) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE STRUCTURAL_PART_MASTER SET is_active=FALSE WHERE part_id=$1', [id]);
        sendSuccess(res, null, 'Structural Part deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStructuralParts,
    getStructuralPartById,
    createStructuralPart,
    updateStructuralPart,
    deleteStructuralPart
};
