/* ==========================================================================
   main.js — Thành phần dùng chung cho tất cả các trang
   ========================================================================== */

/* ---- Bộ icon SVG nét mảnh (phong cách Lucide), luôn tô bằng currentColor
   để đồng màu với chữ xung quanh. Dùng: icon("calendar") ------------------ */
const ICONS = {
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  sprout: '<path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2Z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  stop: '<circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.51-1.94l4-1A2 2 0 0 1 13 4.56Z"/>',
  "clipboard-check": '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
  "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  "eye-off": '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  "arrow-up-down": '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
  "calendar-plus": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
};

function icon(name, size = 18, extraClass = "") {
  const body = ICONS[name] || ICONS.sparkle;
  return `<svg class="ico ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ---- Trạng thái ----------------------------------------------------------- */
const STATUS_META = {
  draft:     { label: "Bản nháp",    cls: "status-draft" },
  pending:   { label: "Chờ duyệt",   cls: "status-pending" },
  published: { label: "Đã đăng",     cls: "status-published" },
  rejected:  { label: "Từ chối",     cls: "status-rejected" },
  ended:     { label: "Đã kết thúc", cls: "status-neutral" },
  cancelled: { label: "Đã hủy",      cls: "status-neutral" },
  removed:   { label: "Đã gỡ",       cls: "status-rejected" },
};
const REG_STATUS_META = {
  registered: { label: "Đã đăng ký", cls: "status-draft" },
  attended:   { label: "Đã tham dự", cls: "status-published" },
  absent:     { label: "Vắng mặt",   cls: "status-rejected" },
  cancelled:  { label: "Đã hủy",     cls: "status-neutral" },
};
const BOOKING_STATUS_META = {
  pending:   { label: "Chờ duyệt phòng", cls: "status-pending" },
  approved:  { label: "Đã duyệt phòng",  cls: "status-published" },
  rejected:  { label: "Từ chối phòng",   cls: "status-rejected" },
  cancelled: { label: "Đã hủy",          cls: "status-neutral" },
};

/* ---- Ngày giờ (đầu vào dạng "YYYY-MM-DDTHH:mm") ------------------------- */
const MONTHS_VI = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
const WEEKDAYS_VI = ["Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
const WEEKDAYS_SHORT = ["CN","T2","T3","T4","T5","T6","T7"];

function parseDT(s) {
  return new Date(s.length <= 10 ? s + "T00:00" : s);
}
// Trả về Date hợp lệ hoặc null (dữ liệu thiếu/sai định dạng)
function validDT(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(s)) return null;
  const d = parseDT(s);
  return isNaN(d.getTime()) ? null : d;
}
function formatDateLong(s) {
  const d = parseDT(s);
  return `${WEEKDAYS_VI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function formatDateShort(s) {
  const d = parseDT(s);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}
// "T5, 25/10 · 18:30"
function formatDayTime(s) {
  const d = parseDT(s);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${formatDateShort(s)} · ${fmtTime(s)}`;
}
function fmtTime(s) {
  return s ? s.slice(11, 16) : "";
}
function dayNum(s) {
  return parseDT(s).getDate();
}
function monthLabel(s) {
  return MONTHS_VI[parseDT(s).getMonth()];
}
function timeRangeText(evt) {
  if (evt.start.slice(0, 10) === evt.end.slice(0, 10)) return `${fmtTime(evt.start)} – ${fmtTime(evt.end)}`;
  return `${fmtDT(evt.start)} – ${fmtDT(evt.end)}`;
}
function isPast(s) {
  return s < nowDT();
}
function timeAgo(s) {
  const diff = (Date.now() - parseDT(s).getTime()) / 60000;
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${Math.floor(diff)} phút trước`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} giờ trước`;
  if (diff < 60 * 24 * 7) return `${Math.floor(diff / 1440)} ngày trước`;
  return fmtDT(s).slice(0, 10);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ---- Header + Footer dùng chung ----------------------------------------- */
function renderChrome(activePage) {
  const session = SessionStore.current();

  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  if (!headerEl) return;

  const navItems = [
    { href: "index.html", label: "Trang chủ", key: "home" },
    { href: "events.html", label: "Sự kiện", key: "events" },
  ];
  if (session && session.role === "student") navItems.push({ href: "my-events.html", label: "Hoạt động của tôi", key: "my" });
  if (session && session.role !== "student") navItems.push({ href: "dashboard.html", label: "Trang quản lý", key: "dashboard" });

  const navLink = (n, cls) =>
    `<a href="${n.href}" class="${cls}" ${activePage === n.key ? 'aria-current="page"' : ""}>${n.label}</a>`;

  let actionsHtml = "";
  let mobileAccount = "";
  if (session) {
    const unread = NotifyService.unreadCount(session.id);
    const sub = session.role === "organizer" ? getUnit(session.unitId).name : ROLE_META[session.role].label;
    actionsHtml = `
      <a href="notifications.html" class="bell-btn" ${activePage === "notifications" ? 'aria-current="page"' : ""} aria-label="Thông báo${unread ? `, ${unread} chưa đọc` : ""}">
        ${icon("bell", 20)}${unread ? `<span class="bell-count" aria-hidden="true">${unread > 9 ? "9+" : unread}</span>` : ""}
      </a>
      <div class="account">
        <button type="button" class="account-btn" id="account-btn" aria-expanded="false" aria-controls="account-menu">
          ${avatarHtml(session, 32)}
          <span class="account-name">${escapeHtml(session.name)}</span>
          ${icon("chevron-down", 16)}
        </button>
        <div class="account-menu" id="account-menu" hidden>
          <div class="account-head">
            <strong>${escapeHtml(session.name)}</strong>
            <span>${escapeHtml(sub)}</span>
          </div>
          <a href="profile.html">${icon("user", 17)} Hồ sơ cá nhân</a>
          ${session.role === "student" ? `<a href="my-events.html">${icon("ticket", 17)} Hoạt động của tôi</a>` : `<a href="dashboard.html">${icon("grid", 17)} Trang quản lý</a>`}
          <a href="notifications.html">${icon("bell", 17)} Thông báo${unread ? ` <span class="menu-count">${unread}</span>` : ""}</a>
          <button type="button" data-logout>${icon("logout", 17)} Đăng xuất</button>
        </div>
      </div>`;
    mobileAccount = `
      <div class="mobile-account">
        ${avatarHtml(session, 40)}
        <div><strong>${escapeHtml(session.name)}</strong><span>${escapeHtml(sub)}</span></div>
      </div>
      <a href="profile.html">Hồ sơ cá nhân</a>
      <a href="notifications.html">Thông báo${unread ? ` (${unread} chưa đọc)` : ""}</a>
      <button type="button" data-logout>Đăng xuất</button>`;
  } else {
    actionsHtml = `
      <a href="register.html" class="btn btn-ghost btn-sm hide-sm">Đăng ký</a>
      <a href="login.html" class="btn btn-primary btn-sm">Đăng nhập</a>`;
    mobileAccount = `<a href="register.html">Đăng ký tài khoản sinh viên</a>`;
  }

  headerEl.innerHTML = `
    <div class="header-inner container">
      <a href="index.html" class="brand" aria-label="NEU Event Portal — Trang chủ">
        <span class="brand-mark" aria-hidden="true">NEU</span>
        <span class="brand-word">Event Portal</span>
      </a>
      <nav class="main-nav" aria-label="Điều hướng chính">${navItems.map((n) => navLink(n, "nav-link")).join("")}</nav>
      <div class="header-actions">${actionsHtml}</div>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Mở menu">
        ${icon("menu", 22)}
      </button>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Menu" hidden>
      <div class="container">
        ${navItems.map((n) => navLink(n, "")).join("")}
        <hr/>
        ${mobileAccount}
      </div>
    </nav>
  `;

  if (!renderChrome._scrollBound) {
    renderChrome._scrollBound = true;
    let ticking = false;
    const sync = () => {
      ticking = false;
      headerEl.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(sync); }
    }, { passive: true });
    sync();
  }

  bindDisclosure(document.getElementById("nav-toggle"), document.getElementById("mobile-nav"), {
    openLabel: "Đóng menu",
    closedLabel: "Mở menu",
  });
  const accBtn = document.getElementById("account-btn");
  if (accBtn) bindDisclosure(accBtn, document.getElementById("account-menu"), { closeOnOutside: true });

  headerEl.querySelectorAll("[data-logout]").forEach((b) =>
    b.addEventListener("click", () => {
      SessionStore.logout();
      window.location.href = "index.html";
    })
  );

  if (footerEl) {
    footerEl.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-brand">
          <a href="index.html" class="brand"><span class="brand-mark" aria-hidden="true">NEU</span><span class="brand-word">Event Portal</span></a>
          <p>Cổng thông tin sự kiện dành cho sinh viên Đại học Kinh tế Quốc dân — đồ án học phần Phát triển Website.</p>
        </div>
        <nav class="footer-col" aria-label="Khám phá">
          <h2>Khám phá</h2>
          <a href="index.html">Trang chủ</a>
          <a href="events.html">Danh sách sự kiện</a>
          <a href="my-events.html">Hoạt động của tôi</a>
        </nav>
        <nav class="footer-col" aria-label="Tài khoản">
          <h2>Tài khoản</h2>
          <a href="login.html">Đăng nhập</a>
          <a href="register.html">Đăng ký sinh viên</a>
          <a href="dashboard.html">Trang quản lý</a>
        </nav>
        <div class="footer-col">
          <h2>Liên hệ</h2>
          <a href="mailto:eventportal@neu.edu.vn">eventportal@neu.edu.vn</a>
          <span>207 Giải Phóng, Hai Bà Trưng, Hà Nội</span>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© 2026 NEU Event Portal · Bản demo, dữ liệu lưu trên trình duyệt của bạn.</span>
        <button type="button" class="link-btn" id="btn-reset-demo">Khôi phục dữ liệu demo</button>
      </div>
    `;
    document.getElementById("btn-reset-demo").addEventListener("click", () => {
      if (confirm("Khôi phục toàn bộ dữ liệu demo về trạng thái ban đầu? Mọi thay đổi trên trình duyệt này sẽ bị xóa.")) {
        DB.reset();
        window.location.href = "index.html";
      }
    });
  }
}

