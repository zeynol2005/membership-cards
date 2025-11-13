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
    q('error').textContent = msg || 'Member not found or data failed to load.';
    q('error').style.display = v ? 'block' : 'none';
  }

  function clearList(listEl) {
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
  }

  function renderMember(m) {
    q('name').textContent = m.name || '';
    q('id').textContent = m.id || '';
    q('role').textContent = m.role || '';
    var list = q('activities');
    clearList(list);
    if (Array.isArray(m.activities) && m.activities.length) {
      m.activities.forEach(function (act) {
        var li = document.createElement('li');
        li.textContent = String(act);
        list.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No activities';
      list.appendChild(li);
    }
  }

  function normalizeId(id) {
    if (!id) return '';
    return String(id).trim();
  }

  function idMatches(candidate, query) {
    if (!candidate || !query) return false;
    var c = String(candidate).trim();
    var q = String(query).trim();
    if (c === q) return true;
    if ((c.toLowerCase()) === ('m' + q).toLowerCase()) return true;
    if (('m' + c).toLowerCase() === q.toLowerCase()) return true;
    return false;
  }

  // initialize UI
  showLoading(true);
  showCard(false);
  showError(false);

  var memberId = getQueryId();
  if (!memberId) {
    showLoading(false);
    showError(true, 'No id provided. Use ?id=m001 or ?id=001');
    return;
  }
  memberId = normalizeId(memberId);

  fetch('./members.json', { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) {
        throw new Error('Network response was not ok: ' + resp.status);
      }
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) {
        // still try to parse, but warn
        console.warn('Expected JSON content-type, got:', ct);
      }
      return resp.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('members.json root must be an array');
      }
      console.info('members loaded:', data.map(function (x) { return x && x.id ? x.id : '(no-id)'; }));
      var found = data.find(function (m) { return m && idMatches(m.id, memberId); });
      showLoading(false);
      if (found) {
        renderMember(found);
        showCard(true);
        showError(false);
      } else {
        showError(true, 'Member not found for id: ' + memberId);
      }
    })
    .catch(function (err) {
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      showLoading(false);
      showError(true, 'Failed to load member data.');
    });
})();
