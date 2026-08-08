const prisma = require('../db');
const { generateNextId } = require('../utils/idGenerator');

// --- Sales Persons ---
const getSalesPersons = async (req, res) => {
    try {
        const list = await prisma.salesPerson.findMany();
        res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
};
const createSalesPerson = async (req, res) => {
    try {
        let { salesPersonId, name, phone, linkedUserId, salary, locationId } = req.body;
        if (!salesPersonId) salesPersonId = await generateNextId(prisma, 'salesPerson', 'salesPersonId', 'EMP-');

        const sp = await prisma.salesPerson.create({
            data: {
                salesPersonId, name, phone, linkedUserId,
                salary: parseFloat(salary) || 0,
                locationId: locationId || null
            }
        });
        res.json(sp);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateSalesPerson = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, salary, locationId } = req.body;
        const sp = await prisma.salesPerson.update({
            where: { salesPersonId: id },
            data: { name, phone, salary: parseFloat(salary) || 0, locationId: locationId || null }
        });
        res.json(sp);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteSalesPerson = async (req, res) => {
    try {
        await prisma.salesPerson.delete({ where: { salesPersonId: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// --- Invoices ---
const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: true,
                salesPerson: true,
                user: true,
                items: { include: { material: true } }
            }
        });
        res.json(invoices);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createInvoice = async (req, res) => {
    try {
        let { invoiceId, quotationId, customerId, salesPersonId, deduction, bonusAmount, items } = req.body;
        if (!invoiceId) invoiceId = await generateNextId(prisma, 'invoice', 'invoiceId', 'INV-');

        salesPersonId = salesPersonId?.trim() || null;
        quotationId = quotationId?.trim() || null;
        const finalDeduction = parseFloat(deduction) || 0;

        const result = await prisma.$transaction(async (tx) => {
            // Find shop location
            const shopLoc = await tx.location.findFirst({ where: { type: 'SHOP' } });
            if (!shopLoc) throw new Error("Shop location is not configured in the system.");

            let subtotal = 0;
            let totalSgst = 0;
            let totalCgst = 0;

            // Validate items and prepare
            const processedItems = await Promise.all(items.map(async (it) => {
                const mat = await tx.material.findUnique({ where: { materialId: it.materialId } });
                if (!mat) throw new Error(`Material ${it.materialId} not found.`);

                // Deduct stock from Shop! (Fallback to whatever stock findFirst returns if subLocation is omitted for flat logic, but here PK is different)
                const stock = await tx.stock.findFirst({ where: { materialId: mat.materialId, locationId: shopLoc.locationId } });
                if (!stock || stock.quantity < it.quantity) {
                    throw new Error(`Insufficient stock for ${mat.name} in Shop. Wanted: ${it.quantity}, Available: ${stock ? stock.quantity : 0}`);
                }

                await tx.stock.update({
                    where: { id: stock.id },
                    data: { quantity: { decrement: it.quantity } }
                });

                const amount = it.unitPrice * it.quantity;
                const discount = it.discount || 0;
                const lineTotal = amount - discount;

                // GST Split
                const gstRate = mat.gstPercentage || 0;
                const sgstAmount = lineTotal * (gstRate / 2) / 100;
                const cgstAmount = lineTotal * (gstRate / 2) / 100;

                subtotal += lineTotal;
                totalSgst += sgstAmount;
                totalCgst += cgstAmount;

                return {
                    materialId: mat.materialId,
                    unitPrice: it.unitPrice,
                    costPrice: mat.purchasePrice || 0,
                    quantity: it.quantity,
                    amount,
                    discount,
                    gstPercentage: gstRate,
                    sgstAmount,
                    cgstAmount,
                    lineTotal
                };
            }));

            const grandTotal = subtotal + totalSgst + totalCgst - finalDeduction;

            const payloadData = {
                invoiceId,
                quotationId,
                customerId,
                salesPersonId,
                subtotal,
                totalSgst,
                totalCgst,
                deduction: finalDeduction,
                grandTotal,
                bonusAmount: bonusAmount || 0,
                createdBy: req.user.id,
                items: {
                    create: processedItems
                }
            };
            console.log("Creating Invoice with Payload: ", JSON.stringify(payloadData, null, 2));

            const invoice = await tx.invoice.create({
                data: {
                    invoiceId,
                    quotationId,
                    customerId,
                    salesPersonId,
                    subtotal,
                    totalSgst,
                    totalCgst,
                    deduction: finalDeduction,
                    grandTotal,
                    bonusAmount: bonusAmount || 0,
                    createdBy: req.user.id,
                    items: {
                        create: processedItems
                    }
                },
                include: { items: true, customer: true }
            });
            return invoice;
        });

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message || "Failed to create invoice" });
    }
};

const voidInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({ where: { invoiceId: id }, include: { items: true } });
            if (!invoice) throw new Error("Invoice not found.");
            if (invoice.status === 'VOID') throw new Error("Invoice is already voided.");

            const shopLoc = await tx.location.findFirst({ where: { type: 'SHOP' } });
            if (!shopLoc) throw new Error("Shop location not configured.");

            // Restore stock
            for (const item of invoice.items) {
                await tx.stock.update({
                    where: { materialId_locationId: { materialId: item.materialId, locationId: shopLoc.locationId } },
                    data: { quantity: { increment: item.quantity } }
                });
            }

            // Mark as void
            const updated = await tx.invoice.update({
                where: { invoiceId: id },
                data: { status: 'VOID' }
            });
            return updated;
        });

        res.json({ success: true, invoice: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = {
    getSalesPersons, createSalesPerson, updateSalesPerson, deleteSalesPerson,
    getInvoices, createInvoice, voidInvoice
};
