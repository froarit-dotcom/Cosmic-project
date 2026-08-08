const mysql = require('mysql2/promise');
async function main() {
    const pool = mysql.createPool('mysql://root:7893327504@localhost:3306/cosmic_erp');
    try {
        await pool.query('ALTER TABLE stock ADD COLUMN sub_location VARCHAR(191) NULL');
        console.log('Column added');
    } catch (e) { console.log(e.message); }
    process.exit(0);
}
main();
