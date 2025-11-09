/* ===============================
   ADMIN DASHBOARD LOGIC - BRIGHTPATH (Final Unified Version)
   =============================== */

const API_URL = "https://brightpath-3.onrender.com"; // Local FastAPI backend

document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") return;

  /* ---------- Helper: Show Messages ---------- */
  function showMessage(sectionId, message, type = "success") {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const box = document.createElement("div");
    box.className = type === "success" ? "msg-success" : "msg-error";
    box.textContent = message;
    section.appendChild(box);

    setTimeout(() => box.remove(), 3500);
  }

  // ✅ put all your admin logic (subject, student, announcements, etc.) below here
});


  /* ---------- Load Subjects ---------- */
  const subjectList = document.getElementById("subjectList");
  async function loadSubjects() {
    try {
      const res = await fetch(`${API_URL}/get-subjects`);
      const data = await res.json();
      if (data.success && subjectList) {
        subjectList.innerHTML = data.subjects.map((s) => `<li>${s.name}</li>`).join("");
      }
    } catch {
      showMessage("manageSubjects", "⚠️ Could not load subjects", "error");
    }
  }

  const subjectForm = document.getElementById("subjectForm");
  if (subjectForm) {
    subjectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const subjectName = document.getElementById("subjectName").value.trim();
      if (!subjectName) return;
      try {
        const res = await fetch(`${API_URL}/add-subject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: subjectName }),
        });
        const data = await res.json();
        if (res.ok) {
          showMessage("manageSubjects", `✅ ${data.message}`, "success");
          subjectForm.reset();
          loadSubjects();
        } else {
          showMessage("manageSubjects", data.detail || "Failed to add subject", "error");
        }
      } catch {
        showMessage("manageSubjects", "⚠️ Server error!", "error");
      }
    });
  }
  loadSubjects();

  /* ---------- Add Student ---------- */
  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("studentName").value.trim();
      const className = document.getElementById("className").value.trim();
      const gender = document.getElementById("gender").value.trim();
      const dob = document.getElementById("dob").value;
      if (!name || !className || !gender || !dob) {
        showMessage("registerStudent", "Please fill in all fields!", "error");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/add-student`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            gender,
            date_of_birth: dob,
            grade: className,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showMessage("registerStudent", `🧍 ${data.message}`, "success");
          studentForm.reset();
          setupAllTables();
        } else {
          showMessage("registerStudent", data.detail || "Failed to add student", "error");
        }
      } catch {
        showMessage("registerStudent", "⚠️ Server error!", "error");
      }
    });
  }

  /* ---------- Announcements ---------- */
  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");
  if (announcementForm && announcementList) {
    announcementForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("announcementText").value.trim();
      if (!text) return;
      const li = document.createElement("li");
      li.textContent = text;
      announcementList.prepend(li);
      showMessage("announcements", "📢 Announcement posted!", "success");
      announcementForm.reset();
    });
  }

  /* ---------- Release Results ---------- */
  const releaseBtn = document.getElementById("releaseResultsBtn");
  const releaseStatus = document.getElementById("releaseStatus");
  if (releaseBtn) {
    releaseBtn.addEventListener("click", () => {
      releaseStatus.textContent = "⏳ Releasing results...";
      setTimeout(() => {
        releaseStatus.textContent = "✅ Results released successfully!";
        showMessage("releaseResults", "Results released successfully!", "success");
      }, 1200);
    });
  }

 /* ---------- Dynamic Tables ---------- */