/* Nút mở/đóng một vùng (menu, dropdown): aria-expanded, Escape trả focus về nút,
   bấm ra ngoài để đóng (tùy chọn) */
function bindDisclosure(btn, panel, { closeOnOutside = false, openLabel, closedLabel } = {}) {
  const set = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    if (openLabel) btn.setAttribute("aria-label", open ? openLabel : closedLabel);
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      set(false);
      btn.focus();
    }
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
  if (closeOnOutside) {
    document.addEventListener("click", (e) => {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    panel.addEventListener("focusout", (e) => {
      if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) set(false);
    });
  }
}

/* ---- Huy hiệu ------------------------------------------------------------ */
function statusBadge(status) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return `<span class="badge ${meta.cls}">${meta.label}</span>`;
}
function regStatusBadge(status) {
  const meta = REG_STATUS_META[status];
  return `<span class="badge ${meta.cls}">${meta.label}</span>`;
}
function bookingBadge(booking) {
  if (!booking) return "";
  const meta = BOOKING_STATUS_META[booking.status];
  return `<span class="badge ${meta.cls}">${icon("door", 13)} ${meta.label}</span>`;
}
function categoryBadge(catId) {
  const cat = getCategory(catId);
  return `<span class="badge badge-cat">${icon(cat.icon, 13)}${escapeHtml(cat.name)}</span>`;
}
function formatBadge(evt) {
  return evt.format === "online"
    ? `<span class="badge badge-format">${icon("monitor", 13)} Trực tuyến</span>`
    : `<span class="badge badge-format">${icon("map-pin", 13)} Trực tiếp</span>`;
}

