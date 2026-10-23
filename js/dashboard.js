/* ==========================================================================
   dashboard.js — Trang quản lý theo vai trò
   - Ban tổ chức: thống kê đơn vị, sự kiện (nháp/gửi duyệt/sửa/hủy), đăng ký &
     điểm danh, mượn phòng, hồ sơ đơn vị
   - Quản trị viên: duyệt sự kiện, toàn bộ sự kiện, tài khoản, đơn vị, danh mục, báo cáo
   - Đoàn trường: duyệt sự kiện, cấp điểm Đoàn
   - Phòng Quản trị thiết bị: duyệt mượn phòng, lịch sử dụng phòng
   ========================================================================== */

let DASH_SESSION = null;
let DASH_VIEW = null;
const DASH_STATE = {
  eventStatus: "all",
  attendanceEvent: null,
  attQuery: "",
  attStatus: "all",
  q: "",
  unitFilter: "",
  statusFilter: "",
  roleFilter: "",
  bookingTab: "pending",
  pointsTab: "todo",
  reportPeriod: "month",
  reportRef: nowDT().slice(0, 10),
};

const DASH_NAV = {
  organizer: [
    { key: "overview", label: "Thống kê đơn vị", ic: "chart" },
    { key: "my-events", label: "Sự kiện của đơn vị", ic: "folder" },
    { key: "attendance", label: "Đăng ký & điểm danh", ic: "clipboard-check" },
    { key: "bookings", label: "Mượn phòng", ic: "door" },
    { key: "unit", label: "Hồ sơ đơn vị", ic: "building" },
  ],
  admin: [
    { key: "pending", label: "Duyệt sự kiện", ic: "hourglass", group: "Sự kiện" },
    { key: "all-events", label: "Tất cả sự kiện", ic: "folder" },
    { key: "attendance", label: "Đăng ký & điểm danh", ic: "clipboard-check" },
    { key: "accounts", label: "Tài khoản", ic: "users", group: "Danh mục hệ thống" },
    { key: "units", label: "Đơn vị tổ chức", ic: "building" },
    { key: "categories", label: "Danh mục sự kiện", ic: "grid" },
    { key: "reports", label: "Báo cáo thống kê", ic: "chart", group: "Báo cáo" },
  ],
  union: [
    { key: "pending", label: "Duyệt sự kiện", ic: "hourglass" },
    { key: "points", label: "Cấp điểm Đoàn", ic: "award" },
  ],
  facility: [
    { key: "room-requests", label: "Yêu cầu mượn phòng", ic: "inbox" },
    { key: "rooms", label: "Lịch sử dụng phòng", ic: "door" },
  ],
};

const ICON_CHOICES = ["trophy", "mic", "wrench", "flag", "sprout", "music", "activity", "user-plus", "briefcase", "megaphone", "book", "building", "award", "heart", "monitor", "users", "chart", "sparkle"];

/* ---------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderChrome("dashboard");
  DASH_SESSION = SessionStore.current();
  const root = document.getElementById("dashboard-root");

  if (!DASH_SESSION || DASH_SESSION.role === "student") {
    root.innerHTML = accessBlockHtml(
      "lock",
      "Khu vực dành cho cán bộ quản lý",
      "Bạn cần đăng nhập bằng tài khoản Ban tổ chức, Quản trị viên, Đoàn trường hoặc Phòng Quản trị thiết bị để truy cập trang này.",
      `<a class="btn btn-primary" href="login.html?role=organizer&next=dashboard.html">Đăng nhập ngay</a>`
    );
    return;
  }

  const eventParam = new URLSearchParams(window.location.search).get("event");
  if (eventParam) DASH_STATE.attendanceEvent = eventParam;

  setViewFromHash();
  window.addEventListener("hashchange", () => {
    setViewFromHash();
    renderShell();
  });
  renderShell();
});

function navItems() {
  return DASH_NAV[DASH_SESSION.role];
}

function setViewFromHash() {
  const hash = window.location.hash.slice(1);
  DASH_VIEW = navItems().some((n) => n.key === hash) ? hash : navItems()[0].key;
}

function go(view) {
  if (window.location.hash.slice(1) === view) renderShell();
  else window.location.hash = view;
}

function refresh() {
  DASH_SESSION = SessionStore.current();
  renderChrome("dashboard");
  renderShell();
}

/* ---------------------------------------------------------------------- */
function renderShell() {
  const root = document.getElementById("dashboard-root");
  const role = DASH_SESSION.role;
  const unit = role === "organizer" ? getUnit(DASH_SESSION.unitId) : null;

  const badges = {
    pending: EventStore.where((e) => e.status === "pending").length,
    "room-requests": BookingStore.where((b) => b.status === "pending").length,
    points: EventStore.where((e) => e.status === "ended" && !e.pointsAwardedAt).length,
  };

  root.innerHTML = `
    <div class="dash-shell">
      <aside class="dash-sidebar">
        <div class="dash-who">
          <strong>${escapeHtml(unit ? unit.name : DASH_SESSION.name)}</strong>
          <span>${ROLE_META[role].label}${unit ? " · " + escapeHtml(DASH_SESSION.name) : ""}</span>
        </div>
        <button type="button" class="dash-menu-toggle" id="dash-menu-toggle" aria-expanded="false" aria-controls="dash-nav">
          <span><small>Menu quản lý</small>${escapeHtml(navItems().find((n) => n.key === DASH_VIEW).label)}</span>
          ${icon("chevron-down", 20)}
        </button>
        <nav class="dash-nav" id="dash-nav" aria-label="Menu quản lý" ${window.matchMedia("(max-width: 960px)").matches ? "hidden" : ""}>
          ${navItems()
            .map(
              (n) => `${n.group ? `<div class="nav-group">${n.group}</div>` : ""}
              <a href="#${n.key}" ${DASH_VIEW === n.key ? 'aria-current="page"' : ""}>${icon(n.ic, 17)} ${n.label}${badges[n.key] ? `<span class="badge-n">${badges[n.key]}</span>` : ""}</a>`
            )
            .join("")}
        </nav>
      </aside>
      <div class="dash-main" id="dash-main"></div>
    </div>
  `;

  bindDisclosure(document.getElementById("dash-menu-toggle"), document.getElementById("dash-nav"));
  const main = document.getElementById("dash-main");
  main.onclick = handleAction;
  VIEWS[DASH_VIEW](main);
}

const VIEWS = {
  overview: (main) => renderReportView(main, DASH_SESSION.unitId),
  "my-events": renderMyEvents,
  attendance: renderAttendance,
  bookings: renderOrgBookings,
  unit: renderUnitProfile,
  pending: renderPendingQueue,
  "all-events": renderAllEvents,
  accounts: renderAccounts,
  units: renderUnits,
  categories: renderCategories,
  reports: (main) => renderReportView(main, null),
  points: renderPoints,
  "room-requests": renderRoomRequests,
  rooms: renderRooms,
};

/* ---- Thành phần bảng dùng chung ----------------------------------------- */
function actBtn(ic, title, act, id, cls = "") {
  return `<button class="icon-btn ${cls}" title="${title}" aria-label="${title}" data-act="${act}" data-id="${id}">${icon(ic, 17)}</button>`;
}
function evtCell(e, withUnit = false) {
  return `<div class="row-title">${escapeHtml(e.title)}</div>
    <div class="row-sub">${categoryBadge(e.category)}${withUnit ? ` · ${escapeHtml(EventService.unitName(e))}` : ""}</div>`;
}
function timeCell(e) {
  return `<td class="num-cell">${formatDateShort(e.start)}/${e.start.slice(0, 4)}<br/>${timeRangeText(e)}</td>`;
}
function seatsCell(e) {
  return `<td class="num-cell">${RegService.takenSeats(e.id)}/${e.capacity}</td>`;
}
function emptyRow(cols, text) {
  return `<tr class="empty-row"><td colspan="${cols}">${text}</td></tr>`;
}
function headHtml(title, desc, actions = "") {
  return `<div class="dash-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`;
}

/* ---- Xử lý các nút hành động (event delegation) ------------------------- */
function result(r, okMsg) {
  if (!r.ok) {
    showToast(r.error);
    return false;
  }
  showToast(okMsg);
  refresh();
  return true;
}

