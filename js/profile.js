/* ==========================================================================
   profile.js — Hồ sơ cá nhân + đổi mật khẩu (mọi vai trò)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderChrome(null);
  renderProfile();
});

function renderProfile() {
  const root = document.getElementById("profile-root");
  const user = SessionStore.current();
  if (!user) {
    root.innerHTML = accessBlockHtml("lock", "Bạn chưa đăng nhập", "Đăng nhập để xem và cập nhật hồ sơ cá nhân.",
      `<a class="btn btn-primary" href="login.html?next=profile.html">Đăng nhập ngay</a>`);
    return;
  }

  const isStudent = user.role === "student";
  const unit = user.role === "organizer" ? getUnit(user.unitId) : null;
  const welcome = new URLSearchParams(window.location.search).get("welcome");
  const regs = isStudent ? RegService.byStudent(user.id) : [];

  const kv = (k, v) => `<div class="kv-row"><span>${k}</span><span>${escapeHtml(v || "—")}</span></div>`;
  const input = (id, label, value, attrs = "") =>
    `<div class="field"><label for="${id}">${label}</label><input id="${id}" value="${escapeHtml(value || "")}" ${attrs}/></div>`;

  let fields = "";
  if (isStudent) {
    fields = `
      ${input("p-name", "Họ và tên <span class=\"req\" aria-hidden=\"true\">*</span>", user.name, "required")}
      <div class="field-row">
        ${input("p-code", "Mã sinh viên", user.studentCode, "readonly")}
        <div class="field"><label for="p-gender">Giới tính</label>
          <select id="p-gender">${["", "Nam", "Nữ", "Khác"].map((g) => `<option value="${g}" ${user.gender === g ? "selected" : ""}>${g || "— Chọn —"}</option>`).join("")}</select>
        </div>
      </div>
      <div class="field-row">
        ${input("p-dob", "Ngày sinh", user.dob, 'type="date"')}
        ${input("p-phone", "Số điện thoại", user.phone, 'type="tel"')}
      </div>
      <div class="field-row">
        ${input("p-class", "Lớp", user.classInfo)}
        ${input("p-cohort", "Khóa", user.cohort)}
      </div>
      ${input("p-faculty", "Khoa / Viện", user.faculty)}`;
  } else {
    fields = `
      ${input("p-name", "Họ và tên <span class=\"req\" aria-hidden=\"true\">*</span>", user.name, "required")}
      <div class="field-row">
        ${user.role === "organizer" ? input("p-position", "Chức vụ", user.position) : ""}
        ${input("p-phone", "Số điện thoại", user.phone, 'type="tel"')}
      </div>
      ${unit ? `<div class="field"><label>Đơn vị</label><input value="${escapeHtml(unit.name)}" readonly/>
        <p class="field-hint">Thông tin đơn vị được cập nhật tại <a class="text-link" href="dashboard.html#unit">Trang quản lý → Hồ sơ đơn vị</a>.</p></div>` : ""}`;
  }

  root.innerHTML = `
    <section class="page-head">
      <div class="container">
        <span class="eyebrow">Tài khoản</span>
        <h1>Hồ sơ cá nhân</h1>
        <p>Cập nhật thông tin liên hệ và bảo mật tài khoản của bạn.</p>
      </div>
    </section>
    <section class="page-body">
      <div class="container">
        ${welcome ? `<div class="notice notice-ok" role="status">${icon("check-circle", 18)}<span><strong>Tạo tài khoản thành công!</strong> Hãy bổ sung giới tính, ngày sinh, số điện thoại rồi bắt đầu <a class="text-link" href="events.html">khám phá sự kiện</a>.</span></div>` : ""}
        <div class="profile-layout">
          <div class="panel profile-card">
            ${avatarHtml(user, 84)}
            <h2>${escapeHtml(user.name)}</h2>
            <div class="sub">${ROLE_META[user.role].label}${unit ? " · " + escapeHtml(unit.name) : ""}</div>
            ${isStudent ? `<div class="points-badge">${icon("award", 16)} ${PointService.total(user.id)} điểm Đoàn</div>` : ""}
            <div class="kv">
              ${kv("Email", user.email)}
              ${kv("Mã tài khoản", user.id)}
              ${kv("Ngày tạo", fmtDT(user.createdAt).slice(0, 10))}
              ${isStudent ? kv("Sự kiện đã đăng ký", String(regs.filter((r) => r.status !== "cancelled").length)) : ""}
              ${isStudent ? kv("Đã tham dự", String(regs.filter((r) => r.status === "attended").length)) : ""}
            </div>
          </div>

          <div>
            <form class="panel" id="profile-form" novalidate aria-labelledby="pf-title">
              <h2 id="pf-title">Thông tin cá nhân</h2>
              <p class="form-error" id="profile-error" role="alert"></p>
              ${fields}
              <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
            </form>

            <form class="panel" id="password-form" novalidate aria-labelledby="pw-title">
              <h2 id="pw-title">Đổi mật khẩu</h2>
              <p class="form-error" id="password-error" role="alert"></p>
              <div class="field"><label for="pw-old">Mật khẩu hiện tại <span class="req" aria-hidden="true">*</span></label><input type="password" id="pw-old" required autocomplete="current-password"/></div>
              <div class="field-row">
                <div class="field"><label for="pw-new">Mật khẩu mới <span class="req" aria-hidden="true">*</span></label><input type="password" id="pw-new" required minlength="6" autocomplete="new-password" aria-describedby="pw-hint"/><p class="field-hint" id="pw-hint">Tối thiểu 6 ký tự.</p></div>
                <div class="field"><label for="pw-confirm">Nhập lại mật khẩu mới <span class="req" aria-hidden="true">*</span></label><input type="password" id="pw-confirm" required minlength="6" autocomplete="new-password"/></div>
              </div>
              <button class="btn btn-outline" type="submit">${icon("key", 18)} Đổi mật khẩu</button>
            </form>
          </div>
        </div>
      </div>
    </section>`;

  enhancePasswordInputs(root);
  const val = (id) => (document.getElementById(id) ? document.getElementById(id).value.trim() : undefined);

  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(e.target);
    if (invalid) {
      document.getElementById("profile-error").textContent = invalid;
      return;
    }
    const patch = { name: val("p-name"), phone: val("p-phone") };
    if (isStudent) Object.assign(patch, { gender: val("p-gender"), dob: val("p-dob"), classInfo: val("p-class"), cohort: val("p-cohort"), faculty: val("p-faculty") });
    if (user.role === "organizer") patch.position = val("p-position");
    const r = AuthService.updateProfile(user, patch);
    if (!r.ok) {
      document.getElementById("profile-error").textContent = r.error;
      return;
    }
    showToast("Đã cập nhật hồ sơ.");
    renderChrome(null);
    renderProfile();
  });

  document.getElementById("password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(e.target);
    if (invalid) {
      document.getElementById("password-error").textContent = invalid;
      return;
    }
    const r = AuthService.changePassword(SessionStore.current(), val("pw-old"), document.getElementById("pw-new").value, document.getElementById("pw-confirm").value);
    if (!r.ok) {
      document.getElementById("password-error").textContent = r.error;
      return;
    }
    e.target.reset();
    document.getElementById("password-error").textContent = "";
    showToast("Đã đổi mật khẩu thành công.");
  });
}