function avatarHtml(user, size = 40) {
  const words = (user.name || "?").replace(/^(TS\.|ThS\.|PGS\.)\s*/, "").trim().split(/\s+/);
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
  return `<span class="avatar" aria-hidden="true" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px">${escapeHtml(initials)}</span>`;
}

function starsHtml(value, size = 14) {
  let html = "";
  for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= Math.round(value) ? "on" : ""}">${icon("star", size)}</span>`;
  return `<span class="stars" role="img" aria-label="${(+value).toFixed(1)} trên 5 sao">${html}</span>`;
}

/* ---- Ảnh bìa sự kiện ----------------------------------------------------
   Không có ảnh (hoặc ảnh lỗi) thì hiển thị "poster ngày" theo danh mục.
   Khi có ảnh, poster nằm phía sau và bị ẩn khỏi công nghệ hỗ trợ. */
function datePosterHtml(evt, hidden) {
  const cat = getCategory(evt.category);
  const d = validDT(evt.start);
  const date = d
    ? `<span class="poster-date" aria-hidden="true">
        <span class="pd-day">${d.getDate()}</span>
        <span class="pd-rest"><span>${MONTHS_VI[d.getMonth()]}</span><span>${WEEKDAYS_VI[d.getDay()]}</span></span>
      </span>`
    : `<span class="poster-date" aria-hidden="true"><span class="pd-rest"><span>Chưa có lịch</span></span></span>`;
  return `
    <div class="cover-fallback" data-color="${cat.color}" ${hidden ? 'aria-hidden="true"' : ""}>
      ${date}
      <span class="poster-cat">${icon(cat.icon, 14)} ${escapeHtml(cat.name)}</span>
    </div>`;
}
// Ảnh lỗi: gỡ ảnh, hiện lại poster. Không sửa dữ liệu, chỉ chạy một lần.
function coverImgError(img) {
  img.onerror = null;
  const box = img.parentNode;
  img.remove();
  if (!box) return;
  box.classList.remove("has-img");
  const fb = box.querySelector(":scope > [aria-hidden='true'].cover-fallback, :scope > .time-card[aria-hidden='true']");
  if (fb) fb.removeAttribute("aria-hidden");
}
function coverImgHtml(evt, eager) {
  return `<img src="${escapeHtml(evt.cover)}" alt="Ảnh bìa: ${escapeHtml(evt.title)}" width="840" height="360" ${eager ? "" : 'loading="lazy"'} onerror="coverImgError(this)"/>`;
}
function coverHtml(evt, { eager = false } = {}) {
  const hasImg = !!evt.cover;
  return `<div class="cover ${hasImg ? "has-img" : ""}">${datePosterHtml(evt, hasImg)}${hasImg ? coverImgHtml(evt, eager) : ""}</div>`;
}

