(function () {
  'use strict';

  function q(id) { return document.getElementById(id); }

  function getQueryId() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('id');
    return raw === null ? null : String(raw).trim();
  }

  function showLoading(v) { q('loading').style.display = v ? '' : 'none'; }
  function showCard(v) { q('card').style.display = v ? 'block' : 'none'; }
  function showError(v, msg) {
    q('error').textContent = msg || 'عضو یافت نشد یا بارگذاری ناموفق بود.';
    q('error').style.display = v ? 'block' : 'none';
  }

  function clearList(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderList(el, items, emptyText) {
    clearList(el);
    if (!Array.isArray(items) || items.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      el.appendChild(li);
      return;
    }
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.textContent = String(it);
      el.appendChild(li);
    });
  }

  function renderMember(m) {
    q('name').textContent = m.full_name || '';
    q('studentId').textContent = m.student_id || '';
    q('role').textContent = m.role || '';

    renderList(q('committees'), m.committees, 'عضویتی ثبت نشده');
    renderList(q('activities'), m.activities, 'هیچ فعالیتی ثبت نشده');
    renderList(q('certificates'), m.certificates, 'مدرکی ثبت نشده');
  }

  function idMatches(candidate, query) {
    if (!candidate || !query) return false;
    var c = String(candidate).trim();
    var q = String(query).trim();
    if (c === q) return true;
    if (c.toLowerCase() === ('m' + q).toLowerCase()) return true;
    if (('m' + c).toLowerCase() === q.toLowerCase()) return true;
    return false;
  }

  // init UI
  showLoading(true);
  showCard(false);
  showError(false);

  var memberId = getQueryId();
  if (!memberId) {
    showLoading(false);
    showError(true, 'شناسه در URL موجود نیست. مثال: ?id=m001');
    return;
  }

  fetch('./members.json', { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) {
        throw new Error('Network response was not ok: ' + resp.status);
      }
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) {
        console.warn('Content-Type is not application/json:', ct);
      }
      return resp.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('members.json root must be an array');
      }
      console.info('members loaded:', data.map(function (x) { return x && x.student_id ? x.student_id : x && x.id ? x.id : '(no-id)'; }));
      var found = data.find(function (m) {
        return m && (idMatches(m.student_id, memberId) || idMatches(m.id, memberId));
      });
      showLoading(false);
      if (found) {
        renderMember(found);
        showCard(true);
        showError(false);
      } else {
        showError(true, 'عضویی با این شناسه پیدا نشد: ' + memberId);
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      showLoading(false);
      showError(true, 'بارگذاری داده‌ها با خطا مواجه شد.');
    });
})();
