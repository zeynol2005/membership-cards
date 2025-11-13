document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("content");
  content.innerText = "در حال بارگذاری...";

  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");

  try {
    const response = await fetch("members.json");
    if (!response.ok) throw new Error("JSON not found");
    const members = await response.json();

    const member = members.find(m => m.id === memberId);
    if (!member) {
      content.innerText = "عضو مورد نظر یافت نشد.";
      return;
    }

    content.innerHTML = 
      <h2>${member.name}</h2>
      <p><strong>نقش:</strong> ${member.role}</p>
      <ul>
        ${member.activities.map(a => <li>${a}</li>).join("")}
      </ul>
    ;
  } catch (err) {
    content.innerText = "خطا در بارگذاری اطلاعات.";
    console.error(err);
  }
});