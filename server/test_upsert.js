const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const mat = await prisma.material.findFirst();
        const loc = await prisma.location.findFirst();

        await prisma.stock.upsert({
            where: { materialId_locationId: { materialId: mat.materialId, locationId: loc.locationId } },
            update: { quantity: { increment: 5 } },
            create: { materialId: mat.materialId, locationId: loc.locationId, quantity: 5, subLocation: null }
        });
        console.log('Upsert worked');
    } catch (e) {
        fs.writeFileSync('error_log.txt', e.message);
    }
}
main().then(() => process.exit(0));
