/* ==========================================================================
   detail.js — Trang chi tiết sự kiện: đăng ký / hủy, quan tâm, vé QR, đánh giá
   ========================================================================== */

let DETAIL_ID = null;
let CTA_OBSERVER = null;
let TIME_TIMER = null;
let TIME_TICK = null;

document.addEventListener("DOMContentLoaded", () => {
  renderChrome("events");
  DETAIL_ID = new URLSearchParams(window.location.search).get("id");
  renderDetail();
});
// Cập nhật đếm ngược ngay khi người dùng quay lại tab; dọn timer khi rời trang
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && TIME_TICK) TIME_TICK();
});
window.addEventListener("pagehide", stopTimeCard);

function renderDetail() {
  const root = document.getElementById("detail-root");
  const session = SessionStore.current();
  const evt = DETAIL_ID ? EventStore.getById(DETAIL_ID) : null;

  if (!evt || !EventService.canView(session, evt)) {
    root.innerHTML = accessBlockHtml(
      "file",
      "Không tìm thấy sự kiện",
      "Sự kiện này có thể chưa được công khai, đã bị gỡ hoặc đường dẫn không chính xác.",
      `<a class="btn btn-primary" href="events.html">Quay lại danh sách sự kiện</a>`
    );
    return;
  }
  document.title = `${evt.title} — NEU Event Portal`;

  const unit = getUnit(evt.unitId);
  const isStudent = session && session.role === "student";
  const reg = isStudent ? RegService.activeReg(session.id, evt.id) : null;
  const interested = isStudent && InterestService.isInterested(session.id, evt.id);
  const canManage = EventService.canManage(session, evt);

  root.innerHTML = `
    <section class="detail-top">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Trang chủ</a><span aria-hidden="true">/</span>
          <a href="events.html">Sự kiện</a><span aria-hidden="true">/</span>
          <span aria-current="page">${escapeHtml(evt.title)}</span>
        </nav>
        <div class="detail-head">
          <div>
            ${statusBannerHtml(evt, canManage)}
            <div class="detail-tags">
              ${categoryBadge(evt.category)}
              ${formatBadge(evt)}
              ${evt.status !== "published" ? statusBadge(evt.status) : ""}
            </div>
            <h1 class="detail-title">${escapeHtml(evt.title)}</h1>
            <p class="detail-lede">${escapeHtml(evt.shortDesc)}</p>
            <div class="key-facts">
              ${factHtml("calendar", "Thời gian", `${formatDateLong(evt.start)}<br/>${timeRangeText(evt)}`)}
              ${factHtml(evt.format === "online" ? "monitor" : "map-pin", evt.format === "online" ? "Hình thức" : "Địa điểm", escapeHtml(evt.location))}
              ${factHtml("building", "Đơn vị tổ chức", escapeHtml(unit.name))}
            </div>
          </div>
          ${detailCoverHtml(evt)}
        </div>
      </div>
    </section>

    <section class="detail-body">
      <div class="container">
        <div class="detail-layout">
          <div class="detail-main">
            <section class="detail-section" aria-labelledby="about-title">
              <h2 id="about-title">Giới thiệu</h2>
              <div class="prose">${escapeHtml(evt.fullDesc)}</div>
            </section>
            <section class="detail-section" aria-labelledby="org-title">
              <h2 id="org-title">Đơn vị tổ chức</h2>
              <div class="org-row">
                <span class="icon-cell">${icon(unit.logo, 20)}</span>
                <div>
                  <a class="text-link" href="events.html?unit=${unit.id}">${escapeHtml(unit.name)}</a>
                  ${unit.description ? `<p>${escapeHtml(unit.description)}</p>` : ""}
                  <p>Liên hệ: ${escapeHtml(evt.contact)}</p>
                </div>
              </div>
            </section>
            ${reviewsSectionHtml(evt, session)}
          </div>

          <aside class="reg-panel" id="reg-panel" aria-labelledby="reg-title">
            <div class="reg-panel-head">
              <div>
                <h2 id="reg-title">Đăng ký tham gia</h2>
                <div class="reg-status">${availabilityHtml(evt)}</div>
              </div>
              ${!session || isStudent
                ? `<button type="button" class="icon-btn interest-btn" id="btn-interest" aria-pressed="${!!interested}" aria-label="${interested ? "Bỏ quan tâm sự kiện" : "Quan tâm sự kiện"}" title="${interested ? "Bỏ quan tâm" : "Quan tâm — nhận nhắc lịch"}">${icon("heart", 20)}</button>`
                : ""}
            </div>
            <p class="reg-deadline">Hạn đăng ký: <strong>${fmtDT(evt.deadline)}</strong></p>
            ${evt.status === "published" ? seatMeterHtml(evt) : ""}

            <div class="ticket-actions">
              ${ticketActionsHtml(evt, session, reg)}
              ${canManage && ["published", "ended"].includes(evt.status) ? `<a class="btn btn-outline btn-block" href="dashboard.html?event=${evt.id}#attendance">${icon("clipboard-check", 18)} Danh sách đăng ký & điểm danh</a>` : ""}
            </div>

            ${shareRowHtml(evt)}

            <div class="reg-info">
              ${infoRowHtml("users", "Số lượng tối đa", `${evt.capacity} người`)}
              ${onlineLinkRowHtml(evt, reg, canManage)}
              ${infoRowHtml("mail", "Liên hệ", escapeHtml(evt.contact))}
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="section" id="related-section" hidden aria-labelledby="related-title">
      <div class="container">
        <div class="section-head">
          <h2 id="related-title">Sự kiện liên quan</h2>
          <a class="link-more" href="events.html?category=${evt.category}">Cùng danh mục</a>
        </div>
        <div class="card-grid" id="related-grid"></div>
      </div>
    </section>

    ${mobileCtaHtml(evt, session, reg)}
  `;

  bindDetailActions(evt, session, reg);
  setupMobileCta();
  startTimeCard(evt);

  /* Sự kiện liên quan: cùng danh mục hoặc cùng đơn vị */
  const related = EventService.publicList()
    .filter((e) => e.id !== evt.id && !isPast(e.end) && (e.category === evt.category || e.unitId === evt.unitId))
    .sort((a, b) => (b.category === evt.category) - (a.category === evt.category) || a.start.localeCompare(b.start))
    .slice(0, 3);
  if (related.length) {
    document.getElementById("related-section").hidden = false;
    document.getElementById("related-grid").innerHTML = related.map((e) => eventCardHtml(e)).join("");
  }
}

