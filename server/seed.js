const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (existing) {
        console.log('Admin already exists.');
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
        data: {
            username: 'admin',
            fullName: 'System Administrator',
            passwordHash,
            role: 'ADMIN'
        }
    });

    // also create the SHOP location
    const existingShop = await prisma.location.findFirst({ where: { type: 'SHOP' } });
    if (!existingShop) {
        await prisma.location.create({
            data: {
                locationId: 'LOC-SHOP',
                name: 'Main Counter',
                type: 'SHOP'
            }
        });
    }
    console.log('Admin seeded (admin / admin123). Shop location seeded.');
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
