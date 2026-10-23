/* ==========================================================================
   notifications.js — Hộp thông báo (xác nhận đăng ký, đổi lịch, hủy, nhắc lịch...)
   ========================================================================== */

const NOTIF_TYPE_META = {
  registration: { label: "Đăng ký",     ic: "ticket" },
  change:       { label: "Thay đổi",    ic: "calendar" },
  cancel:       { label: "Hủy / gỡ",    ic: "ban" },
  reminder:     { label: "Nhắc lịch",   ic: "clock" },
  approval:     { label: "Duyệt",       ic: "check-circle" },
  booking:      { label: "Mượn phòng",  ic: "door" },
  points:       { label: "Điểm Đoàn",   ic: "award" },
  system:       { label: "Hệ thống",    ic: "info" },
};

let NOTIF_FILTER = "all";

document.addEventListener("DOMContentLoaded", () => {
  renderChrome("notifications");
  renderNotifications();
});

function renderNotifications() {
  const root = document.getElementById("notif-root");
  const user = SessionStore.current();
  if (!user) {
    root.innerHTML = accessBlockHtml("bell", "Bạn chưa đăng nhập", "Đăng nhập để xem thông báo của bạn.",
      `<a class="btn btn-primary" href="login.html?next=notifications.html">Đăng nhập ngay</a>`);
    return;
  }

  const all = NotifyService.forUser(user.id);
  const unread = all.filter((n) => !n.read).length;
  const list = NOTIF_FILTER === "unread" ? all.filter((n) => !n.read) : NOTIF_FILTER === "all" ? all : all.filter((n) => n.type === NOTIF_FILTER);
  const types = [...new Set(all.map((n) => n.type))];

  root.innerHTML = `
    <section class="page-head">
      <div class="container narrow">
        <h1>Thông báo</h1>
        <p>${unread ? `Bạn có <strong>${unread}</strong> thông báo chưa đọc.` : "Bạn đã đọc hết thông báo."}</p>
      </div>
    </section>
    <section class="page-body">
      <div class="container narrow">
        <div class="dash-toolbar">
          <div class="chip-row" role="group" aria-label="Lọc thông báo" style="margin:0">
            <button type="button" class="chip" aria-pressed="${NOTIF_FILTER === "all"}" data-filter="all">Tất cả</button>
            <button type="button" class="chip" aria-pressed="${NOTIF_FILTER === "unread"}" data-filter="unread">Chưa đọc (${unread})</button>
            ${types.map((t) => `<button type="button" class="chip" aria-pressed="${NOTIF_FILTER === t}" data-filter="${t}">${NOTIF_TYPE_META[t].label}</button>`).join("")}
          </div>
          <button type="button" class="btn btn-ghost btn-sm spacer" id="btn-read-all" ${unread ? "" : "disabled"}>${icon("check", 16)} Đánh dấu tất cả đã đọc</button>
        </div>
        ${list.length
          ? `<ul class="notif-list">${list
              .map((n) => {
                const meta = NOTIF_TYPE_META[n.type] || NOTIF_TYPE_META.system;
                return `<li class="notif-item ${n.read ? "" : "unread"}">
                  <span class="n-ico">${icon(meta.ic, 18)}</span>
                  <div>
                    <h2>${n.read ? "" : `<span class="new-tag">Mới</span>`}${escapeHtml(n.title)}</h2>
                    <p>${escapeHtml(n.body)}</p>
                    <time datetime="${n.sentAt}">${meta.label} · ${timeAgo(n.sentAt)}</time>
                  </div>
                  ${n.link
                    ? `<a class="notif-link" href="${escapeHtml(n.link)}" data-id="${n.id}" aria-label="${n.read ? "" : "Chưa đọc: "}${escapeHtml(n.title)} — mở chi tiết"></a>`
                    : `<button type="button" class="notif-link" data-id="${n.id}" aria-label="Đánh dấu đã đọc: ${escapeHtml(n.title)}"></button>`}
                </li>`;
              })
              .join("")}</ul>`
          : emptyStateHtml("inbox", NOTIF_FILTER === "all" ? "Chưa có thông báo nào" : "Không có thông báo phù hợp", NOTIF_FILTER === "all" ? "Thông báo xác nhận đăng ký, thay đổi lịch và nhắc lịch sẽ xuất hiện ở đây." : "")}
      </div>
    </section>`;

  root.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      NOTIF_FILTER = b.dataset.filter;
      renderNotifications();
    })
  );
  document.getElementById("btn-read-all").addEventListener("click", () => {
    NotifyService.markAllRead(user.id);
    renderChrome("notifications");
    renderNotifications();
  });
  root.querySelectorAll(".notif-link").forEach((el) =>
    el.addEventListener("click", (e) => {
      NotifyService.markRead(el.dataset.id);
      if (el.tagName === "BUTTON") {
        e.preventDefault();
        renderChrome("notifications");
        renderNotifications();
      }
    })
  );
}