const ACTIONS = {
  view: (id) => window.open("event-detail.html?id=" + id, "_blank"),
  edit: (id) => openEventForm(EventStore.getById(id)),
  submit: (id) => result(EventService.submit(DASH_SESSION, id), "Đã gửi duyệt sự kiện."),
  delete: (id) => {
    const evt = EventStore.getById(id);
    if (confirm(`Xóa sự kiện "${evt.title}"? Hành động này không thể hoàn tác.`)) result(EventService.deleteDraft(DASH_SESSION, id), "Đã xóa sự kiện.");
  },
  "cancel-evt": (id) => {
    const evt = EventStore.getById(id);
    const n = RegService.byEvent(id).filter((r) => r.status === "registered").length;
    askReason(
      { title: "Hủy sự kiện", label: "Lý do hủy (sẽ gửi tới sinh viên)", submitLabel: "Hủy sự kiện",
        note: `Sự kiện "${escapeHtml(evt.title)}" sẽ chuyển sang Đã hủy. ${n} phiếu đăng ký sẽ chuyển sang Đã hủy và sinh viên nhận thông báo.` },
      (reason) => {
        const r = EventService.cancel(DASH_SESSION, id, reason);
        if (r.ok) result(r, `Đã hủy sự kiện và thông báo tới ${r.data} sinh viên.`);
        return r;
      }
    );
  },
  finish: (id) => {
    if (confirm("Kết thúc sự kiện? Các phiếu chưa điểm danh sẽ chuyển sang Vắng mặt.")) result(EventService.finishManually(DASH_SESSION, id), "Đã kết thúc sự kiện.");
  },
  regs: (id) => {
    DASH_STATE.attendanceEvent = id;
    go("attendance");
  },
  approve: (id) => {
    const evt = EventStore.getById(id);
    if (confirm(`Duyệt và đăng công khai "${evt.title}"?`)) result(EventService.approve(DASH_SESSION, id), "Đã duyệt sự kiện. Ban tổ chức đã nhận thông báo.");
  },
  reject: (id) => {
    const evt = EventStore.getById(id);
    askReason(
      { title: "Từ chối sự kiện", label: "Lý do từ chối (bắt buộc)", placeholder: "Ví dụ: Nội dung chưa rõ đối tượng tham gia, đề nghị bổ sung...", submitLabel: "Từ chối",
        note: `Ban tổ chức của "${escapeHtml(evt.title)}" sẽ nhận lý do để chỉnh sửa và gửi lại.` },
      (reason) => {
        const r = EventService.reject(DASH_SESSION, id, reason);
        if (r.ok) result(r, "Đã từ chối sự kiện.");
        return r;
      }
    );
  },
  remove: (id) =>
    askReason(
      { title: "Gỡ sự kiện vi phạm", label: "Lý do gỡ", submitLabel: "Gỡ sự kiện",
        note: "Sự kiện sẽ bị ẩn khỏi cổng thông tin, mọi phiếu đăng ký bị hủy và các bên liên quan nhận thông báo." },
      (reason) => {
        const r = EventService.removeViolation(DASH_SESSION, id, reason);
        if (r.ok) result(r, "Đã gỡ sự kiện.");
        return r;
      }
    ),
  lock: (id) => result(AdminService.setStatus(DASH_SESSION, id, "locked"), "Đã khóa tài khoản."),
  unlock: (id) => result(AdminService.setStatus(DASH_SESSION, id, "active"), "Đã mở khóa tài khoản."),
  "delete-user": (id) => {
    const u = UserStore.getById(id);
    if (confirm(`Xóa tài khoản ${u.email}?`)) result(AdminService.deleteAccount(DASH_SESSION, id), "Đã xóa tài khoản.");
  },
  "edit-unit": (id) => openUnitForm(UnitStore.getById(id)),
  "delete-unit": (id) => {
    if (confirm("Xóa đơn vị này?")) result(AdminService.deleteUnit(id), "Đã xóa đơn vị.");
  },
  "edit-cat": (id) => openCategoryForm(CategoryStore.getById(id)),
  "delete-cat": (id) => {
    if (confirm("Xóa danh mục này?")) result(AdminService.deleteCategory(id), "Đã xóa danh mục.");
  },
  "approve-booking": (id) => result(BookingService.approve(DASH_SESSION, id), "Đã duyệt mượn phòng."),
  "reject-booking": (id) =>
    askReason({ title: "Từ chối mượn phòng", label: "Lý do từ chối", submitLabel: "Từ chối" }, (reason) => {
      const r = BookingService.reject(DASH_SESSION, id, reason);
      if (r.ok) result(r, "Đã từ chối yêu cầu mượn phòng.");
      return r;
    }),
  award: (id) => openAwardForm(EventStore.getById(id)),
  attendees: (id) => openAttendeeList(EventStore.getById(id)),
};

function handleAction(e) {
  const b = e.target.closest("[data-act]");
  if (!b || b.tagName === "SELECT") return;
  e.preventDefault();
  ACTIONS[b.dataset.act](b.dataset.id, b);
}

/* ======================================================================
   BAN TỔ CHỨC
   ====================================================================== */
function renderMyEvents(main) {
  const all = EventStore.where((e) => e.unitId === DASH_SESSION.unitId).sort((a, b) => b.start.localeCompare(a.start));
  const list = DASH_STATE.eventStatus === "all" ? all : all.filter((e) => e.status === DASH_STATE.eventStatus);
  const count = (s) => all.filter((e) => e.status === s).length;
  const chips = ["all", "draft", "pending", "published", "rejected", "ended", "cancelled"];

  main.innerHTML = `
    ${headHtml("Sự kiện của đơn vị", `Quản lý các sự kiện do ${escapeHtml(getUnit(DASH_SESSION.unitId).name)} tổ chức.`,
      `<button class="btn btn-primary" id="btn-new-event">${icon("plus", 16)} Tạo sự kiện mới</button>`)}

    <div class="mini-stats">
      <div class="mini-stat"><div class="num">${all.length}</div><div class="lbl">Tổng số sự kiện</div></div>
      <div class="mini-stat"><div class="num">${count("published")}</div><div class="lbl">Đã đăng</div></div>
      <div class="mini-stat"><div class="num">${count("pending")}</div><div class="lbl">Chờ duyệt</div></div>
      <div class="mini-stat"><div class="num">${count("draft") + count("rejected")}</div><div class="lbl">Nháp / cần sửa</div></div>
    </div>

    <div class="chip-row" role="group" aria-label="Lọc theo trạng thái">
      ${chips.map((s) => `<button type="button" class="chip" aria-pressed="${DASH_STATE.eventStatus === s}" data-status="${s}">${s === "all" ? "Tất cả" : STATUS_META[s].label} (${s === "all" ? all.length : count(s)})</button>`).join("")}
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Thời gian</th><th>Đăng ký</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          ${list.length ? list.map(orgEventRow).join("") : emptyRow(5, 'Chưa có sự kiện nào. Nhấn "Tạo sự kiện mới" để bắt đầu.')}
        </tbody>
      </table>
    </div>`;

  document.getElementById("btn-new-event").addEventListener("click", () => openEventForm(null));
  main.querySelectorAll("[data-status]").forEach((b) =>
    b.addEventListener("click", () => {
      DASH_STATE.eventStatus = b.dataset.status;
      renderShell();
    })
  );
}

function orgEventRow(e) {
  const booking = e.roomId ? BookingService.forEvent(e.id) : null;
  const rejectedBooking = e.roomId && !booking ? BookingStore.where((b) => b.eventId === e.id && b.status === "rejected")[0] : null;
  const s = e.status;
  const started = nowDT() >= e.start;
  const acts = [
    actBtn("eye", "Xem trang sự kiện", "view", e.id),
    ["draft", "rejected", "pending", "published"].includes(s) ? actBtn("edit", "Chỉnh sửa", "edit", e.id) : "",
    ["draft", "rejected"].includes(s) ? actBtn("send", "Gửi duyệt", "submit", e.id, "ok") : "",
    ["published", "ended"].includes(s) ? actBtn("users", "Danh sách đăng ký", "regs", e.id) : "",
    s === "published" && started ? actBtn("stop", "Kết thúc sự kiện", "finish", e.id) : "",
    ["published", "pending"].includes(s) ? actBtn("ban", "Hủy sự kiện", "cancel-evt", e.id, "danger") : "",
    ["draft", "rejected"].includes(s) ? actBtn("trash", "Xóa", "delete", e.id, "danger") : "",
  ].join("");

  return `
    <tr>
      <td>
        ${evtCell(e)}
        ${s === "rejected" ? `<div class="reason">${icon("x-circle", 14)}<span><strong>Lý do từ chối:</strong> ${escapeHtml(e.rejectReason)}</span></div>` : ""}
        ${rejectedBooking ? `<div class="reason">${icon("door", 14)}<span><strong>Phòng bị từ chối:</strong> ${escapeHtml(rejectedBooking.reason)} — hãy chọn phòng khác.</span></div>` : ""}
        ${s === "cancelled" ? `<div class="reason warn">${icon("ban", 14)}<span>${escapeHtml(e.cancelReason)}</span></div>` : ""}
      </td>
      ${timeCell(e)}
      ${seatsCell(e)}
      <td>${statusBadge(s)}${booking ? `<div class="row-sub">${bookingBadge(booking)}</div>` : ""}</td>
      <td><div class="row-actions">${acts}</div></td>
    </tr>`;
}

/* ---- Form tạo / sửa sự kiện --------------------------------------------- */
function toDTInput(s) {
  return s || "";
}