/* Trạng thái đăng ký tính từ dữ liệu thật (thời gian, hạn, số chỗ) */
function availability(evt) {
  const now = nowDT();
  if (evt.status === "cancelled") return { cls: "neutral", text: "Đã hủy" };
  if (evt.status === "ended" || evt.end <= now) return { cls: "neutral", text: "Đã kết thúc" };
  if (evt.status !== "published") return { cls: "neutral", text: STATUS_META[evt.status].label };
  if (now >= evt.start) return { cls: "ok", text: "Đang diễn ra" };
  if (now >= evt.deadline) return { cls: "neutral", text: "Hết hạn đăng ký" };
  const left = RegService.seatsLeft(evt);
  if (left <= 0) return { cls: "error", text: "Hết chỗ" };
  if (left <= Math.max(5, Math.floor(evt.capacity * 0.1))) return { cls: "warn", text: `Sắp hết chỗ · còn ${left}` };
  return { cls: "ok", text: `Hạn đăng ký ${formatDateShort(evt.deadline)}` };
}
function availabilityHtml(evt) {
  const a = availability(evt);
  return `<span class="avail avail-${a.cls}">${a.text}</span>`;
}

/* Giai đoạn thời gian của sự kiện (khác với hạn đăng ký).
   now: chuỗi "YYYY-MM-DDTHH:mm" để có thể kiểm tra với thời điểm tùy ý. */
