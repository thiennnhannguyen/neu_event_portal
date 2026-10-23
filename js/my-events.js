/* ==========================================================================
   my-events.js — "Hoạt động của tôi" dành cho Sinh viên:
   vé sắp tới, lịch tháng, sự kiện quan tâm, lịch sử đăng ký & điểm Đoàn
   ========================================================================== */

const MY = { tab: "upcoming", calMonth: null };

document.addEventListener("DOMContentLoaded", () => {
  renderChrome("my");
  const hash = window.location.hash.slice(1);
  if (["upcoming", "calendar", "interests", "history"].includes(hash)) MY.tab = hash;
  const now = new Date();
  MY.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  renderMy();
});

function renderMy() {
  const root = document.getElementById("my-root");
  const user = requireRole(["student"]);
  if (!user) {
    root.innerHTML = accessBlockHtml("user", "Dành cho tài khoản Sinh viên",
      "Đăng nhập bằng tài khoản Sinh viên để xem vé, lịch sự kiện và lịch sử tham gia của bạn.",
      `<a class="btn btn-primary" href="login.html?next=my-events.html">Đăng nhập ngay</a>`);
    return;
  }

  const regs = RegService.byStudent(user.id);
  const withEvt = regs.map((r) => ({ reg: r, evt: EventStore.getById(r.eventId) })).filter((x) => x.evt);
  const upcoming = withEvt.filter((x) => x.reg.status === "registered" && x.evt.status === "published").sort((a, b) => a.evt.start.localeCompare(b.evt.start));
  const interests = InterestService.byStudent(user.id).map((i) => EventStore.getById(i.eventId)).filter(Boolean);
  const historyList = [...withEvt].sort((a, b) => b.evt.start.localeCompare(a.evt.start));

  const tabs = [
    { key: "upcoming", label: "Vé sắp tới", ic: "ticket", count: upcoming.length },
    { key: "calendar", label: "Lịch sự kiện", ic: "calendar" },
    { key: "interests", label: "Đang quan tâm", ic: "heart", count: interests.length },
    { key: "history", label: "Lịch sử tham gia", ic: "clock", count: historyList.length },
  ];

  root.innerHTML = `
    <section class="page-head">
      <div class="container">
        <span class="eyebrow">Xin chào, ${escapeHtml(user.name)}</span>
        <h1>Hoạt động của tôi</h1>
        <p>Theo dõi vé tham dự, lịch sự kiện sắp tới và các hoạt động bạn đã tham gia.</p>
      </div>
    </section>
    <section class="page-body">
      <div class="container">
        <div class="mini-stats">
          <div class="mini-stat"><div class="num">${upcoming.length}</div><div class="lbl">Sự kiện sắp tham gia</div></div>
          <div class="mini-stat"><div class="num">${regs.filter((r) => r.status === "attended").length}</div><div class="lbl">Đã tham dự</div></div>
          <div class="mini-stat"><div class="num">${interests.length}</div><div class="lbl">Đang quan tâm</div></div>
          <div class="mini-stat accent"><div class="num">${PointService.total(user.id)}</div><div class="lbl">Điểm Đoàn tích lũy</div></div>
        </div>

        <div class="tab-bar" role="tablist">
          ${tabs.map((t) => `<button type="button" role="tab" id="tab-${t.key}" data-tab="${t.key}" aria-controls="my-tab-body" aria-selected="${MY.tab === t.key}" tabindex="${MY.tab === t.key ? 0 : -1}">${icon(t.ic, 18)} ${t.label}${t.count !== undefined ? ` <span class="count">${t.count}</span>` : ""}</button>`).join("")}
        </div>
        <div id="my-tab-body" role="tabpanel" aria-labelledby="tab-${MY.tab}"></div>
      </div>
    </section>`;

  const tabBtns = [...root.querySelectorAll("[data-tab]")];
  const selectTab = (key) => {
    if (key === MY.tab) return;
    MY.tab = key;
    window.history.replaceState(null, "", "#" + MY.tab);
    renderMy();
    // Hiệu ứng chỉ khi đổi tab (các lần render do cập nhật dữ liệu không có)
    document.getElementById("my-tab-body").classList.add("tab-enter");
    document.getElementById("tab-" + key).focus({ preventScroll: true });
  };
  tabBtns.forEach((b, i) => {
    b.addEventListener("click", () => selectTab(b.dataset.tab));
    // Phím mũi tên trái/phải chuyển tab
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabBtns[(i + (e.key === "ArrowRight" ? 1 : tabBtns.length - 1)) % tabBtns.length];
      selectTab(next.dataset.tab);
    });
  });

  const body = document.getElementById("my-tab-body");
  if (MY.tab === "upcoming") body.innerHTML = renderUpcoming(upcoming);
  if (MY.tab === "calendar") body.innerHTML = renderCalendar(upcoming.map((x) => x.evt), interests);
  if (MY.tab === "interests") body.innerHTML = renderInterests(interests);
  if (MY.tab === "history") body.innerHTML = renderHistory(historyList, user);
  bindMyActions(user);
}

