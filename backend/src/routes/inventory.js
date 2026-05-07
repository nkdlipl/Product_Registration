const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/inventory/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

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

router.get('/pcb', inventoryController.getPCBs);
router.get('/pcb/:id', inventoryController.getPCBById);
router.post('/pcb', upload.fields(pcbFiles), inventoryController.createPCB);
router.put('/pcb/:id', upload.fields(pcbFiles), inventoryController.updatePCB);
router.delete('/pcb/:id', inventoryController.deletePCB);

module.exports = router;
