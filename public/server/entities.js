'use strict';
/**
 * Single source of truth for every admin-managed table.
 * - server.js uses it for CRUD / export routes
 * - the admin UI (script.js) receives the same description through GET /api/admin/meta
 * No dependencies on purpose, so it can be unit-tested without a database.
 */

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }));
const CLASS_NAME_SUGGESTIONS = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const DEPARTMENTS = [
  'Class 1 - 8', 'Class 9 - 10', 'Class 11 - 12 (Science)', 'Class 11 - 12 (Commerce)',
  'Hindi', 'English', 'Marathi', 'Mathematics', 'Science', 'Social Science (SST)',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics',
  'Business Studies (OCM)', 'Secretarial Practice (SP)',
];
const STATUS_OPTIONS = [{ value: 'Present', label: 'Present' }, { value: 'Absent', label: 'Absent' }];

const photo = { name: 'photo_url', label: 'Photo URL', type: 'url', max: 500, hideInExport: true };

const ENTITIES = {
  students: {
    table: 'students',
    label: 'Students',
    singular: 'Student',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 100, width: 28 },
      { name: 'phone', label: 'Phone Number', type: 'phone', required: true, width: 20 },
      { name: 'class_name', label: 'Class', type: 'text', required: true, max: 30, width: 14, suggestions: CLASS_NAME_SUGGESTIONS },
      photo,
    ],
    search: ['name', 'phone', 'class_name'],
    sortable: ['name', 'class_name', 'id'],
    order: 'name ASC, id ASC',
  },
  staff: {
    table: 'staff',
    label: 'Staff',
    singular: 'Staff member',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 100, width: 28 },
      { name: 'phone', label: 'Phone Number', type: 'phone', required: true, width: 20 },
      { name: 'department', label: 'Department', type: 'text', required: true, max: 80, width: 26, suggestions: DEPARTMENTS },
      photo,
    ],
    search: ['name', 'phone', 'department'],
    sortable: ['name', 'department', 'id'],
    order: 'name ASC, id ASC',
  },
  student_attendance: {
    table: 'student_attendance',
    label: 'Student Attendance',
    singular: 'Student attendance',
    fields: [
      { name: 'student_name', label: 'Student', type: 'text', required: true, max: 100, width: 28 },
      { name: 'standard', label: 'Class', type: 'standard', required: true, options: CLASS_OPTIONS, width: 12 },
      { name: 'att_date', label: 'Date', type: 'date', required: true, width: 14 },
      { name: 'status', label: 'Status', type: 'enum', required: true, options: STATUS_OPTIONS, width: 12 },
    ],
    search: ['student_name', 'standard'],
    dateColumn: 'att_date',
    statusColumn: 'status',
    sortable: ['student_name', 'standard', 'att_date', 'status', 'id'],
    order: 'att_date DESC, id DESC',
  },
  staff_attendance: {
    table: 'staff_attendance',
    label: 'Staff Attendance',
    singular: 'Staff attendance',
    fields: [
      { name: 'staff_name', label: 'Staff', type: 'text', required: true, max: 100, width: 28 },
      { name: 'department', label: 'Department', type: 'text', required: true, max: 80, width: 26, suggestions: DEPARTMENTS },
      { name: 'att_date', label: 'Date', type: 'date', required: true, width: 14 },
      { name: 'status', label: 'Status', type: 'enum', required: true, options: STATUS_OPTIONS, width: 12 },
    ],
    search: ['staff_name', 'department'],
    dateColumn: 'att_date',
    statusColumn: 'status',
    sortable: ['staff_name', 'department', 'att_date', 'status', 'id'],
    order: 'att_date DESC, id DESC',
  },
  toppers: {
    table: 'toppers',
    label: 'Toppers',
    singular: 'Topper',
    fields: [
      { name: 'rank_label', label: 'Rank', type: 'text', required: true, max: 10, width: 8, suggestions: ['1st', '2nd', '3rd', '4th', '5th'] },
      { name: 'name', label: 'Name', type: 'text', required: true, max: 100, width: 28 },
      { name: 'class_name', label: 'Class', type: 'text', required: true, max: 40, width: 24, suggestions: ['Class 10', 'Class 12 (Science)', 'Class 12 (Commerce)'] },
      { name: 'score', label: 'Score', type: 'text', required: true, max: 10, width: 10 },
      { name: 'message', label: 'Congratulation message', type: 'text', max: 255, width: 40, hideInExport: true },
      photo,
    ],
    search: ['name', 'class_name', 'rank_label'],
    sortable: ['name', 'class_name', 'score', 'rank_label', 'id'],
    order: 'class_name ASC, rank_label ASC, id ASC',
  },
  events: {
    table: 'events',
    label: 'Functions',
    singular: 'Function',
    fields: [
      { name: 'title', label: 'Event', type: 'text', required: true, max: 120, width: 28 },
      { name: 'category', label: 'Category', type: 'text', required: true, max: 50, width: 18, suggestions: ['Picnic', 'Festival', 'Academic', 'Sports', 'Cultural', 'PTM', 'National Day'] },
      { name: 'description', label: 'Description', type: 'textarea', required: true, max: 500, width: 60 },
      { name: 'image_url', label: 'Photo URL', type: 'url', max: 500, hideInExport: true },
    ],
    search: ['title', 'category', 'description'],
    sortable: ['title', 'category', 'id'],
    order: 'id ASC',
  },
  notices: {
    table: 'notices',
    label: 'Notices',
    singular: 'Notice',
    fields: [
      { name: 'message', label: 'Notice text', type: 'textarea', required: true, max: 500, width: 90 },
      { name: 'sort_order', label: 'Order', type: 'int', min: 0, max: 9999, width: 8, default: 0 },
    ],
    search: ['message'],
    sortable: ['sort_order', 'id'],
    order: 'sort_order ASC, id ASC',
  },
};