/* ---- Khối thời gian / đếm ngược (thay ảnh bìa khi không có ảnh) --------- */
function detailCoverHtml(evt) {
  const cat = getCategory(evt.category);
  const hasImg = !!evt.cover;
  return `
    <div class="detail-cover ${hasImg ? "has-img" : ""}">
      <div class="time-card" id="time-card" data-color="${cat.color}" data-phase="${eventPhase(evt).key}" ${hasImg ? 'aria-hidden="true"' : ""}>${timeCardInner(evt)}</div>
      ${hasImg ? coverImgHtml(evt, true) : ""}
    </div>`;
}

function timeCardInner(evt) {
  const phase = eventPhase(evt);
  const start = validDT(evt.start);
  const end = validDT(evt.end);
  let main = "";
  if (phase.key === "upcoming") {
    const c = countdownText(start);
    main = c.value === "Sắp bắt đầu"
      ? `<span class="tc-value tc-text">Sắp bắt đầu</span>`
      : `<span class="tc-kicker">Bắt đầu sau</span><span class="tc-value">${c.value}</span>${c.unit ? `<span class="tc-unit">${c.unit}</span>` : ""}`;
  } else if (phase.key === "ongoing") {
    const pct = Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
    main = `<span class="tc-kicker">Kết thúc lúc</span><span class="tc-value">${fmtTime(evt.end)}</span>
      <span class="tc-progress"><span class="bar"><span style="width:${pct}%"></span></span><span>Đã diễn ra ${pct}%</span></span>`;
  } else if (phase.key === "started") {
    main = `<span class="tc-kicker">Bắt đầu lúc</span><span class="tc-value">${fmtTime(evt.start)}</span>`;
  } else if (phase.key === "ended") {
    main = `<span class="tc-value tc-text">Sự kiện đã kết thúc</span>`;
  } else if (phase.key === "cancelled" || phase.key === "removed") {
    main = `<span class="tc-value tc-text">Sự kiện ${phase.key === "cancelled" ? "đã bị hủy" : "đã bị gỡ"}</span>`;
  } else {
    main = `<span class="tc-value tc-text">Chưa có thời gian tổ chức</span>`;
  }
  const date = start
    ? `<strong>${formatDateLong(evt.start)}</strong><span>${end && evt.end > evt.start ? timeRangeText(evt) : `Từ ${fmtTime(evt.start)}`}</span>`
    : `<strong>Chưa xác định</strong>`;
  return `
    <div class="tc-top"><span class="tc-phase">${phase.label}</span>${icon("calendar", 20)}</div>
    <div class="tc-main">${main}</div>
    <div class="tc-date">${date}</div>`;
}

