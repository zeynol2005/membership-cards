(function () {
  'use strict';

  // ایمن‌سازی دسترسی به المان‌ها: اگر موجود نبود، null برمی‌گرداند
  function el(id) {
    try { return document.getElementById(id); } catch (e) { return null; }
  }

  function safeSetText(id, text) {
    var node = el(id);
    if (node) node.textContent = text;
    else console.warn('عنصر پیدا نشد:', id, '— مقدار مورد نظر:', text);
  }

  function getQueryId() {
    var p = new URLSearchParams(window.location.search);
    var v = p.get('id');
    return v === null ? null : String(v).trim();
  }

  function show(id, visible) {
    var n = el(id);
    if (!n) { console.warn('show(): عنصر پیدا نشد:', id); return; }
    n.style.display = visible ? '' : 'none';
  }

  function clearChildren(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderList(nodeId, items, emptyText) {
    var node = el(nodeId);
    if (!node) { console.warn('renderList(): عنصر پیدا نشد:', nodeId); return; }
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
    safeSetText('name', m.full_name || '');
    safeSetText('studentId', m.student_id || '');
    safeSetText('id', m.id || '');
    safeSetText('role', m.role || '');

    renderList('committees', m.committees, 'عضویتی ثبت نشده');
    renderList('activities', m.activities, 'هیچ فعالیتی ثبت نشده');
    renderList('certificates', m.certificates, 'مدرکی ثبت نشده');
  }

  function normalize(s) { return s === null || s === undefined ? '' : String(s).trim(); }

  function idMatches(candidate, query) {
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase();
    var q = normalize(query).toLowerCase();
    if (c === q) return true;
    if (c === ('m' + q)) return true;
    if (('m' + c) === q) return true;
    return false;
  }

  // اطمینان از وجود المان‌های پایه‌ای برای نمایش خطا/لودینگ
  var required = ['loading', 'error', 'card'];
  for (var ri = 0; ri < required.length; ri++) {
    if (!el(required[ri])) console.warn('عنصر ضروری موجود نیست در index.html:', required[ri]);
  }

  // init UI
  show('loading', true);
  show('card', false);
  show('error', false);

  var memberId = getQueryId();
  if (!memberId) {
    show('loading', false);
    show('error', true);
    safeSetText('error', 'شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991');
    console.info('No id query param provided.');
    return;
  }

  fetch('./members.json', { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) console.warn('Expected JSON content-type, got:', ct);
      return resp.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error('members.json باید یک آرایه باشد');
      // ایجاد نقشه‌های سریع برای جستجو
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

      if (!found) {
        for (var j = 0; j < data.length; j++) {
          var cand = data[j];
          if (!cand) continue;
          if (idMatches(cand.student_id, memberId) || idMatches(cand.id, memberId)) {
            found = cand;
            break;
          }
        }
      }

      show('loading', false);
      if (found) {
        renderMember(found);
        show('card', true);
        show('error', false);
      } else {
        show('error', true);
        safeSetText('error', 'عضویی با این شناسه یافت نشد: ' + memberId);
        console.warn('No matching member for id:', memberId);
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      safeSetText('error', 'بارگذاری داده‌ها با خطا مواجه شد.');
    });
})();