function eventPhase(evt, now = nowDT()) {
  if (evt.status === "cancelled") return { key: "cancelled", label: "Đã hủy" };
  if (evt.status === "removed") return { key: "removed", label: "Đã bị gỡ" };
  if (!validDT(evt.start)) return { key: "unknown", label: "Chưa rõ thời gian" };
  const hasEnd = !!validDT(evt.end) && evt.end > evt.start;
  if (evt.status === "ended" || (hasEnd && now >= evt.end)) return { key: "ended", label: "Đã kết thúc" };
  if (now < evt.start) return { key: "upcoming", label: "Sắp diễn ra" };
  return hasEnd ? { key: "ongoing", label: "Đang diễn ra" } : { key: "started", label: "Đã bắt đầu" };
}
// Thời gian còn lại đến lúc bắt đầu: ≥ 24 giờ làm tròn xuống theo ngày
function countdownText(startDate, nowMs = Date.now()) {
  const min = Math.floor((startDate.getTime() - nowMs) / 60000);
  if (min < 1) return { value: "Sắp bắt đầu", unit: "" };
  if (min < 60 * 24) {
    const h = Math.floor(min / 60), m = min % 60;
    return { value: h ? `${h} giờ ${m} phút` : `${m} phút`, unit: "" };
  }
  return { value: String(Math.floor(min / 1440)), unit: "ngày" };
}

/* ---- Thẻ sự kiện dùng chung --------------------------------------------- */
function eventCardHtml(evt, { featured = false, eager = false, extraClass = "" } = {}) {
  const cat = getCategory(evt.category);
  return `
    <article class="event-card ${featured ? "event-card-featured" : ""} ${extraClass}">
      ${coverHtml(evt, { eager })}
      <div class="event-body">
        <span class="event-cat">${icon(cat.icon, 14)} ${escapeHtml(cat.name)}${evt.format === "online" ? " · Trực tuyến" : ""}</span>
        <h3 class="event-title"><a href="event-detail.html?id=${evt.id}">${escapeHtml(evt.title)}</a></h3>
        ${featured ? `<p class="event-desc">${escapeHtml(evt.shortDesc)}</p>` : ""}
        <ul class="event-meta">
          <li>${icon("calendar", 15)} <span>${validDT(evt.start) ? formatDayTime(evt.start) : "Chưa có lịch"}</span></li>
          <li>${icon(evt.format === "online" ? "monitor" : "map-pin", 15)} <span>${escapeHtml(evt.location)}</span></li>
          <li>${icon("building", 15)} <span>${escapeHtml(EventService.unitName(evt))}</span></li>
        </ul>
        <div class="event-foot">${availabilityHtml(evt)}<span class="event-more" aria-hidden="true">Chi tiết ${icon("arrow-right", 14)}</span></div>
      </div>
    </article>
  `;
}

/* Hàng sự kiện gọn: ô ngày + tiêu đề + giờ/địa điểm + tình trạng
   (mục "7 ngày tới" ở trang chủ và chế độ Danh sách ở trang Sự kiện) */