async function setupAllTables() {
  const rowsPerPage = 8;

  const tables = {
    students: {
      search: document.getElementById("searchStudent"),
      tbody: document.querySelector("#studentsTable tbody"),
      pagination: document.querySelector("#studentsTab .pagination"),
      endpoint: "/get-students",
      columns: ["reg_no", "name", "grade", "gender", "date_of_birth", "actions"],
      normalize: (r) => ({
        id: r.id,
        reg_no: r.reg_no ?? "—",
        name: r.name ?? "—",
        grade: r.grade ?? "—",
        gender: r.gender ?? "—",
        date_of_birth: r.date_of_birth ?? "—",
        parent: r.parent_name ?? "—",
      }),
    },

   teachers: {
  search: document.getElementById("searchTeacher"),
  tbody: document.querySelector("#teachersTable tbody"),
  pagination: document.querySelector("#teachersTab .pagination"),
  endpoint: "/get-teachers",
  columns: ["name", "email", "department", "subjects", "created_at", "actions"],

  normalize: (r) => {
    // ✅ Safely parse subjects joined from backend
    let subjectsDisplay = "—";
    if (Array.isArray(r.teacher_subjects) && r.teacher_subjects.length > 0) {
      subjectsDisplay = r.teacher_subjects
        .map((ts) => ts.subjects?.name ?? "")
        .filter(Boolean)
        .join(", ");
    }

    return {
      id: r.id,
      name: r.name ?? "—",
      email: r.email ?? "—",
      department: r.department ?? "—",
      subjects: subjectsDisplay,
      created_at: r.created_at
        ? new Date(r.created_at).toLocaleDateString()
        : "—",
    };
  },
},


    parents: {
      search: document.getElementById("searchParent"),
      tbody: document.querySelector("#parentsTable tbody"),
      pagination: document.querySelector("#parentsTab .pagination"),
      endpoint: "/get-parents",
      columns: ["name", "email", "phone", "children", "actions"],
      normalize: (r) => {
        let childrenDisplay = "—";
        if (Array.isArray(r.children) && r.children.length > 0) {
          const first = r.children[0];
          if (typeof first === "object" && first !== null) {
            childrenDisplay = r.children
              .map((c) => c && (c.name ?? String(c)))
              .join(", ");
          } else {
            childrenDisplay = r.children.join(", ");
          }
        }
        return {
          id: r.id,
          name: r.name ?? "—",
          email: r.email ?? "—",
          phone: r.phone ?? "—",
          children: childrenDisplay,
        };
      },
    },
  };

  Object.keys(tables).forEach((key) => setupTable(tables[key]));

  // 🔸 Helper for delete button
  function actionBtnHTML(id, type) {
    return `
      <button class="btn btn-danger btn-sm btn-delete"
              data-id="${id}" data-type="${type}">
        <i class="fas fa-trash"></i> Delete
      </button>
    `;
  }

  async function setupTable(refs) {
    if (!refs || !refs.tbody) return;

    let fullData = [];
    let currentPage = 1;

    try {
      const res = await fetch(`${API_URL}${refs.endpoint}`);
      const json = await res.json();

      // ✅ handle different API response shapes
      let raw =
        json.students ||
        json.teachers ||
        json.parents ||
        json.data ||
        (Array.isArray(json) ? json : []);
      fullData = raw.map(refs.normalize);
    } catch (e) {
      console.error(`Failed to load ${refs.endpoint}`, e);
    }

    const prevBtn = refs.pagination?.querySelector(".prev");
    const nextBtn = refs.pagination?.querySelector(".next");
    const pageNumber = refs.pagination?.querySelector(".page-number");

    function sanitize(v) {
      return v === null || v === undefined ? "—" : String(v);
    }

    function renderTable(source) {
      refs.tbody.innerHTML = "";
      const totalPages = Math.max(1, Math.ceil(source.length / rowsPerPage));
      currentPage = Math.min(currentPage, totalPages);
      const start = (currentPage - 1) * rowsPerPage;
      const pageRows = source.slice(start, start + rowsPerPage);

      if (pageRows.length === 0) {
        refs.tbody.innerHTML = `<tr><td colspan="${refs.columns.length}" style="text-align:center;padding:1rem;">No records found</td></tr>`;
        return;
      }

      pageRows.forEach((item) => {
        const tr = document.createElement("tr");

        if (refs.endpoint === "/get-students") {
          tr.innerHTML = `
            <td>${sanitize(item.reg_no)}</td>
            <td>${sanitize(item.name)}</td>
            <td>${sanitize(item.grade)}</td>
            <td>${sanitize(item.gender)}</td>
            <td>${sanitize(item.date_of_birth)}</td>
            <td class="actions-cell">
              <button class="btn-edit" data-id="${item.id}" data-type="student">✏️ Edit</button>
              <button class="btn-delete btn btn-danger btn-sm" data-id="${item.id}" data-type="student">
                <i class="fas fa-trash"></i> Delete
              </button>
            </td>
          `;
        } else if (refs.endpoint === "/get-teachers") {
  tr.innerHTML = `
    <td>${sanitize(item.name)}</td>
    <td>${sanitize(item.email)}</td>
    <td>${sanitize(item.subjects)}</td>
    <td>${sanitize(item.created_at)}</td>
    <td class="actions-cell" style="text-align:center;">
      ${actionBtnHTML(item.id, "teacher")}
    </td>
  `;
}
 else if (refs.endpoint === "/get-parents") {
          tr.innerHTML = `
            <td>${sanitize(item.name)}</td>
            <td>${sanitize(item.email)}</td>
            <td>${sanitize(item.phone)}</td>
            <td>${sanitize(item.children)}</td>
            <td class="actions-cell" style="text-align:center;">
              ${actionBtnHTML(item.id, "parent")}
            </td>
          `;
        }

        refs.tbody.appendChild(tr);
      });

      if (pageNumber) pageNumber.textContent = `Page ${currentPage}`;
      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    // 🔍 Search
    refs.search?.addEventListener("input", () => {
      const q = (refs.search.value || "").toLowerCase();
      const filtered = !q
        ? fullData
        : fullData.filter((row) =>
            refs.columns.some((col) =>
              String(row[col] ?? "").toLowerCase().includes(q)
            )
          );
      currentPage = 1;
      renderTable(filtered);
    });

    // Pagination
    prevBtn?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(fullData);
      }
    });

    nextBtn?.addEventListener("click", () => {
      currentPage++;
      renderTable(fullData);
    });

    renderTable(fullData);
  }
}

