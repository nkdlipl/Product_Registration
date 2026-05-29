const express = require('express');
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const cache = require('../middleware/cache');
const clearCache = require('../middleware/clearCache');

const router = express.Router();

router.use(verifyToken);

router.get('/', cache(60), customerController.getCustomers);
router.get('/:id', cache(60), customerController.getCustomerById);
router.post('/', requireRole('Admin'), clearCache('/api/customers'), customerController.createCustomer);
router.put('/:id', requireRole('Admin'), clearCache('/api/customers'), customerController.updateCustomer);
router.delete('/:id', requireRole('Admin'), clearCache('/api/customers'), customerController.deleteCustomer);

module.exports = router;
