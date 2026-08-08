const prisma = require('./server/src/db');
async function run() {
    try {
        const locations = await prisma.location.findMany({
            include: { subLocations: true }
        });
        console.log("Locations OK:", locations.length);

        const stock = await prisma.stock.findMany({
            include: { location: true, material: { include: { company: true } } }
        });
        console.log("Stock OK:", stock.length);
    } catch (e) {
        console.error("PRISMA ERROR ===>");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