// Initialize everything
setupAllTables();

/* =============== DELETE ACTION =============== */
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-delete");
  if (!btn) return;

  const id = btn.dataset.id;
  const type = btn.dataset.type; // student | teacher | parent
  if (!id || !type) return;

  const confirmed = confirm(`Are you sure you want to delete this ${type}?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/delete-${type}/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Failed to delete");
    alert(data.message || `${type} deleted successfully!`);

    setupAllTables(); // refresh everything
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});

/* =============== EDIT ACTIONS (students only) =============== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-edit");
  if (!btn) return;

  const id = btn.dataset.id;
  const row = btn.closest("tr");
  if (!row) return;

  document.getElementById("editStudentId").value = id;
  document.getElementById("editStudentName").value = row.children[1].textContent.trim();
  document.getElementById("editStudentGrade").value = row.children[2].textContent.trim();
  document.getElementById("editStudentGender").value = row.children[3].textContent.trim();
  document.getElementById("editStudentDob").value = row.children[4].textContent.trim();

  document.getElementById("editStudentModal").style.display = "flex";
});

// Close modal
document.getElementById("closeEditModal").addEventListener("click", () => {
  document.getElementById("editStudentModal").style.display = "none";
});
window.addEventListener("click", (e) => {
  const modal = document.getElementById("editStudentModal");
  if (e.target === modal) modal.style.display = "none";
});

// Save edits
document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editStudentId").value;
  const name = document.getElementById("editStudentName").value.trim();
  const grade = document.getElementById("editStudentGrade").value.trim();
  const gender = document.getElementById("editStudentGender").value.trim();
  const dob = document.getElementById("editStudentDob").value.trim();

  if (!id || !name || !grade || !gender || !dob) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/update-student/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        grade,
        gender,
        date_of_birth: dob,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Update failed:", data);
      alert(`Update failed: ${data.detail || JSON.stringify(data)}`);
      return;
    }

    alert(data.message || "Student updated successfully!");
    document.getElementById("editStudentModal").style.display = "none";
    setupAllTables();
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});

/* ===============================
   RESULTS CONTROL PANEL (Admin)
   =============================== */
window.addEventListener("load", () => {
  const tableBody = document.getElementById("resultTableBody");
  if (!tableBody) return;

  async function loadResultsSummary() {
    try {
      const res = await fetch(`${API_URL}/admin/results-summary?term=2025-T1`);
      const data = await res.json();
      console.log("✅ Results Summary Data:", data);

      tableBody.innerHTML = "";
      if (!data.success || !Array.isArray(data.summary) || data.summary.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1rem;">No data yet.</td></tr>`;
        return;
      }

      data.summary.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.class}</td>
          <td>${item.total_subjects}</td>
          <td>${item.uploaded}</td>
          <td>${item.pending}</td>
          <td>${item.status}</td>
          <td><button class="btn-outline small view-btn" data-class="${item.class}">View</button></td>
        `;
        tableBody.appendChild(tr);
      });

      // Rebind view buttons after populating
      tableBody.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const grade = e.target.dataset.class;
          console.log("🟢 View clicked for grade:", grade);

          const modal = document.getElementById("classResultsModal");
          const tableBody = document.querySelector("#classResultsTable tbody");
          const title = document.getElementById("modalTitle");

          title.textContent = `Results for Grade ${grade}`;
          tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;
          modal.classList.remove("hidden");

          try {
            const res = await fetch(`${API_URL}/admin/class-results/${grade}`);
            const data = await res.json();

            if (!data.success || !data.subjects?.length) {
              tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No results yet.</td></tr>`;
              return;
            }

            tableBody.innerHTML = data.subjects
              .map(
                (s) => `
                  <tr>
                    <td>${s.subject}</td>
                    <td>${s.teacher}</td>
                    <td>${s.uploaded}</td>
                    <td>${s.pending}</td>
                    <td>${s.average_marks ?? "—"}</td>
                  </tr>`
              )
              .join("");
          } catch (err) {
            console.error("Error loading class results:", err);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error loading data.</td></tr>`;
          }
        });
      });

      const closeModal = document.getElementById("closeModal");
      if (closeModal) {
        closeModal.addEventListener("click", () => {
          document.getElementById("classResultsModal").classList.add("hidden");
        });
      }
    } catch (err) {
      console.error("Error fetching results summary:", err);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">⚠️ Error loading data.</td></tr>`;
    }
  }

  loadResultsSummary();
  setInterval(loadResultsSummary, 30000);
});