function dateBoxHtml(start) {
  const d = parseDT(start);
  return `<div class="date-box" aria-hidden="true"><span class="dw">${WEEKDAYS_SHORT[d.getDay()]}</span><span class="d">${d.getDate()}</span><span class="m">${monthLabel(start)}</span></div>`;
}

function ticketRowHtml(evt, actsHtml, extraMeta = "") {
  return `
    <article class="ticket-row">
      ${dateBoxHtml(evt.start)}
      <div style="min-width:0">
        <h3><a href="event-detail.html?id=${evt.id}">${escapeHtml(evt.title)}</a></h3>
        <div class="meta">
          <span>${icon("clock", 15)} ${formatDayTime(evt.start)} – ${fmtTime(evt.end)}</span>
          <span>${icon(evt.format === "online" ? "monitor" : "map-pin", 15)} ${escapeHtml(evt.location)}</span>
          ${extraMeta}
        </div>
        <div class="acts">${actsHtml}</div>
      </div>
    </article>`;
}

function renderUpcoming(list) {
  if (!list.length) return emptyStateHtml("ticket", "Bạn chưa có vé nào", "Khám phá và đăng ký các sự kiện sắp diễn ra.", `<a class="btn btn-primary" href="events.html">Khám phá sự kiện</a>`);
  return `<div class="ticket-list">${list
    .map(({ reg, evt }) =>
      ticketRowHtml(
        evt,
        `<button type="button" class="btn btn-primary btn-sm" data-ticket="${reg.id}">${icon("qr", 16)} Xem vé QR</button>
         ${RegService.canCancel(reg, evt) ? `<button type="button" class="btn btn-ghost btn-sm" data-cancel="${reg.id}">Hủy đăng ký</button>` : ""}`,
        `<span>${icon("ticket", 15)} Mã vé ${reg.code} · ${regStatusBadge(reg.status)}</span>`
      )
    )
    .join("")}</div>`;
}

function renderInterests(list) {
  if (!list.length) return emptyStateHtml("heart", "Chưa có sự kiện quan tâm", "Bấm biểu tượng trái tim ở trang chi tiết để theo dõi sự kiện và nhận nhắc lịch.", `<a class="btn btn-primary" href="events.html">Khám phá sự kiện</a>`);
  return `<div class="card-grid">${list.map((e) => eventCardHtml(e)).join("")}</div>`;
}

