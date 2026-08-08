const prisma = require('../db');
const { generateNextId } = require('../utils/idGenerator');

// --- Customers ---
const getCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany();
        res.json(customers);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const getCustomerDetails = async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { customerId: req.params.id },
            include: { quotations: true, invoices: true }
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createCustomer = async (req, res) => {
    try {
        let { customerId, name, phone, address } = req.body;
        if (!customerId) customerId = await generateNextId(prisma, 'customer', 'customerId', 'CUST-');

        const cust = await prisma.customer.create({ data: { customerId, name, phone, address } });
        res.json(cust);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;
        const cust = await prisma.customer.update({
            where: { customerId: id },
            data: { name, phone, address }
        });
        res.json(cust);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteCustomer = async (req, res) => {
    try {
        await prisma.customer.delete({ where: { customerId: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'P2003') return res.status(400).json({ error: 'Cannot delete Customer: They are currently linked to existing Invoices or Quotations.' });
        res.status(500).json({ error: e.message });
    }
};

// --- Quotations ---
const getQuotations = async (req, res) => {
    try {
        const opts = { include: { customer: true, items: true, user: true } };
        // Employee might only see their own
        if (req.user.role === 'EMPLOYEE') {
            opts.where = { createdBy: req.user.id };
        }
        const quotations = await prisma.quotation.findMany(opts);
        res.json(quotations);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createQuotation = async (req, res) => {
    try {
        let { quotationId, customerId, items } = req.body;
        if (!quotationId) quotationId = await generateNextId(prisma, 'quotation', 'quotationId', 'QT-');

        // items array: { materialId, quantity, unitPrice, discount }

        let totalAmount = 0;
        const processedItems = items.map(item => {
            const lineTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
            totalAmount += lineTotal;
            return {
                materialId: item.materialId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                lineTotal
            };
        });

        const quotation = await prisma.quotation.create({
            data: {
                quotationId,
                customerId,
                totalAmount,
                createdBy: req.user.id,
                items: {
                    create: processedItems
                }
            },
            include: { items: true, customer: true }
        });
        res.json(quotation);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteQuotation = async (req, res) => {
    try {
        // Can only delete if admin
        await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id } });
        await prisma.quotation.delete({ where: { quotationId: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};



module.exports = {
    getCustomers, getCustomerDetails, createCustomer, updateCustomer, deleteCustomer,
    getQuotations, createQuotation, deleteQuotation
};
