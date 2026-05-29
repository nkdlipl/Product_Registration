const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken } = require('../middleware/auth');
const cache = require('../middleware/cache');
const clearCache = require('../middleware/clearCache');

router.use(verifyToken);

router.get('/', cache(60), companyController.getCompanies);
router.post('/', clearCache('/api/companies'), companyController.createCompany);
router.put('/:id', clearCache('/api/companies'), companyController.updateCompany);
router.delete('/:id', clearCache('/api/companies'), companyController.deleteCompany);

router.get('/:companyId/sub', cache(60), companyController.getSubCompanies);
router.post('/:companyId/sub', clearCache('/api/companies'), companyController.createSubCompany);
router.put('/sub/:id', clearCache('/api/companies'), companyController.updateSubCompany);
router.delete('/sub/:id', clearCache('/api/companies'), companyController.deleteSubCompany);

module.exports = router;
