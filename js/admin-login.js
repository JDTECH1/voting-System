document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const statusEl = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus(statusEl);

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";

    try {
      const data = await Api.post("/auth/admin-login", { username, password });
      Session.setAdmin(data.token, data.admin);
      window.location.href = "admin-dashboard.html";
    } catch (err) {
      showStatus(statusEl, err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
});