function startTimeCard(evt) {
  stopTimeCard();
  TIME_TICK = () => {
    const el = document.getElementById("time-card");
    if (!el) return stopTimeCard();
    el.innerHTML = timeCardInner(evt);
    el.dataset.phase = eventPhase(evt).key;
  };
  TIME_TIMER = setInterval(TIME_TICK, 60000);
}
function stopTimeCard() {
  clearInterval(TIME_TIMER);
  TIME_TIMER = null;
  TIME_TICK = null;
}

/* ---- Thêm vào lịch (.ics, RFC 5545) & sao chép liên kết ------------------ */
function eventShareUrl(evt) {
  // Đường dẫn tương đối với trang hiện tại → đúng cả khi deploy trong thư mục con
  const u = new URL("event-detail.html", window.location.href);
  u.search = "?id=" + encodeURIComponent(evt.id);
  return u.href;
}

function icsBlockReason(evt) {
  const phase = eventPhase(evt);
  if (phase.key === "cancelled") return "Sự kiện đã bị hủy nên không thể thêm vào lịch.";
  if (phase.key === "removed") return "Sự kiện đã bị gỡ nên không thể thêm vào lịch.";
  if (phase.key === "ended") return "Sự kiện đã kết thúc.";
  if (phase.key === "unknown") return "Sự kiện chưa có thời gian hợp lệ.";
  return "";
}

function shareRowHtml(evt) {
  const reason = icsBlockReason(evt);
  return `
    <div class="share-row">
      <button type="button" class="btn btn-outline btn-sm" id="btn-add-calendar" ${reason ? "disabled" : ""}>${icon("calendar-plus", 16)} Thêm vào lịch</button>
      <button type="button" class="btn btn-outline btn-sm" id="btn-copy-link">${icon("copy", 16)} Sao chép liên kết</button>
    </div>
    ${reason ? `<p class="field-hint share-hint">${reason}</p>` : `<p class="field-hint share-hint">Tải tệp .ics để mở bằng Google Calendar, Outlook hoặc Lịch — không tạo phiếu đăng ký.</p>`}`;
}

