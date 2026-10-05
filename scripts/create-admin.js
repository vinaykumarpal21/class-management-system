// Creates (or resets the password of) the admin login:  npm run create-admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

(async () => {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass || pass.length < 8) {
    console.error('Set ADMIN_USER and ADMIN_PASS (min 8 characters) in .env first.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pass, 12);
  await pool.query(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    [user, hash]
  );
  console.log(`Admin "${user}" is ready. You can now remove ADMIN_PASS from .env.`);
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
