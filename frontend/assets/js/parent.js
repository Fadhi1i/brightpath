/* ===============================
   PARENT DASHBOARD LOGIC - BRIGHTPATH (Supabase-Linked)
   =============================== */

// ===============================
// Display Logged-In Parent Name
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const parentNameElement = document.getElementById("parentName");
  const userName = localStorage.getItem("userName");
  if (parentNameElement && userName) parentNameElement.textContent = userName;
});

// ===============================
// Load Parent & Student Data
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const userRole = localStorage.getItem("userRole");
  const parentId = localStorage.getItem("userId");
  if (userRole !== "parent" || !parentId) return;

  try {
    // === Fetch linked students ===
    const response = await fetch(`https://brightpath-2.onrender.com/parents/${parentId}/students`);
    if (!response.ok) throw new Error("Failed to load student data.");
    const result = await response.json();

    const studentData = result.students?.[0]; // first child
    if (!studentData) throw new Error("No linked students found.");

    // === Display student info ===
    document.getElementById("studentName").textContent = studentData.name || "—";
    document.getElementById("studentReg").textContent = studentData.reg_no || "—";
    document.getElementById("studentGrade").textContent = studentData.grade || "—";

    // === Fetch performance ===
    const perfResponse = await fetch(`https://brightpath-2.onrender.com/students/${studentData.id}/performance`);
    const perfResult = await perfResponse.json();

    const performanceBody = document.getElementById("performanceData");
    if (performanceBody && perfResult.performance && perfResult.performance.length > 0) {
      performanceBody.innerHTML = perfResult.performance
        .map(
          (item) => `
          <tr>
            <td>${item.subject}</td>
            <td>${item.marks}</td>
            <td>${calculateGrade(item.marks)}</td>
          </tr>`
        )
        .join("");
    } else if (performanceBody) {
      performanceBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No results yet.</td></tr>`;
    }

    // === Comments & Announcements placeholders ===
    const commentsContainer = document.getElementById("teacherComments");
    if (commentsContainer) commentsContainer.innerHTML = `<p class="comment-item">Results are up-to-date.</p>`;

  } catch (err) {
    console.error("Error loading parent dashboard:", err);
  }

  // Smooth scrolling
  document.documentElement.style.scrollBehavior = "smooth";
});

// ===============================
// Summarize Text Feature
// ===============================
const summarizeBtn = document.getElementById("summarizeBtn");
if (summarizeBtn) {
  summarizeBtn.addEventListener("click", async () => {
    const text = document.getElementById("inputText").value;
    const resultElem = document.getElementById("result");

    if (!text.trim()) {
      resultElem.innerText = "Please enter some text first.";
      return;
    }

    resultElem.innerText = "Summarizing... ⏳";

    try {
      const res = await fetch("https://brightpath-2.onrender.com/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      resultElem.innerText = data.summary || "No summary available.";
    } catch (err) {
      console.error("Summarization error:", err);
      resultElem.innerText = "An error occurred while summarizing.";
    }
  });
}

// ===============================
// Parent: Load Announcements (Auto-refresh every 15s)
// ===============================
async function loadAnnouncements() {
  const list = document.getElementById("announcementsList");
  if (!list) return;

  try {
    const res = await fetch("https://brightpath-2.onrender.com/get-announcements");
    const data = await res.json();

    list.innerHTML = "";

    if (!data.success || !data.announcements || data.announcements.length === 0) {
      list.innerHTML = `<p class="empty">No announcements yet.</p>`;
      return;
    }

    data.announcements.forEach((a) => {
      const div = document.createElement("div");
      div.className = "announcement-item";
      div.innerHTML = `
        <p>${a.message}</p>
        <small>— ${a.posted_by || "Admin"} (${new Date(
          a.created_at
        ).toLocaleString()})</small>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading announcements:", err);
    list.innerHTML = `<p class="empty">⚠️ Could not load announcements.</p>`;
  }
}

// Initialize announcements once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncements();
  setInterval(loadAnnouncements, 15000); // refresh every 15s
});

// ===============================
// Utility: Calculate Grade
// ===============================
function calculateGrade(marks) {
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "E";
}
