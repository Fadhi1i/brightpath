/* ===============================
   DASHBOARD LOGIC - BRIGHTPATH (Fixed for .content scrolling)
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  // Redirect to login if no session
  if (!userEmail || !userRole) {
    window.location.href = "index.html";
    return;
  }

  // Display user name
 // Display user name (real name from localStorage)
const nameSpan =
  document.getElementById(`${userRole}Name`) ||
  document.getElementById("userName");

const storedName = localStorage.getItem("userName");

if (nameSpan) {
  if (storedName) {
    nameSpan.textContent = storedName;
  } else if (userEmail && userEmail.includes("@")) {
    // fallback in case name isn't stored
    const fallbackName = userEmail.split("@")[0].replace(/[._]/g, " ");
    nameSpan.textContent =
      fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
  }
}


  // ===============================
  // CONTENT SCROLLING HELPERS
  // ===============================
  const content = document.querySelector(".content");

  // ===============================
  // SMOOTH SCROLL INSIDE CONTENT (fixed top alignment)
  // ===============================
  const navLinks = document.querySelectorAll(".sidebar-nav a[href^='#']");
  if (navLinks.length && content) {
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        // Scroll the content area precisely to the section
        const targetPosition = target.offsetTop;
        content.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      });
    });
  }
});

/* ===============================
   LOGOUT FUNCTIONALITY
   =============================== */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  });
}

/* ===============================
   UTILITIES & MOCK DATA
   =============================== */
function calculateGrade(marks) {
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "E";
}

function getMockData(role) {
  if (role === "parent") {
    return {
      performance: [
        { subject: "Math", marks: 84 },
        { subject: "Science", marks: 76 },
        { subject: "English", marks: 92 },
      ],
      comments: [
        "Excellent progress in English.",
        "Needs to participate more actively in Science class.",
      ],
      announcements: [
        "Midterm results will be released on Friday.",
        "Parent-Teacher meeting next Wednesday.",
      ],
    };
  }
  return {};
}
