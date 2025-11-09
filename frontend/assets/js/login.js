/* ===============================
   LOGIN & SIGN-UP PAGE SCRIPT - BRIGHTPATH
   =============================== */

// =================== PASSWORD VISIBILITY ===================
const passwordInput = document.getElementById("password");
const togglePassword = document.querySelector(".toggle-password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });
}

// =================== LOGIN HANDLER ===================
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("error-message");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginButton = loginForm.querySelector(".btn-primary");

    if (!email || !password) {
      errorMessage.textContent = "Please fill in all fields.";
      return;
    }

    try {
      loginButton.disabled = true;
      loginButton.textContent = "Logging in...";

      const response = await fetch("https://brightpath-2.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      loginButton.disabled = false;
      loginButton.textContent = "Login";

      if (!response.ok) {
        errorMessage.textContent = "Invalid email or password.";
        return;
      }

      const user = await response.json();
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.name);

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
        default:
          errorMessage.textContent = "Unknown user role.";
      }
    } catch (err) {
      console.error("Login error:", err);
      errorMessage.textContent = "Server error. Please try again later.";
      loginButton.disabled = false;
      loginButton.textContent = "Login";
    }
  });
}

// =================== SIGN-UP ROLE SWITCHING & DYNAMIC DATA ===================
document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("role");
  const parentSection = document.getElementById("parentDetails");
  const teacherSection = document.getElementById("teacherDetails");
  const subjectsSelect = document.getElementById("subjects");
  const gradesSelect = document.getElementById("grades");

  // Toggle parent / teacher sections
  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      const role = roleSelect.value;
      parentSection.style.display = "none";
      teacherSection.style.display = "none";

      if (role === "parent") parentSection.style.display = "block";
      if (role === "teacher") teacherSection.style.display = "block";
    });
  }

  // =================== LOAD SUBJECTS FROM BACKEND ===================
  async function loadSubjects() {
    if (!subjectsSelect) return;
    try {
      const res = await fetch("https://brightpath-2.onrender.com/get-subjects");
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load subjects");

      subjectsSelect.innerHTML = "";
      data.subjects.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        subjectsSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error loading subjects:", err);
      subjectsSelect.innerHTML = `<option value="">Error loading subjects</option>`;
    }
  }

  // =================== HARD-CODED GRADES ===================
  function loadGrades() {
    if (!gradesSelect) return;
    const gradeList = [
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9"
    ];

    gradesSelect.innerHTML = "";
    gradeList.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      gradesSelect.appendChild(opt);
    });
  }

  // Load data when signup page opens
  if (subjectsSelect && gradesSelect) {
    loadSubjects();
    loadGrades();
  }

  // =================== SIGN-UP FORM HANDLER ===================
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const role = document.getElementById("role").value;

      try {
        if (role === "parent") {
          const phone = document.getElementById("parentPhone").value.trim();
          const admissionNo = document.getElementById("admissionNo").value.trim();

          const res = await fetch("http://127.0.0.1:8000/signup-parent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              password,
              phone,
              admission_no: admissionNo,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Parent signup failed");
          alert("Parent account created successfully!");
        }

        if (role === "teacher") {
          const department = document.getElementById("department").value.trim();
          const subjects = Array.from(subjectsSelect.selectedOptions).map(
            (o) => o.value
          );
          const grades = Array.from(gradesSelect.selectedOptions).map(
            (o) => o.value
          );

          const res = await fetch("https://brightpath-2.onrender.com/signup-teacher", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              password,
              department,
              subjects,
              grades,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Teacher signup failed");
          alert("Teacher account created successfully!");
        }

        if (role === "admin") {
          alert("Admin signup coming soon!");
        }

        window.location.href = "index.html"; // redirect to login
      } catch (err) {
        console.error(err);
        document.getElementById("error-message").textContent = err.message;
      }
    });
  }
});
