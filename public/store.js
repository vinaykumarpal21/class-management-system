/* Sagar Classes – browser data store.
   Replaces the Node/MySQL backend: every /api/... request made by script.js and admin.js
   is answered here from localStorage. Data lives in THIS browser only. */
(function () {
  'use strict';

  var DB_KEY = 'sc_db_v1';
  var SESSION_KEY = 'sc_admin_token';
  var SESSION_VALUE = 'local-admin-session';
  var DEFAULT_ADMIN = { user: 'admin', pass: 'admin@123' };   // change from the browser console: SCStore.setAdmin('user','password')

  /* ---------- entity definitions (validation + labels) ---------- */
  var PHONE = /^[0-9+()\-\s]{6,20}$/;
  var ENTITIES = {
    students: { label: 'Students', order: ['class_name', 'name'], fields: [
      { key: 'name', label: 'Name', max: 100, required: true },
      { key: 'phone', label: 'Phone Number', max: 20, pattern: PHONE },
      { key: 'class_name', label: 'Class', max: 30, required: true },
      { key: 'photo_url', label: 'Photo URL', max: 500, url: true, noExport: true }] },
    staff: { label: 'Staff', order: ['name'], fields: [
      { key: 'name', label: 'Name', max: 100, required: true },
      { key: 'phone', label: 'Phone Number', max: 20, pattern: PHONE },
      { key: 'department', label: 'Department', max: 80, required: true },
      { key: 'photo_url', label: 'Photo URL', max: 500, url: true, noExport: true }] },
    toppers: { label: 'Toppers', order: ['id'], fields: [
      { key: 'rank_label', label: 'Rank', max: 10, required: true },
      { key: 'name', label: 'Name', max: 100, required: true },
      { key: 'class_name', label: 'Class', max: 30, required: true },
      { key: 'score', label: 'Score', max: 10, required: true },
      { key: 'photo_url', label: 'Photo URL', max: 500, url: true, noExport: true }] },
    events: { label: 'Functions & Events', order: ['id'], fields: [
      { key: 'title', label: 'Event', max: 120, required: true },
      { key: 'category', label: 'Category', max: 50, required: true },
      { key: 'description', label: 'Description', max: 500, long: true },
      { key: 'photo_url', label: 'Photo URL', max: 500, url: true, noExport: true }] },
    notices: { label: 'Notices', order: ['id'], fields: [
      { key: 'text', label: 'Notice text', max: 300, required: true, long: true }] },
    inquiries: { label: 'Enquiries', order: ['-id'], readOnlyCreate: true, extra: [{ key: 'created_at', label: 'Received' }], fields: [
      { key: 'name', label: 'Name', max: 100, required: true },
      { key: 'phone', label: 'Phone', max: 20, required: true, pattern: PHONE },
      { key: 'standard', label: 'Interested in', max: 60 },
      { key: 'message', label: 'Message', max: 1000, long: true }] }
  };

  /* ---------- seed data (same as the old schema.sql) ---------- */
  function seed() {
    var img = function (n) { return 'https://i.pravatar.cc/100?img=' + n; };
    var ev = function (t, c, d, p) { return { title: t, category: c, description: d, photo_url: 'https://images.unsplash.com/' + p + '?auto=format&fit=crop&w=900&q=85' }; };
    var db = {
      students: [
        { name: 'Aarav Sharma', phone: '+91 98111 22331', class_name: 'Class 10', photo_url: img(11) },
        { name: 'Priya Mehta', phone: '+91 98222 33442', class_name: 'Class 10', photo_url: img(47) },
        { name: 'Rohan Patil', phone: '+91 98333 44553', class_name: 'Class 9', photo_url: img(15) },
        { name: 'Sneha Joshi', phone: '+91 98444 55664', class_name: 'Class 12', photo_url: img(48) },
        { name: 'Aryan Gupta', phone: '+91 98555 66775', class_name: 'Class 8', photo_url: img(12) },
        { name: 'Ishaan Verma', phone: '+91 98666 78886', class_name: 'Class 11', photo_url: img(33) }],
      staff: [
        { name: 'Sagar Sir', phone: '+91 99111 00111', department: 'Mathematics', photo_url: img(57) },
        { name: "Pooja Ma'am", phone: '+91 99222 00222', department: 'Science', photo_url: img(44) },
        { name: "Pratibha Ma'am", phone: '+91 99333 00333', department: 'Science', photo_url: img(44) },
        { name: "Pranjal Ma'am", phone: '+91 99444 00444', department: 'Science', photo_url: img(44) },
        { name: "Poorva Ma'am", phone: '+91 99555 00555', department: 'Science', photo_url: img(44) },
        { name: "Sanvi Ma'am", phone: '+91 99666 00666', department: 'Science', photo_url: img(44) },
        { name: "Prachi Ma'am", phone: '+91 99777 00777', department: 'Science', photo_url: img(44) },
        { name: 'Rahul Sir', phone: '+91 99888 00888', department: 'English', photo_url: img(59) },
        { name: "Anita Ma'am", phone: '+91 99999 00999', department: 'Social Science', photo_url: img(49) }],
      toppers: [
        { rank_label: '1st', name: 'Sneha Joshi', class_name: 'Class 12', score: '97%', photo_url: img(48) },
        { rank_label: '2nd', name: 'Aarav Sharma', class_name: 'Class 10', score: '95%', photo_url: img(11) },
        { rank_label: '3rd', name: 'Priya Mehta', class_name: 'Class 10', score: '93%', photo_url: img(47) },
        { rank_label: '4th', name: 'Ishaan Verma', class_name: 'Class 11', score: '91%', photo_url: img(33) }],
      events: [
        ev('Annual Picnic', 'Picnic', 'A fun-filled educational picnic with games, teamwork and memorable activities.', 'photo-1504150558240-0b4fd8946624'),
        ev('Diwali Celebration', 'Festival', 'A vibrant celebration with rangoli, cultural activities and festive learning.', 'photo-1601050690597-df0568f70950'),
        ev('Science Exhibition', 'Academic', 'Students present creative experiments, working models and science projects.', 'photo-1532094349884-543bc11b234d'),
        ev('Sports Day', 'Sports', 'Track, field and team activities that encourage fitness, discipline and sportsmanship.', 'photo-1461896836934-ffe607ba8211'),
        ev('Annual Day', 'Cultural', 'A celebration of student talent through performances, awards and cultural programmes.', 'photo-1503095396549-807759245b35'),
        ev('Parent-Teacher Meeting', 'PTM', 'A constructive interaction between parents and teachers to review student progress.', 'photo-1529390079861-591de354faf5'),
        ev('Independence Day', 'National Day', 'Patriotic activities, student performances and a special assembly celebrating India.', 'photo-1524492412937-b28074a5d7da'),
        ev('Republic Day', 'National Day', 'A meaningful school celebration with speeches, performances and civic learning.', 'photo-1532375810709-75b1da00537c')],
      notices: [
        { text: '🎓 Admissions open for 2026-27 academic year! Enroll now.' },
        { text: '📝 Unit Test scheduled for Class 10 on 1st September 2026.' },
        { text: '🏆 Congratulations to all Board toppers of 2025-26 batch!' },
        { text: '📅 Parent-Teacher Meeting on 10th September 2026 at 10:00 AM.' }],
      inquiries: [], attendance: [], seq: {}, admin: { user: DEFAULT_ADMIN.user, hash: hash(DEFAULT_ADMIN.pass) }
    };
    ['students', 'staff', 'toppers', 'events', 'notices', 'inquiries', 'attendance'].forEach(function (k) {
      db[k].forEach(function (r) { r.id = (db.seq[k] = (db.seq[k] || 0) + 1); r.created_at = now(); });
    });
    return db;
  }

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h >>> 0); }
  function now() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

  var memoryFallback = null;   // used if localStorage is blocked
  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
      var db = seed(); localStorage.setItem(DB_KEY, JSON.stringify(db)); return db;
    } catch (e) { return memoryFallback || (memoryFallback = seed()); }
  }
  function save(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) { memoryFallback = db; }
  }
  function nextId(db, k) { db.seq[k] = (db.seq[k] || 0) + 1; return db.seq[k]; }

  /* ---------- validation ---------- */
  function cleanBody(ent, body) {
    var values = {};
    for (var i = 0; i < ent.fields.length; i++) {
      var f = ent.fields[i], v = body[f.key];
      v = v === undefined || v === null ? '' : String(v).trim();
      if (f.required && !v) return { error: f.label + ' is required.' };
      if (v.length > f.max) return { error: f.label + ' must be at most ' + f.max + ' characters.' };
      if (v && f.pattern && !f.pattern.test(v)) return { error: f.label + ' is not valid.' };
      if (v && f.url && !/^(https?:\/\/|\/|[\w.\-]+\.(png|jpe?g|gif|webp|svg)$)/i.test(v)) return { error: f.label + ' must start with http(s):// or be a site path.' };
      values[f.key] = v === '' ? null : v;
    }
    return { values: values };
  }
  function isValidDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }
  function parseAttendance(body, type) {
    var name = String(body.name || '').trim();
    var group = String(body[type === 'Student' ? 'standard' : 'department'] || body.group_name || '').trim();
    var date = String(body.date || body.att_date || '').trim();
    var status = String(body.status || '').trim();
    if (name.length < 2 || name.length > 100) return { error: 'Please enter a valid name.' };
    if (!group || group.length > 80) return { error: type === 'Student' ? 'Select a class.' : 'Select a department.' };
    if (type === 'Student' && /^\d{1,2}$/.test(group)) group = 'Class ' + group;
    if (!isValidDate(date)) return { error: 'Please choose a valid date.' };
    if (status !== 'Present' && status !== 'Absent') return { error: 'Choose Present or Absent.' };
    return { name: name, group: group, date: date, status: status };
  }
  var typeOf = function (t) { return String(t).toLowerCase() === 'staff' ? 'Staff' : 'Student'; };

  function upsertAttendance(db, type, a) {
    var key = a.name.toLowerCase();
    var ex = db.attendance.filter(function (r) { return r.person_type === type && r.name.toLowerCase() === key && r.att_date === a.date; })[0];
    if (ex) { ex.status = a.status; ex.group_name = a.group; return; }
    db.attendance.push({ id: nextId(db, 'attendance'), person_type: type, name: a.name, group_name: a.group, att_date: a.date, status: a.status, created_at: now() });
  }

  /* ---------- attendance register ---------- */
  var MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  function currentMonth() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function buildRegister(db, type, month) {
    var p = month.split('-'), y = +p[0], m = +p[1];
    var days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var records = db.attendance.filter(function (r) { return r.person_type === type && r.att_date.slice(0, 7) === month; })
      .sort(function (a, b) { return a.att_date.localeCompare(b.att_date) || a.name.localeCompare(b.name); })
      .map(function (r) { return { id: r.id, name: r.name, group_name: r.group_name, att_date: r.att_date, status: r.status }; });
    var master = type === 'Student'
      ? sorted(db.students, ['class_name', 'name']).map(function (s) { return { name: s.name, grp: s.class_name }; })
      : sorted(db.staff, ['name']).map(function (s) { return { name: s.name, grp: s.department }; });
    var people = {}, order = [];
    var add = function (name, grp) { var k = name.trim().toLowerCase(); if (!people[k]) { people[k] = { name: name, group: grp, cells: new Array(days).fill('') }; order.push(k); } return people[k]; };
    master.forEach(function (s) { add(s.name, s.grp); });
    records.forEach(function (r) { add(r.name, r.group_name).cells[+r.att_date.slice(8, 10) - 1] = r.status === 'Present' ? 'P' : 'A'; });
    var rows = order.map(function (k) {
      var q = people[k];
      q.present = q.cells.filter(function (c) { return c === 'P'; }).length;
      q.absent = q.cells.filter(function (c) { return c === 'A'; }).length;
      return q;
    });
    var sundays = [];
    for (var d = 1; d <= days; d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0) sundays.push(d);
    return { month: month, days: days, sundays: sundays, rows: rows, records: records };
  }

  function sorted(list, order) {
    return list.slice().sort(function (a, b) {
      for (var i = 0; i < order.length; i++) {
        var k = order[i], desc = k[0] === '-'; if (desc) k = k.slice(1);
        var x = a[k], y = b[k], c = typeof x === 'number' ? x - y : String(x || '').localeCompare(String(y || ''));
        if (c) return desc ? -c : c;
      }
      return 0;
    });
  }

  /* ---------- API router ---------- */
  function HttpError(status, message) { this.status = status; this.message = message; }
  function authed(init) {
    var h = (init && init.headers) || {};
    var a = h.Authorization || h.authorization || '';
    if (a !== 'Bearer ' + SESSION_VALUE) throw new HttpError(401, 'Login required.');
  }

  function route(method, url, body, init) {
    var u = new URL(url, location.href), path = u.pathname.replace(/^.*?\/api\//, '/api/'), q = u.searchParams, m;
    var db = load();

    if (method === 'POST' && path === '/api/auth/login') {
      var user = String(body.username || '').trim(), pass = String(body.password || '');
      if (user !== db.admin.user || hash(pass) !== db.admin.hash) throw new HttpError(401, 'Invalid username or password.');
      return { token: SESSION_VALUE, username: user };
    }

    /* public */
    if (method === 'GET' && path === '/api/public/notices') return sorted(db.notices, ['id']).map(function (n) { return { text: n.text }; });
    if (method === 'GET' && path === '/api/public/toppers') return sorted(db.toppers, ['id']);
    if (method === 'GET' && path === '/api/public/events') return sorted(db.events, ['id']);
    if (method === 'POST' && path === '/api/public/contact') {
      var cb = { name: body.visitorName != null ? body.visitorName : body.name, phone: body.visitorPhone != null ? body.visitorPhone : body.phone,
                 standard: body.visitorStandard != null ? body.visitorStandard : body.standard, message: body.visitorMessage != null ? body.visitorMessage : body.message };
      var c = cleanBody(ENTITIES.inquiries, cb);
      if (c.error) throw new HttpError(400, c.error);
      c.values.id = nextId(db, 'inquiries'); c.values.created_at = now();
      db.inquiries.push(c.values); save(db);
      return { ok: true, message: 'Thank you! We will contact you soon.' };
    }
    if (method === 'POST' && (m = /^\/api\/public\/attendance\/(student|staff)$/.exec(path))) {
      var type = m[1] === 'student' ? 'Student' : 'Staff';
      var a = parseAttendance(body, type);
      if (a.error) throw new HttpError(400, a.error);
      if (new Date(a.date + 'T00:00:00Z') > new Date(Date.now() + 36 * 3600 * 1000)) throw new HttpError(400, 'Attendance cannot be marked for a future date.');
      upsertAttendance(db, type, a); save(db);
      return { ok: true, message: 'Attendance submitted. Thank you!' };
    }

    /* admin (login required) */
    if (path.indexOf('/api/admin') !== 0) throw new HttpError(404, 'Not found.');
    authed(init);

    if (path === '/api/admin-schema') {
      var out = {};
      Object.keys(ENTITIES).forEach(function (k) {
        var e = ENTITIES[k];
        out[k] = { label: e.label, readOnlyCreate: !!e.readOnlyCreate, extra: e.extra || [], fields: e.fields.map(function (f) {
          return { key: f.key, label: f.label, long: !!f.long, required: !!f.required, max: f.max, url: !!f.url }; }) };
      });
      return out;
    }
    if (path === '/api/admin/me') return { username: db.admin.user };
    if (path === '/api/admin/stats') {
      var st = {}; ['students', 'staff', 'toppers', 'events', 'notices', 'inquiries'].forEach(function (k) { st[k] = db[k].length; }); return st;
    }

    if (path === '/api/admin/attendance' && method === 'GET') {
      var mo = MONTH_RE.test(q.get('month') || '') ? q.get('month') : currentMonth();
      return buildRegister(db, typeOf(q.get('type')), mo);
    }
    var attFromAdmin = function (b) {
      var t = typeOf(b.person_type), o = {}; for (var k in b) o[k] = b[k];
      o[t === 'Student' ? 'standard' : 'department'] = b.group_name;
      var r = parseAttendance(o, t); if (r.error) throw new HttpError(400, r.error); r.type = t; return r;
    };
    if (path === '/api/admin/attendance' && method === 'POST') { var n = attFromAdmin(body); upsertAttendance(db, n.type, n); save(db); return { ok: true, _status: 201 }; }
    if ((m = /^\/api\/admin\/attendance\/(\d+)$/.exec(path))) {
      var id = +m[1], rec = db.attendance.filter(function (r) { return r.id === id; })[0];
      if (!rec) throw new HttpError(404, 'Record not found.');
      if (method === 'DELETE') { db.attendance = db.attendance.filter(function (r) { return r.id !== id; }); save(db); return { ok: true }; }
      if (method === 'PUT') {
        var p = attFromAdmin(body);
        var dup = db.attendance.some(function (r) { return r.id !== id && r.person_type === p.type && r.name.toLowerCase() === p.name.toLowerCase() && r.att_date === p.date; });
        if (dup) throw new HttpError(409, 'Another record already exists for that person and date.');
        rec.person_type = p.type; rec.name = p.name; rec.group_name = p.group; rec.att_date = p.date; rec.status = p.status; save(db);
        return { ok: true };
      }
    }

    if ((m = /^\/api\/admin\/([a-z]+)(?:\/(\d+))?$/.exec(path)) && ENTITIES[m[1]]) {
      var key = m[1], ent = ENTITIES[key], rid = m[2] ? +m[2] : null;
      if (method === 'GET' && !rid) return sorted(db[key], ent.order);
      if (method === 'POST' && !rid) {
        if (ent.readOnlyCreate) throw new HttpError(405, 'Not allowed.');
        var cr = cleanBody(ent, body); if (cr.error) throw new HttpError(400, cr.error);
        cr.values.id = nextId(db, key); cr.values.created_at = now(); db[key].push(cr.values); save(db);
        return { ok: true, id: cr.values.id, _status: 201 };
      }
      if (rid) {
        var row = db[key].filter(function (r) { return r.id === rid; })[0];
        if (!row) throw new HttpError(404, 'Record not found.');
        if (method === 'PUT') { var up = cleanBody(ent, body); if (up.error) throw new HttpError(400, up.error); Object.assign(row, up.values); save(db); return { ok: true }; }
        if (method === 'DELETE') { db[key] = db[key].filter(function (r) { return r.id !== rid; }); save(db); return { ok: true }; }
      }
    }
    throw new HttpError(404, 'Not found.');
  }

  /* ---------- fetch shim ---------- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!/(^|\/)api\//.test(url.split('?')[0]) && url.indexOf('/api') !== 0) return realFetch ? realFetch(input, init) : Promise.reject(new TypeError('fetch unavailable'));
    init = init || {};
    var status = 200, payload;
    try {
      var body = init.body ? JSON.parse(init.body) : {};
      payload = route((init.method || 'GET').toUpperCase(), url, body, init);
      if (payload && payload._status) { status = payload._status; delete payload._status; }
    } catch (e) {
      if (e instanceof HttpError) { status = e.status; payload = { error: e.message }; }
      else { console.error(e); status = 500; payload = { error: 'Something went wrong.' }; }
    }
    return Promise.resolve(new Response(JSON.stringify(payload), { status: status, headers: { 'Content-Type': 'application/json' } }));
  };

  /* ---------- Excel / PDF export (done in the browser) ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function table(title, head, rows) {
    return '<h2>' + esc(title) + '</h2><table border="1" cellspacing="0" cellpadding="4"><thead><tr>' +
      head.map(function (h) { return '<th style="background:#4338ca;color:#fff">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function entityTable(db, key) {
    var e = ENTITIES[key], cols = e.fields.filter(function (f) { return !f.noExport; }).concat(e.extra || []);
    var rows = sorted(db[key], e.order).map(function (r, i) { return [i + 1].concat(cols.map(function (c) { return r[c.key]; })); });
    return table(e.label, ['#'].concat(cols.map(function (c) { return c.label; })), rows);
  }
  function registerTables(db, type, month) {
    var reg = buildRegister(db, type, month), days = [];
    for (var i = 1; i <= reg.days; i++) days.push(String(i));
    var grp = type === 'Student' ? 'Class' : 'Department';
    return table(type + ' Attendance Register – ' + month, [type, grp].concat(days, ['Present', 'Absent']),
        reg.rows.map(function (r) { return [r.name, r.group].concat(r.cells, [r.present, r.absent]); })) +
      table(type + ' Attendance Records – ' + month, ['Date', type, grp, 'Status'],
        reg.records.map(function (r) { return [r.att_date, r.name, r.group_name, r.status]; }));
  }

  function download(path, fallbackName) {
    var u = new URL(path, location.href), m = /\/export\/([a-z\-]+)\/(xlsx|pdf)$/.exec(u.pathname);
    if (!m) return false;
    var name = m[1], fmt = m[2], db = load();
    var month = MONTH_RE.test(u.searchParams.get('month') || '') ? u.searchParams.get('month') : currentMonth();
    var html, title;
    if (name === 'all') {
      title = 'Sagar Classes – all data';
      html = Object.keys(ENTITIES).map(function (k) { return entityTable(db, k); }).join('<br>') + '<br>' + registerTables(db, 'Student', month) + '<br>' + registerTables(db, 'Staff', month);
    } else if (name === 'student-attendance' || name === 'staff-attendance') {
      title = (name.indexOf('staff') === 0 ? 'Staff' : 'Student') + ' attendance ' + month;
      html = registerTables(db, name.indexOf('staff') === 0 ? 'Staff' : 'Student', month);
    } else if (ENTITIES[name]) { title = ENTITIES[name].label; html = entityTable(db, name); }
    else return false;

    var doc = '<html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:Arial,sans-serif;font-size:12px}' +
      'table{border-collapse:collapse;margin-bottom:16px}th,td{border:1px solid #999;padding:4px 6px;text-align:left}h2{font-size:15px}' +
      '@page{size:landscape;margin:10mm}</style></head><body>' + html + '</body></html>';

    if (fmt === 'pdf') {   // opens a print view: choose "Save as PDF"
      var w = window.open('', '_blank');
      if (!w) throw new Error('Please allow pop-ups to download the PDF.');
      w.document.open(); w.document.write(doc); w.document.close(); w.focus();
      setTimeout(function () { w.print(); }, 400);
      return true;
    }
    var blob = new Blob(['\ufeff' + doc], { type: 'application/vnd.ms-excel' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (fallbackName || name).replace(/\.xlsx$/, '') + '-' + new Date().toISOString().slice(0, 10) + '.xls';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    return true;
  }

  window.SCStore = {
    download: download,
    sessionKey: SESSION_KEY,
    setAdmin: function (user, pass) {
      if (!user || !pass || pass.length < 8) throw new Error('Username required and password must be 8+ characters.');
      var db = load(); db.admin = { user: user, hash: hash(pass) }; save(db); return 'Admin login updated.';
    },
    exportJSON: function () { return JSON.stringify(load(), null, 2); },
    reset: function () { try { localStorage.removeItem(DB_KEY); } catch (e) {} memoryFallback = null; return 'Data reset to sample data.'; }
  };
})();
