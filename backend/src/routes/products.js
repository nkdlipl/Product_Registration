const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const cache = require('../middleware/cache');
const clearCache = require('../middleware/clearCache');

// All product routes are protected and for Admin
router.get('/bom-options', verifyToken, requireRole('Admin', 'Staff'), cache(300), productController.getBomOptions);
router.get('/', verifyToken, requireRole('Admin', 'Staff'), cache(60), productController.getProducts);
router.get('/:id', verifyToken, requireRole('Admin', 'Staff'), productController.getProductById);
router.get('/:id/bom', verifyToken, requireRole('Admin', 'Staff'), productController.getProductBom);
router.put('/:id/bom', verifyToken, requireRole('Admin'), clearCache('/api/products'), productController.saveProductBom);
router.post('/', 
  verifyToken, 
  requireRole('Admin'), 
  upload.fields([
    { name: 'image', maxCount: 10 },
    { name: 'document', maxCount: 10 }
  ]),
  clearCache('/api/products'),
  productController.createProduct
);
router.put('/:id', 
  verifyToken, 
  requireRole('Admin'), 
  upload.fields([
    { name: 'image', maxCount: 10 },
    { name: 'document', maxCount: 10 }
  ]),
  clearCache('/api/products'),
  productController.updateProduct
);
router.delete('/:id/assets', verifyToken, requireRole('Admin'), clearCache('/api/products'), productController.removeAsset);
router.delete('/:id', verifyToken, requireRole('Admin'), clearCache('/api/products'), productController.deleteProduct);

module.exports = router;