/* ===============================
   LIVE RESULTS FEED (Admin)
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#liveResultsTable tbody");
  const refreshBtn = document.getElementById("refreshResultsBtn");
  if (!tableBody || !refreshBtn) return;

  async function loadResults() {
    try {
      const res = await fetch(`${API_URL}/admin/view-results`);
      const data = await res.json();
      tableBody.innerHTML = "";
      if (!data.success || data.results.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:1rem;">No results yet.</td></tr>`;
        return;
      }

      data.results.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.student_reg}</td>
          <td>${r.student_name}</td>
          <td>${r.grade}</td>
          <td>${r.subject}</td>
          <td>${r.teacher}</td>
          <td>${r.marks}</td>
          <td>${r.term}</td>
          <td>${r.exam_type}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error loading results:", err);
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">⚠️ Error loading data</td></tr>`;
    }
  }

  refreshBtn.addEventListener("click", loadResults);
  setInterval(loadResults, 30000);
  loadResults();
});

const announcementInput = document.querySelector("#announcementInput");
const postButton = document.querySelector("#postAnnouncementBtn");

postButton.addEventListener("click", async () => {
  const message = announcementInput.value.trim();
  const adminName = localStorage.getItem("userName") || "Admin";

  if (!message) {
    alert("Please write an announcement first!");
    return;
  }

  try {
    postButton.disabled = true;
    postButton.textContent = "Posting...";

    const res = await fetch("https://brightpath-3.onrender.com/add-announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, posted_by: adminName }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Announcement posted!");
      announcementInput.value = "";
    } else {
      alert("Failed to post announcement");
    }
  } catch (err) {
    console.error("Error posting announcement:", err);
    alert("Server error. Try again.");
  } finally {
    postButton.disabled = false;
    postButton.textContent = "Post";
  }
});
