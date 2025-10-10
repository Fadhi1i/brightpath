/* ===============================
   PARENT DASHBOARD LOGIC - BRIGHTPATH (Fixed)
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "parent") return;

  const data = getMockData("parent");

  // === Academic Performance ===
  const performanceBody = document.getElementById("performanceData");
  if (performanceBody && data.performance) {
    performanceBody.innerHTML = data.performance
      .map(
        (item) => `
        <tr>
          <td>${item.subject}</td>
          <td>${item.marks}</td>
          <td>${calculateGrade(item.marks)}</td>
        </tr>`
      )
      .join("");
  }

  // === Teacher Comments ===
  const commentsContainer = document.getElementById("teacherComments");
  if (commentsContainer && data.comments) {
    commentsContainer.innerHTML = data.comments
      .map((comment) => `<p class="comment-item">• ${comment}</p>`)
      .join("");
  }

  // === Announcements ===
  const announcementsList = document.getElementById("announcementsList");
  if (announcementsList && data.announcements) {
    announcementsList.innerHTML = data.announcements
      .map((msg) => `<li>${msg}</li>`)
      .join("");
  }

  // === Ensure scroll works correctly ===
  document.documentElement.style.scrollBehavior = "smooth";
});
