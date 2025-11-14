(function () {
  'use strict';

  // Helpers
  function el(id) { try { return document.getElementById(id); } catch (e) { return null; } }
  function exists(id) { return !!el(id); }
  function setText(id, txt) { var n = el(id); if (n) n.textContent = txt; else console.warn('setText: missing', id); }
  function show(id, on) { var n = el(id); if (!n) return; n.style.display = on ? '' : 'none'; n.style.visibility = on ? 'visible' : ''; n.style.opacity = on ? '' : ''; }
  function clear(node) { if (!node) return; while (node.firstChild) node.removeChild(node.firstChild); }
  function debug(msg) { var d = el('debugInfo'); if (d) { d.style.display = ''; d.textContent = msg; } console.info(msg); }

  // Render helpers for lists (ul)
  function ensureUl(containerId, ulId) {
    var ul = el(ulId);
    if (ul && ul.tagName && ul.tagName.toLowerCase() === 'ul') return ul;
    var container = el(containerId);
    if (!container) {
      console.warn('ensureUl: missing container', containerId);
      ul = document.createElement('ul');
      ul.id = ulId;
      return ul; // return unattached ul to avoid crashes
    }
    ul = container.querySelector('ul');
    if (ul) return ul;
    ul = document.createElement('ul');
    ul.id = ulId;
    container.appendChild(ul);
    return ul;
  }

  function renderArray(containerId, ulId, arr, emptyText) {
    var ul = ensureUl(containerId, ulId);
    clear(ul);
    if (!Array.isArray(arr) || arr.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      ul.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < arr.length; i++) {
      var li = document.createElement('li');
      li.textContent = String(arr[i]);
      frag.appendChild(li);
    }
    ul.appendChild(frag);
  }

  // Normalization and matching
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

  // Check required DOM ids and warn if missing
  var required = [
    'loading', 'error', 'card', 'name', 'full_name', 'student_id', 'study',
    'member_id', 'role_list', 'committees_list', 'activities_list', 'certificates_list', 'debugInfo'
  ];
  required.forEach(function (id) { if (!exists(id)) console.warn('Expected element not found in DOM:', id); });

  // Initial UI state
  show('loading', true);
  show('card', false);
  show('error', false);
  debug('شروع اسکریپت');

  // Read query id
  var params = new URLSearchParams(window.location.search);
  var qid = params.get('id');
  if (!qid) {
    show('loading', false);
    show('error', true);
    setText('error', 'شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991');
    debug('no-id');
    return;
  }
  qid = normalize(qid);
  debug('شناسه پرس‌وجو: ' + qid);

  // Fetch members.json
  fetch('./members.json', { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('members.json HTTP ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      console.info('members.json content-type:', ct);
      return resp.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error('members.json باید آرایه باشد');
      debug('اعضا بارگذاری شدند: ' + data.length);

      // Build quick lookup maps for exact keys (lowercased)
      var mapById = Object.create(null);
      var mapByStudent = Object.create(null);
      for (var i = 0; i < data.length; i++) {
        var it = data[i];
        if (!it) continue;
        if (it.id) mapById[normalize(it.id).toLowerCase()] = it;
        if (it.student_id) mapByStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var key = qid.toLowerCase();
      var found = mapById[key] || mapByStudent[key];

      // Fallback: flexible matching loop
      if (!found) {
        for (var j = 0; j < data.length; j++) {
          var cand = data[j];
          if (!cand) continue;
          if (idMatches(cand.id, qid) || idMatches(cand.student_id, qid)) {
            found = cand;
            break;
          }
        }
      }

      show('loading', false);

      if (found) {
        debug('عضو یافت شد: ' + (found.full_name || found.student_id || found.id || '(no-name)'));

        // Fill fields (support multiple possible field names)
        setText('name', found.full_name || found.name || '');
        setText('full_name', found.full_name || found.name || '');
		setText('study', found.study || found.study_name || '');
        setText('student_id', found.student_id || found.studentId || found.std || '');
        setText('member_id', found.id || '');

        // role field variants
        var roleVal = found.role || found.position || found.title || '';
        setText('role_list', roleVal);

        // Render lists safely
        renderArray('committees_list'.replace('_list','_container'), 'committees_list', found.committees || found.committee || found.committees_list || [], 'عضویتی ثبت نشده');
        renderArray('activities_list'.replace('_list','_container'), 'activities_list', found.activities || found.activity || [], 'هیچ فعالیتی ثبت نشده');
        renderArray('certificates_list'.replace('_list','_container'), 'certificates_list', found.certificates || found.certificate || [], 'مدرکی ثبت نشده');
		renderArray('role_list'.replace('_list','_container'), 'role_list', found.role || found.role || [], 'سمتی ثبت نشده');

        // Ensure card visible: also clear any CSS hiding
        var card = el('card');
        if (card) {
          card.style.display = 'block';
          card.style.visibility = 'visible';
          card.style.opacity = '1';
        }

        // Safety: ensure text color visible (avoid white-on-white)
        try {
          var all = card ? card.querySelectorAll('*') : [];
          for (var k = 0; k < all.length; k++) {
            var comp = getComputedStyle(all[k]);
            if (comp && comp.color === 'rgba(0, 0, 0, 0)' || comp.color === 'transparent') {
              all[k].style.color = '#111';
            }
          }
        } catch (e) { /* ignore */ }

        show('card', true);
        show('error', false);
        debug('اطلاعات عضو نمایش داده شد');
      } else {
        console.warn('No matching member for id:', qid);
        show('error', true);
        setText('error', 'عضویی با این شناسه یافت نشد: ' + qid);
        debug('no-member');
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      setText('error', 'بارگذاری اطلاعات با خطا مواجه شد.');
      debug('fetch-error: ' + (err && err.message ? err.message : err));
    });

})();
