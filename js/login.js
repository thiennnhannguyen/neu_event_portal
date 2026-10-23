/* ==========================================================================
   login.js — Đăng nhập bằng email + mật khẩu, kèm danh sách tài khoản demo
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderChrome(null);
  enhancePasswordInputs();

  const params = new URLSearchParams(window.location.search);
  const emailInput = document.getElementById("email");
  const pwInput = document.getElementById("password");
  const errEl = document.getElementById("login-error");

  /* Danh sách tài khoản demo theo vai trò (khu vực phụ, có thể thu gọn) */
  const roles = Object.keys(ROLE_META);
  const roleParam = params.get("role");
  let currentRole = roles.includes(roleParam) ? roleParam : "student";
  if (roleParam) document.getElementById("demo-box").open = true;
  const shortLabels = { student: "Sinh viên", organizer: "Ban tổ chức", admin: "Quản trị", union: "Đoàn trường", facility: "Thiết bị" };
  const tabsEl = document.getElementById("role-tabs");
  const listEl = document.getElementById("demo-accounts");

  function renderDemo() {
    tabsEl.innerHTML = roles
      .map((r) => `<button type="button" class="role-tab" data-role="${r}" aria-pressed="${r === currentRole}">${shortLabels[r]}</button>`)
      .join("");
    listEl.innerHTML = UserStore.where((u) => u.role === currentRole)
      .map((u) => {
        const sub = u.role === "student" ? `${u.studentCode} · ${u.classInfo}` : u.role === "organizer" ? getUnit(u.unitId).name : u.email;
        return `<button type="button" class="demo-account" data-email="${escapeHtml(u.email)}" aria-label="Điền tài khoản ${escapeHtml(u.name)}">
          ${avatarHtml(u, 32)}
          <span><strong>${escapeHtml(u.name)}</strong><small>${escapeHtml(sub)}</small></span>
          ${u.status === "locked" ? `<span class="badge status-rejected">Bị khóa</span>` : ""}
        </button>`;
      })
      .join("");
  }

  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".role-tab");
    if (!tab) return;
    currentRole = tab.dataset.role;
    renderDemo();
    tabsEl.querySelector(`[data-role="${currentRole}"]`).focus();
  });
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".demo-account");
    if (!btn) return;
    emailInput.value = btn.dataset.email;
    pwInput.value = "123456";
    errEl.textContent = "";
    emailInput.focus();
  });
  renderDemo();

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!emailInput.value.trim() || !pwInput.value) {
      errEl.textContent = "Vui lòng nhập email và mật khẩu.";
      (emailInput.value.trim() ? pwInput : emailInput).focus();
      return;
    }
    const r = AuthService.login(emailInput.value, pwInput.value);
    if (!r.ok) {
      errEl.textContent = r.error;
      (r.error.includes("Mật khẩu") ? pwInput : emailInput).focus();
      return;
    }
    const next = params.get("next");
    window.location.href = next || ROLE_META[r.data.role].home;
  });
});
