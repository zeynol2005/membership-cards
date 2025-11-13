(function () {
  'use strict';

  // Helper to get element safely
  function el(id) { try { return document.getElementById(id); } catch (e) { return null; } }

  // Safe set text
  function safeText(id, txt) {
    var n = el(id);
    if (n) n.textContent = txt;
    else console.warn('safeText: element not found -', id);
  }

  // Show/hide element
  function show(id, visible) {
    var n = el(id);
    if (!n) return;
    n.style.display = visible ? '' : 'none';
  }

  // Clear children
  function clearChildren(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // Get or create UL list inside a container
  function getListNode(containerId, listId) {
    var list = el(listId);
    if (list && list.tagName && list.tagName.toLowerCase() === 'ul') return list;
    var container = el(containerId);
    if (!container) {
      console.warn('getListNode: container missing', containerId);
      // create a temporary ul and return it (but not attached)
      var tmp = document.createElement('ul');
      return tmp;
    }
    // try find ul inside container
    var found = container.querySelector('ul');
    if (found) return found;
    // create ul and append
    var ul = document.createElement('ul');
    ul.id = listId;
    container.appendChild(ul);
    return ul;
  }

  // Render array into list node (ul)
  function renderArrayToList(containerId, listId, arr, emptyText) {
    var ul = getListNode(containerId, listId);
    clearChildren(ul);
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

  // Normalize strings
  function normalize(s) { return s === null || s === undefined ? '' : String(s).trim(); }

  // Flexible id matching
  function idMatches(candidate, query) {
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase();
    var q = normalize(query).toLowerCase();
    if (c === q) return true;
    if (c === ('m' + q)) return true;
    if (('m' + c) === q) return true;
    return false;
  }

  // Debug helper
  function debug(msg) {
    var d = el('debugInfo');
    if (d) d.textContent = msg;
    console.info(msg);
  }

  // Ensure required elements exist
  ['loading','error','card','name','full_name','student_id','id','role','committees_container','activities_container','certificates_container'].forEach(function (k) {
    if (!el(k)) console.warn('Expected element not found in DOM:', k);
  });

  // UI initial state
  show('loading', true);
  show('card', false);
  show('error', false);
  debug('در حال آماده‌سازی...');

  // Read id from URL
  var params = new URLSearchParams(window.location.search);
  var qid = params.get('id');
  if (!qid) {
    show('loading', false);
    show('error', true);
    safeText('error', 'شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991');
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
      if (!Array.isArray(data)) throw new Error('members.json root must be an array');
      debug('اعضا بارگذاری شدند: ' + data.length);

      // quick lookup maps
      var mapId = Object.create(null);
      var mapStudent = Object.create(null);
      for (var i = 0; i < data.length; i++) {
        var it = data[i];
        if (!it) continue;
        if (it.id) mapId[normalize(it.id).toLowerCase()] = it;
        if (it.student_id) mapStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var key = qid.toLowerCase();
      var found = mapId[key] || mapStudent[key];

      // fallback flexible scan
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
        // set simple fields
        safeText('name', found.full_name || '');
        safeText('full_name', found.full_name || '');
        safeText('student_id', found.student_id || '');
        safeText('id', found.id || '');
        safeText('role', found.role || '');

        // lists
        renderArrayToList('committees_container', 'committees_list', found.committees, 'عضویتی ثبت نشده');
        renderArrayToList('activities_container', 'activities_list', found.activities, 'هیچ فعالیتی ثبت نشده');
        renderArrayToList('certificates_container', 'certificates_list', found.certificates, 'مدرکی ثبت نشده');

        show('card', true);
        debug('نمایش اطلاعات کامل عضو');
      } else {
        console.warn('No matching member for id:', qid);
        show('error', true);
        safeText('error', 'عضویی با این شناسه یافت نشد: ' + qid);
        debug('no-member');
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      safeText('error', 'بارگذاری اطلاعات با خطا مواجه شد.');
      debug('fetch-error: ' + (err && err.message ? err.message : err));
    });
})();
