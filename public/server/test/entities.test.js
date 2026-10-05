'use strict';
const assert = require('assert');
const { ENTITIES, validate, buildList, monthRange, checkPublicDateWindow, publicMeta, exportColumns } = require('../entities');

// --- validation
let r = validate(ENTITIES.students, { name: ' Aarav Sharma ', phone: '+91 98111 22331', class_name: 'Class 10', photo_url: '' });
assert(r.ok && r.values.name === 'Aarav Sharma' && r.values.photo_url === null);

r = validate(ENTITIES.students, { name: '', phone: 'abc', class_name: 'Class 10' });
assert(!r.ok && r.errors.name && r.errors.phone);

r = validate(ENTITIES.students, { name: 'X', phone: '9876543210', class_name: '10', photo_url: 'javascript:alert(1)' });
assert(!r.ok && r.errors.photo_url, 'javascript: urls must be rejected');

r = validate(ENTITIES.student_attendance, { student_name: 'A', standard: '13', att_date: '2026-02-30', status: 'Maybe' });
assert(!r.ok && r.errors.standard && r.errors.att_date && r.errors.status);

r = validate(ENTITIES.student_attendance, { student_name: 'A', standard: '10', att_date: '2026-10-04', status: 'Present' });
assert(r.ok);

r = validate(ENTITIES.notices, { message: 'Hello', sort_order: '3' });
assert(r.ok && r.values.sort_order === 3);
r = validate(ENTITIES.notices, { message: 'Hello' });
assert(r.ok && r.values.sort_order === 0);
r = validate(ENTITIES.notices, { message: 'Hello', sort_order: 'x' });
assert(!r.ok);

r = validate(ENTITIES.students, { name: { $ne: 1 }, phone: '9876543210', class_name: '5' });
assert(!r.ok && r.errors.name, 'objects must be rejected');

r = validate(ENTITIES.students, { name: 'A'.repeat(101), phone: '9876543210', class_name: '5' });
assert(!r.ok && r.errors.name);

// --- months
assert.deepStrictEqual(monthRange('2026-12'), { start: '2026-12-01', end: '2027-01-01' });
assert.deepStrictEqual(monthRange('2026-10'), { start: '2026-10-01', end: '2026-11-01' });
assert.strictEqual(monthRange('2026-13'), null);
assert.strictEqual(monthRange("2026-10' OR 1=1"), null);

// --- SQL building
let q = buildList(ENTITIES.students, { q: '50%_off', sort: 'name; DROP TABLE students', dir: 'desc' });
assert(!/DROP/.test(q.sql), 'sort must be whitelisted');
assert(/ORDER BY name ASC, id ASC/.test(q.sql));
assert.strictEqual(q.params.length, 3);
assert.strictEqual(q.params[0], '%50\\%\\_off%');

q = buildList(ENTITIES.student_attendance, { month: '2026-10', status: 'Absent', sort: 'att_date', dir: 'asc', limit: '99999' });
assert(/att_date >= \? AND att_date < \?/.test(q.sql));
assert(/status = \?/.test(q.sql));
assert(/ORDER BY att_date ASC, id DESC LIMIT 1000$/.test(q.sql));
assert.deepStrictEqual(q.params, ['2026-10-01', '2026-11-01', 'Absent']);

q = buildList(ENTITIES.students, {}, { forExport: true });
assert(/LIMIT 50000$/.test(q.sql));

// --- public date window
const now = new Date('2026-10-04T10:00:00Z');
assert(checkPublicDateWindow('2026-10-04', now));
assert(checkPublicDateWindow('2026-09-27', now));
assert(!checkPublicDateWindow('2026-09-26', now));
assert(!checkPublicDateWindow('2026-10-06', now));

// --- meta / export columns never leak SQL and respect hideInExport
const meta = publicMeta();
assert(meta.students.fields.length === 4 && !JSON.stringify(meta).includes('SELECT'));
assert(!exportColumns(ENTITIES.students).some((c) => c.key === 'photo_url'));
assert.strictEqual(exportColumns(ENTITIES.student_attendance).find((c) => c.key === 'standard').format('10'), 'Class 10');

console.log('entities.js: all tests passed');
