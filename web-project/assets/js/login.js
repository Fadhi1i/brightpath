/* ===============================
   LOGIN PAGE SCRIPT - BRIGHTPATH
   =============================== */

// Toggle password visibility
const passwordInput = document.getElementById("password");
const togglePassword = document.querySelector(".toggle-password");

togglePassword.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.textContent = type === "password" ? "👁️" : "🙈";
});

// Mock user data (replace with backend later)
const users = [
  { email: "parent@example.com", password: "12345", role: "parent" },
  { email: "teacher@example.com", password: "12345", role: "teacher" },
  { email: "admin@example.com", password: "12345", role: "admin" },
];

const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    errorMessage.textContent = "Invalid email or password. Please try again.";
    return;
  }

  // Simulate login success (store in localStorage)
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("userEmail", user.email);

  // Redirect based on role
  switch (user.role) {
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
});
