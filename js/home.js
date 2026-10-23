/* ==========================================================================
   home.js — Logic trang chủ
   ========================================================================== */

/* Độ rộng (trên lưới 6 cột) của từng thẻ nổi bật: 3 thẻ mỗi hàng,
   hàng cuối thiếu thì chia đều để không hụt cột. 1 thẻ → thẻ ngang. */
function featuredSpans(n) {
  if (n === 1) return [6];
  const spans = Array(n).fill(2);
  if (n % 3 === 2) spans[n - 1] = spans[n - 2] = 3;
  if (n % 3 === 1) for (let i = n - 4; i < n; i++) spans[i] = 3;
  return spans;
}

function featuredGridHtml(list) {
  const spans = featuredSpans(list.length);
  return list.map((e, i) => eventCardHtml(e, { featured: spans[i] === 6, extraClass: `span-${spans[i]}` })).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome("home");

  const categories = CategoryStore.getAll();
  const published = EventService.publicList().filter((e) => !isPast(e.end));
  const byStart = (a, b) => a.start.localeCompare(b.start);
  const openForReg = published.filter((e) => nowDT() < e.deadline && RegService.seatsLeft(e) > 0);

  /* Tìm kiếm */
  document.getElementById("hero-search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("hero-search-input").value.trim();
    window.location.href = "events.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });

  /* Chip danh mục (chỉ danh mục đang có sự kiện) */
  const counted = categories.map((c) => ({ c, n: published.filter((e) => e.category === c.id).length }));
  document.getElementById("hero-pills").innerHTML =
    `<a class="cat-chip" href="events.html">Tất cả <span class="count">${published.length}</span></a>` +
    counted
      .filter(({ n }) => n > 0)
      .map(({ c, n }) => `<a class="cat-chip" href="events.html?category=${c.id}">${icon(c.icon, 16)} ${escapeHtml(c.name)} <span class="count">${n}</span></a>`)
      .join("");

  /* Số liệu nhỏ gọn, tính từ dữ liệu thật */
  const stat = (n, label) => `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`;
  document.getElementById("hero-stats").innerHTML =
    stat(published.length, "Sắp diễn ra") + stat(openForReg.length, "Đang mở đăng ký") + stat(UnitStore.getAll().length, "Đơn vị tổ chức");

  /* Sự kiện nổi bật: một sự kiện ở hero, các sự kiện còn lại ở mục "Nổi bật" */
  const featured = published.filter((e) => e.featured).sort(byStart);
  const heroEvt = featured[0] || openForReg.sort(byStart)[0];
  if (heroEvt) {
    document.getElementById("hero-feature").innerHTML = `<span class="label">Sắp diễn ra nổi bật</span>${eventCardHtml(heroEvt, { eager: true })}`;
  } else {
    document.getElementById("hero-feature").remove();
    document.getElementById("hero-grid").classList.add("single");
  }

  const rest = (featured.length ? featured : [...published].sort(byStart)).filter((e) => !heroEvt || e.id !== heroEvt.id).slice(0, 4);
  const featuredEl = document.getElementById("featured-rail");
  if (rest.length) featuredEl.innerHTML = featuredGridHtml(rest);
  else featuredEl.closest("section").remove();

  /* 7 ngày tới — đúng khoảng thời gian, gần nhất trước */
  const weekEnd = relDT(7, "23:59");
  const week = published.filter((e) => e.start <= weekEnd).sort(byStart);
  document.getElementById("upcoming-grid").innerHTML = week.length
    ? week.slice(0, 8).map((e) => eventRowHtml(e)).join("")
    : `<div class="grid-full">${emptyStateHtml("calendar", "Không có sự kiện trong 7 ngày tới", "Xem các sự kiện xa hơn trong danh sách.", `<a class="btn btn-outline" href="events.html">Xem tất cả sự kiện</a>`)}</div>`;
  if (week.length > 8) document.getElementById("week-sub").textContent = `Hiển thị 8 / ${week.length} sự kiện gần nhất.`;

  /* CTA theo vai trò */
  const session = SessionStore.current();
  const cta = document.getElementById("cta-btn");
  if (session && session.role !== "student") {
    cta.textContent = "Vào trang quản lý";
    cta.href = "dashboard.html";
  }
});