function renderHistory(list, user) {
  if (!list.length) return emptyStateHtml("clock", "Chưa có lịch sử đăng ký");
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Sự kiện</th><th>Thời gian</th><th>Đăng ký lúc</th><th>Trạng thái</th><th>Điểm Đoàn</th><th></th></tr></thead>
        <tbody>
          ${list
            .map(({ reg, evt }) => {
              const pts = reg.status === "attended" && evt.pointsAwardedAt ? `<span class="badge status-draft">+${evt.unionPoints} điểm</span>` : "—";
              const canReview = ReviewService.canReview(user, evt);
              return `<tr>
                <td><div class="row-title"><a href="event-detail.html?id=${evt.id}">${escapeHtml(evt.title)}</a></div><div class="row-sub">${escapeHtml(EventService.unitName(evt))}</div></td>
                <td class="num-cell">${fmtDT(evt.start)}</td>
                <td class="num-cell">${fmtDT(reg.registeredAt)}</td>
                <td>${regStatusBadge(reg.status)}${reg.checkinAt ? `<div class="row-sub">Điểm danh ${fmtTime(reg.checkinAt)}</div>` : ""}</td>
                <td>${pts}</td>
                <td>${canReview ? `<a class="btn btn-secondary btn-sm" href="event-detail.html?id=${evt.id}#reviews">${icon("star", 16)} Đánh giá</a>` : ReviewService.hasReviewed(user.id, evt.id) ? `<span class="row-sub">Đã đánh giá</span>` : ""}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderCalendar(registered, interests) {
  const m = MY.calMonth;
  const year = m.getFullYear();
  const month = m.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Thứ 2 là cột đầu
  const start = new Date(year, month, 1 - firstDow);
  const todayKey = nowDT().slice(0, 10);
  const regIds = new Set(registered.map((e) => e.id));

  const items = [
    ...registered.map((e) => ({ evt: e, cls: "" })),
    ...interests.filter((e) => !regIds.has(e.id) && e.status === "published").map((e) => ({ evt: e, cls: "interest" })),
  ];

  // Danh sách theo ngày (dùng cho mobile và trình đọc màn hình)
  const monthKey = `${year}-${pad2(month + 1)}`;
  const agenda = items
    .filter((x) => x.evt.start.slice(0, 7) === monthKey)
    .sort((a, b) => a.evt.start.localeCompare(b.evt.start))
    .map((x) => `<div class="agenda-item">${dateBoxHtml(x.evt.start)}<div><a href="event-detail.html?id=${x.evt.id}"><strong>${escapeHtml(x.evt.title)}</strong></a><span>${fmtTime(x.evt.start)} · ${x.cls ? "Đang quan tâm" : "Đã đăng ký"}</span></div></div>`)
    .join("");

  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toLocalDT(d).slice(0, 10);
    const dayItems = items.filter((x) => x.evt.start.slice(0, 10) === key);
    cells += `<div class="cal-cell ${d.getMonth() !== month ? "other" : ""} ${key === todayKey ? "today" : ""}">
      <span class="n">${d.getDate()}</span>
      ${dayItems.map((x) => `<a class="cal-ev ${x.cls}" href="event-detail.html?id=${x.evt.id}" title="${escapeHtml(x.evt.title)}">${fmtTime(x.evt.start)} ${escapeHtml(x.evt.title)}</a>`).join("")}
    </div>`;
  }

  return `
    <div class="panel">
      <div class="cal-head">
        <h2 aria-live="polite">Tháng ${month + 1}, ${year}</h2>
        <div class="nav">
          <button type="button" class="icon-btn" data-cal="-1" aria-label="Tháng trước">${icon("chevron-left", 18)}</button>
          <button type="button" class="btn btn-ghost" data-cal="0">Tháng này</button>
          <button type="button" class="icon-btn" data-cal="1" aria-label="Tháng sau">${icon("chevron-right", 18)}</button>
        </div>
      </div>
      <div class="cal-grid" aria-hidden="true">
        ${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => `<div class="dow">${d}</div>`).join("")}
        ${cells}
      </div>
      <div class="agenda">${agenda || `<p class="muted">Không có sự kiện nào trong tháng này.</p>`}</div>
      <div class="cal-legend">
        <span><i style="background:var(--blue-50); border-left:3px solid var(--blue)"></i>Đã đăng ký</span>
        <span><i style="background:var(--warning-bg); border-left:3px solid #c27a0e"></i>Đang quan tâm</span>
      </div>
    </div>`;
}

function bindMyActions(user) {
  const root = document.getElementById("my-tab-body");
  root.querySelectorAll("[data-ticket]").forEach((b) =>
    b.addEventListener("click", () => {
      const reg = RegistrationStore.getById(b.dataset.ticket);
      const evt = EventStore.getById(reg.eventId);
      openModal({
        title: "Vé tham dự",
        submitLabel: null,
        body: `
          <div class="ticket-big">
            <strong>${escapeHtml(evt.title)}</strong>
            <p style="margin-top:4px">${formatDateLong(evt.start)} · ${timeRangeText(evt)}<br/>${escapeHtml(evt.location)}</p>
            ${qrSvg(reg.code, 190)}
            <div class="code">${reg.code}</div>
            <p>Đưa mã QR này cho Ban tổ chức quét khi điểm danh.</p>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Đóng</button></div>`,
      });
    })
  );
  root.querySelectorAll("[data-cancel]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!confirm("Hủy đăng ký sự kiện này?")) return;
      const r = RegService.cancel(user, b.dataset.cancel);
      showToast(r.ok ? "Đã hủy đăng ký." : r.error);
      renderChrome("my");
      renderMy();
    })
  );
  root.querySelectorAll("[data-cal]").forEach((b) =>
    b.addEventListener("click", () => {
      const step = +b.dataset.cal;
      const now = new Date();
      MY.calMonth = step === 0 ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(MY.calMonth.getFullYear(), MY.calMonth.getMonth() + step, 1);
      renderMy();
    })
  );
}
