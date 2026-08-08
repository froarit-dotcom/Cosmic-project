const mysql = require('mysql2/promise');

async function drop() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '7893327504',
        database: 'cosmic_erp'
    });

    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
        await conn.query('DROP TABLE IF EXISTS StockTransferLog;');
        await conn.query('DROP TABLE IF EXISTS Stock;');
        await conn.query('DROP TABLE IF EXISTS SubLocation;');
        await conn.query('DROP TABLE IF EXISTS Location;');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log("Tables dropped.");
    } catch (e) {
        console.error(e);
    }

    await conn.end();
}
drop();
