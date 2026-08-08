const prisma = require('./src/db');

async function test() {
    try {
        // Let's see if we have ANY materials/locations to test with
        const mats = await prisma.material.findMany({ take: 1 });
        const locs = await prisma.location.findMany({ take: 1 });

        if (!mats.length || !locs.length) {
            console.log("No materials or locations to test.");
            return;
        }

        const mId = mats[0].materialId;
        const lId = locs[0].locationId;

        console.log("Testing with:", mId, lId);

        const stock = await prisma.stock.upsert({
            where: { materialId_locationId: { materialId: mId, locationId: lId } },
            update: { quantity: { increment: 10 } },
            create: { materialId: mId, locationId: lId, quantity: 10 }
        });
        console.log("Success:", stock);
    } catch (e) {
        console.error("Prisma Error:", e);
    }
}
test();
