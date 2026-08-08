const prisma = require('../db');
const { generateNextId } = require('../utils/idGenerator');

// --- Locations ---
const getLocations = async (req, res) => {
    try {
        const locations = await prisma.location.findMany({
            include: { subLocations: true }
        });
        res.json(locations);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createLocation = async (req, res) => {
    try {
        let { locationId, name, type } = req.body;
        if (!locationId) locationId = await generateNextId(prisma, 'location', 'locationId', 'LOC-');

        const loc = await prisma.location.create({ data: { locationId, name, type } });
        res.json(loc);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateLocation = async (req, res) => {
    try {
        const { name, type } = req.body;
        const updated = await prisma.location.update({
            where: { locationId: req.params.id },
            data: { name, type }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteLocation = async (req, res) => {
    try {
        await prisma.location.delete({ where: { locationId: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// --- Stock Inquiry ---
const getStock = async (req, res) => {
    try {
        const { materialId, locationId } = req.query;
        let where = {};
        if (materialId) where.materialId = materialId;
        if (locationId) where.locationId = locationId;

        const stock = await prisma.stock.findMany({
            where,
            include: {
                location: true,
                subLocation: true,
                material: { include: { company: true } }
            }
        });
        res.json(stock);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// --- Stock Transfers ---
const transferStock = async (req, res) => {
    try {
        let { transferId, materialId, fromLocationId, fromSubLocationId, toLocationId, toSubLocationId, quantity, remarks } = req.body;
        if (!transferId) transferId = await generateNextId(prisma, 'stockTransfer', 'transferId', 'TRF-');

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });

        // Execute in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Find specific source stock
            let findSourceArgs = { materialId, locationId: fromLocationId };
            if (fromSubLocationId) findSourceArgs.subLocationId = fromSubLocationId;
            // if fromSubLocationId is falsy, check for stock with NO subLocation
            else findSourceArgs.subLocationId = null;

            const sourceStock = await tx.stock.findFirst({
                where: findSourceArgs
            });

            if (!sourceStock || sourceStock.quantity < qty) {
                throw new Error(`Insufficient stock at source location (Available: ${sourceStock?.quantity || 0})`);
            }

            // Deduct from source
            await tx.stock.update({
                where: { id: sourceStock.id },
                data: { quantity: { decrement: qty } }
            });

            // Add to destination
            let findDestArgs = { materialId, locationId: toLocationId };
            if (toSubLocationId) findDestArgs.subLocationId = toSubLocationId;
            else findDestArgs.subLocationId = null;

            const destStock = await tx.stock.findFirst({
                where: findDestArgs
            });

            if (destStock) {
                await tx.stock.update({
                    where: { id: destStock.id },
                    data: { quantity: { increment: qty } }
                });
            } else {
                await tx.stock.create({
                    data: { materialId, locationId: toLocationId, quantity: qty, subLocationId: toSubLocationId || null }
                });
            }

            // Record history
            const transfer = await tx.stockTransfer.create({
                data: { transferId, materialId, fromLocationId, toLocationId, quantity, remarks }
            });
            // Verify if user actually still exists (prevents FK failures from old DB seeds with stale JWT tokens)
            const transferringUser = req.user?.id ? await tx.user.findUnique({ where: { id: req.user.id } }) : null;

            await tx.stockTransferLog.create({
                data: {
                    materialId,
                    fromLocationId,
                    toLocationId,
                    fromSubLocId: fromSubLocationId || null,
                    toSubLocId: toSubLocationId || null,
                    quantity: qty,
                    transferredBy: transferringUser ? req.user.id : null
                }
            });

            return transfer;
        });

        res.json({ success: true, transfer: result });
    } catch (e) {
        res.status(500).json({ error: e.message || e.toString() });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { materialId, locationId, quantity, subLocationId } = req.body;

        if (!materialId) return res.status(400).json({ error: 'Please select a material before submitting.' });
        if (!locationId) return res.status(400).json({ error: 'Please select a target location.' });

        const qty = parseInt(quantity);
        if (isNaN(qty)) return res.status(400).json({ error: 'Invalid quantity' });

        let findArgs = { materialId, locationId };
        if (subLocationId) findArgs.subLocationId = subLocationId;
        else findArgs.subLocationId = null;

        let stock = await prisma.stock.findFirst({
            where: findArgs
        });

        if (stock) {
            stock = await prisma.stock.update({
                where: { id: stock.id },
                data: { quantity: { increment: qty } }
            });
        } else {
            stock = await prisma.stock.create({
                data: { materialId, locationId, quantity: qty, subLocationId: subLocationId || null }
            });
        }

        res.json({ success: true, stock });
    } catch (e) {
        res.status(500).json({ error: e.message || 'Failed to adjust stock' });
    }
};

const clearAllStock = async (req, res) => {
    try {
        await prisma.stock.deleteMany({});
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message || 'Failed to clear stock' });
    }
};

// --- SubLocations ---
const addSubLocation = async (req, res) => {
    try {
        const { locationId } = req.params;
        const { name, parentId } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const sub = await prisma.subLocation.create({
            data: { locationId, name, parentId: parentId || null }
        });
        res.json(sub);
    } catch (e) {
        if (e.code === 'P2002') return res.status(400).json({ error: 'Sub-location already exists at this level' });
        res.status(500).json({ error: e.message });
    }
};

const deleteSubLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await prisma.subLocation.delete({ where: { subLocationId: id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const updateSubLocation = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const updated = await prisma.subLocation.update({
            where: { subLocationId: req.params.id },
            data: { name }
        });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getTransferLogs = async (req, res) => {
    try {
        const logs = await prisma.stockTransferLog.findMany({
            include: {
                material: true,
                fromLocation: true,
                toLocation: true,
                fromSub: true,
                toSub: true,
                user: true
            },
            orderBy: { transferDate: 'desc' }
        });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const clearTransferHistory = async (req, res) => {
    try {
        await prisma.stockTransferLog.deleteMany({});
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const deleteTransferLog = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.stockTransferLog.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getLocations, createLocation, updateLocation, deleteLocation,
    getStock,
    transferStock,
    adjustStock,
    clearAllStock,
    addSubLocation,
    deleteSubLocation,
    updateSubLocation,
    getTransferLogs,
    clearTransferHistory,
    deleteTransferLog
};
