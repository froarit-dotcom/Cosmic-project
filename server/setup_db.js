const mysql = require('mysql2/promise');

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '7893327504',
      port: 3306
    });

    console.log('Connected to MySQL server.');
    await connection.query('CREATE DATABASE IF NOT EXISTS cosmic_erp;');
    console.log('Database `cosmic_erp` created or already exists.');
    await connection.end();
  } catch (error) {
    console.error('Error connecting to DB:', error);
    process.exit(1);
  }
}

setup();
