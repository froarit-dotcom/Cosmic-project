const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
    getCompanies, createCompany, updateCompany, deleteCompany,
    getCategories, createCategory, updateCategory, deleteCategory,
    getMaterials, createMaterial, updateMaterial, deleteMaterial
} = require('../controllers/masterController');

const router = express.Router();

router.use(authenticate);

// Companies
router.get('/companies', getCompanies);
router.post('/companies', requireAdmin, createCompany);
router.put('/companies/:id', requireAdmin, updateCompany);
router.delete('/companies/:id', requireAdmin, deleteCompany);

// Categories
router.get('/categories', getCategories);
router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

// Materials
router.get('/materials', getMaterials);
router.post('/materials', requireAdmin, createMaterial);
router.put('/materials/:id', requireAdmin, updateMaterial);
router.delete('/materials/:id', requireAdmin, deleteMaterial);

module.exports = router;
