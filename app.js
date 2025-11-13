document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get('id');
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  fetch('members.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('File not found');
      return response.json();
    })
    .then(data => {
      const member = data.members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');
      loading.style.display = 'none';
      content.innerHTML = 
        <h2>${member.name}</h2>
        <p>Student ID: ${member.id}</p>
        <p>Role: ${member.role}</p>
        <p>Activities: ${member.activities}</p>
      ;
    })
    .catch(err => {
      loading.textContent = '❌ خطا در بارگذاری اطلاعات';
      console.error(err);
    });
});