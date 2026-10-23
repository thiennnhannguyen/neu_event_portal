/* ==========================================================================
   forgot.js — Quên mật khẩu: gửi mã xác nhận (mô phỏng) → đặt lại mật khẩu
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderChrome(null);
  enhancePasswordInputs();

  const $ = (id) => document.getElementById(id);
  let email = "";

  function step(n) {
    [1, 2, 3].forEach((i) => $("step-" + i).classList.toggle("on", i <= n));
    $("forgot-form").hidden = n !== 1;
    $("reset-form").hidden = n !== 2;
    $("reset-done").hidden = n !== 3;
  }

  $("forgot-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(e.target);
    if (invalid) {
      $("forgot-error").textContent = invalid;
      return;
    }
    const r = AuthService.requestReset($("f-email").value);
    if (!r.ok) {
      $("forgot-error").textContent = r.error;
      $("f-email").focus();
      return;
    }
    email = r.data.email;
    $("reset-sub").textContent = `Mã xác nhận đã được gửi tới ${email}.`;
    $("demo-code").textContent = r.data.code;
    step(2);
    $("f-code").focus();
  });

  $("reset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(e.target);
    if (invalid) {
      $("reset-error").textContent = invalid;
      return;
    }
    const r = AuthService.resetPassword(email, $("f-code").value, $("f-new").value, $("f-confirm").value);
    if (!r.ok) {
      $("reset-error").textContent = r.error;
      return;
    }
    step(3);
    $("reset-done").querySelector("a").focus();
  });
});
