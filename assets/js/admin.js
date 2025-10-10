/* ===============================
   ADMIN DASHBOARD LOGIC - BRIGHTPATH
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") return;

  const data = getMockData("admin");

  /* ===============================
     MANAGE SUBJECTS
     =============================== */
  const subjectForm = document.getElementById("subjectForm");
  const subjectList = document.getElementById("subjectList");

  if (subjectList && data.subjects) {
    subjectList.innerHTML = data.subjects.map((s) => `<li>${s}</li>`).join("");
  }

  if (subjectForm) {
    subjectForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const subjectName = document.getElementById("subjectName").value.trim();
      if (!subjectName) return;

      const li = document.createElement("li");
      li.textContent = subjectName;
      subjectList.appendChild(li);
      subjectForm.reset();
    });
  }

  /* ===============================
     REGISTER STUDENT
     =============================== */
  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("studentName").value.trim();
      const admissionNo = document.getElementById("admissionNo").value.trim();
      const className = document.getElementById("className").value.trim();
      const parentEmail = document.getElementById("parentEmail").value.trim();

      if (!name || !admissionNo || !className || !parentEmail) {
        alert("Please fill in all student fields.");
        return;
      }

      alert(`✅ Student "${name}" added successfully!`);
      studentForm.reset();
    });
  }

  /* ===============================
     REGISTER TEACHER
     =============================== */
  const teacherForm = document.getElementById("teacherForm");
  if (teacherForm) {
    teacherForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("teacherName").value.trim();
      const email = document.getElementById("teacherEmail").value.trim();
      const subject = document.getElementById("subject").value.trim();

      if (!name || !email || !subject) {
        alert("Please fill in all teacher fields.");
        return;
      }

      alert(`👩‍🏫 Teacher "${name}" registered successfully!`);
      teacherForm.reset();
    });
  }

  /* ===============================
     ANNOUNCEMENTS
     =============================== */
  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");

  if (announcementForm && announcementList) {
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

  /* ===============================
     RELEASE RESULTS (Simple Button)
     =============================== */
  const releaseBtn = document.getElementById("releaseResultsBtn");
  const releaseStatus = document.getElementById("releaseStatus");

  if (releaseBtn) {
    releaseBtn.addEventListener("click", () => {
      releaseStatus.textContent = "⏳ Releasing results...";
      setTimeout(() => {
        releaseStatus.textContent = "✅ Results released successfully!";
      }, 1500);
    });
  }

  /* ===============================
     RESULTS CONTROL PANEL
     =============================== */
  const resultTableBody = document.getElementById("resultTableBody");

  if (resultTableBody) {
    // Simulated upload data (replace later with real teacher uploads)
    const classResults = [
      { className: "Grade 6A", totalSubjects: 8, uploaded: 8, pending: 0 },
      { className: "Grade 6B", totalSubjects: 8, uploaded: 7, pending: 1 },
      { className: "Grade 7A", totalSubjects: 9, uploaded: 9, pending: 0 },
      { className: "Grade 8A", totalSubjects: 10, uploaded: 8, pending: 2 },
    ];

    // Build table dynamically
    resultTableBody.innerHTML = classResults
      .map((cls) => {
        const isReady = cls.pending === 0;
        const status = isReady ? "✅ Ready for Release" : "⚠️ Incomplete";
        const buttonHTML = isReady
          ? `<button class="btn-primary release-btn" data-class="${cls.className}">Release</button>`
          : `<button class="btn-disabled" disabled>Waiting</button>`;

        return `
          <tr>
            <td>${cls.className}</td>
            <td>${cls.totalSubjects}</td>
            <td>${cls.uploaded}</td>
            <td>${cls.pending}</td>
            <td>${status}</td>
            <td>${buttonHTML}</td>
          </tr>
        `;
      })
      .join("");

    // Handle release actions
    document.querySelectorAll(".release-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const className = e.target.dataset.class;
        e.target.textContent = "Released ✅";
        e.target.disabled = true;
        alert(`Results for ${className} have been successfully released!`);
      });
    });
  }
});
