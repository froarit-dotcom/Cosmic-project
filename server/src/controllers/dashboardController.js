const prisma = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        const { range } = req.query; // 'daily', 'monthly', 'yearly'

        let dateFilter = {};
        const now = new Date();
        if (range === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { gte: startOfMonth };
        } else if (range === 'yearly') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { gte: startOfYear };
        } else {
            // daily
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { gte: startOfDay };
        }

        // Active invoices in period
        const invoices = await prisma.invoice.findMany({
            where: {
                invoiceDate: dateFilter,
                status: 'ACTIVE'
            },
            include: { items: true }
        });

        const salesCount = invoices.length;
        let revenue = 0;
        let profit = 0;
        let totalQuantitySold = 0;

        invoices.forEach(inv => {
            // Revenue = Subtotal - Deduction
            const invRevenue = inv.subtotal - inv.deduction;
            revenue += invRevenue;

            let invProfit = 0;
            inv.items.forEach(item => {
                totalQuantitySold += item.quantity;
                // Line Profit = ((unitPrice - costPrice) * qty) - discount
                const lineProfit = ((item.unitPrice - item.costPrice) * item.quantity) - item.discount;
                invProfit += lineProfit;
            });
            // Total Profit = items profit - deduction
            profit += (invProfit - inv.deduction);
        });

        // Top Selling Materials
        // In a real app we'd group by SQL, here we can process it in memory if size is small, or use Prisma groupBy
        const items = await prisma.invoiceItem.groupBy({
            by: ['materialId'],
            _sum: { quantity: true },
            where: { invoice: { invoiceDate: dateFilter, status: 'ACTIVE' } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topSellingIds = items.map(i => i.materialId);
        const topMaterials = await prisma.material.findMany({ where: { materialId: { in: topSellingIds } } });

        const topSelling = items.map(i => {
            const mat = topMaterials.find(m => m.materialId === i.materialId);
            return {
                materialId: i.materialId,
                name: mat?.name,
                quantity: i._sum.quantity
            };
        });

        // Low stock alerts
        const lowStock = await prisma.stock.findMany({
            where: { quantity: { lte: 5 } }, // Or dynamically check reorder_level
            include: { material: true, location: true },
            take: 10
        });

        res.json({
            metrics: { salesCount, revenue, profit, totalQuantitySold },
            topSelling,
            lowStock
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { getDashboardStats };
