const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
    getSalesPersons, createSalesPerson, updateSalesPerson, deleteSalesPerson,
    getInvoices, createInvoice, voidInvoice
} = require('../controllers/invoiceController');

const router = express.Router();

router.use(authenticate);

// Sales Persons
router.get('/sales-persons', getSalesPersons);
router.post('/sales-persons', requireAdmin, createSalesPerson);
router.put('/sales-persons/:id', requireAdmin, updateSalesPerson);
router.delete('/sales-persons/:id', requireAdmin, deleteSalesPerson);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.post('/invoices/:id/void', requireAdmin, voidInvoice);

module.exports = router;
