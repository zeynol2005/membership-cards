(function () {
  'use strict';

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    return raw === null ? null : String(raw).trim();
  }

  function el(id) { return document.getElementById(id); }

  function showLoading(v){ el('loading').style.display = v ? '' : 'none'; }
  function showCard(v){ el('card').style.display = v ? 'block' : 'none'; }
  function showError(v, msg){ el('error').textContent = msg || 'Member not found or data failed to load.'; el('error').style.display = v ? 'block' : 'none'; }

  function renderMember(member){
    el('name').textContent = member.name || '';
    el('id').textContent = member.id || '';
    el('role').textContent = member.role || '';
    const list = el('activities');
    list.innerHTML = '';
    if (Array.isArray(member.activities) && member.activities.length) {
      member.activities.forEach(function(a){
        const li = document.createElement('li');
        li.textContent = String(a);
        list.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No activities';
      list.appendChild(li);
    }
  }

  // مقاوم‌سازی مقایسه id: حذف فاصله، تبدیل به رشته، و تلاش برای تطبیق با/بدون پیشوند m
  function matchesId(candidateId, queryId) {
    if (!candidateId || !queryId) return false;
    const c = String(candidateId).trim();
    const q = String(queryId).trim();
    if (c === q) return true;
    // try add/remove leading "m" or "M"
    if (c.toLowerCase() === ('m' + q).toLowerCase()) return true;
    if (( 'm' + c ).toLowerCase() === q.toLowerCase()) return true;
    return false;
  }

  // شروع
  var memberId = getQueryParam('id');
  showLoading(true); showCard(false); showError(false);

  if (!memberId) {
    showLoading(false);
    showError(true, 'No id specified in the URL. Example: ?id=m001');
    console.info('No id query param provided.');
    return;
  }

  // fetch JSON
  fetch('./members.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Network error: ' + response.status + ' ' + response.statusText);
      }
      var ct = response.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) {
        console.warn('Content-Type header is not application/json:', ct);
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array at root');
      }

      // لاگ کردن همه‌ی idها برای کمک به دیباگ
      console.info('Loaded members. IDs found:', data.map(function(m){ return m && m.id ? m.id : '(no id)'; }));

      var found = data.find(function (m) {
        return m && matchesId(m.id, memberId);
      });

      showLoading(false);
      if (found) {
        renderMember(found);
        showCard(true);
        showError(false);
        console.info('Member matched:', found.id || '(no id)');
      } else {
        showError(true, 'Member not found for id: ' + memberId);
        console.warn('No matching member for id:', memberId);
      }
    })
    .catch(function (err) {
      console.error('Failed to load or parse members.json:', err && err.message ? err.message : err);
      showLoading(false);
      showError(true, 'Failed to load member data.');
    });
})();
