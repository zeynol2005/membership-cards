(function () {
  'use strict';

  // Elements
  var el = function (id) { return document.getElementById(id); };

  // Helpers
  function getQueryId() {
    var p = new URLSearchParams(window.location.search);
    var v = p.get('id');
    return v === null ? null : String(v).trim();
  }

  function show(id, visible) {
    var node = el(id);
    if (!node) return;
    node.style.display = visible ? '' : 'none';
  }

  function clearChildren(node) {
    var fc;
    while ((fc = node.firstChild)) node.removeChild(fc);
  }

  function renderList(node, items, emptyText) {
    clearChildren(node);
    if (!Array.isArray(items) || items.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      node.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement('li');
      li.textContent = String(items[i]);
      frag.appendChild(li);
    }
    node.appendChild(frag);
  }

  function renderMember(m) {
    el('name').textContent = m.full_name || '';
    el('studentId').textContent = m.student_id || '';
    el('role').textContent = m.role || '';
    renderList(el('committees'), m.committees, 'عضویتی ثبت نشده');
    renderList(el('activities'), m.activities, 'هیچ فعالیتی ثبت نشده');
    renderList(el('certificates'), m.certificates, 'مدرکی ثبت نشده');
  }

  function normalize(s) {
    return s === null || s === undefined ? '' : String(s).trim();
  }

  function idMatches(candidate, query) {
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase();
    var q = normalize(query).toLowerCase();
    if (c === q) return true;
    if (c === ('m' + q)) return true;
    if (('m' + c) === q) return true;
    return false;
  }

  // UI init
  show('loading', true);
  show('card', false);
  show('error', false);

  var memberId = getQueryId();
  if (!memberId) {
    show('loading', false);
    show('error', true);
    el('error').textContent = 'شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991';
    return;
  }

  // Fetch and find (works efficiently for dozens/hundreds of members)
  fetch('./members.json', { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) console.warn('Expected JSON, got:', ct);
      return resp.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error('members.json root must be an array');
      // Optional: build a small index for faster lookup when list grows large
      // For tens/hundreds items a linear scan is fine; still we build maps for id and student_id
      var mapId = Object.create(null);
      var mapStudent = Object.create(null);
      for (var i = 0; i < data.length; i++) {
        var it = data[i];
        if (!it) continue;
        if (it.id) mapId[normalize(it.id).toLowerCase()] = it;
        if (it.student_id) mapStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var q = normalize(memberId).toLowerCase();
      var found = mapId[q] || mapStudent[q];

      // fallback flexible matching
      if (!found) {
        for (var j = 0; j < data.length; j++) {
          var candidate = data[j];
          if (!candidate) continue;
          if (idMatches(candidate.student_id, memberId) || idMatches(candidate.id, memberId)) {
            found = candidate;
            break;
          }
        }
      }

      show('loading', false);
      if (found) {
        renderMember(found);
        show('card', true);
      } else {
        show('error', true);
        el('error').textContent = 'عضویی با این شناسه پیدا نشد: ' + memberId;
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      el('error').textContent = 'بارگذاری داده‌ها با خطا مواجه شد.';
    });
})();
