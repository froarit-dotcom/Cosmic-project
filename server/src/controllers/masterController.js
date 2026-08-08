const prisma = require('../db');
const { generateNextId } = require('../utils/idGenerator');

// --- Company Master ---
const getCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany();
        res.json(companies);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createCompany = async (req, res) => {
    try {
        let { companyId, name, contactInfo } = req.body;
        if (!companyId) companyId = await generateNextId(prisma, 'company', 'companyId', 'COMP-');
        const company = await prisma.company.create({
            data: { companyId, name, contactInfo }
        });
        res.json(company);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contactInfo } = req.body;
        const company = await prisma.company.update({
            where: { companyId: id },
            data: { name, contactInfo }
        });
        res.json(company);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteCompany = async (req, res) => {
    try {
        await prisma.company.delete({ where: { companyId: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'P2003') return res.status(400).json({ error: 'Cannot delete Company: It is currently linked to existing materials.' });
        res.status(500).json({ error: e.message });
    }
};


// --- Category Master ---
const getCategories = async (req, res) => {
    try {
        const cats = await prisma.category.findMany();
        res.json(cats);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createCategory = async (req, res) => {
    try {
        let { categoryId, name } = req.body;
        if (!categoryId) categoryId = await generateNextId(prisma, 'category', 'categoryId', 'CAT-');
        const cat = await prisma.category.create({ data: { categoryId, name } });
        res.json(cat);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const cat = await prisma.category.update({ where: { categoryId: id }, data: { name } });
        res.json(cat);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteCategory = async (req, res) => {
    try {
        await prisma.category.delete({ where: { categoryId: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'P2003') return res.status(400).json({ error: 'Cannot delete Category: It is currently linked to existing materials.' });
        res.status(500).json({ error: e.message });
    }
};


// --- Material Master ---
const getMaterials = async (req, res) => {
    try {
        const materials = await prisma.material.findMany({
            include: { company: true, category: true }
        });
        res.json(materials);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createMaterial = async (req, res) => {
    try {
        let { materialId, name, categoryId, companyId, sizeSpec, unit, purchasePrice, sellingPrice, gstPercentage, reorderLevel } = req.body;
        if (!materialId) materialId = await generateNextId(prisma, 'material', 'materialId', 'MAT-');

        const mat = await prisma.material.create({
            data: { materialId, name, categoryId, companyId, sizeSpec, unit, purchasePrice, sellingPrice, gstPercentage, reorderLevel }
        });
        res.json(mat);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, categoryId, companyId, sizeSpec, unit, purchasePrice, sellingPrice, gstPercentage, reorderLevel, status } = req.body;
        const mat = await prisma.material.update({
            where: { materialId: id },
            data: { name, categoryId, companyId, sizeSpec, unit, purchasePrice, sellingPrice, gstPercentage, reorderLevel, status }
        });
        res.json(mat);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteMaterial = async (req, res) => {
    // Soft delete logic if requested, or hard delete
    try {
        // Here we can attempt a hard delete. If it fails due to FK (exists on quotation or invoice), we catch and soft delete.
        await prisma.material.delete({ where: { materialId: req.params.id } });
        res.json({ success: true, hardDeleted: true });
    } catch (e) {
        if (e.code === 'P2003') { // Foreign key constraint failed
            const softDeleted = await prisma.material.update({ where: { materialId: req.params.id }, data: { status: 'INACTIVE' } });
            return res.json({ success: true, hardDeleted: false, softDeleted });
        }
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getCompanies, createCompany, updateCompany, deleteCompany,
    getCategories, createCategory, updateCategory, deleteCategory,
    getMaterials, createMaterial, updateMaterial, deleteMaterial
};
