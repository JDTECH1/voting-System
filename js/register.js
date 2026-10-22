document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus(statusEl);

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      identificationNo: document.getElementById("identificationNo").value.trim(),
      password: document.getElementById("password").value,
      accessibilityPref: document.getElementById("accessibilityPref").value,
    };

    if (!payload.fullName || !payload.email || !payload.identificationNo || !payload.password) {
      showStatus(statusEl, "Please fill in all required fields.", "error");
      return;
    }
    if (payload.password.length < 8) {
      showStatus(statusEl, "Password must be at least 8 characters long.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
      await Api.post("/auth/register", payload);
      showStatus(statusEl, "Account created successfully! Redirecting to login…", "success");
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (err) {
      showStatus(statusEl, err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });
});
