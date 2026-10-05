/* Public site script: live notice ticker + attendance / enquiry forms saved to MySQL via the API */
(function () {
  'use strict';

  // ---- 1. Notice ticker from the database (keeps the static text if the API is unreachable) ----
  var ticker = document.querySelector('.ticker-text');
  if (ticker) {
    fetch('/api/public/notices', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (list) {
        if (Array.isArray(list) && list.length) {
          ticker.textContent = list.map(function (n) { return n.text; }).join('   ·   ');
        }
      })
      .catch(function () { /* keep static notices */ });
  }

  // ---- 2. Forms: attendance (student/staff) and contact enquiry ----
  function setMessage(form, text, ok) {
    var box = form.querySelector('.form-feedback');
    if (!box) {
      box = document.createElement('p');
      box.className = 'form-feedback';
      box.setAttribute('role', 'status');
      box.style.cssText = 'margin:.75rem 0 0;font-weight:700;font-size:.9rem;text-align:center';
      form.appendChild(box);
    }
    box.style.color = ok ? '#34d399' : '#f87171';
    box.textContent = text;
  }

  document.querySelectorAll('form[data-api]').forEach(function (form) {
    // default the date field to today on attendance forms
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      var d = new Date();
      dateInput.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (btn) btn.disabled = true;
      setMessage(form, 'Submitting…', true);

      fetch(form.getAttribute('data-api'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            setMessage(form, res.body.message || 'Submitted. Thank you!', true);
            form.reset();
            if (dateInput) { var t = new Date(); dateInput.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
          } else {
            setMessage(form, res.body.error || 'Could not submit. Please try again.', false);
          }
        })
        .catch(function () { setMessage(form, 'Network problem. Please try again.', false); })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });
})();
