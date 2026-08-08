const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mat = await prisma.material.findFirst({ where: { name: { contains: 'pvs pipe' } } });
    if (mat) {
        console.log('Found material:', mat.materialId);

        await prisma.stockTransfer.deleteMany({ where: { materialId: mat.materialId } });
        await prisma.stock.deleteMany({ where: { materialId: mat.materialId } });
        await prisma.invoiceItem.deleteMany({ where: { materialId: mat.materialId } });
        await prisma.quotationItem.deleteMany({ where: { materialId: mat.materialId } });

        await prisma.material.delete({ where: { materialId: mat.materialId } });
        console.log('Deleted Material record completely.');
    }

    try {
        await prisma.category.delete({ where: { categoryId: 'CAT-01' } });
        console.log('Deleted CAT-01 category');
    } catch (e) {
        console.log('Category delete failed or already deleted: ', e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
