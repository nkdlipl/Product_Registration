const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', companyController.getCompanies);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

router.get('/:companyId/sub', companyController.getSubCompanies);
router.post('/:companyId/sub', companyController.createSubCompany);
router.put('/sub/:id', companyController.updateSubCompany);
router.delete('/sub/:id', companyController.deleteSubCompany);

module.exports = router;