function icsEscape(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}
// Thời điểm địa phương → UTC dạng 20261027T070000Z
function icsUtc(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
// Gập dòng dài hơn 75 octet (UTF-8); không cắt giữa một ký tự
function icsFold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (len + b > 75) {
      out.push(cur);
      cur = " ";
      len = 1;
    }
    cur += ch;
    len += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

function buildIcs(evt, url, now = new Date()) {
  const start = validDT(evt.start);
  if (!start) return { ok: false, error: "Sự kiện chưa có thời gian bắt đầu hợp lệ nên không thể tạo tệp lịch." };
  const end = validDT(evt.end);
  const desc = [evt.shortDesc, `Đơn vị tổ chức: ${EventService.unitName(evt)}`, `Chi tiết: ${url}`].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NEU Event Portal//Su kien NEU//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evt.id}@neu-event-portal`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsUtc(start)}`,
    // Không tự bịa giờ kết thúc khi dữ liệu thiếu
    ...(end && end > start ? [`DTEND:${icsUtc(end)}`] : []),
    `SUMMARY:${icsEscape(evt.title)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    // Sự kiện trực tuyến: không đưa đường dẫn tham gia (chỉ dành cho người đã đăng ký)
    `LOCATION:${icsEscape(evt.location)}`,
    `URL:${url}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return { ok: true, data: lines.map(icsFold).join("\r\n") + "\r\n" };
}

function icsFilename(evt) {
  const slug = evt.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${slug || "su-kien"}.ics`;
}

function downloadIcs(evt) {
  const r = buildIcs(evt, eventShareUrl(evt));
  if (!r.ok) return showToast(r.error);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([r.data], { type: "text/calendar;charset=utf-8" }));
  a.download = icsFilename(evt);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast("Đã tải tệp lịch " + a.download);
}

async function copyEventLink(evt) {
  const url = eventShareUrl(evt);
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API không khả dụng");
    await navigator.clipboard.writeText(url);
    showToast("Đã sao chép liên kết");
  } catch (err) {
    // Không sao chép được tự động: cho người dùng tự chọn và sao chép
    openModal({
      title: "Sao chép liên kết",
      submitLabel: "",
      cancelLabel: "Đóng",
      body: `
        <p class="field-hint">Trình duyệt không cho phép sao chép tự động. Hãy chọn liên kết dưới đây và nhấn Ctrl + C (hoặc ⌘ + C).</p>
        <div class="field">
          <label for="share-url">Liên kết sự kiện</label>
          <input type="text" id="share-url" readonly value="${escapeHtml(url)}" />
        </div>`,
      onOpen: (form) => {
        const input = form.querySelector("#share-url");
        input.addEventListener("focus", () => input.select());
      },
    });
  }
}

/* ---- Các khối giao diện -------------------------------------------------- */
function factHtml(ic, label, valueHtml) {
  return `<div class="fact"><span class="fi">${icon(ic, 18)}</span><div><small>${label}</small><strong>${valueHtml}</strong></div></div>`;
}
function infoRowHtml(ic, label, valueHtml) {
  return `<div class="info-row">${icon(ic, 18)}<span><span class="lbl">${label}</span><span class="val">${valueHtml}</span></span></div>`;
}

function statusBannerHtml(evt, canManage) {
  const n = (cls, ic, html) => `<div class="notice ${cls}" role="status">${icon(ic, 18)}<span>${html}</span></div>`;
  if (evt.status === "draft") return n("notice-info", "file", "<strong>Bản nháp</strong> — sự kiện chưa được gửi duyệt và chỉ đơn vị tổ chức nhìn thấy.");
  if (evt.status === "pending") return n("notice-warn", "hourglass", "<strong>Đang chờ duyệt</strong> — sự kiện sẽ hiển thị công khai sau khi được phê duyệt.");
  if (evt.status === "rejected")
    return n("notice-error", "x-circle", `<strong>Bị từ chối.</strong> Lý do: ${escapeHtml(evt.rejectReason)}${canManage ? " Hãy chỉnh sửa và gửi duyệt lại trong Trang quản lý." : ""}`);
  if (evt.status === "cancelled") return n("notice-error", "ban", `<strong>Sự kiện đã bị hủy.</strong> ${escapeHtml(evt.cancelReason)}`);
  if (evt.status === "removed") return n("notice-error", "shield", `<strong>Sự kiện đã bị gỡ do vi phạm.</strong> ${escapeHtml(evt.removeReason)}`);
  if (evt.status === "ended") return n("", "check-circle", "<strong>Sự kiện đã kết thúc.</strong> Cảm ơn các bạn đã tham gia!");
  return "";
}

function seatMeterHtml(evt) {
  const left = RegService.seatsLeft(evt);
  const taken = evt.capacity - left;
  const pct = Math.min(100, Math.round((taken / evt.capacity) * 100));
  const cls = left === 0 ? "full" : left <= Math.max(5, Math.floor(evt.capacity * 0.1)) ? "warn" : "";
  return `
    <div class="seat-meter">
      <div class="bar" role="progressbar" aria-label="Số chỗ đã đăng ký" aria-valuemin="0" aria-valuemax="${evt.capacity}" aria-valuenow="${taken}"><span class="${cls}" style="width:${pct}%"></span></div>
      <div class="txt"><span>${taken}/${evt.capacity} đã đăng ký</span><strong>${left === 0 ? "Hết chỗ" : `Còn ${left} chỗ`}</strong></div>
    </div>`;
}

function ticketActionsHtml(evt, session, reg) {
  if (reg && reg.status === "registered") {
    return `
      <div class="my-ticket">
        ${qrSvg(reg.code, 64)}
        <div>
          <small>Bạn đã đăng ký · Mã vé</small>
          <div class="code">${reg.code}</div>
          <small>Xuất trình mã này khi điểm danh</small>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="btn-show-ticket">${icon("qr", 18)} Xem vé QR</button>
      ${RegService.canCancel(reg, evt)
        ? `<button type="button" class="btn btn-danger-outline btn-block" id="btn-cancel-reg">Hủy đăng ký</button>`
        : `<p class="field-hint">Đã quá hạn đăng ký nên không thể hủy.</p>`}`;
  }
  if (reg && reg.status === "attended") {
    return `<div class="notice notice-ok">${icon("check-circle", 18)}<span>Bạn đã tham dự — điểm danh lúc ${fmtDT(reg.checkinAt)}.</span></div>
      ${ReviewService.canReview(session, evt) ? `<a class="btn btn-primary btn-block" href="#reviews">${icon("star", 18)} Đánh giá sự kiện</a>` : ""}`;
  }
  if (reg && reg.status === "absent") {
    return `<div class="notice">${icon("info", 18)}<span>Bạn đã đăng ký nhưng không điểm danh tại sự kiện (Vắng mặt).</span></div>`;
  }

  if (!session) {
    if (evt.status !== "published" || nowDT() >= evt.deadline) return `<button type="button" class="btn btn-block" disabled>${availability(evt).text}</button>`;
    return `<a class="btn btn-primary btn-block" href="login.html?next=${encodeURIComponent("event-detail.html?id=" + evt.id)}">Đăng nhập để đăng ký</a>
      <p class="field-hint">Chưa có tài khoản? <a class="text-link" href="register.html">Đăng ký sinh viên</a></p>`;
  }
  if (session.role !== "student") return `<p class="field-hint">Chỉ tài khoản Sinh viên mới đăng ký được sự kiện.</p>`;

  const reason = RegService.blockReason(session, evt);
  if (reason) return `<button type="button" class="btn btn-block" disabled>${reason.replace(/\.$/, "")}</button>`;
  return `<button type="button" class="btn btn-primary btn-block" id="btn-register">Đăng ký ngay</button>`;
}

function onlineLinkRowHtml(evt, reg, canManage) {
  if (evt.format !== "online") return "";
  const canSee = canManage || (reg && reg.status !== "cancelled");
  return infoRowHtml(
    "link",
    "Đường dẫn tham gia",
    canSee ? `<a href="${escapeHtml(evt.onlineUrl)}" target="_blank" rel="noopener">${escapeHtml(evt.onlineUrl)}</a>` : "Hiển thị sau khi đăng ký thành công"
  );
}

/* Thanh CTA cố định trên mobile — chỉ hiện khi có thao tác thực sự khả dụng */
function mobileCtaHtml(evt, session, reg) {
  let info = "";
  let btn = "";
  if (reg && reg.status === "registered") {
    info = `<strong>Bạn đã đăng ký</strong>Mã vé ${reg.code}`;
    btn = `<button type="button" class="btn btn-primary" id="btn-show-ticket-m">${icon("qr", 18)} Xem vé</button>`;
  } else if (reg && reg.status === "attended" && ReviewService.canReview(session, evt)) {
    info = `<strong>Bạn đã tham dự</strong>Chia sẻ cảm nhận của bạn`;
    btn = `<a class="btn btn-primary" href="#reviews">Đánh giá</a>`;
  } else if (!reg && evt.status === "published" && nowDT() < evt.deadline && RegService.seatsLeft(evt) > 0) {
    info = `<strong>Còn ${RegService.seatsLeft(evt)} chỗ</strong>Hạn ${fmtDT(evt.deadline)}`;
    if (!session) btn = `<a class="btn btn-primary" href="login.html?next=${encodeURIComponent("event-detail.html?id=" + evt.id)}">Đăng nhập để đăng ký</a>`;
    else if (!RegService.blockReason(session, evt)) btn = `<button type="button" class="btn btn-primary" id="btn-register-m">Đăng ký ngay</button>`;
  }
  return btn ? `<div class="mobile-cta" id="mobile-cta"><div class="mc-info">${info}</div>${btn}</div>` : "";
}

function setupMobileCta() {
  if (CTA_OBSERVER) CTA_OBSERVER.disconnect();
  const bar = document.getElementById("mobile-cta");
  document.body.classList.toggle("has-mobile-cta", !!bar);
  if (!bar || !("IntersectionObserver" in window)) return;
  // Ẩn thanh cố định khi khung đăng ký đang nằm trong màn hình để không lặp nút
  CTA_OBSERVER = new IntersectionObserver(([entry]) => {
    bar.hidden = entry.isIntersecting;
  });
  CTA_OBSERVER.observe(document.querySelector("#reg-panel .ticket-actions"));
}

function reviewsSectionHtml(evt, session) {
  const reviews = ReviewService.byEvent(evt.id);
  const canReview = ReviewService.canReview(session, evt);
  if (evt.status !== "ended" && !reviews.length) return "";
  const avg = ReviewService.average(evt.id);

  return `
    <section class="detail-section" id="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Đánh giá từ người tham dự</h2>
      ${reviews.length
        ? `<div class="rating-summary"><span class="big">${avg.toFixed(1)}</span><div>${starsHtml(avg, 18)}<div class="field-hint">${reviews.length} lượt đánh giá</div></div></div>`
        : `<p class="field-hint" style="margin-bottom:16px">Chưa có đánh giá nào.</p>`}
      ${canReview ? `
        <form id="review-form" class="review-form">
          <fieldset>
            <legend>Bạn chấm sự kiện mấy sao?</legend>
            <div class="star-input">
              ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="stars" id="star-${n}" value="${n}"/><label for="star-${n}" title="${n} sao"><span class="sr-only">${n} sao</span>${icon("star", 28)}</label>`).join("")}
            </div>
          </fieldset>
          <div class="field">
            <label for="review-comment">Nhận xét (không bắt buộc)</label>
            <textarea id="review-comment" placeholder="Chia sẻ cảm nhận của bạn"></textarea>
          </div>
          <p class="form-error" id="review-error" role="alert"></p>
          <button class="btn btn-primary" type="submit">Gửi đánh giá</button>
        </form>` : ""}
      ${reviews
        .map((r) => {
          const u = UserStore.getById(r.studentId) || { name: "Sinh viên" };
          return `<div class="review-item">
            ${avatarHtml(u, 36)}
            <div>
              <div class="who">${escapeHtml(u.name)}</div>
              <div>${starsHtml(r.stars, 14)} <span class="when">· ${timeAgo(r.createdAt)}</span></div>
              ${r.comment ? `<p>${escapeHtml(r.comment)}</p>` : ""}
            </div>
          </div>`;
        })
        .join("")}
    </section>`;
}

