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
  const nameSpan =
    document.getElementById(`${userRole}Name`) ||
    document.getElementById("userName");
  if (nameSpan && userEmail.includes("@")) {
    const name = userEmail.split("@")[0];
    nameSpan.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // ===============================
  // MOBILE SIDEBAR TOGGLE
  // ===============================
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const content = document.querySelector(".content");

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("show"));
  }

  document.addEventListener("click", (event) => {
    if (
      sidebar &&
      sidebar.classList.contains("show") &&
      !sidebar.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      sidebar.classList.remove("show");
    }
  });

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

        sidebar.classList.remove("show");
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
