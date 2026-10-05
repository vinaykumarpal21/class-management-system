'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  ENTITIES, validate, buildList, publicMeta, exportColumns, checkPublicDateWindow, monthRange,
} = require('./entities');
const { sendExcel, sendPdf } = require('./exporters');

// ----------------------------------------------------------------- config
const PORT = Number(process.env.PORT) || 3000;
const SITE_DIR = path.resolve(__dirname, '..'); // the HTML/CSS site lives one level up
const JWT_SECRET = process.env.JWT_SECRET || '';
const TOKEN_TTL = process.env.TOKEN_TTL || '8h';

if (JWT_SECRET.length < 24) {
  console.error('JWT_SECRET is missing or too short. Set a random string of 24+ characters in server/.env');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sagar_classes',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE columns come back as 'YYYY-MM-DD' strings, not JS Date objects
  charset: 'utf8mb4',
});

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ------------------------------------------------------------ tiny rate limiter
function rateLimiter({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const rec = hits.get(req.ip);
    if (!rec || now - rec.start > windowMs) { hits.set(req.ip, { start: now, count: 1 }); return next(); }
    rec.count += 1;
    if (rec.count > max) {
      res.setHeader('Retry-After', Math.ceil((rec.start + windowMs - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
const loginLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Try again in a few minutes.' });
const attendanceLimiter = rateLimiter({ windowMs: 10 * 60 * 1000, max: 40, message: 'Too many submissions. Please try again later.' });

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ------------------------------------------------------------------- auth
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10); // keeps login timing similar for unknown users

app.post('/api/auth/login', loginLimiter, wrap(async (req, res) => {
  const username = String(req.body?.username || '').trim().slice(0, 50);
  const password = String(req.body?.password || '').slice(0, 200);
  const [rows] = await pool.query('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1', [username]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Wrong username or password' });
  const token = jwt.sign({ sub: user.id, name: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.json({ token, username: user.username });
}));

function requireAdmin(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return res.status(401).json({ error: 'Login required' });
  try {
    req.admin = jwt.verify(m[1], JWT_SECRET);
    next();
  } catch (_) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ------------------------------------------------------------- public API
const publicCache = (req, res, next) => { res.setHeader('Cache-Control', 'public, max-age=30'); next(); };

app.get('/api/public/notices', publicCache, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, message FROM notices ORDER BY sort_order ASC, id ASC');
  res.json(rows);
}));
app.get('/api/public/events', publicCache, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, title, category, description, image_url FROM events ORDER BY id ASC');
  res.json(rows);
}));
app.get('/api/public/toppers', publicCache, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, rank_label, name, class_name, score, message, photo_url FROM toppers ORDER BY class_name ASC, id ASC');
  res.json(rows);
}));

// Attendance forms. Same person + same day = one row (re-submitting updates the status).
function attendanceRoute(entityKey, upsertSql, toParams) {
  const entity = ENTITIES[entityKey];
  return [attendanceLimiter, wrap(async (req, res) => {
    const { values, errors, ok } = validate(entity, req.body);
    if (!ok) return res.status(400).json({ error: Object.values(errors)[0], errors });
    if (!checkPublicDateWindow(values.att_date)) {
      return res.status(400).json({ error: 'Date must be within the last 7 days and not in the future.' });
    }
    await pool.query(upsertSql, toParams(values));
    res.status(201).json({ ok: true });
  })];
}
app.post('/api/public/attendance/student', ...attendanceRoute(
  'student_attendance',
  `INSERT INTO student_attendance (student_name, standard, att_date, status) VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE status = VALUES(status)`,
  (v) => [v.student_name, v.standard, v.att_date, v.status]
));
app.post('/api/public/attendance/staff', ...attendanceRoute(
  'staff_attendance',
  `INSERT INTO staff_attendance (staff_name, department, att_date, status) VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE status = VALUES(status)`,
  (v) => [v.staff_name, v.department, v.att_date, v.status]
));

// -------------------------------------------------------------- admin API
const admin = express.Router();
admin.use(requireAdmin);

admin.get('/meta', (req, res) => res.json(publicMeta()));

admin.get('/stats', wrap(async (req, res) => {
  const keys = Object.keys(ENTITIES);
  const counts = await Promise.all(keys.map((k) => pool.query(`SELECT COUNT(*) AS n FROM ${ENTITIES[k].table}`)));
  const out = {};
  keys.forEach((k, i) => { out[k] = counts[i][0][0].n; });
  res.json(out);
}));

function exportName(label, query) {
  const day = new Date().toISOString().slice(0, 10);
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `sagar-classes-${slug}${query.month ? '-' + query.month : ''}-${day}`;
}
function monthLabel(month) {
  const r = monthRange(month);
  if (!r) return '';
  return new Date(r.start + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
async function datasetFor(key, query) {
  const entity = ENTITIES[key];
  const { sql, params } = buildList(entity, query, { forExport: true });
  const [rows] = await pool.query(sql, params);
  const bits = [];
  if (query.month && monthLabel(query.month)) bits.push(monthLabel(query.month));
  if (query.q) bits.push(`Search: "${String(query.q).slice(0, 40)}"`);
  if (query.status === 'Present' || query.status === 'Absent') bits.push(`Status: ${query.status}`);
  return { title: entity.label, subtitle: bits.join('   |   '), columns: exportColumns(entity), rows };
}
async function sendExport(res, format, datasets, filename) {
  const opts = { logoPath: path.join(SITE_DIR, 'logo.jpeg'), fontPath: process.env.PDF_FONT_PATH };
  if (format === 'pdf') return sendPdf(res, datasets, filename, opts);
  return sendExcel(res, datasets, filename);
}
const pickFormat = (q) => (String(q.format).toLowerCase() === 'pdf' ? 'pdf' : 'xlsx');

// everything in one file (Excel: one sheet per table, PDF: one section per table)
admin.get('/export-all', wrap(async (req, res) => {
  const datasets = [];
  for (const key of Object.keys(ENTITIES)) datasets.push(await datasetFor(key, { month: req.query.month }));
  await sendExport(res, pickFormat(req.query), datasets, exportName('all-records', req.query));
}));

const withEntity = (req, res, next) => {
  const entity = ENTITIES[req.params.entity];
  if (!entity) return res.status(404).json({ error: 'Unknown resource' });
  req.entity = entity;
  next();
};

admin.get('/:entity/export', withEntity, wrap(async (req, res) => {
  const ds = await datasetFor(req.params.entity, req.query);
  await sendExport(res, pickFormat(req.query), [ds], exportName(req.entity.label, req.query));
}));

admin.get('/:entity', withEntity, wrap(async (req, res) => {
  const { sql, params } = buildList(req.entity, req.query);
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

async function fetchOne(entity, id) {
  const cols = ['id', ...entity.fields.map((f) => f.name)].join(', ');
  const [rows] = await pool.query(`SELECT ${cols} FROM ${entity.table} WHERE id = ?`, [id]);
  return rows[0] || null;
}
const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: 'Invalid id' }); return null; }
  return id;
};
const dupMessage = 'A record with the same details already exists.';

admin.post('/:entity', withEntity, wrap(async (req, res) => {
  const { values, errors, ok } = validate(req.entity, req.body);
  if (!ok) return res.status(400).json({ error: Object.values(errors)[0], errors });
  const names = Object.keys(values);
  try {
    const [r] = await pool.query(
      `INSERT INTO ${req.entity.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
      names.map((n) => values[n])
    );
    res.status(201).json(await fetchOne(req.entity, r.insertId));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: dupMessage });
    throw e;
  }
}));

admin.put('/:entity/:id', withEntity, wrap(async (req, res) => {
  const id = parseId(req, res); if (id === null) return;
  const { values, errors, ok } = validate(req.entity, req.body);
  if (!ok) return res.status(400).json({ error: Object.values(errors)[0], errors });
  const names = Object.keys(values);
  try {
    await pool.query(
      `UPDATE ${req.entity.table} SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`,
      [...names.map((n) => values[n]), id]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: dupMessage });
    throw e;
  }
  const row = await fetchOne(req.entity, id);
  if (!row) return res.status(404).json({ error: 'Record not found' });
  res.json(row);
}));

admin.delete('/:entity/:id', withEntity, wrap(async (req, res) => {
  const id = parseId(req, res); if (id === null) return;
  const [r] = await pool.query(`DELETE FROM ${req.entity.table} WHERE id = ?`, [id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Record not found' });
  res.json({ ok: true });
}));

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ----------------------------------------------------------- static website
// the server code, node_modules and any dotfiles (.env) are never served
app.use((req, res, next) => {
  if (/^\/(server|node_modules)(\/|$)/i.test(req.path) || /(^|\/)\./.test(req.path)) return res.status(404).end();
  next();
});
app.use(express.static(SITE_DIR, { extensions: ['html'], index: 'index.html', dotfiles: 'ignore' }));

// ---------------------------------------------------------------- errors
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// ---------------------------------------------------------------- startup
async function ensureAdminUser() {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM admin_users');
  if (rows[0].n > 0) return;
  const user = (process.env.ADMIN_USER || '').trim();
  const pass = process.env.ADMIN_PASSWORD || '';
  if (!user || pass.length < 8) {
    console.warn('No admin account exists yet. Set ADMIN_USER and ADMIN_PASSWORD (8+ chars) in server/.env and restart.');
    return;
  }
  await pool.query('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', [user, await bcrypt.hash(pass, 12)]);
  console.log(`Admin account "${user}" created. You can now remove ADMIN_PASSWORD from .env.`);
}

(async () => {
  try {
    await pool.query('SELECT 1');
    await ensureAdminUser();
  } catch (e) {
    console.error('Cannot reach MySQL - check DB_* settings in server/.env and that schema.sql was imported.\n', e.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`Sagar Classes running at http://localhost:${PORT}`));
})();