/* ---- Hành động ----------------------------------------------------------- */
function bindDetailActions(evt, session, reg) {
  const $ = (id) => document.getElementById(id);

  if ($("btn-add-calendar")) $("btn-add-calendar").addEventListener("click", () => downloadIcs(evt));
  $("btn-copy-link").addEventListener("click", () => copyEventLink(evt));

  if ($("btn-interest")) {
    $("btn-interest").addEventListener("click", () => {
      if (!session) {
        window.location.href = "login.html?next=" + encodeURIComponent("event-detail.html?id=" + evt.id);
        return;
      }
      const r = InterestService.toggle(session, evt.id);
      if (!r.ok) return showToast(r.error);
      renderDetail();
      $("btn-interest").focus();
      showToast(r.data ? "Đã thêm vào danh sách quan tâm. Bạn sẽ được nhắc lịch trước 24 giờ." : "Đã bỏ quan tâm sự kiện.");
    });
  }

  const startRegister = () => {
    const conflicts = RegService.conflicts(session.id, evt);
    if (!conflicts.length) return doRegister(evt, session);
    openModal({
      title: "Trùng lịch sự kiện",
      submitLabel: "Vẫn đăng ký",
      body: `
        <div class="notice notice-warn">${icon("alert", 18)}<span>Thời gian sự kiện này trùng với ${conflicts.length} sự kiện bạn đã đăng ký:</span></div>
        ${conflicts.map((c) => `<div class="kv-row"><span>${escapeHtml(c.title)}</span><span>${formatDateShort(c.start)} · ${timeRangeText(c)}</span></div>`).join("")}
        <p class="field-hint">Bạn vẫn có thể tiếp tục đăng ký nếu sắp xếp được thời gian.</p>`,
      onSubmit: () => {
        // Đóng hộp thoại cảnh báo trước khi mở hộp thoại kết quả
        setTimeout(() => doRegister(evt, session));
      },
    });
  };
  ["btn-register", "btn-register-m"].forEach((id) => $(id) && $(id).addEventListener("click", startRegister));
  ["btn-show-ticket", "btn-show-ticket-m"].forEach((id) => $(id) && $(id).addEventListener("click", () => openTicketModal(reg, evt)));

  if ($("btn-cancel-reg")) {
    $("btn-cancel-reg").addEventListener("click", () => {
      if (!confirm(`Hủy đăng ký "${evt.title}"? Chỗ của bạn sẽ được trả lại cho sinh viên khác.`)) return;
      const r = RegService.cancel(session, reg.id);
      renderChrome("events");
      renderDetail();
      showToast(r.ok ? "Đã hủy đăng ký." : r.error);
    });
  }

  if ($("review-form")) {
    $("review-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const stars = +(document.querySelector('input[name="stars"]:checked') || {}).value || 0;
      const r = ReviewService.add(session, evt.id, stars, $("review-comment").value);
      if (!r.ok) {
        $("review-error").textContent = r.error;
        return;
      }
      renderDetail();
      showToast("Cảm ơn bạn đã đánh giá!");
    });
  }
}

function doRegister(evt, session) {
  const r = RegService.register(session, evt.id);
  if (!r.ok) return showToast(r.error);
  renderChrome("events");
  renderDetail();
  openModal({
    title: "Đăng ký thành công",
    submitLabel: null,
    body: `
      <div class="ticket-big">
        ${qrSvg(r.data.code, 180)}
        <div class="code">${r.data.code}</div>
        <p>Email xác nhận đã được gửi tới <strong>${escapeHtml(session.email)}</strong>.<br/>Vé luôn có trong mục <a class="text-link" href="my-events.html">Hoạt động của tôi</a>.</p>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Đã hiểu</button></div>`,
  });
}

function openTicketModal(reg, evt) {
  openModal({
    title: "Vé tham dự",
    submitLabel: null,
    body: `
      <div class="ticket-big">
        <strong>${escapeHtml(evt.title)}</strong>
        <p style="margin-top:4px">${formatDateLong(evt.start)} · ${timeRangeText(evt)}</p>
        ${qrSvg(reg.code, 200)}
        <div class="code">${reg.code}</div>
        <p>Đưa mã QR này cho Ban tổ chức quét khi điểm danh.</p>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Đóng</button></div>`,
  });
}
