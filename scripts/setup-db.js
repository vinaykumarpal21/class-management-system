// Runs schema.sql against your MySQL server:  npm run setup-db
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log('Database and tables created, sample data inserted.');
})().catch(e => { console.error('Setup failed:', e.message); process.exit(1); });