// ---------- validation ----------

const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;
const URL_RE = /^(https?:\/\/[^\s]+|[\w./-]+)$/i; // absolute http(s) URL or a relative path; javascript: etc. are rejected

function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function cleanText(v) {
  // strip control characters, collapse nothing else (names/messages keep their spacing)
  return String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

/** Validates a request body against the entity's fields. Returns { values, errors }. */
function validate(entity, body, { partial = false } = {}) {
  const values = {};
  const errors = {};
  const src = body && typeof body === 'object' ? body : {};
  for (const f of entity.fields) {
    const present = Object.prototype.hasOwnProperty.call(src, f.name);
    if (!present && partial) continue;
    let v = present && src[f.name] !== null && src[f.name] !== undefined ? src[f.name] : '';
    if (typeof v === 'object') { errors[f.name] = 'Invalid value'; continue; }
    v = f.type === 'textarea' ? String(v).replace(/\r/g, '').trim() : cleanText(v);

    if (v === '') {
      if (f.required) { errors[f.name] = `${f.label} is required`; continue; }
      values[f.name] = f.type === 'int' ? (f.default ?? 0) : null;
      continue;
    }
    if (f.max && f.type !== 'int' && v.length > f.max) { errors[f.name] = `${f.label} must be at most ${f.max} characters`; continue; }

    switch (f.type) {
      case 'phone':
        if (!PHONE_RE.test(v)) { errors[f.name] = 'Enter a valid phone number'; continue; }
        break;
      case 'url':
        if (!URL_RE.test(v)) { errors[f.name] = 'Enter a valid http(s) link'; continue; }
        break;
      case 'date':
        if (!isValidDate(v)) { errors[f.name] = 'Enter a valid date (YYYY-MM-DD)'; continue; }
        break;
      case 'enum':
      case 'standard':
        if (!f.options.some((o) => o.value === v)) { errors[f.name] = `Invalid ${f.label.toLowerCase()}`; continue; }
        break;
      case 'int': {
        if (!/^-?\d+$/.test(v)) { errors[f.name] = `${f.label} must be a whole number`; continue; }
        const n = Number(v);
        if (n < (f.min ?? -Infinity) || n > (f.max ?? Infinity)) { errors[f.name] = `${f.label} is out of range`; continue; }
        values[f.name] = n;
        continue;
      }
      default:
    }
    values[f.name] = v;
  }
  return { values, errors, ok: Object.keys(errors).length === 0 };
}

/** Public attendance forms may only record a date close to "today". */
function checkPublicDateWindow(dateStr, now = new Date(), pastDays = 7, futureDays = 1) {
  const d = new Date(dateStr + 'T00:00:00Z').getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = 86400000;
  return d >= today - pastDays * day && d <= today + futureDays * day;
}

// ---------- list / export SQL ----------

function monthRange(month) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(month || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const ny = mo === 12 ? y + 1 : y;
  const nm = mo === 12 ? 1 : mo + 1;
  return { start: `${m[1]}-${m[2]}-01`, end: `${ny}-${String(nm).padStart(2, '0')}-01` };
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

/**
 * Builds a parameterised SELECT. Column / table names only ever come from the ENTITIES
 * whitelist above, never from request input.
 */
function buildList(entity, query = {}, { forExport = false } = {}) {
  const where = [];
  const params = [];

  const q = String(query.q || '').trim().slice(0, 100);
  if (q) {
    where.push('(' + entity.search.map((c) => `${c} LIKE ?`).join(' OR ') + ')');
    entity.search.forEach(() => params.push('%' + escapeLike(q) + '%'));
  }
  if (entity.dateColumn && query.month) {
    const r = monthRange(query.month);
    if (r) {
      where.push(`${entity.dateColumn} >= ? AND ${entity.dateColumn} < ?`);
      params.push(r.start, r.end);
    }
  }
  if (entity.statusColumn && (query.status === 'Present' || query.status === 'Absent')) {
    where.push(`${entity.statusColumn} = ?`);
    params.push(query.status);
  }

  let order = entity.order;
  if (query.sort && entity.sortable.includes(String(query.sort))) {
    const dir = String(query.dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    order = `${query.sort} ${dir}, id DESC`;
  }

  const cols = ['id', ...entity.fields.map((f) => f.name)].join(', ');
  const limit = forExport ? 50000 : Math.min(Math.max(parseInt(query.limit, 10) || 500, 1), 1000);
  const sql = `SELECT ${cols} FROM ${entity.table}` + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ` ORDER BY ${order} LIMIT ${limit}`;
  return { sql, params };
}

/** Description sent to the browser (no SQL details). */
function publicMeta() {
  const out = {};
  for (const [key, e] of Object.entries(ENTITIES)) {
    out[key] = {
      label: e.label,
      singular: e.singular,
      hasMonth: !!e.dateColumn,
      hasStatus: !!e.statusColumn,
      sortable: e.sortable,
      fields: e.fields.map(({ name, label, type, required, max, options, suggestions, min }) => ({
        name, label, type, required: !!required, max, min, options, suggestions,
      })),
    };
  }
  return out;
}

function exportColumns(entity) {
  return entity.fields.filter((f) => !f.hideInExport).map((f) => ({
    key: f.name,
    label: f.label,
    width: f.width || 20,
    format: f.type === 'standard' ? (v) => `Class ${v}` : undefined,
  }));
}

module.exports = {
  ENTITIES, validate, buildList, monthRange, publicMeta, exportColumns,
  checkPublicDateWindow, isValidDate, escapeLike,
};
