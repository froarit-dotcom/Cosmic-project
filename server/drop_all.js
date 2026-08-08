const mysql = require('mysql2/promise');

async function wipe() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '7893327504'
    });

    try {
        await conn.query('DROP DATABASE IF EXISTS cosmic_erp;');
        await conn.query('CREATE DATABASE cosmic_erp;');
        console.log("Database cosmic_erp fully recreated!");
    } catch (e) {
        console.error(e);
    }

    await conn.end();
}
wipe();
