/* ==========================================================================
   register.js — Đăng ký tài khoản sinh viên
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderChrome(null);
  enhancePasswordInputs();

  const form = document.getElementById("register-form");
  const errEl = document.getElementById("register-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(form);
    if (invalid) {
      errEl.textContent = invalid;
      return;
    }
    const val = (id) => document.getElementById(id).value.trim();
    const r = AuthService.registerStudent({
      name: val("r-name"),
      studentCode: val("r-code"),
      classInfo: val("r-class"),
      faculty: val("r-faculty"),
      cohort: val("r-cohort"),
      email: val("r-email"),
      password: document.getElementById("r-password").value,
      confirm: document.getElementById("r-confirm").value,
      gender: "",
      dob: "",
      phone: "",
    });
    if (!r.ok) {
      errEl.textContent = r.error;
      errEl.scrollIntoView({ block: "center" });
      return;
    }
    window.location.href = "profile.html?welcome=1";
  });
});
