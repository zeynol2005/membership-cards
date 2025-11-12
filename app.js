document.addEventListener("DOMContentLoaded", function() {
  const app = document.getElementById("app");
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");

  if (!memberId) {
    app.textContent = "هیچ عضو مشخص نشده است.";
    return;
  }

  fetch("members.json")
    .then(res => {
      if (!res.ok) throw new Error("members.json load failed");
      return res.json();
    })
    .then(data => {
      const member = data.find(m => m.id.trim() === memberId.trim());
      if (!member) {
        app.textContent = "عضو پیدا نشد";
        return;
      }
      app.innerHTML = 
        <h1>${member.name}</h1>
        <p>${member.role}</p>
        <p>${member.bio || ""}</p>
        <ul>${(member.activities || []).map(a => <li>${a}</li>).join("")}</ul>
      ;
    })
    .catch(err => {
      console.error(err);
      app.textContent = "خطا در بارگذاری اطلاعات";
    });
});