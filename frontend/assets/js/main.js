
/* ===============================
   MAIN JS - BRIGHTPATH GLOBAL LOGIC
   =============================== */
const BASE_URL = "https://brightpath-3.onrender.com";
// Ensure all pages use the same scroll and layout behavior
window.addEventListener("load", () => {
  document.body.style.visibility = "visible";
  document.body.style.opacity = "1";
});

// ======== AUTH CHECK (for non-dashboard pages) ======== //
function checkIfLoggedIn() {
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");

  // If user is logged in and tries to access login/signup → redirect to dashboard
  if (userRole && userEmail) {
    switch (userRole) {
      case "parent":
        window.location.href = "dashboard-parent.html";
        break;
      case "teacher":
        window.location.href = "dashboard-teacher.html";
        break;
      case "admin":
        window.location.href = "dashboard-admin.html";
        break;
    }
  }
}

// Run only on login/signup pages
if (window.location.pathname.includes("index.html") || window.location.pathname.includes("signup.html")) {
  checkIfLoggedIn();
}

// ======== DARK MODE TOGGLE (optional global feature) ======== //
const darkModeToggle = document.getElementById("darkModeToggle");

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// Maintain dark mode preference
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
});

// ======== HELPER FUNCTIONS ======== //

// Capitalize first letter utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Format date (for announcements, etc.)
function formatDate() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Display message banners
function showMessage(text, type = "success") {
  const banner = document.createElement("div");
  banner.className = `alert alert-${type}`;
  banner.textContent = text;

  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

// ======== GLOBAL CSS FOR ALERTS ======== //
const alertStyle = document.createElement("style");
alertStyle.textContent = `
  .alert {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    color: var(--text-color);
    padding: 0.9rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    z-index: 9999;
    transition: all 0.3s ease;
  }
  .alert-success {
    border-left: 5px solid var(--primary-color);
  }
  .alert-error {
    border-left: 5px solid var(--error-color);
  }
`;
document.head.appendChild(alertStyle);
// ===============================
// SIGNUP LOGIC
// ===============================
const signupForm = document.getElementById("signupForm");
const roleSelect = document.getElementById("role");
const parentDetails = document.getElementById("parentDetails");

if (signupForm && roleSelect) {
  // 1️⃣ Show/Hide Parent Details based on selected role
  roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "parent") {
      parentDetails.style.display = "block";
    } else {
      parentDetails.style.display = "none";
    }
  });

  // 2️⃣ Handle signup submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const role = roleSelect.value;
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password || !role) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    let payload = { name, email, password };
    let endpoint = "";

    // 3️⃣ Route based on role
    if (role === "teacher") {
      endpoint = "/add-teacher";
    } else if (role === "admin") {
      endpoint = "/add-admin";
    } else if (role === "parent") {
      const phone = document.getElementById("parentPhone").value.trim();
      const admission_no = document.getElementById("admissionNo").value.trim();

      if (!phone || !admission_no) {
        showMessage("Please fill in phone and admission number.", "error");
        return;
      }

      payload = {
        name,
        email,
        phone,
        password,
        admission_no,
      };
      endpoint = "/parent/signup";
    } else {
      showMessage("Invalid role selected.", "error");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Signup failed.");
      }

      showMessage("Signup successful! Redirecting to login...", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}
