/* ==========================================================================
   events.js — Danh sách sự kiện: tìm kiếm + lọc + sắp xếp
   Chỉ hiển thị sự kiện ở trạng thái Đã đăng và chưa kết thúc.
   Desktop: bộ lọc áp dụng ngay. Mobile: bộ lọc mở dạng bottom sheet, lựa chọn
   chỉ được áp dụng khi bấm "Xem N kết quả"; đóng sheet sẽ bỏ lựa chọn chưa áp dụng.
   ========================================================================== */

const SORT_OPTIONS = [
  ["date-asc", "Gần nhất trước"],
  ["date-desc", "Xa nhất trước"],
  ["seats-desc", "Còn nhiều chỗ nhất"],
  ["name-asc", "Tên A → Z"],
];
const TIME_LABELS = { week: "7 ngày tới", month: "Tháng này", custom: "Khoảng ngày" };
const DEFAULT_FILTERS = { categories: [], unit: "", timeframe: "all", from: "", to: "", format: "all", availableOnly: false, openOnly: false };

const mobileQuery = window.matchMedia("(max-width: 960px)");

/* Kiểu hiển thị (lưới / danh sách): key riêng, không thuộc dữ liệu nghiệp vụ */
const VIEW_KEY = "neu_ui_events_view";
function loadView() {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch (e) {
    return "grid";
  }
}
function saveView(v) {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch (e) { /* localStorage không khả dụng: chỉ giữ trong phiên */ }
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome("events");

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const time = params.get("time");

  // Bộ lọc đang áp dụng; q và sort luôn áp dụng ngay
  let state = {
    ...DEFAULT_FILTERS,
    q: params.get("q") || "",
    categories: params.get("category") ? [params.get("category")] : [],
    unit: params.get("unit") || "",
    timeframe: ["week", "month"].includes(time) ? time : "all",
    sort: "date-asc",
  };
  let sheetOpen = false;
  let view = loadView();

  /* Dựng bộ lọc */
  const categories = CategoryStore.getAll();
  $("filter-categories").innerHTML = categories
    .map((c) => `<label class="filter-check"><input type="checkbox" value="${c.id}"/> ${icon(c.icon, 16)} ${escapeHtml(c.name)}</label>`)
    .join("");
  $("filter-unit").innerHTML += UnitStore.getAll().map((u) => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("");
  const sortHtml = SORT_OPTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  $("sort-select").innerHTML = sortHtml;
  $("sort-select-m").innerHTML = sortHtml;

  function readFilters() {
    return {
      categories: [...$("filter-categories").querySelectorAll("input:checked")].map((i) => i.value),
      unit: $("filter-unit").value,
      timeframe: document.querySelector('input[name="timeframe"]:checked').value,
      from: $("filter-from").value,
      to: $("filter-to").value,
      format: document.querySelector('input[name="format"]:checked').value,
      availableOnly: $("filter-available").checked,
      openOnly: $("filter-open").checked,
    };
  }

  function writeFilters(f) {
    $("filter-categories").querySelectorAll("input").forEach((i) => (i.checked = f.categories.includes(i.value)));
    $("filter-unit").value = f.unit;
    document.querySelector(`input[name="timeframe"][value="${f.timeframe}"]`).checked = true;
    $("filter-from").value = f.from;
    $("filter-to").value = f.to;
    document.querySelector(`input[name="format"][value="${f.format}"]`).checked = true;
    $("filter-available").checked = f.availableOnly;
    $("filter-open").checked = f.openOnly;
    $("custom-range").hidden = f.timeframe !== "custom";
    syncGroups(f, true);
  }

  /* Nhóm bộ lọc thu gọn: hiện số lựa chọn đang chọn, tự mở nếu có lựa chọn */
  function syncGroups(f, autoOpen) {
    const counts = {
      "fg-category": f.categories.length,
      "fg-time": f.timeframe !== "all" ? 1 : 0,
      "fg-unit": f.unit ? 1 : 0,
      "fg-format": f.format !== "all" ? 1 : 0,
      "fg-status": (f.availableOnly ? 1 : 0) + (f.openOnly ? 1 : 0),
    };
    Object.entries(counts).forEach(([id, n]) => {
      const g = $(id);
      const badge = g.querySelector(".group-count");
      badge.hidden = !n;
      badge.textContent = n ? `${n} đang chọn` : "";
      if (autoOpen && n) g.open = true;
    });
  }

  function applyFilters(s) {
    let list = EventService.publicList().filter((e) => !isPast(e.end));

    if (s.q) {
      const q = s.q.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          EventService.unitName(e).toLowerCase().includes(q) ||
          e.shortDesc.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          getCategory(e.category).name.toLowerCase().includes(q)
      );
    }
    if (s.categories.length) list = list.filter((e) => s.categories.includes(e.category));
    if (s.unit) list = list.filter((e) => e.unitId === s.unit);
    if (s.format !== "all") list = list.filter((e) => e.format === s.format);
    if (s.availableOnly) list = list.filter((e) => RegService.seatsLeft(e) > 0);
    if (s.openOnly) list = list.filter((e) => nowDT() < e.deadline);

    if (s.timeframe !== "all") {
      const now = new Date();
      let from = toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      let to = "9999";
      if (s.timeframe === "week") to = relDT(7, "23:59");
      if (s.timeframe === "month") to = toLocalDT(new Date(now.getFullYear(), now.getMonth() + 1, 1));
      if (s.timeframe === "custom") {
        from = s.from ? s.from + "T00:00" : "0000";
        to = s.to ? s.to + "T23:59" : "9999";
      }
      list = list.filter((e) => e.start >= from && e.start <= to);
    }

    list.sort((a, b) => {
      if (s.sort === "date-asc") return a.start.localeCompare(b.start);
      if (s.sort === "date-desc") return b.start.localeCompare(a.start);
      if (s.sort === "name-asc") return a.title.localeCompare(b.title, "vi");
      if (s.sort === "seats-desc") return RegService.seatsLeft(b) - RegService.seatsLeft(a);
      return 0;
    });
    return list;
  }

  /* Các bộ lọc đang áp dụng, mỗi mục có cách gỡ bỏ */
  function activeFilters(s) {
    const items = [];
    if (s.q) items.push({ label: `"${s.q}"`, clear: () => { state.q = ""; $("search-input").value = ""; } });
    s.categories.forEach((id) => items.push({ label: getCategory(id).name, clear: () => (state.categories = state.categories.filter((c) => c !== id)) }));
    if (s.unit) items.push({ label: getUnit(s.unit).name, clear: () => (state.unit = "") });
    if (s.timeframe !== "all") {
      const range = s.timeframe === "custom" ? `${s.from ? fmtDT(s.from + "T00:00").slice(0, 10) : "…"} – ${s.to ? fmtDT(s.to + "T00:00").slice(0, 10) : "…"}` : TIME_LABELS[s.timeframe];
      items.push({ label: range, clear: () => Object.assign(state, { timeframe: "all", from: "", to: "" }) });
    }
    if (s.format !== "all") items.push({ label: s.format === "online" ? "Trực tuyến" : "Trực tiếp", clear: () => (state.format = "all") });
    if (s.availableOnly) items.push({ label: "Còn chỗ", clear: () => (state.availableOnly = false) });
    if (s.openOnly) items.push({ label: "Còn hạn đăng ký", clear: () => (state.openOnly = false) });
    return items;
  }

  function render() {
    const results = applyFilters(state);
    $("result-count").innerHTML = `<strong>${results.length}</strong> sự kiện phù hợp`;

    const active = activeFilters(state);
    $("active-filters").innerHTML = active.length
      ? active.map((f, i) => `<button type="button" class="filter-pill" data-clear="${i}" aria-label="Bỏ lọc ${escapeHtml(f.label)}">${escapeHtml(f.label)} ${icon("x", 14)}</button>`).join("") +
        `<button type="button" class="clear-all" id="btn-clear-all">Xóa tất cả</button>`
      : "";
    $("active-filters").querySelectorAll("[data-clear]").forEach((b) =>
      b.addEventListener("click", () => {
        active[+b.dataset.clear].clear();
        writeFilters(state);
        render();
        const next = $("active-filters").querySelector("button") || $("search-input");
        next.focus();
      })
    );
    if ($("btn-clear-all")) $("btn-clear-all").addEventListener("click", () => clearAll(true));

    const filterCount = active.length - (state.q ? 1 : 0);
    $("filter-count").hidden = !filterCount;
    $("filter-count").textContent = filterCount;

    const grid = $("events-grid");
    grid.className = view === "list" ? "event-rows" : "card-grid";
    grid.innerHTML = results.length
      ? results.map((e) => (view === "list" ? eventRowHtml(e, { showUnit: true }) : eventCardHtml(e))).join("")
      : `<div class="grid-full">${emptyStateHtml(
          "search",
          "Không tìm thấy sự kiện phù hợp",
          active.length ? "Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm." : "Hiện chưa có sự kiện nào đang mở.",
          active.length ? `<div class="actions"><button type="button" class="btn btn-primary" id="btn-empty-clear">Xóa bộ lọc</button></div>` : ""
        )}</div>`;
    if ($("btn-empty-clear")) $("btn-empty-clear").addEventListener("click", () => clearAll(true));
  }

  function clearAll(includeQuery) {
    state = { ...state, ...DEFAULT_FILTERS, categories: [] };
    if (includeQuery) {
      state.q = "";
      $("search-input").value = "";
    }
    writeFilters(state);
    render();
  }

  /* Bộ lọc thay đổi */
  function onFilterChange() {
    $("custom-range").hidden = document.querySelector('input[name="timeframe"]:checked').value !== "custom";
    syncGroups(readFilters(), false);
    if (sheetOpen) {
      updateApplyLabel();
      return;
    }
    state = { ...state, ...readFilters() };
    render();
  }
  $("filter-inner").addEventListener("change", onFilterChange);
  $("btn-clear-filters").addEventListener("click", () => clearAll(false));

  /* Lưới / Danh sách: cùng một tập kết quả, không đụng tới bộ lọc */
  const viewBtns = [$("btn-view-grid"), $("btn-view-list")];
  function syncViewBtns() {
    viewBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  }
  viewBtns.forEach((b) =>
    b.addEventListener("click", () => {
      if (view === b.dataset.view) return;
      view = b.dataset.view;
      saveView(view);
      syncViewBtns();
      render();
    })
  );
  syncViewBtns();

  /* Tìm kiếm & sắp xếp: luôn áp dụng ngay */
  $("search-input").value = state.q;
  $("search-input").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    render();
  });
  $("toolbar-form").addEventListener("submit", (e) => e.preventDefault());
  [$("sort-select"), $("sort-select-m")].forEach((sel) =>
    sel.addEventListener("change", () => {
      state.sort = sel.value;
      $("sort-select").value = $("sort-select-m").value = state.sort;
      render();
    })
  );

  /* Bottom sheet trên mobile */
  const box = $("filter-box");
  const openBtn = $("btn-open-filters");
  let backdrop = null;

  function updateApplyLabel() {
    const n = applyFilters({ ...state, ...readFilters() }).length;
    $("btn-sheet-apply").textContent = `Xem ${n} kết quả`;
  }

  function openSheet() {
    sheetOpen = true;
    backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.addEventListener("click", () => closeSheet(false));
    document.body.appendChild(backdrop);
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.classList.add("open");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    updateApplyLabel();
    $("btn-close-filters").focus();
  }

  function closeSheet(apply) {
    if (!sheetOpen) return;
    sheetOpen = false;
    if (apply) state = { ...state, ...readFilters() };
    else writeFilters(state); // bỏ các lựa chọn chưa áp dụng
    box.classList.remove("open");
    box.removeAttribute("role");
    box.removeAttribute("aria-modal");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    if (backdrop) backdrop.remove();
    render();
    openBtn.focus();
  }

  openBtn.addEventListener("click", openSheet);
  $("btn-close-filters").addEventListener("click", () => closeSheet(false));
  $("btn-sheet-apply").addEventListener("click", () => closeSheet(true));
  $("btn-sheet-clear").addEventListener("click", () => {
    writeFilters({ ...DEFAULT_FILTERS, categories: [] });
    updateApplyLabel();
  });
  box.addEventListener("keydown", (e) => {
    if (!sheetOpen) return;
    if (e.key === "Escape") closeSheet(false);
    else trapFocus(box, e);
  });
  mobileQuery.addEventListener("change", () => closeSheet(false));

  writeFilters(state);
  render();
});