function eventRowHtml(evt, { showUnit = false } = {}) {
  const d = validDT(evt.start);
  const cat = getCategory(evt.category);
  return `
    <article class="event-row">
      <div class="date-box" aria-hidden="true">
        ${d ? `<span class="dw">${WEEKDAYS_SHORT[d.getDay()]}</span><span class="d">${d.getDate()}</span><span class="m">${MONTHS_VI[d.getMonth()]}</span>` : `<span class="d">–</span>`}
      </div>
      <div class="row-main">
        <h3><a href="event-detail.html?id=${evt.id}">${escapeHtml(evt.title)}</a></h3>
        <p class="sub">${d ? formatDayTime(evt.start) : "Chưa có lịch"} · ${escapeHtml(evt.location)}</p>
        ${showUnit ? `<p class="sub">${icon(cat.icon, 14)} ${escapeHtml(cat.name)} · ${escapeHtml(EventService.unitName(evt))}</p>` : ""}
      </div>
      <div class="row-side">${availabilityHtml(evt)}</div>
    </article>`;
}

function emptyStateHtml(iconName, title, text = "", extra = "") {
  return `<div class="empty-state">
    <div class="glyph">${icon(iconName, 28)}</div>
    <h3>${title}</h3>${text ? `<p>${text}</p>` : ""}${extra}
  </div>`;
}

function accessBlockHtml(iconName, title, text, btnHtml = "") {
  return `<div class="access-block">
    <div class="glyph">${icon(iconName, 32)}</div>
    <h1>${title}</h1><p>${text}</p>${btnHtml}
  </div>`;
}

/* ---- Toast (thông báo cho công nghệ hỗ trợ qua aria-live) --------------- */
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---- Giữ focus trong hộp thoại / ngăn kéo -------------------------------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(container, e) {
  if (e.key !== "Tab") return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---- Modal dùng chung -----------------------------------------------------
   openModal({ title, body, submitLabel, danger, wide, extraActions, onSubmit, onOpen })
   onSubmit(form) trả về chuỗi lỗi để giữ modal mở và hiển thị lỗi. -------- */
let MODAL_RETURN_FOCUS = null;

function openModal(opts) {
  let overlay = document.getElementById("app-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "app-modal";
    document.body.appendChild(overlay);
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      else trapFocus(overlay, e);
    });
  }
  if (!overlay.classList.contains("open")) MODAL_RETURN_FOCUS = document.activeElement;

  const extras = (opts.extraActions || [])
    .map((a, i) => `<button type="button" class="btn ${a.cls || "btn-ghost"}" data-extra="${i}">${a.label}</button>`)
    .join("");
  const footer =
    opts.submitLabel === null
      ? ""
      : `<div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>${opts.cancelLabel || "Hủy"}</button>
          ${extras}
          ${opts.submitLabel ? `<button type="submit" class="btn ${opts.danger ? "btn-danger" : "btn-primary"}">${opts.submitLabel}</button>` : ""}
        </div>`;

  overlay.innerHTML = `
    <div class="modal-box ${opts.wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
      <div class="modal-head">
        <h2 id="app-modal-title">${opts.title}</h2>
        <button type="button" class="modal-close" data-close aria-label="Đóng">${icon("x", 18)}</button>
      </div>
      <form id="app-modal-form" novalidate>
        <div class="modal-body">
          <p class="form-error" id="app-modal-error" role="alert"></p>
          ${opts.body}
        </div>
        ${footer}
      </form>
    </div>`;
  overlay.classList.add("open");
  document.body.classList.add("no-scroll");

  const form = document.getElementById("app-modal-form");
  const errEl = document.getElementById("app-modal-error");
  const handle = (result) => {
    if (typeof result === "string") {
      errEl.textContent = result;
      errEl.scrollIntoView({ block: "nearest" });
      return;
    }
    if (result !== false) closeModal();
  };

  overlay.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = formValidationError(form);
    if (invalid) {
      errEl.textContent = invalid;
      return;
    }
    handle(opts.onSubmit ? opts.onSubmit(form) : undefined);
  });
  overlay.querySelectorAll("[data-extra]").forEach((b) =>
    b.addEventListener("click", () => handle(opts.extraActions[+b.dataset.extra].onClick(form)))
  );

  if (opts.onOpen) opts.onOpen(form);
  enhancePasswordInputs(form);
  const first = form.querySelector("input:not([type=hidden]):not([type=radio]), textarea, select") || overlay.querySelector(".modal-close");
  first.focus();
}

