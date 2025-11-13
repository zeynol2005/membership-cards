(function () {
  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function showMember(member) {
    document.getElementById('name').textContent = member.name;
    document.getElementById('id').textContent = member.id;
    document.getElementById('role').textContent = member.role;
    const activitiesList = document.getElementById('activities');
    activitiesList.innerHTML = '';
    member.activities.forEach(activity => {
      const li = document.createElement('li');
      li.textContent = activity;
      activitiesList.appendChild(li);
    });
    document.getElementById('loading').style.display = 'none';
    document.getElementById('card').style.display = 'block';
  }

  function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
  }

  const memberId = getQueryParam('id');
  if (!memberId) {
    showError();
    return;
  }

  fetch('./members.json')
    .then(response => {
      if (!response.ok || !response.headers.get('content-type').includes('application/json')) {
        throw new Error('Invalid JSON response');
      }
      return response.json();
    })
    .then(data => {
      const member = data.find(m => m.id === memberId);
      if (member) {
        showMember(member);
      } else {
        showError();
      }
    })
    .catch(() => {
      showError();
    });
})();
