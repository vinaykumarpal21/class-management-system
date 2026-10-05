/* Sagar Classes admin panel – login, CRUD, attendance register, PDF / Excel downloads */
(function () {
  'use strict';

  var TOKEN_KEY = 'sc_admin_token';
  var token = sessionStorage.getItem(TOKEN_KEY) || '';
  var schema = null;
  var current = 'students';

  var TABS = [
    { id: 'students',   label: 'Students',           icon: 'ri-user-star-fill',         color: '#818cf8', type: 'entity' },
    { id: 'staff',      label: 'Staff',              icon: 'ri-group-fill',             color: '#34d399', type: 'entity' },
    { id: 'stuatt',     label: 'Student Attendance', icon: 'ri-user-location-fill',     color: '#38bdf8', type: 'att', person: 'Student' },
    { id: 'staffatt',   label: 'Staff Attendance',   icon: 'ri-calendar-check-fill',    color: '#a78bfa', type: 'att', person: 'Staff' },
    { id: 'toppers',    label: 'Toppers',            icon: 'ri-award-fill',             color: '#fbbf24', type: 'entity' },
    { id: 'events',     label: 'Functions',          icon: 'ri-calendar-schedule-fill', color: '#f97316', type: 'entity' },
    { id: 'notices',    label: 'Notices',            icon: 'ri-megaphone-fill',         color: '#f87171', type: 'entity' },
    { id: 'inquiries',  label: 'Enquiries',          icon: 'ri-mail-star-fill',         color: '#22c1e8', type: 'entity' }
  ];
  var STATS = [
    { key: 'students', label: 'Total Students', icon: 'ri-user-star-fill', color: '#818cf8' },
    { key: 'staff', label: 'Total Staff', icon: 'ri-group-fill', color: '#34d399' },
    { key: 'toppers', label: 'Toppers', icon: 'ri-award-fill', color: '#fbbf24' },
    { key: 'events', label: 'Events', icon: 'ri-calendar-schedule-fill', color: '#f97316' }
  ];

  /* ---------- tiny DOM helper (always uses textContent -> no XSS from stored data) ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }
  function icon(cls, color) { var i = h('i', { class: cls }); if (color) i.style.color = color; return i; }
  var $ = function (id) { return document.getElementById(id); };

  function toast(msg, isErr) {
    var t = h('div', { class: 'adm-toast' + (isErr ? ' err' : ''), role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---------- API ---------- */
  function logout(msg) {
    token = ''; sessionStorage.removeItem(TOKEN_KEY); schema = null;
    showLogin(msg);
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/json', Authorization: 'Bearer ' + token };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        if (r.status === 401) { logout('Session expired. Please log in again.'); return Promise.reject(new Error('auth')); }
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) return Promise.reject(new Error(j.error || 'Request failed'));
          return j;
        });
      });
  }
  function fail(e) { if (e && e.message !== 'auth') toast(e.message || 'Something went wrong', true); }

  function download(path, fallbackName) {
    try { if (window.SCStore && SCStore.download(path, fallbackName)) return; } catch (e) { fail(e); return; }
    fetch(path, { headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) {
        if (r.status === 401) { logout('Session expired. Please log in again.'); throw new Error('auth'); }
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'Download failed'); });
        var cd = r.headers.get('Content-Disposition') || '';
        var m = /filename="([^"]+)"/.exec(cd);
        return r.blob().then(function (b) { return { blob: b, name: m ? m[1] : fallbackName }; });
      })
      .then(function (f) {
        var url = URL.createObjectURL(f.blob);
        var a = h('a', { href: url, download: f.name });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      })
      .catch(fail);
  }

  /* ---------- login / logout ---------- */
  function showLogin(msg) {
    $('adminApp').hidden = true;
    $('loginView').hidden = false;
    var err = $('loginError');
    err.hidden = !msg; err.textContent = msg || '';
    $('loginPass').value = '';
  }
  function showApp() {
    $('loginView').hidden = true;
    $('adminApp').hidden = false;
    api('/api/admin-schema').then(function (s) {
      schema = s;
      buildTabs();
      loadStats();
      openTab(current);
    }).catch(fail);
  }

  $('loginForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var btn = ev.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: $('loginUser').value, password: $('loginPass').value })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) { showLogin(res.body.error || 'Login failed.'); return; }
        token = res.body.token; sessionStorage.setItem(TOKEN_KEY, token);
        showApp();
      })
      .catch(function () { showLogin('Cannot reach the server.'); })
      .finally(function () { btn.disabled = false; });
  });
  $('btnLogout').addEventListener('click', function () { logout(''); });
  $('btnAllExcel').addEventListener('click', function () { download('/api/admin/export/all/xlsx', 'sagar-classes-all-data.xlsx'); });

  /* ---------- tabs + stats ---------- */
  function buildTabs() {
    var nav = $('adminTabs');
    nav.textContent = '';
    TABS.forEach(function (t) {
      nav.appendChild(h('button', {
        type: 'button', class: 'admin-tab-btn' + (t.id === current ? ' active' : ''), 'data-tab': t.id,
        onclick: function () { openTab(t.id); }
      }, icon(t.icon, t.color), ' ' + t.label));
    });
  }
  function loadStats() {
    api('/api/admin/stats').then(function (s) {
      var grid = $('statsGrid'); grid.textContent = '';
      STATS.forEach(function (x) {
        grid.appendChild(h('div', { class: 'admin-stat-card' }, icon(x.icon, x.color),
          h('div', {}, h('strong', { text: String(s[x.key] || 0) }), h('span', { text: x.label }))));
      });
    }).catch(fail);
  }
  function openTab(id) {
    current = id;
    document.querySelectorAll('#adminTabs .admin-tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === id);
    });
    var tab = TABS.filter(function (t) { return t.id === id; })[0];
    if (tab.type === 'entity') renderEntity(tab); else renderAttendance(tab);
  }

  /* ---------- modal form ---------- */
  function openModal(title, fields, values, onSave) {
    var form = h('form', { class: 'modal-content form-modal', novalidate: true });
    var err = h('p', { class: 'adm-error', role: 'alert', hidden: true });
    form.appendChild(h('h3', { class: 'modal-title', text: title }));
    var inputs = {};
    fields.forEach(function (f) {
      var el;
      if (f.type === 'select') {
        el = h('select', { class: 'pill-input', name: f.key });
        f.options.forEach(function (o) { el.appendChild(h('option', { value: o, text: o })); });
      } else if (f.long) {
        el = h('textarea', { class: 'pill-input', name: f.key, maxlength: f.max });
      } else {
        el = h('input', { class: 'pill-input', name: f.key, type: f.type || 'text', maxlength: f.max });
      }
      if (f.required) el.required = true;
      var initial = values && values[f.key] != null ? values[f.key] : (f.default || '');
      if (!(f.type === 'select' && !initial)) el.value = initial;
      inputs[f.key] = el;
      form.appendChild(h('label', {}, f.label + (f.required ? ' *' : ''), el));
    });
    form.appendChild(err);
    var cancel = h('button', { type: 'button', class: 'adm-btn', text: 'Cancel' });
    var save = h('button', { type: 'submit', class: 'adm-btn primary' }, icon('ri-save-3-fill'), ' Save');
    form.appendChild(h('div', { class: 'modal-actions' }, cancel, save));

    var overlay = h('div', { class: 'modal active', role: 'dialog', 'aria-modal': 'true' }, form);
    function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    cancel.addEventListener('click', close);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = {};
      Object.keys(inputs).forEach(function (k) { data[k] = inputs[k].value; });
      save.disabled = true; err.hidden = true;
      onSave(data).then(close).catch(function (e) {
        if (e && e.message === 'auth') return;
        err.textContent = e.message || 'Could not save.'; err.hidden = false; save.disabled = false;
      });
    });
    document.body.appendChild(overlay);
    var first = form.querySelector('input,textarea,select'); if (first) first.focus();
  }

  /* ---------- generic CRUD tab ---------- */
  function renderEntity(tab) {
    var def = schema[tab.id];
    var panel = $('adminPanel');
    var rows = [];
    var query = '';
    var tbody = h('tbody');
    var count = h('span', { class: 'adm-count' });
    var hasPhoto = def.fields.some(function (f) { return f.key === 'photo_url'; });
    var cols = def.fields.filter(function (f) { return f.key !== 'photo_url'; }).concat(def.extra || []);

    var search = h('input', { class: 'pill-input', type: 'search', placeholder: 'Search…', 'aria-label': 'Search',
      oninput: function () { query = search.value.trim().toLowerCase(); draw(); } });
    var toolbar = h('div', { class: 'adm-toolbar' }, search);
    if (!def.readOnlyCreate) {
      toolbar.appendChild(h('button', { type: 'button', class: 'adm-btn primary', onclick: function () { edit(null); } }, icon('ri-add-circle-fill'), ' Add'));
    }
    toolbar.appendChild(h('span', { class: 'spacer' }));
    toolbar.appendChild(h('button', { type: 'button', class: 'adm-btn', onclick: function () { download('/api/admin/export/' + tab.id + '/xlsx', tab.id + '.xlsx'); } }, icon('ri-file-excel-2-fill', '#34d399'), ' Excel'));
    toolbar.appendChild(h('button', { type: 'button', class: 'adm-btn', onclick: function () { download('/api/admin/export/' + tab.id + '/pdf', tab.id + '.pdf'); } }, icon('ri-file-pdf-2-fill', '#f87171'), ' PDF'));

    var headRow = h('tr');
    if (hasPhoto) headRow.appendChild(h('th', { text: 'Photo' }));
    cols.forEach(function (c) { headRow.appendChild(h('th', { text: c.label })); });
    headRow.appendChild(h('th', { text: 'Actions' }));

    panel.textContent = '';
    panel.appendChild(h('h3', { class: 'form-title' }, icon(tab.icon, tab.color), ' ' + def.label, count));
    panel.appendChild(toolbar);
    panel.appendChild(h('div', { class: 'table-responsive-wrapper' },
      h('table', { class: 'adm-table' }, h('thead', {}, headRow), tbody)));

    function draw() {
      tbody.textContent = '';
      var shown = rows.filter(function (r) {
        return !query || def.fields.concat(def.extra || []).some(function (f) { return String(r[f.key] == null ? '' : r[f.key]).toLowerCase().indexOf(query) !== -1; });
      });
      count.textContent = '(' + shown.length + ')';
      if (!shown.length) {
        tbody.appendChild(h('tr', {}, h('td', { class: 'adm-empty', colspan: cols.length + (hasPhoto ? 2 : 1), text: 'No records found.' })));
        return;
      }
      shown.forEach(function (r) {
        var tr = h('tr');
        if (hasPhoto) {
          var img = h('img', { class: 'admin-avatar', alt: r.name || r.title || '', loading: 'lazy' });
          if (r.photo_url) { img.src = r.photo_url; img.addEventListener('error', function () { img.style.visibility = 'hidden'; }); }
          else img.style.visibility = 'hidden';
          tr.appendChild(h('td', {}, img));
        }
        cols.forEach(function (c) { tr.appendChild(h('td', { class: c.long ? 'long' : '', text: r[c.key] == null ? '' : String(r[c.key]) })); });
        tr.appendChild(h('td', {}, h('div', { class: 'adm-row-actions' },
          def.readOnlyCreate ? null : h('button', { type: 'button', class: 'adm-btn sm', onclick: function () { edit(r); } }, icon('ri-edit-2-fill'), ' Edit'),
          h('button', { type: 'button', class: 'adm-btn sm danger', onclick: function () { remove(r); } }, icon('ri-delete-bin-6-fill'), ' Delete'))));
        tbody.appendChild(tr);
      });
    }

    function load() {
      api('/api/admin/' + tab.id).then(function (data) { rows = data; draw(); }).catch(fail);
    }
    function edit(row) {
      openModal(row ? 'Edit record' : 'Add ' + def.label.replace(/s$/, ''), def.fields, row, function (data) {
        var p = row
          ? api('/api/admin/' + tab.id + '/' + row.id, { method: 'PUT', body: data })
          : api('/api/admin/' + tab.id, { method: 'POST', body: data });
        return p.then(function () { toast(row ? 'Updated' : 'Added'); load(); loadStats(); });
      });
    }
    function remove(row) {
      var label = row.name || row.title || row.text || ('#' + row.id);
      if (!window.confirm('Delete "' + String(label).slice(0, 60) + '"? This cannot be undone.')) return;
      api('/api/admin/' + tab.id + '/' + row.id, { method: 'DELETE' })
        .then(function () { toast('Deleted'); load(); loadStats(); }).catch(fail);
    }
    load();
  }

  /* ---------- attendance tab (month register + records CRUD) ---------- */
  function renderAttendance(tab) {
    var panel = $('adminPanel');
    var person = tab.person;
    var d = new Date();
    var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var regBox = h('div', { class: 'table-responsive-wrapper' });
    var recBox = h('div', { class: 'table-responsive-wrapper' });
    var groupLabel = person === 'Student' ? 'Class' : 'Department';

    var monthInput = h('input', { class: 'pill-input', type: 'month', value: month, 'aria-label': 'Month', style: 'max-width:200px',
      onchange: function () { if (monthInput.value) { month = monthInput.value; load(); } } });
    var slug = person === 'Student' ? 'student-attendance' : 'staff-attendance';
    var toolbar = h('div', { class: 'adm-toolbar' }, monthInput,
      h('button', { type: 'button', class: 'adm-btn primary', onclick: function () { edit(null); } }, icon('ri-add-circle-fill'), ' Add record'),
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'adm-btn', onclick: function () { download('/api/admin/export/' + slug + '/xlsx?month=' + month, slug + '.xlsx'); } }, icon('ri-file-excel-2-fill', '#34d399'), ' Excel'),
      h('button', { type: 'button', class: 'adm-btn', onclick: function () { download('/api/admin/export/' + slug + '/pdf?month=' + month, slug + '.pdf'); } }, icon('ri-file-pdf-2-fill', '#f87171'), ' PDF'));

    panel.textContent = '';
    panel.appendChild(h('h3', { class: 'form-title' }, icon(tab.icon, tab.color), ' ' + tab.label));
    panel.appendChild(toolbar);
    panel.appendChild(regBox);
    panel.appendChild(h('h4', { class: 'adm-sub', text: 'Individual records' }));
    panel.appendChild(recBox);

    function drawRegister(reg) {
      var head = h('tr', {}, h('th', { class: 'reg-name', text: person }));
      for (var day = 1; day <= reg.days; day++) head.appendChild(h('th', { class: reg.sundays.indexOf(day) !== -1 ? 'sun' : '', text: String(day) }));
      head.appendChild(h('th', { text: 'P' })); head.appendChild(h('th', { text: 'A' }));
      var body = h('tbody');
      reg.rows.forEach(function (r) {
        var tr = h('tr', {}, h('td', { class: 'reg-name' }, r.name, h('small', { text: r.group })));
        r.cells.forEach(function (c, i) {
          tr.appendChild(h('td', { class: (reg.sundays.indexOf(i + 1) !== -1 ? 'sun ' : '') + (c === 'P' ? 'cp' : c === 'A' ? 'ca' : ''), text: c || '–' }));
        });
        tr.appendChild(h('td', { class: 'cp', text: String(r.present) }));
        tr.appendChild(h('td', { class: 'ca', text: String(r.absent) }));
        body.appendChild(tr);
      });
      if (!reg.rows.length) body.appendChild(h('tr', {}, h('td', { class: 'adm-empty', colspan: reg.days + 3, text: 'No ' + person.toLowerCase() + 's yet. Add them in the ' + person + 's tab.' })));
      regBox.textContent = '';
      regBox.appendChild(h('table', { class: 'register' }, h('thead', {}, head), body));
    }

    function drawRecords(reg) {
      var body = h('tbody');
      reg.records.slice().reverse().forEach(function (r) {
        body.appendChild(h('tr', {},
          h('td', { text: r.att_date }), h('td', { text: r.name }), h('td', { text: r.group_name }),
          h('td', {}, h('span', { class: 'adm-pill ' + (r.status === 'Present' ? 'p' : 'a'), text: r.status })),
          h('td', {}, h('div', { class: 'adm-row-actions' },
            h('button', { type: 'button', class: 'adm-btn sm', onclick: function () { edit(r); } }, icon('ri-edit-2-fill'), ' Edit'),
            h('button', { type: 'button', class: 'adm-btn sm danger', onclick: function () { remove(r); } }, icon('ri-delete-bin-6-fill'), ' Delete')))));
      });
      if (!reg.records.length) body.appendChild(h('tr', {}, h('td', { class: 'adm-empty', colspan: 5, text: 'No attendance records for this month.' })));
      recBox.textContent = '';
      recBox.appendChild(h('table', { class: 'adm-table' },
        h('thead', {}, h('tr', {}, h('th', { text: 'Date' }), h('th', { text: person }), h('th', { text: groupLabel }), h('th', { text: 'Status' }), h('th', { text: 'Actions' }))),
        body));
    }

    function load() {
      api('/api/admin/attendance?type=' + person + '&month=' + month).then(function (reg) { drawRegister(reg); drawRecords(reg); }).catch(fail);
    }
    function edit(rec) {
      var today = new Date().toISOString().slice(0, 10);
      var fields = [
        { key: 'name', label: person + ' name', required: true, max: 100 },
        { key: 'group_name', label: groupLabel, required: true, max: 80 },
        { key: 'att_date', label: 'Date', type: 'date', required: true, default: month === today.slice(0, 7) ? today : month + '-01' },
        { key: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent'], required: true }
      ];
      openModal(rec ? 'Edit attendance' : 'Add attendance', fields, rec, function (data) {
        data.person_type = person;
        var p = rec ? api('/api/admin/attendance/' + rec.id, { method: 'PUT', body: data })
                    : api('/api/admin/attendance', { method: 'POST', body: data });
        return p.then(function () { toast(rec ? 'Updated' : 'Saved'); load(); });
      });
    }
    function remove(rec) {
      if (!window.confirm('Delete attendance of ' + rec.name + ' on ' + rec.att_date + '?')) return;
      api('/api/admin/attendance/' + rec.id, { method: 'DELETE' }).then(function () { toast('Deleted'); load(); }).catch(fail);
    }
    load();
  }

  /* ---------- start ---------- */
  if (token) {
    api('/api/admin/me').then(showApp).catch(function (e) {
      if (e && e.message !== 'auth') showLogin('Cannot reach the server.');   // 401 already shows the login form
    });
  } else {
    showLogin('');
  }
})();
