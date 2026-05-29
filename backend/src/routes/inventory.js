const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const customCategoryController = require('../controllers/customCategoryController');
const cache = require('../middleware/cache');
const clearCache = require('../middleware/clearCache');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/inventory/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const electronicsController = require('../controllers/electronicsController');
const electricalController = require('../controllers/electricalController');
const structuralController = require('../controllers/structuralController');

const pcbFiles = [
    { name: 'file_gerber', maxCount: 1 },
    { name: 'file_board', maxCount: 1 },
    { name: 'file_schematic', maxCount: 1 },
    { name: 'file_bom', maxCount: 1 },
    { name: 'file_stencile', maxCount: 1 },
    { name: 'file_panel_gerber', maxCount: 1 },
    { name: 'file_layer_stack', maxCount: 1 },
    { name: 'file_production_note', maxCount: 1 },
    { name: 'pcb_images', maxCount: 10 }
];

const electronicsFiles = [
    { name: 'file_datasheet', maxCount: 1 },
    { name: 'file_wiring', maxCount: 1 },
    { name: 'file_manual', maxCount: 1 },
    { name: 'file_test_report', maxCount: 1 },
    { name: 'file_calib_cert', maxCount: 1 },
    { name: 'file_warranty', maxCount: 1 },
    { name: 'file_invoice', maxCount: 1 },
    { name: 'part_images', maxCount: 10 }
];

const electricalFiles = [
    { name: 'file_datasheet', maxCount: 1 },
    { name: 'file_wiring', maxCount: 1 },
    { name: 'file_manual', maxCount: 1 },
    { name: 'file_test_report', maxCount: 1 },
    { name: 'file_calib_cert', maxCount: 1 },
    { name: 'file_compliance', maxCount: 1 },
    { name: 'file_warranty', maxCount: 1 },
    { name: 'file_invoice', maxCount: 1 },
    { name: 'part_images', maxCount: 10 }
];
const structuralFiles = [
    { name: 'file_2d_drawing', maxCount: 1 },
    { name: 'file_3d_model', maxCount: 1 },
    { name: 'file_fabrication_drawing', maxCount: 1 },
    { name: 'file_assembly_drawing', maxCount: 1 },
    { name: 'file_cutting', maxCount: 1 },
    { name: 'part_images', maxCount: 10 }
];
// Custom Category Fields routes (shared for all 3 modules)
router.get('/:module/custom-categories', cache(60), customCategoryController.getCustomCategories);
router.get('/:module/categories/:categoryName/fields', cache(60), customCategoryController.getCategoryFields);
router.post('/:module/categories/:categoryName/fields', customCategoryController.saveCategoryFields);
router.delete('/:module/categories/:categoryName', customCategoryController.deleteCustomCategory);


router.get('/pcb', cache(60), inventoryController.getPCBs);
router.get('/pcb/:id', cache(60), inventoryController.getPCBById);
router.post('/pcb', upload.fields(pcbFiles), clearCache('/api/inventory'), inventoryController.createPCB);
router.put('/pcb/:id', upload.fields(pcbFiles), clearCache('/api/inventory'), inventoryController.updatePCB);
router.delete('/pcb/:id', clearCache('/api/inventory'), inventoryController.deletePCB);
router.delete('/pcb/:id/image', clearCache('/api/inventory'), inventoryController.deletePCBImage);
router.delete('/pcb/:id/file', clearCache('/api/inventory'), inventoryController.deletePCBFile);

router.get('/electronics', cache(60), electronicsController.getElectronicsParts);
router.get('/electronics/:id', cache(60), electronicsController.getElectronicsPartById);
router.post('/electronics', upload.fields(electronicsFiles), clearCache('/api/inventory'), electronicsController.createElectronicsPart);
router.put('/electronics/:id', upload.fields(electronicsFiles), clearCache('/api/inventory'), electronicsController.updateElectronicsPart);
router.delete('/electronics/:id', clearCache('/api/inventory'), electronicsController.deleteElectronicsPart);
router.delete('/electronics/:id/image', clearCache('/api/inventory'), electronicsController.deleteElectronicsImage);
router.delete('/electronics/:id/file', clearCache('/api/inventory'), electronicsController.deleteElectronicsFile);

router.get('/electrical', cache(60), electricalController.getElectricalParts);
router.get('/electrical/:id', cache(60), electricalController.getElectricalPartById);
router.post('/electrical', upload.fields(electricalFiles), clearCache('/api/inventory'), electricalController.createElectricalPart);
router.put('/electrical/:id', upload.fields(electricalFiles), clearCache('/api/inventory'), electricalController.updateElectricalPart);
router.delete('/electrical/:id', clearCache('/api/inventory'), electricalController.deleteElectricalPart);
router.delete('/electrical/:id/image', clearCache('/api/inventory'), electricalController.deleteElectricalImage);
router.delete('/electrical/:id/file', clearCache('/api/inventory'), electricalController.deleteElectricalFile);

router.get('/structural', cache(60), structuralController.getStructuralParts);
router.get('/structural/:id', cache(60), structuralController.getStructuralPartById);
router.post('/structural', upload.fields(structuralFiles), clearCache('/api/inventory'), structuralController.createStructuralPart);
router.put('/structural/:id', upload.fields(structuralFiles), clearCache('/api/inventory'), structuralController.updateStructuralPart);
router.delete('/structural/:id', clearCache('/api/inventory'), structuralController.deleteStructuralPart);
router.delete('/structural/:id/image', clearCache('/api/inventory'), structuralController.deleteStructuralImage);
router.delete('/structural/:id/file', clearCache('/api/inventory'), structuralController.deleteStructuralFile);



module.exports = router;
