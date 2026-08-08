const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
    getCustomers, getCustomerDetails, createCustomer, updateCustomer, deleteCustomer,
    getQuotations, createQuotation, deleteQuotation
} = require('../controllers/crmController');

const router = express.Router();

router.use(authenticate);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerDetails);
router.post('/customers', createCustomer);
router.put('/customers/:id', requireAdmin, updateCustomer);
router.delete('/customers/:id', requireAdmin, deleteCustomer);

// Quotations
router.get('/quotations', getQuotations);
router.post('/quotations', createQuotation);
router.delete('/quotations/:id', requireAdmin, deleteQuotation);

module.exports = router;
