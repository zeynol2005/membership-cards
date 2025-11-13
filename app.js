// app.js
(function () {
  'use strict';

  const statusEl = document.getElementById('status');
  const cardEl = document.getElementById('card');
  const errorEl = document.getElementById('error');

  const nameEl = document.getElementById('name');
  const idEl = document.getElementById('id');
  const roleEl = document.getElementById('role');
  const activitiesEl = document.getElementById('activities');

  function showError(message) {
    if (statusEl) statusEl.hidden = true;
    errorEl.textContent = message;
    errorEl.hidden = false;
    cardEl.hidden = true;
  }

  function showCard(member) {
    nameEl.textContent = member.name || '';
    idEl.textContent = member.id || '';
    roleEl.textContent = member.role || '';

    // Clear and render activities safely
    activitiesEl.textContent = '';
    const list = Array.isArray(member.activities) ? member.activities : [];
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = String(item);
      activitiesEl.appendChild(li);
    });

    if (statusEl) statusEl.hidden = true;
    errorEl.hidden = true;
    cardEl.hidden = false;
  }

  function getQueryId() {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      return id && id.trim() ? id.trim() : null;
    } catch {
      return null;
    }
  }

  async function load() {
    const memberId = getQueryId();
    if (!memberId) {
      showError('Missing member id. Use ?id=YOUR_ID in the URL.');
      return;
    }

    let resp;
    try {
      resp = await fetch('./members.json', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });
    } catch {
      showError('Unable to load members.json. Please try again later.');
      return;
    }

    if (!resp || !resp.ok) {
      showError('members.json not found or failed to load.');
      return;
    }

    const ct = resp.headers.get('Content-Type') || '';
    if (!ct.toLowerCase().includes('application/json')) {
      showError('Invalid response type for members.json.');
      return;
    }

    let data;
    try {
      data = await resp.json();
    } catch {
      showError('Failed to parse members.json. Ensure it is valid JSON.');
      return;
    }

    if (!Array.isArray(data)) {
      showError('members.json must be a JSON array.');
      return;
    }

    const member = data.find(m => m && typeof m === 'object' && String(m.id) === memberId);
    if (!member) {
      showError(No member found for id: ${memberId});
      return;
    }

    showCard(member);
  }

  // Start
  load();
})();