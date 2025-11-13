(function () {
  'use strict';

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function el(id) {
    return document.getElementById(id);
  }

  function showLoading(visible) {
    el('loading').style.display = visible ? '' : 'none';
  }

  function showCard(visible) {
    el('card').style.display = visible ? 'block' : 'none';
  }

  function showError(visible) {
    el('error').style.display = visible ? 'block' : 'none';
  }

  function renderMember(member) {
    el('name').textContent = member.name || '';
    el('id').textContent = member.id || '';
    el('role').textContent = member.role || '';
    const list = el('activities');
    list.innerHTML = '';
    if (Array.isArray(member.activities) && member.activities.length) {
      member.activities.forEach(function (act) {
        const li = document.createElement('li');
        li.textContent = String(act);
        list.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No activities';
      list.appendChild(li);
    }
  }

  var memberId = getQueryParam('id');

  showLoading(true);
  showCard(false);
  showError(false);

  if (!memberId) {
    showLoading(false);
    showError(true);
    return;
  }

  fetch('./members.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      var ct = response.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) {
        throw new Error('Expected JSON but got ' + ct);
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('JSON root is not an array');
      }
      var found = data.find(function (m) { return m && m.id === memberId; });
      showLoading(false);
      if (found) {
        renderMember(found);
        showCard(true);
        showError(false);
      } else {
        showError(true);
      }
    })
    .catch(function () {
      showLoading(false);
      showError(true);
    });
})();