function closeModal() {
  const overlay = document.getElementById("app-modal");
  if (!overlay || !overlay.classList.contains("open")) return;
  overlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
  if (MODAL_RETURN_FOCUS && document.contains(MODAL_RETURN_FOCUS)) MODAL_RETURN_FOCUS.focus();
}

// Hộp thoại nhập lý do bắt buộc (từ chối, hủy, gỡ sự kiện...)
function askReason({ title, label, placeholder = "", submitLabel = "Xác nhận", danger = true, note = "" }, onConfirm) {
  openModal({
    title,
    submitLabel,
    danger,
    body: `
      ${note ? `<div class="notice notice-warn">${icon("alert", 18)}<span>${note}</span></div>` : ""}
      <div class="field">
        <label for="reason-input">${label} <span class="req" aria-hidden="true">*</span></label>
        <textarea id="reason-input" required minlength="5" placeholder="${placeholder}"></textarea>
        <p class="field-hint">Tối thiểu 5 ký tự.</p>
      </div>`,
    onSubmit: (form) => {
      const r = onConfirm(form.querySelector("#reason-input").value);
      return r && !r.ok ? r.error : undefined;
    },
  });
}

/* ---- Hiện/ẩn mật khẩu cho mọi ô password trong vùng chỉ định ------------ */
function enhancePasswordInputs(root = document) {
  root.querySelectorAll('input[type="password"]:not([data-pw])').forEach((input) => {
    input.dataset.pw = "1";
    const wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-toggle";
    btn.setAttribute("aria-label", "Hiện mật khẩu");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = icon("eye", 18);
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      btn.setAttribute("aria-pressed", String(show));
      btn.innerHTML = icon(show ? "eye-off" : "eye", 18);
    });
    wrap.appendChild(btn);
  });
}

/* ---- Kiểm tra form (novalidate): trả về câu lỗi cho ô sai đầu tiên và focus vào ô đó */
function formValidationError(form) {
  const bad = [...form.querySelectorAll("input, select, textarea")].find((el) => !el.checkValidity());
  if (!bad) return null;
  bad.focus();
  const label = (form.querySelector(`label[for="${bad.id}"]`) || bad.closest("label") || { textContent: "Trường này" }).textContent.replace("*", "").trim();
  const v = bad.validity;
  if (v.valueMissing) return bad.type === "checkbox" ? `Vui lòng xác nhận: ${label}` : `Vui lòng nhập ${label.toLowerCase()}.`;
  if (v.typeMismatch && bad.type === "email") return "Email không đúng định dạng.";
  if (v.typeMismatch && bad.type === "url") return `${label} phải là đường dẫn hợp lệ (bắt đầu bằng http:// hoặc https://).`;
  if (v.tooShort) return `${label} cần tối thiểu ${bad.minLength} ký tự.`;
  if (v.patternMismatch) return `${label} không đúng định dạng.`;
  if (v.rangeUnderflow) return `${label} phải lớn hơn hoặc bằng ${bad.min}.`;
  return `${label}: giá trị không hợp lệ.`;
}

/* ---- Xuất CSV (mở được bằng Excel, giữ tiếng Việt nhờ BOM) ------------- */
function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---- Mã QR mô phỏng (sinh hình ổn định từ chuỗi mã vé, không dùng thư viện) */
function qrSvg(code, size = 140) {
  const n = 21;
  let h = 2166136261;
  for (const ch of code) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) / 4294967295;
  };
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let cells = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!inFinder(x, y) && rand() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  const finder = (x, y) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg class="qr" width="${size}" height="${size}" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" role="img" aria-label="Mã QR vé ${code}">
    <rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><g fill="#000">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${cells}</g></svg>`;
}

function requireRole(allowedRoles) {
  const session = SessionStore.current();
  if (!session || !allowedRoles.includes(session.role)) return null;
  return session;
}
