const prisma = require('./server/src/db');
const { generateNextId } = require('./server/src/utils/idGenerator');

async function test() {
    try {
        const nextLoc = await generateNextId(prisma, 'location', 'locationId', 'LOC-');
        console.log("NEXT LOC ID:", nextLoc);

        const nextMat = await generateNextId(prisma, 'material', 'materialId', 'MAT-');
        console.log("NEXT MAT ID:", nextMat);

        const nextCust = await generateNextId(prisma, 'customer', 'customerId', 'CUST-');
        console.log("NEXT CUST ID:", nextCust);

        const nextInv = await generateNextId(prisma, 'invoice', 'invoiceId', 'INV-');
        console.log("NEXT INV ID:", nextInv);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
