/* ===============================
   TEACHER DASHBOARD LOGIC - BRIGHTPATH (Fixed)
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "teacher") return;

  const data = getMockData("teacher");

  // === Class Summary ===
  const summaryBody = document.getElementById("classSummaryTable");
  if (summaryBody && data.summary) {
    summaryBody.innerHTML = data.summary
      .map(
        (s) => `
        <tr>
          <td>${s.student}</td>
          <td>${s.avg}</td>
          <td>${calculateGrade(s.avg)}</td>
        </tr>`
      )
      .join("");
  }

  // === CSV Upload ===
  const csvUploadForm = document.getElementById("csvUploadForm");
  if (csvUploadForm) {
    csvUploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("csvFile");
      if (!fileInput.files.length) {
        alert("Please select a CSV file first.");
        return;
      }
      const file = fileInput.files[0];
      alert(`Uploaded: ${file.name}`);
      fileInput.value = "";
    });
  }

  // === Enter Marks Form ===
  const marksForm = document.getElementById("marksForm");
  if (marksForm && summaryBody) {
    marksForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("studentName").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const marks = parseFloat(document.getElementById("marks").value);

      if (!name || !subject || isNaN(marks)) {
        alert("Please fill in all fields correctly.");
        return;
      }

      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td>${name}</td>
        <td>${marks}</td>
        <td>${calculateGrade(marks)}</td>
      `;
      summaryBody.appendChild(newRow);

      marksForm.reset();
    });
  }

  // === Announcements ===
  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");

  if (announcementForm && announcementList) {
    // Load mock announcements
    if (data.announcements) {
      announcementList.innerHTML = data.announcements
        .map((msg) => `<li>${msg}</li>`)
        .join("");
    }

    announcementForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("announcementText").value.trim();
      if (!text) return;

      const li = document.createElement("li");
      li.textContent = text;
      announcementList.prepend(li);
      announcementForm.reset();
    });
  }
});