function openEventForm(evt) {
  const isAdmin = DASH_SESSION.role === "admin";
  const status = evt ? evt.status : "draft";
  const canDraft = ["draft", "rejected"].includes(status);
  const regCount = evt ? RegService.byEvent(evt.id).filter((r) => r.status === "registered").length : 0;
  const format = evt ? evt.format : "offline";
  const rooms = RoomStore.getAll();
  const v = (k, d = "") => escapeHtml(evt ? evt[k] ?? d : d);

  const REQ = `<span class="req" aria-hidden="true">*</span>`;
  const body = `
    ${status === "rejected" ? `<div class="notice notice-error">${icon("x-circle", 18)}<span><strong>Lý do bị từ chối:</strong> ${escapeHtml(evt.rejectReason)}</span></div>` : ""}
    ${status === "published" ? `<div class="notice notice-warn">${icon("alert", 18)}<span>Sự kiện đang công khai. Nếu đổi thời gian hoặc địa điểm, hệ thống sẽ tự gửi thông báo tới <strong>${regCount}</strong> sinh viên đã đăng ký.</span></div>` : ""}
    <p class="field-hint" style="margin:0 0 16px">Các trường có dấu ${REQ} là bắt buộc khi gửi duyệt. Bản nháp chỉ cần tên sự kiện.</p>

    <fieldset class="form-section">
      <legend>Thông tin chung</legend>
      <div class="form-grid">
        <div class="field span-2">
          <label for="ef-title">Tên sự kiện ${REQ}</label>
          <input type="text" id="ef-title" required value="${v("title")}" placeholder="Ví dụ: Workshop Kỹ năng mềm" />
        </div>
        <div class="field ${isAdmin ? "" : "span-2"}">
          <label for="ef-category">Danh mục ${REQ}</label>
          <select id="ef-category" required>${CategoryStore.getAll().map((c) => `<option value="${c.id}" ${evt && evt.category === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select>
        </div>
        ${isAdmin
          ? `<div class="field"><label for="ef-unit">Đơn vị tổ chức ${REQ}</label>
              <select id="ef-unit" required>${UnitStore.getAll().map((u) => `<option value="${u.id}" ${evt && evt.unitId === u.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`).join("")}</select></div>`
          : ""}
        <div class="field span-2">
          <label for="ef-short">Mô tả ngắn ${REQ}</label>
          <input type="text" id="ef-short" required maxlength="160" value="${v("shortDesc")}" aria-describedby="ef-short-hint" />
          <p class="field-hint" id="ef-short-hint">Một câu tóm tắt, hiển thị trên thẻ sự kiện (tối đa 160 ký tự).</p>
        </div>
        <div class="field span-2">
          <label for="ef-full">Mô tả chi tiết ${REQ}</label>
          <textarea id="ef-full" required placeholder="Nội dung, thể lệ, đối tượng tham gia...">${v("fullDesc")}</textarea>
        </div>
        <div class="field span-2">
          <label for="ef-cover">Ảnh bìa (đường dẫn, không bắt buộc)</label>
          <input type="url" id="ef-cover" value="${v("cover")}" placeholder="https://..." aria-describedby="ef-cover-hint" />
          <p class="field-hint" id="ef-cover-hint">Ảnh tỷ lệ 16:9 mà đơn vị có quyền sử dụng. Để trống sẽ dùng ảnh minh họa theo danh mục.</p>
        </div>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend>Thời gian</legend>
      <div class="form-grid">
        <div class="field">
          <label for="ef-start">Bắt đầu ${REQ}</label>
          <input type="datetime-local" id="ef-start" required value="${toDTInput(evt && evt.start)}" />
        </div>
        <div class="field">
          <label for="ef-end">Kết thúc ${REQ}</label>
          <input type="datetime-local" id="ef-end" required value="${toDTInput(evt && evt.end)}" />
        </div>
        <div class="field span-2">
          <label for="ef-deadline">Hạn đăng ký ${REQ}</label>
          <input type="datetime-local" id="ef-deadline" required value="${toDTInput(evt && evt.deadline)}" aria-describedby="ef-deadline-hint" />
          <p class="field-hint" id="ef-deadline-hint">Phải trước giờ bắt đầu. Sinh viên chỉ hủy đăng ký được trước thời điểm này.</p>
        </div>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend>Hình thức & địa điểm</legend>
      <div class="field">
        <span class="field-label" id="ef-format-label">Hình thức ${REQ}</span>
        <div class="radio-cards" role="radiogroup" aria-labelledby="ef-format-label">
          <label class="radio-card"><input type="radio" name="ef-format" value="offline" ${format === "offline" ? "checked" : ""}/> ${icon("map-pin", 18)} Trực tiếp</label>
          <label class="radio-card"><input type="radio" name="ef-format" value="online" ${format === "online" ? "checked" : ""}/> ${icon("monitor", 18)} Trực tuyến</label>
        </div>
      </div>
      <div class="field" id="ef-room-wrap">
        <label for="ef-room">Phòng ${REQ}</label>
        <select id="ef-room" aria-describedby="ef-room-hint">
          ${rooms.map((r) => `<option value="${r.id}" ${evt && evt.roomId === r.id ? "selected" : ""}>${escapeHtml(r.name)} — sức chứa ${r.capacity}</option>`).join("")}
          <option value="" ${evt && !evt.roomId && evt.format === "offline" ? "selected" : ""}>Địa điểm khác (không cần mượn phòng)</option>
        </select>
        <p class="field-hint" id="ef-room-hint">Chọn phòng sẽ tự gửi yêu cầu mượn phòng tới Phòng Quản trị thiết bị.</p>
      </div>
      <div class="field" id="ef-location-wrap">
        <label for="ef-location" id="ef-location-label">Địa điểm</label>
        <input type="text" id="ef-location" value="${evt && !evt.roomId ? v("location") : ""}" placeholder="Ví dụ: Sảnh Nhà A1" />
      </div>
      <div class="field" id="ef-url-wrap">
        <label for="ef-url">Đường dẫn tham gia trực tuyến ${REQ}</label>
        <input type="url" id="ef-url" value="${v("onlineUrl")}" placeholder="https://meet.google.com/..." aria-describedby="ef-url-hint" />
        <p class="field-hint" id="ef-url-hint">Chỉ hiển thị cho sinh viên đã đăng ký.</p>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend>Đăng ký & liên hệ</legend>
      <div class="form-grid">
        <div class="field">
          <label for="ef-capacity">Số lượng tối đa ${REQ}</label>
          <input type="number" id="ef-capacity" min="1" required value="${v("capacity", "100")}" inputmode="numeric" />
        </div>
        <div class="field">
          <label for="ef-contact">Liên hệ ${REQ}</label>
          <input type="text" id="ef-contact" required value="${v("contact", isAdmin ? "" : getUnit(DASH_SESSION.unitId).email || "")}" placeholder="email@neu.edu.vn" />
        </div>
        ${isAdmin ? `<div class="field span-2"><label class="check-line"><input type="checkbox" id="ef-featured" ${evt && evt.featured ? "checked" : ""}/> Ghim vào mục Sự kiện nổi bật trên trang chủ</label></div>` : ""}
      </div>
    </fieldset>`;

  const read = (form) => {
    const val = (id) => (form.querySelector("#" + id) ? form.querySelector("#" + id).value.trim() : "");
    const fmt = form.querySelector('input[name="ef-format"]:checked').value;
    const roomId = fmt === "offline" ? val("ef-room") || null : null;
    return {
      id: evt ? evt.id : undefined,
      title: val("ef-title"),
      category: val("ef-category"),
      unitId: isAdmin ? val("ef-unit") : evt ? evt.unitId : DASH_SESSION.unitId,
      format: fmt,
      roomId,
      location: fmt === "online" ? val("ef-location") || "Trực tuyến" : roomId ? "" : val("ef-location"),
      onlineUrl: fmt === "online" ? val("ef-url") : "",
      start: val("ef-start"),
      end: val("ef-end"),
      deadline: val("ef-deadline"),
      capacity: +val("ef-capacity"),
      contact: val("ef-contact"),
      shortDesc: val("ef-short"),
      fullDesc: val("ef-full"),
      cover: val("ef-cover"),
      ...(isAdmin ? { featured: form.querySelector("#ef-featured").checked } : {}),
    };
  };

  const save = (form, submit) => {
    if (submit || !canDraft) {
      const invalid = formValidationError(form);
      if (invalid) return invalid;
    }
    const r = EventService.save(DASH_SESSION, read(form), submit);
    if (!r.ok) return r.error;
    showToast(submit && canDraft ? "Đã gửi duyệt sự kiện. Quản trị viên / Đoàn trường sẽ xem xét." : evt ? "Đã lưu thay đổi." : "Đã lưu bản nháp.");
    refresh();
  };

  openModal({
    title: evt ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới",
    wide: true,
    body,
    submitLabel: canDraft ? `${icon("send", 18)} Gửi duyệt` : "Lưu thay đổi",
    extraActions: canDraft ? [{ label: "Lưu nháp", cls: "btn-outline", onClick: (form) => save(form, false) }] : [],
    onSubmit: (form) => save(form, true),
    onOpen: (form) => {
      const sync = () => {
        const fmt = form.querySelector('input[name="ef-format"]:checked').value;
        const roomId = form.querySelector("#ef-room").value;
        form.querySelector("#ef-room-wrap").hidden = fmt !== "offline";
        form.querySelector("#ef-url-wrap").hidden = fmt !== "online";
        form.querySelector("#ef-location-wrap").hidden = fmt === "offline" && roomId !== "";
        form.querySelector("#ef-location-label").textContent = fmt === "online" ? "Nền tảng" : "Địa điểm";
        form.querySelector("#ef-location").placeholder = fmt === "online" ? "Ví dụ: Google Meet, Zoom" : "Ví dụ: Sảnh Nhà A1";
        form.querySelector("#ef-url").required = fmt === "online";
        const room = roomId ? getRoom(roomId) : null;
        const cap = +form.querySelector("#ef-capacity").value;
        form.querySelector("#ef-room-hint").textContent =
          room && cap > room.capacity
            ? `Lưu ý: số lượng tối đa (${cap}) vượt sức chứa của phòng (${room.capacity}).`
            : "Chọn phòng sẽ tự gửi yêu cầu mượn phòng tới Phòng Quản trị thiết bị.";
      };
      form.querySelectorAll('input[name="ef-format"], #ef-room, #ef-capacity').forEach((el) => el.addEventListener("input", sync));
      form.querySelectorAll('input[name="ef-format"]').forEach((el) => el.addEventListener("change", sync));
      sync();
    },
  });
}

/* ---- Đăng ký & điểm danh ------------------------------------------------ */
function renderAttendance(main) {
  const isAdmin = DASH_SESSION.role === "admin";
  const events = EventStore.where((e) => ["published", "ended"].includes(e.status) && (isAdmin || e.unitId === DASH_SESSION.unitId)).sort((a, b) => {
    // Ưu tiên sự kiện đang diễn ra / sắp tới, sau đó đến sự kiện đã kết thúc
    if (a.status !== b.status) return a.status === "published" ? -1 : 1;
    return a.status === "published" ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start);
  });

  if (!events.length) {
    main.innerHTML = headHtml("Đăng ký & điểm danh", "Theo dõi danh sách đăng ký và điểm danh tại sự kiện.") +
      emptyStateHtml("clipboard-check", "Chưa có sự kiện đã đăng", "Danh sách đăng ký xuất hiện khi sự kiện được duyệt.");
    return;
  }
  if (!events.some((e) => e.id === DASH_STATE.attendanceEvent)) {
    const ongoing = events.find((e) => e.status === "published" && nowDT() >= e.start);
    DASH_STATE.attendanceEvent = (ongoing || events[0]).id;
  }
  const evt = EventStore.getById(DASH_STATE.attendanceEvent);
  const regs = RegService.byEvent(evt.id).sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  const active = regs.filter((r) => r.status !== "cancelled");
  const attended = regs.filter((r) => r.status === "attended").length;
  const canCheck = RegService.canCheckIn(evt);
  const q = DASH_STATE.attQuery.toLowerCase();

  const rows = regs
    .map((r) => ({ r, u: UserStore.getById(r.studentId) || { name: "(đã xóa)", studentCode: "", classInfo: "", email: "" } }))
    .filter(({ r, u }) => DASH_STATE.attStatus === "all" || r.status === DASH_STATE.attStatus)
    .filter(({ r, u }) => !q || u.name.toLowerCase().includes(q) || (u.studentCode || "").includes(q) || r.code.toLowerCase().includes(q));

  main.innerHTML = `
    ${headHtml("Đăng ký & điểm danh", "Xem danh sách đăng ký, điểm danh thủ công hoặc quét mã vé, xuất danh sách.")}

    <div class="dash-toolbar">
      <label for="att-event" class="tb-label">Sự kiện</label>
      <select id="att-event" class="select grow">
        ${events.map((e) => `<option value="${e.id}" ${e.id === evt.id ? "selected" : ""}>${e.status === "ended" ? "[Đã kết thúc] " : nowDT() >= e.start ? "[Đang diễn ra] " : ""}${escapeHtml(e.title)} — ${formatDateShort(e.start)}</option>`).join("")}
      </select>
      <button class="btn btn-ghost btn-sm" data-act="view" data-id="${evt.id}">${icon("eye", 15)} Xem trang</button>
      ${evt.status === "published" && nowDT() >= evt.start ? `<button class="btn btn-outline btn-sm" data-act="finish" data-id="${evt.id}">${icon("stop", 15)} Kết thúc sự kiện</button>` : ""}
    </div>

    <div class="mini-stats">
      <div class="mini-stat"><div class="num">${active.length}<small>/${evt.capacity}</small></div><div class="lbl">Đã đăng ký</div></div>
      <div class="mini-stat ok"><div class="num">${attended}</div><div class="lbl">Đã điểm danh</div></div>
      <div class="mini-stat"><div class="num">${evt.status === "ended" ? regs.filter((r) => r.status === "absent").length : active.length - attended}</div><div class="lbl">${evt.status === "ended" ? "Vắng mặt" : "Chưa điểm danh"}</div></div>
      <div class="mini-stat"><div class="num">${active.length ? Math.round((attended / active.length) * 100) : 0}%</div><div class="lbl">Tỷ lệ tham dự</div></div>
    </div>

    ${canCheck
      ? `<div class="scan-box">
          <div class="scan-ico">${icon("qr", 26)}</div>
          <div>
            <form id="scan-form">
              <input id="scan-input" placeholder="Quét hoặc nhập mã vé, ví dụ NEU-OLY001" autocomplete="off" aria-label="Mã vé" />
              <button class="btn btn-success" type="submit">${icon("check", 18)} Điểm danh</button>
              <button class="btn btn-ghost" type="button" id="btn-sim-scan" title="Mô phỏng máy quét đọc mã QR của một sinh viên chưa điểm danh">Mô phỏng quét QR</button>
            </form>
            <p>Máy quét QR hoạt động như bàn phím: đặt con trỏ vào ô và quét vé, hệ thống tự điểm danh khi nhận mã.</p>
            <div class="scan-result" id="scan-result" role="status"></div>
          </div>
        </div>`
      : `<div class="notice">${icon("info", 16)}<span>${evt.status === "ended" ? "Sự kiện đã kết thúc — danh sách điểm danh đã được chốt." : `Điểm danh mở từ 60 phút trước giờ bắt đầu (${fmtDT(evt.start)}).`}</span></div>`}

    <div class="dash-toolbar">
      <input type="search" id="att-search" placeholder="Tìm theo tên, mã sinh viên, mã vé..." value="${escapeHtml(DASH_STATE.attQuery)}" />
      <label for="att-status" class="sr-only">Trạng thái phiếu</label>
      <select id="att-status" class="select">
        <option value="all">Tất cả trạng thái</option>
        ${Object.keys(REG_STATUS_META).map((s) => `<option value="${s}" ${DASH_STATE.attStatus === s ? "selected" : ""}>${REG_STATUS_META[s].label}</option>`).join("")}
      </select>
      <button class="btn btn-outline btn-sm" id="btn-export">${icon("download", 15)} Xuất danh sách (CSV)</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>#</th><th>Sinh viên</th><th>Lớp</th><th>Mã vé</th><th>Đăng ký lúc</th><th>Trạng thái</th><th>Điểm danh</th></tr></thead>
        <tbody>
          ${rows.length
            ? rows
                .map(({ r, u }, i) => `
              <tr>
                <td class="num-cell">${i + 1}</td>
                <td><div class="row-title">${escapeHtml(u.name)}</div><div class="row-sub">${escapeHtml(u.studentCode)} · ${escapeHtml(u.email)}</div></td>
                <td class="muted">${escapeHtml(u.classInfo)}</td>
                <td class="num-cell">${r.code}</td>
                <td class="num-cell">${fmtDT(r.registeredAt)}</td>
                <td>${regStatusBadge(r.status)}</td>
                <td>${canCheck && ["registered", "attended"].includes(r.status)
                  ? `<label class="att-toggle"><input type="checkbox" data-att="${r.id}" ${r.status === "attended" ? "checked" : ""}/> ${r.checkinAt ? fmtTime(r.checkinAt) : "Có mặt"}</label>`
                  : `<span class="num-cell">${r.checkinAt ? fmtTime(r.checkinAt) : "—"}</span>`}</td>
              </tr>`)
                .join("")
            : emptyRow(7, "Không có phiếu đăng ký phù hợp.")}
        </tbody>
      </table>
    </div>`;

  document.getElementById("att-event").addEventListener("change", (e) => {
    DASH_STATE.attendanceEvent = e.target.value;
    renderShell();
  });
  const search = document.getElementById("att-search");
  search.addEventListener("input", () => {
    DASH_STATE.attQuery = search.value;
    renderShell();
    const s = document.getElementById("att-search");
    s.focus();
    s.setSelectionRange(s.value.length, s.value.length);
  });
  document.getElementById("att-status").addEventListener("change", (e) => {
    DASH_STATE.attStatus = e.target.value;
    renderShell();
  });
  main.querySelectorAll("[data-att]").forEach((cb) =>
    cb.addEventListener("change", () => {
      const r = RegService.setAttendance(DASH_SESSION, cb.dataset.att, cb.checked);
      if (!r.ok) showToast(r.error);
      renderShell();
    })
  );

  document.getElementById("btn-export").addEventListener("click", () => {
    const header = ["STT", "Họ tên", "Mã sinh viên", "Lớp", "Khoa/Viện", "Email", "Số điện thoại", "Mã vé", "Ngày đăng ký", "Trạng thái", "Thời gian điểm danh"];
    const data = regs.map((r, i) => {
      const u = UserStore.getById(r.studentId) || {};
      return [i + 1, u.name, u.studentCode, u.classInfo, u.faculty, u.email, u.phone, r.code, fmtDT(r.registeredAt), REG_STATUS_META[r.status].label, fmtDT(r.checkinAt)];
    });
    downloadCsv(`dang-ky_${evt.id}.csv`, [[evt.title], [`Thời gian: ${fmtDT(evt.start)} – ${fmtDT(evt.end)}`], [], header, ...data]);
    showToast("Đã xuất danh sách đăng ký.");
  });

  if (canCheck) {
    const input = document.getElementById("scan-input");
    const out = document.getElementById("scan-result");
    const doScan = (code) => {
      const r = RegService.checkInByCode(DASH_SESSION, evt.id, code);
      if (!r.ok) {
        out.className = "scan-result err";
        out.textContent = r.error;
        input.select();
        return;
      }
      renderShell();
      const res = document.getElementById("scan-result");
      res.className = "scan-result ok";
      res.textContent = `Đã điểm danh: ${r.data.name} (${r.data.studentCode}) lúc ${fmtTime(nowDT())}.`;
      document.getElementById("scan-input").focus();
    };
    document.getElementById("scan-form").addEventListener("submit", (e) => {
      e.preventDefault();
      doScan(input.value);
    });
    document.getElementById("btn-sim-scan").addEventListener("click", () => {
      const next = regs.find((r) => r.status === "registered");
      if (!next) {
        out.className = "scan-result err";
        out.textContent = "Tất cả sinh viên đã được điểm danh.";
        return;
      }
      input.value = next.code;
      doScan(next.code);
    });
    if (!DASH_STATE.attQuery) input.focus();
  }
}

/* ---- Mượn phòng (Ban tổ chức) ------------------------------------------- */
function renderOrgBookings(main) {
  const list = BookingStore.where((b) => b.unitId === DASH_SESSION.unitId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  main.innerHTML = `
    ${headHtml("Mượn phòng", "Yêu cầu mượn phòng được tạo tự động khi sự kiện trực tiếp chọn phòng và gửi duyệt.")}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Phòng</th><th>Sự kiện</th><th>Thời gian sử dụng</th><th>Gửi lúc</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${list.length
            ? list
                .map((b) => {
                  const evt = EventStore.getById(b.eventId);
                  const room = getRoom(b.roomId);
                  return `<tr>
                    <td><div class="row-title">${escapeHtml(room.name)}</div><div class="row-sub">Sức chứa ${room.capacity}</div></td>
                    <td>${evt ? escapeHtml(evt.title) : "—"}</td>
                    <td class="num-cell">${fmtDT(b.start)}<br/>→ ${fmtDT(b.end)}</td>
                    <td class="num-cell">${fmtDT(b.createdAt)}</td>
                    <td>${bookingBadge(b)}${b.reason ? `<div class="reason">${escapeHtml(b.reason)}</div>` : ""}</td>
                  </tr>`;
                })
                .join("")
            : emptyRow(5, "Chưa có yêu cầu mượn phòng nào.")}
        </tbody>
      </table>
    </div>`;
}

/* ---- Hồ sơ đơn vị ------------------------------------------------------- */
function renderUnitProfile(main) {
  const unit = getUnit(DASH_SESSION.unitId);
  const members = UserStore.where((u) => u.role === "organizer" && u.unitId === unit.id);
  main.innerHTML = `
    ${headHtml("Hồ sơ đơn vị", "Thông tin hiển thị trên trang chi tiết các sự kiện của đơn vị.")}
    <div class="profile-layout">
      <div class="panel profile-card">
        <span class="icon-cell">${icon(unit.logo, 34)}</span>
        <h2>${escapeHtml(unit.name)}</h2>
        <div class="sub">${escapeHtml(unit.type)}</div>
        <div class="kv">
          <div class="kv-row"><span>Mã đơn vị</span><span>${unit.id}</span></div>
          <div class="kv-row"><span>Sự kiện</span><span>${EventStore.where((e) => e.unitId === unit.id).length}</span></div>
          <div class="kv-row"><span>Thành viên BTC</span><span>${members.length}</span></div>
        </div>
      </div>
      <div>
        <form class="panel" id="unit-form" aria-labelledby="unit-form-title">
          <h2 id="unit-form-title">Thông tin đơn vị</h2>
          ${unitFieldsHtml(unit, true)}
          <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
        </form>
        <div class="panel">
          <h2>Thành viên Ban tổ chức</h2>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Họ tên</th><th>Chức vụ</th><th>Email</th><th>Điện thoại</th></tr></thead>
            <tbody>${members.map((m) => `<tr><td class="row-title">${escapeHtml(m.name)}</td><td class="muted">${escapeHtml(m.position || "")}</td><td class="num-cell">${escapeHtml(m.email)}</td><td class="num-cell">${escapeHtml(m.phone || "")}</td></tr>`).join("")}</tbody>
          </table></div>
          <p class="field-hint">Tài khoản Ban tổ chức do Quản trị viên cấp. Liên hệ Ban quản trị để thêm thành viên.</p>
        </div>
      </div>
    </div>`;
  document.getElementById("unit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = AdminService.saveUnit({ id: unit.id, ...readUnitFields(e.target, true) });
    result(r, "Đã cập nhật hồ sơ đơn vị.");
  });
}

function iconPickerHtml(name, current) {
  return `<div class="icon-pick">${ICON_CHOICES.map(
    (ic) => `<label title="${ic}"><input type="radio" name="${name}" value="${ic}" ${ic === current ? "checked" : ""}/><span>${icon(ic, 18)}</span></label>`
  ).join("")}</div>`;
}

function unitFieldsHtml(unit, limited) {
  const v = (k) => escapeHtml(unit ? unit[k] || "" : "");
  return `
    <div class="field-row">
      <div class="field"><label for="u-name">Tên đơn vị</label><input id="u-name" required value="${v("name")}" ${limited ? "readonly" : ""}/></div>
      <div class="field"><label for="u-type">Loại đơn vị</label>
        <select id="u-type" ${limited ? "disabled" : ""}>${UNIT_TYPES.map((t) => `<option ${unit && unit.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="u-email">Email liên hệ</label><input id="u-email" type="email" value="${v("email")}"/></div>
      <div class="field"><label for="u-leader">Người phụ trách</label><input id="u-leader" value="${v("leader")}"/></div>
    </div>
    <div class="field"><label>Biểu tượng (logo)</label>${iconPickerHtml("u-logo", unit ? unit.logo : "building")}</div>
    <div class="field"><label for="u-desc">Mô tả</label><textarea id="u-desc">${v("description")}</textarea></div>`;
}

function readUnitFields(form, limited) {
  const val = (id) => form.querySelector("#" + id).value.trim();
  const logo = (form.querySelector('input[name="u-logo"]:checked') || {}).value || "building";
  const data = { email: val("u-email"), leader: val("u-leader"), description: val("u-desc"), logo };
  if (!limited) Object.assign(data, { name: val("u-name"), type: val("u-type") });
  return data;
}

/* ======================================================================
   QUẢN TRỊ VIÊN & ĐOÀN TRƯỜNG: DUYỆT SỰ KIỆN
   ====================================================================== */
function renderPendingQueue(main) {
  const pending = EventStore.where((e) => e.status === "pending").sort((a, b) => (a.submittedAt || "").localeCompare(b.submittedAt || ""));
  const decided = EventStore.where((e) => e.approvedAt && ["published", "rejected", "ended"].includes(e.status))
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
    .slice(0, 8);

  main.innerHTML = `
    ${headHtml("Duyệt sự kiện", "Kiểm tra nội dung trước khi sự kiện hiển thị công khai. Từ chối bắt buộc ghi lý do.")}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Thời gian</th><th>Địa điểm / phòng</th><th>Gửi lúc</th><th>Hành động</th></tr></thead>
        <tbody>
          ${pending.length
            ? pending
                .map((e) => {
                  const booking = BookingService.forEvent(e.id);
                  return `<tr>
                    <td>${evtCell(e, true)}<div class="row-sub">${escapeHtml(e.shortDesc)}</div></td>
                    ${timeCell(e)}
                    <td class="muted">${icon(e.format === "online" ? "monitor" : "map-pin", 14)} ${escapeHtml(e.location)}${booking ? `<div class="row-sub">${bookingBadge(booking)}</div>` : ""}</td>
                    <td class="num-cell">${fmtDT(e.submittedAt)}</td>
                    <td><div class="row-actions">
                      ${actBtn("eye", "Xem chi tiết", "view", e.id)}
                      ${actBtn("check", "Duyệt", "approve", e.id, "ok")}
                      ${actBtn("x", "Từ chối", "reject", e.id, "danger")}
                    </div></td>
                  </tr>`;
                })
                .join("")
            : emptyRow(5, "Không có sự kiện nào đang chờ duyệt.")}
        </tbody>
      </table>
    </div>

    <h2 class="section-title">Lịch sử duyệt gần đây</h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Kết quả</th><th>Người xử lý</th><th>Thời điểm</th></tr></thead>
        <tbody>
          ${decided.length
            ? decided
                .map((e) => {
                  const by = UserStore.getById(e.approverId);
                  return `<tr>
                    <td>${evtCell(e, true)}${e.status === "rejected" ? `<div class="reason">${escapeHtml(e.rejectReason)}</div>` : ""}</td>
                    <td>${e.status === "rejected" ? statusBadge("rejected") : `<span class="badge status-published">Đã duyệt</span>`}</td>
                    <td class="muted">${by ? escapeHtml(by.name) : "—"}</td>
                    <td class="num-cell">${fmtDT(e.approvedAt)}</td>
                  </tr>`;
                })
                .join("")
            : emptyRow(4, "Chưa có lịch sử.")}
        </tbody>
      </table>
    </div>`;
}

/* ---- Admin: tất cả sự kiện ---------------------------------------------- */
function renderAllEvents(main) {
  const q = DASH_STATE.q.toLowerCase();
  const list = EventStore.getAll()
    .filter((e) => !DASH_STATE.statusFilter || e.status === DASH_STATE.statusFilter)
    .filter((e) => !DASH_STATE.unitFilter || e.unitId === DASH_STATE.unitFilter)
    .filter((e) => !q || e.title.toLowerCase().includes(q))
    .sort((a, b) => b.start.localeCompare(a.start));

  main.innerHTML = `
    ${headHtml("Tất cả sự kiện", `Quản lý toàn bộ ${EventStore.getAll().length} sự kiện trong hệ thống, gỡ sự kiện vi phạm.`,
      `<button class="btn btn-primary" id="btn-new-event">${icon("plus", 16)} Tạo sự kiện</button>`)}
    <div class="dash-toolbar">
      <input type="search" id="f-q" placeholder="Tìm theo tên sự kiện..." value="${escapeHtml(DASH_STATE.q)}" />
      <label for="f-status" class="sr-only">Trạng thái</label>
      <select id="f-status" class="select"><option value="">Mọi trạng thái</option>${Object.keys(STATUS_META).map((s) => `<option value="${s}" ${DASH_STATE.statusFilter === s ? "selected" : ""}>${STATUS_META[s].label}</option>`).join("")}</select>
      <label for="f-unit" class="sr-only">Đơn vị</label>
      <select id="f-unit" class="select"><option value="">Mọi đơn vị</option>${UnitStore.getAll().map((u) => `<option value="${u.id}" ${DASH_STATE.unitFilter === u.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`).join("")}</select>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Thời gian</th><th>Đăng ký</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          ${list.length
            ? list
                .map((e) => `<tr>
                  <td>${evtCell(e, true)}${e.status === "removed" ? `<div class="reason">${escapeHtml(e.removeReason)}</div>` : ""}</td>
                  ${timeCell(e)}
                  ${seatsCell(e)}
                  <td>${statusBadge(e.status)}${e.featured ? `<div class="row-sub">${icon("star", 14)} Nổi bật</div>` : ""}</td>
                  <td><div class="row-actions">
                    ${actBtn("eye", "Xem", "view", e.id)}
                    ${["draft", "rejected", "pending", "published"].includes(e.status) ? actBtn("edit", "Sửa", "edit", e.id) : ""}
                    ${e.status === "pending" ? actBtn("check", "Duyệt", "approve", e.id, "ok") + actBtn("x", "Từ chối", "reject", e.id, "danger") : ""}
                    ${["published", "ended"].includes(e.status) ? actBtn("users", "Danh sách đăng ký", "regs", e.id) : ""}
                    ${e.status === "published" ? actBtn("shield", "Gỡ sự kiện vi phạm", "remove", e.id, "danger") : ""}
                    ${["draft", "rejected", "cancelled", "removed"].includes(e.status) ? actBtn("trash", "Xóa vĩnh viễn", "delete", e.id, "danger") : ""}
                  </div></td>
                </tr>`)
                .join("")
            : emptyRow(5, "Không có sự kiện phù hợp.")}
        </tbody>
      </table>
    </div>`;

  document.getElementById("btn-new-event").addEventListener("click", () => openEventForm(null));
  bindFilter("f-q", "q", "input");
  bindFilter("f-status", "statusFilter");
  bindFilter("f-unit", "unitFilter");
}

function bindFilter(elId, key, evtName = "change") {
  const el = document.getElementById(elId);
  el.addEventListener(evtName, () => {
    DASH_STATE[key] = el.value;
    renderShell();
    if (evtName === "input") {
      const again = document.getElementById(elId);
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    }
  });
}

/* ---- Admin: tài khoản --------------------------------------------------- */
function renderAccounts(main) {
  const q = DASH_STATE.q.toLowerCase();
  const list = UserStore.getAll()
    .filter((u) => !DASH_STATE.roleFilter || u.role === DASH_STATE.roleFilter)
    .filter((u) => !DASH_STATE.statusFilter || u.status === DASH_STATE.statusFilter)
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.studentCode || "").includes(q));
  const counts = Object.keys(ROLE_META).map((r) => `${ROLE_META[r].label}: ${UserStore.where((u) => u.role === r).length}`).join(" · ");

  main.innerHTML = `
    ${headHtml("Tài khoản", counts, `<button class="btn btn-primary" id="btn-new-user">${icon("user-plus", 16)} Tạo tài khoản</button>`)}
    <div class="dash-toolbar">
      <input type="search" id="f-q" placeholder="Tìm theo tên, email, mã sinh viên..." value="${escapeHtml(DASH_STATE.q)}" />
      <label for="f-role" class="sr-only">Vai trò</label>
      <select id="f-role" class="select"><option value="">Mọi vai trò</option>${Object.keys(ROLE_META).map((r) => `<option value="${r}" ${DASH_STATE.roleFilter === r ? "selected" : ""}>${ROLE_META[r].label}</option>`).join("")}</select>
      <label for="f-status" class="sr-only">Trạng thái</label>
      <select id="f-status" class="select"><option value="">Mọi trạng thái</option><option value="active" ${DASH_STATE.statusFilter === "active" ? "selected" : ""}>Hoạt động</option><option value="locked" ${DASH_STATE.statusFilter === "locked" ? "selected" : ""}>Bị khóa</option></select>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Người dùng</th><th>Vai trò (phân quyền)</th><th>Trạng thái</th><th>Ngày tạo</th><th></th></tr></thead>
        <tbody>
          ${list.length
            ? list
                .map((u) => {
                  const self = u.id === DASH_SESSION.id;
                  return `<tr>
                    <td><div class="user-cell">${avatarHtml(u, 34)}<div><div class="row-title">${escapeHtml(u.name)}${self ? " (bạn)" : ""}</div><div class="row-sub">${escapeHtml(u.email)}${u.studentCode ? " · " + u.studentCode : ""}</div></div></div></td>
                    <td>
                      <select class="inline-select" data-role-of="${u.id}" ${self ? "disabled" : ""} aria-label="Vai trò của ${escapeHtml(u.name)}">${Object.keys(ROLE_META).map((r) => `<option value="${r}" ${u.role === r ? "selected" : ""}>${ROLE_META[r].label}</option>`).join("")}</select>
                      ${u.role === "organizer" ? `<div class="row-sub">${escapeHtml(getUnit(u.unitId).name)}</div>` : ""}
                    </td>
                    <td>${u.status === "active" ? `<span class="badge status-published">Hoạt động</span>` : `<span class="badge status-rejected">Bị khóa</span>`}</td>
                    <td class="num-cell">${fmtDT(u.createdAt).slice(0, 10)}</td>
                    <td><div class="row-actions">${self ? "" : (u.status === "active" ? actBtn("lock", "Khóa tài khoản", "lock", u.id, "danger") : actBtn("unlock", "Mở khóa", "unlock", u.id, "ok")) + actBtn("trash", "Xóa tài khoản", "delete-user", u.id, "danger")}</div></td>
                  </tr>`;
                })
                .join("")
            : emptyRow(5, "Không có tài khoản phù hợp.")}
        </tbody>
      </table>
    </div>`;

  bindFilter("f-q", "q", "input");
  bindFilter("f-role", "roleFilter");
  bindFilter("f-status", "statusFilter");
  document.getElementById("btn-new-user").addEventListener("click", openAccountForm);
  main.querySelectorAll("[data-role-of]").forEach((sel) =>
    sel.addEventListener("change", () => {
      const userId = sel.dataset.roleOf;
      if (sel.value !== "organizer") return result(AdminService.setRole(DASH_SESSION, userId, sel.value), "Đã cập nhật vai trò.");
      openModal({
        title: "Gắn tài khoản với đơn vị",
        submitLabel: "Lưu phân quyền",
        body: `<div class="field"><label for="role-unit">Đơn vị tổ chức</label><select id="role-unit">${UnitStore.getAll().map((u) => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("")}</select></div>`,
        onSubmit: (form) => {
          const r = AdminService.setRole(DASH_SESSION, userId, "organizer", form.querySelector("#role-unit").value);
          if (!r.ok) return r.error;
          result(r, "Đã chuyển sang vai trò Ban tổ chức.");
        },
      });
      sel.value = UserStore.getById(userId).role;
    })
  );
}

function openAccountForm() {
  openModal({
    title: "Tạo tài khoản",
    submitLabel: "Tạo tài khoản",
    body: `
      <div class="field"><label for="a-name">Họ tên</label><input id="a-name" required/></div>
      <div class="field-row">
        <div class="field"><label for="a-email">Email</label><input id="a-email" type="email" required/></div>
        <div class="field"><label for="a-password">Mật khẩu ban đầu</label><input id="a-password" required minlength="6" value="123456"/></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="a-role">Vai trò</label><select id="a-role">${Object.keys(ROLE_META).map((r) => `<option value="${r}" ${r === "organizer" ? "selected" : ""}>${ROLE_META[r].label}</option>`).join("")}</select></div>
        <div class="field"><label for="a-phone">Số điện thoại</label><input id="a-phone" type="tel"/></div>
      </div>
      <div class="field-row" id="a-org">
        <div class="field"><label for="a-unit">Đơn vị</label><select id="a-unit">${UnitStore.getAll().map((u) => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="a-position">Chức vụ</label><input id="a-position" placeholder="Chủ nhiệm CLB"/></div>
      </div>
      <div class="field-row" id="a-stu" hidden>
        <div class="field"><label for="a-code">Mã sinh viên</label><input id="a-code"/></div>
        <div class="field"><label for="a-class">Lớp</label><input id="a-class"/></div>
      </div>`,
    onOpen: (form) => {
      const sync = () => {
        const role = form.querySelector("#a-role").value;
        form.querySelector("#a-org").hidden = role !== "organizer";
        form.querySelector("#a-stu").hidden = role !== "student";
      };
      form.querySelector("#a-role").addEventListener("change", sync);
      sync();
    },
    onSubmit: (form) => {
      const val = (id) => form.querySelector("#" + id).value.trim();
      const role = val("a-role");
      const data = { name: val("a-name"), email: val("a-email"), password: val("a-password"), role, phone: val("a-phone") };
      if (role === "organizer") Object.assign(data, { unitId: val("a-unit"), position: val("a-position") });
      if (role === "student") Object.assign(data, { studentCode: val("a-code"), classInfo: val("a-class") });
      const r = AdminService.createAccount(DASH_SESSION, data);
      if (!r.ok) return r.error;
      result(r, `Đã tạo tài khoản ${data.email}.`);
    },
  });
}

/* ---- Admin: đơn vị tổ chức ---------------------------------------------- */
function renderUnits(main) {
  const units = UnitStore.getAll();
  main.innerHTML = `
    ${headHtml("Đơn vị tổ chức", "CLB, Viện, Khoa, Phòng ban và tổ chức Đoàn - Hội được phép đăng sự kiện.",
      `<button class="btn btn-primary" id="btn-new-unit">${icon("plus", 16)} Thêm đơn vị</button>`)}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Đơn vị</th><th>Loại</th><th>Liên hệ</th><th>Sự kiện</th><th>Tài khoản BTC</th><th></th></tr></thead>
        <tbody>
          ${units
            .map((u) => `<tr>
              <td><div class="user-cell"><span class="icon-cell">${icon(u.logo, 18)}</span><div><div class="row-title">${escapeHtml(u.name)}</div><div class="row-sub">${escapeHtml(u.leader || "")}</div></div></div></td>
              <td class="muted">${escapeHtml(u.type)}</td>
              <td class="num-cell">${escapeHtml(u.email || "")}</td>
              <td class="num-cell">${EventStore.where((e) => e.unitId === u.id).length}</td>
              <td class="num-cell">${UserStore.where((x) => x.unitId === u.id).length}</td>
              <td><div class="row-actions">${actBtn("edit", "Sửa", "edit-unit", u.id)}${actBtn("trash", "Xóa", "delete-unit", u.id, "danger")}</div></td>
            </tr>`)
            .join("")}
        </tbody>
      </table>
    </div>`;
  document.getElementById("btn-new-unit").addEventListener("click", () => openUnitForm(null));
}

function openUnitForm(unit) {
  openModal({
    title: unit ? "Sửa đơn vị" : "Thêm đơn vị tổ chức",
    submitLabel: "Lưu",
    body: unitFieldsHtml(unit, false),
    onSubmit: (form) => {
      const r = AdminService.saveUnit({ ...(unit ? { id: unit.id } : {}), ...readUnitFields(form, false) });
      if (!r.ok) return r.error;
      result(r, "Đã lưu đơn vị.");
    },
  });
}

/* ---- Admin: danh mục sự kiện -------------------------------------------- */
function renderCategories(main) {
  const cats = CategoryStore.getAll();
  main.innerHTML = `
    ${headHtml("Danh mục sự kiện", "Phân loại sự kiện: học thuật, hướng nghiệp, văn nghệ, thể thao, tình nguyện...",
      `<button class="btn btn-primary" id="btn-new-cat">${icon("plus", 16)} Thêm danh mục</button>`)}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Danh mục</th><th>Mô tả</th><th>Sự kiện</th><th></th></tr></thead>
        <tbody>
          ${cats
            .map((c) => `<tr>
              <td>${categoryBadge(c.id)}<div class="row-sub">Mã: ${c.id}</div></td>
              <td class="muted">${escapeHtml(c.description || "")}</td>
              <td class="num-cell">${EventStore.where((e) => e.category === c.id).length}</td>
              <td><div class="row-actions">${actBtn("edit", "Sửa", "edit-cat", c.id)}${actBtn("trash", "Xóa", "delete-cat", c.id, "danger")}</div></td>
            </tr>`)
            .join("")}
        </tbody>
      </table>
    </div>`;
  document.getElementById("btn-new-cat").addEventListener("click", () => openCategoryForm(null));
}

function openCategoryForm(cat) {
  const colorNames = { crimson: "Hồng", "crimson-dark": "Đỏ", teal: "Xanh ngọc", gold: "Hổ phách", navy: "Xanh navy", slate: "Xám" };
  openModal({
    title: cat ? "Sửa danh mục" : "Thêm danh mục",
    submitLabel: "Lưu",
    body: `
      <div class="field-row">
        <div class="field"><label for="c-name">Tên danh mục</label><input id="c-name" required value="${escapeHtml(cat ? cat.name : "")}"/></div>
        <div class="field"><label for="c-color">Màu ảnh minh họa</label><select id="c-color">${CATEGORY_COLORS.map((c) => `<option value="${c}" ${cat && cat.color === c ? "selected" : ""}>${colorNames[c]}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Biểu tượng</label>${iconPickerHtml("c-icon", cat ? cat.icon : "sparkle")}</div>
      <div class="field"><label for="c-desc">Mô tả</label><textarea id="c-desc">${escapeHtml(cat ? cat.description || "" : "")}</textarea></div>`,
    onSubmit: (form) => {
      const r = AdminService.saveCategory({
        ...(cat ? { id: cat.id } : {}),
        name: form.querySelector("#c-name").value.trim(),
        color: form.querySelector("#c-color").value,
        icon: (form.querySelector('input[name="c-icon"]:checked') || {}).value || "sparkle",
        description: form.querySelector("#c-desc").value.trim(),
      });
      if (!r.ok) return r.error;
      result(r, "Đã lưu danh mục.");
    },
  });
}

/* ---- Báo cáo thống kê (Admin: toàn trường; BTC: đơn vị mình) ------------ */
function renderReportView(main, unitId) {
  const rep = ReportService.build({ unitId, period: DASH_STATE.reportPeriod, ref: DASH_STATE.reportRef });
  const t = rep.totals;
  const pct = (x) => Math.round(x * 100) + "%";

  const bars = (map, labelFn) => {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return `<p class="field-hint">Không có dữ liệu.</p>`;
    const max = Math.max(...entries.map((e) => e[1]));
    return entries
      .map(([k, n]) => `<div class="bar-row"><span class="lbl" title="${escapeHtml(labelFn(k))}">${escapeHtml(labelFn(k))}</span><span class="track"><span class="fill" style="width:${(n / max) * 100}%"></span></span><span class="v">${n}</span></div>`)
      .join("");
  };

  main.innerHTML = `
    ${headHtml(unitId ? "Thống kê đơn vị" : "Báo cáo thống kê", unitId ? `Số liệu sự kiện của ${escapeHtml(getUnit(unitId).name)}.` : "Tổng hợp hoạt động sự kiện toàn trường theo ngày, tháng, học kỳ.")}
    <div class="dash-toolbar">
      <label for="rp-period" class="sr-only">Kỳ báo cáo</label>
      <select id="rp-period" class="select">
        ${[["day", "Theo ngày"], ["month", "Theo tháng"], ["semester", "Theo học kỳ"], ["all", "Toàn bộ"]].map(([v, l]) => `<option value="${v}" ${DASH_STATE.reportPeriod === v ? "selected" : ""}>${l}</option>`).join("")}
      </select>
      ${DASH_STATE.reportPeriod !== "all" ? `<input type="date" id="rp-ref" value="${DASH_STATE.reportRef}" aria-label="Ngày tham chiếu"/>` : ""}
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-sm" id="rp-csv">${icon("download", 15)} Xuất CSV</button>
      <button class="btn btn-outline btn-sm" id="rp-print">${icon("printer", 15)} In báo cáo</button>
    </div>
    <p class="report-title">Kỳ báo cáo: ${rep.label} · Lập lúc ${fmtDT(nowDT())}</p>

    <div class="mini-stats">
      <div class="mini-stat"><div class="num">${t.events}</div><div class="lbl">Sự kiện</div></div>
      <div class="mini-stat"><div class="num">${t.registered}</div><div class="lbl">Lượt đăng ký</div></div>
      <div class="mini-stat"><div class="num">${t.attended}</div><div class="lbl">Lượt tham dự</div></div>
      <div class="mini-stat"><div class="num">${pct(t.rate)}</div><div class="lbl">Tỷ lệ tham dự</div></div>
      <div class="mini-stat"><div class="num">${t.rating ? t.rating.toFixed(1) : "—"}</div><div class="lbl">Điểm đánh giá TB</div></div>
    </div>

    <div class="report-grid">
      <div class="report-card"><h2>Theo trạng thái</h2>${bars(rep.byStatus, (k) => STATUS_META[k].label)}</div>
      <div class="report-card"><h2>Theo danh mục</h2>${bars(rep.byCategory, (k) => getCategory(k).name)}</div>
      ${unitId
        ? `<div class="report-card"><h2>Đăng ký nhiều nhất</h2>${rep.top.length ? `<ol class="top-list">${rep.top.map((x, i) => `<li><span>${i + 1}. ${escapeHtml(x.evt.title)}</span><span>${x.registered}</span></li>`).join("")}</ol>` : `<p class="field-hint">Không có dữ liệu.</p>`}</div>`
        : `<div class="report-card"><h2>Theo đơn vị</h2>${bars(rep.byUnit, (k) => getUnit(k).name)}</div>`}
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Ngày</th><th>Trạng thái</th><th>Đăng ký</th><th>Tham dự</th><th>Tỷ lệ</th><th>Đánh giá</th></tr></thead>
        <tbody>
          ${rep.rows.length
            ? [...rep.rows]
                .sort((a, b) => b.registered - a.registered)
                .map((x) => `<tr>
                  <td>${evtCell(x.evt, !unitId)}</td>
                  <td class="num-cell">${fmtDT(x.evt.start).slice(0, 10)}</td>
                  <td>${statusBadge(x.evt.status)}</td>
                  <td class="num-cell">${x.registered}</td>
                  <td class="num-cell">${x.attended}</td>
                  <td>${x.registered && ["ended"].includes(x.evt.status) ? `<span class="rate-pill ${x.rate >= 0.7 ? "good" : x.rate < 0.5 ? "bad" : ""}">${pct(x.rate)}</span>` : `<span class="rate-pill">${x.registered ? pct(x.rate) : "—"}</span>`}</td>
                  <td>${x.rating ? `${starsHtml(x.rating, 12)} <span class="num-cell">${x.rating.toFixed(1)}</span>` : "—"}</td>
                </tr>`)
                .join("")
            : emptyRow(7, "Không có sự kiện trong kỳ báo cáo.")}
        </tbody>
      </table>
    </div>`;

  document.getElementById("rp-period").addEventListener("change", (e) => {
    DASH_STATE.reportPeriod = e.target.value;
    renderShell();
  });
  const ref = document.getElementById("rp-ref");
  if (ref)
    ref.addEventListener("change", () => {
      DASH_STATE.reportRef = ref.value || nowDT().slice(0, 10);
      renderShell();
    });
  document.getElementById("rp-print").addEventListener("click", () => window.print());
  document.getElementById("rp-csv").addEventListener("click", () => {
    const header = ["Sự kiện", "Đơn vị", "Danh mục", "Ngày", "Trạng thái", "Lượt đăng ký", "Lượt tham dự", "Tỷ lệ tham dự", "Điểm đánh giá TB"];
    const rows = rep.rows.map((x) => [x.evt.title, EventService.unitName(x.evt), getCategory(x.evt.category).name, fmtDT(x.evt.start), STATUS_META[x.evt.status].label, x.registered, x.attended, pct(x.rate), x.rating ? x.rating.toFixed(2) : ""]);
    downloadCsv(`bao-cao_${DASH_STATE.reportPeriod}_${DASH_STATE.reportRef}.csv`, [[`Báo cáo: ${rep.label}`], [], header, ...rows]);
  });
}

/* ======================================================================
   ĐOÀN TRƯỜNG: CẤP ĐIỂM ĐOÀN
   ====================================================================== */
function renderPoints(main) {
  const ended = EventStore.where((e) => e.status === "ended").sort((a, b) => b.start.localeCompare(a.start));
  const todo = ended.filter((e) => !e.pointsAwardedAt);
  const done = ended.filter((e) => e.pointsAwardedAt);
  const list = DASH_STATE.pointsTab === "todo" ? todo : done;
  const attendedCount = (id) => RegService.byEvent(id).filter((r) => r.status === "attended").length;

  main.innerHTML = `
    ${headHtml("Cấp điểm Đoàn", "Cộng điểm rèn luyện Đoàn cho sinh viên có phiếu Đã tham dự tại các sự kiện đã kết thúc.")}
    <div class="tab-bar" role="tablist">
      <button type="button" role="tab" data-ptab="todo" aria-selected="${DASH_STATE.pointsTab === "todo"}">${icon("hourglass", 15)} Chờ cấp điểm <span class="count">${todo.length}</span></button>
      <button type="button" role="tab" data-ptab="done" aria-selected="${DASH_STATE.pointsTab === "done"}">${icon("award", 15)} Đã cấp <span class="count">${done.length}</span></button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Ngày tổ chức</th><th>Tham dự</th><th>${DASH_STATE.pointsTab === "todo" ? "" : "Điểm đã cấp"}</th><th></th></tr></thead>
        <tbody>
          ${list.length
            ? list
                .map((e) => `<tr>
                  <td>${evtCell(e, true)}</td>
                  <td class="num-cell">${fmtDT(e.start).slice(0, 10)}</td>
                  <td class="num-cell">${attendedCount(e.id)} sinh viên</td>
                  <td>${e.pointsAwardedAt ? `<span class="badge status-pending">+${e.unionPoints} điểm</span><div class="row-sub">${fmtDT(e.pointsAwardedAt)}</div>` : ""}</td>
                  <td><div class="row-actions">
                    ${actBtn("users", "Danh sách tham dự", "attendees", e.id)}
                    ${!e.pointsAwardedAt ? `<button type="button" class="btn btn-primary btn-sm" data-act="award" data-id="${e.id}">${icon("award", 15)} Cấp điểm</button>` : ""}
                  </div></td>
                </tr>`)
                .join("")
            : emptyRow(5, DASH_STATE.pointsTab === "todo" ? "Không còn sự kiện nào chờ cấp điểm." : "Chưa cấp điểm cho sự kiện nào.")}
        </tbody>
      </table>
    </div>`;

  main.querySelectorAll("[data-ptab]").forEach((b) =>
    b.addEventListener("click", () => {
      DASH_STATE.pointsTab = b.dataset.ptab;
      renderShell();
    })
  );
}

function attendeeTableHtml(evt) {
  const regs = RegService.byEvent(evt.id).filter((r) => r.status === "attended");
  if (!regs.length) return `<p class="field-hint">Không có sinh viên nào điểm danh.</p>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Họ tên</th><th>Mã SV</th><th>Lớp</th><th>Điểm danh</th></tr></thead>
    <tbody>${regs
      .map((r) => {
        const u = UserStore.getById(r.studentId) || {};
        return `<tr><td class="row-title">${escapeHtml(u.name)}</td><td class="num-cell">${escapeHtml(u.studentCode || "")}</td><td class="muted">${escapeHtml(u.classInfo || "")}</td><td class="num-cell">${fmtTime(r.checkinAt)}</td></tr>`;
      })
      .join("")}</tbody></table></div>`;
}

function openAttendeeList(evt) {
  openModal({
    title: "Sinh viên đã tham dự",
    wide: true,
    submitLabel: null,
    body: `<p class="field-hint" style="margin:0 0 12px">${escapeHtml(evt.title)} · ${fmtDT(evt.start)}</p>${attendeeTableHtml(evt)}
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Đóng</button></div>`,
  });
}

function openAwardForm(evt) {
  const n = RegService.byEvent(evt.id).filter((r) => r.status === "attended").length;
  openModal({
    title: "Cấp điểm Đoàn",
    wide: true,
    submitLabel: `${icon("award", 15)} Cấp điểm cho ${n} sinh viên`,
    body: `
      <div class="notice">${icon("info", 16)}<span><strong>${escapeHtml(evt.title)}</strong> — chỉ sinh viên có phiếu Đã tham dự được cộng điểm. Sinh viên sẽ nhận thông báo.</span></div>
      <div class="field"><label for="pt-value">Số điểm mỗi sinh viên <span class="req" aria-hidden="true">*</span></label><input type="number" id="pt-value" min="1" max="10" value="1" required/></div>
      ${attendeeTableHtml(evt)}`,
    onSubmit: (form) => {
      const r = PointService.award(DASH_SESSION, evt.id, +form.querySelector("#pt-value").value);
      if (!r.ok) return r.error;
      result(r, `Đã cấp điểm Đoàn cho ${r.data} sinh viên.`);
    },
  });
}

/* ======================================================================
   PHÒNG QUẢN TRỊ THIẾT BỊ: MƯỢN PHÒNG
   ====================================================================== */
function renderRoomRequests(main) {
  const all = BookingStore.getAll();
  const pending = all.filter((b) => b.status === "pending").sort((a, b) => a.start.localeCompare(b.start));
  const handled = all.filter((b) => ["approved", "rejected"].includes(b.status)).sort((a, b) => (b.reviewedAt || "").localeCompare(a.reviewedAt || ""));
  const list = DASH_STATE.bookingTab === "pending" ? pending : handled;

  main.innerHTML = `
    ${headHtml("Yêu cầu mượn phòng", "Duyệt hoặc từ chối yêu cầu mượn phòng cho các sự kiện trực tiếp.")}
    <div class="tab-bar" role="tablist">
      <button type="button" role="tab" data-btab="pending" aria-selected="${DASH_STATE.bookingTab === "pending"}">${icon("inbox", 15)} Chờ duyệt <span class="count">${pending.length}</span></button>
      <button type="button" role="tab" data-btab="handled" aria-selected="${DASH_STATE.bookingTab === "handled"}">${icon("check-circle", 15)} Đã xử lý <span class="count">${handled.length}</span></button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Phòng</th><th>Sự kiện</th><th>Thời gian sử dụng</th><th>Kiểm tra</th><th>${DASH_STATE.bookingTab === "pending" ? "Hành động" : "Kết quả"}</th></tr></thead>
        <tbody>
          ${list.length
            ? list
                .map((b) => {
                  const evt = EventStore.getById(b.eventId) || { title: "(đã xóa)", capacity: 0 };
                  const room = getRoom(b.roomId);
                  const conflicts = BookingService.conflicts(b);
                  const checks = [
                    conflicts.length ? `<div class="reason">${icon("alert", 14)}<span>Trùng với ${conflicts.map((c) => escapeHtml((EventStore.getById(c.eventId) || {}).title || "")).join(", ")}</span></div>` : "",
                    evt.capacity > room.capacity ? `<div class="reason warn">${icon("users", 14)}<span>Dự kiến ${evt.capacity} người > sức chứa ${room.capacity}</span></div>` : "",
                  ].join("");
                  return `<tr>
                    <td><div class="row-title">${escapeHtml(room.name)}</div><div class="row-sub">Sức chứa ${room.capacity}</div></td>
                    <td><div class="row-title">${escapeHtml(evt.title)}</div><div class="row-sub">${escapeHtml(getUnit(b.unitId).name)} · ${statusBadge(evt.status || "draft")}</div></td>
                    <td class="num-cell">${fmtDT(b.start)}<br/>→ ${fmtDT(b.end)}</td>
                    <td>${checks || `<span class="badge status-published">${icon("check", 12)} Phòng trống</span>`}</td>
                    <td>${b.status === "pending"
                      ? `<div class="row-actions">${actBtn("check", "Duyệt mượn phòng", "approve-booking", b.id, "ok")}${actBtn("x", "Từ chối", "reject-booking", b.id, "danger")}</div>`
                      : `${bookingBadge(b)}${b.reason ? `<div class="reason">${escapeHtml(b.reason)}</div>` : ""}<div class="row-sub">${fmtDT(b.reviewedAt)}</div>`}</td>
                  </tr>`;
                })
                .join("")
            : emptyRow(5, DASH_STATE.bookingTab === "pending" ? "Không có yêu cầu nào đang chờ." : "Chưa xử lý yêu cầu nào.")}
        </tbody>
      </table>
    </div>`;

  main.querySelectorAll("[data-btab]").forEach((b) =>
    b.addEventListener("click", () => {
      DASH_STATE.bookingTab = b.dataset.btab;
      renderShell();
    })
  );
}

function renderRooms(main) {
  const now = nowDT();
  main.innerHTML = `
    ${headHtml("Lịch sử dụng phòng", "Các phòng đã được duyệt cho sự kiện sắp tới.")}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Phòng</th><th>Sức chứa</th><th>Lịch đã duyệt sắp tới</th></tr></thead>
        <tbody>
          ${RoomStore.getAll()
            .map((room) => {
              const upcoming = BookingStore.where((b) => b.roomId === room.id && b.status === "approved" && b.end > now).sort((a, b) => a.start.localeCompare(b.start));
              return `<tr>
                <td><div class="user-cell"><span class="icon-cell">${icon("door", 18)}</span><span class="row-title">${escapeHtml(room.name)}</span></div></td>
                <td class="num-cell">${room.capacity}</td>
                <td>${upcoming.length
                  ? upcoming.map((b) => `<div class="row-sub"><strong>${fmtDT(b.start)} – ${fmtTime(b.end)}</strong> · ${escapeHtml((EventStore.getById(b.eventId) || {}).title || "")}</div>`).join("")
                  : `<span class="row-sub">Trống</span>`}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}
