document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const credentialsForm = document.getElementById("credentials-form");
  const otpForm = document.getElementById("otp-form");
  const otpDisplay = document.getElementById("dev-otp-display");

  let otpToken = null;

  credentialsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus(statusEl);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const submitBtn = document.getElementById("credentials-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";

    try {
      const data = await Api.post("/auth/login", { email, password });
      otpToken = data.otpToken;
      otpDisplay.textContent = data.devOtp; // demo-only convenience
      credentialsForm.hidden = true;
      otpForm.hidden = false;
      document.getElementById("otpCode").focus();
      showStatus(statusEl, "Credentials verified. Enter the OTP below to finish logging in.", "success");
    } catch (err) {
      showStatus(statusEl, err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue";
    }
  });

  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus(statusEl);

    const code = document.getElementById("otpCode").value.trim();
    const submitBtn = document.getElementById("otp-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying…";

    try {
      const data = await Api.post("/auth/verify-otp", { otpToken, code });
      Session.setVoter(data.token, data.voter);
      showStatus(statusEl, "Login successful! Redirecting…", "success");
      setTimeout(() => (window.location.href = "voter-dashboard.html"), 800);
    } catch (err) {
      showStatus(statusEl, err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify and log in";
    }
  });

  document.getElementById("otp-cancel").addEventListener("click", () => {
    otpForm.hidden = true;
    credentialsForm.hidden = false;
    hideStatus(statusEl);
    otpToken = null;
  });
});
