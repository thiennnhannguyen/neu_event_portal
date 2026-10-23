# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static frontend (plain HTML/CSS/vanilla JS, no build step, no package manager, no tests, no linter) for a NEU (Đại học Kinh tế Quốc dân) campus event portal — a university course project. Everything runs in the browser; "backend" behaviour is simulated over `localStorage`. UI text, comments and the README are in Vietnamese; keep new user-facing strings and code comments in Vietnamese to match.

## Running

Pages link to each other by relative path and rely on `localStorage`, so serve the folder instead of opening files directly:

```bash
python3 -m http.server 8080   # or: npx serve .
```

Demo accounts all use password `123456` (listed on `login.html`). The footer's "Khôi phục dữ liệu demo" button (or `DB.reset()` in the console) re-seeds all data.

## Architecture

**Script loading model.** No modules. Every page loads, in order, `js/data.js` → `js/services.js` → `js/main.js` → one page script. Everything is shared via top-level globals. Page HTML is mostly an empty shell (`#site-header`, `#site-footer`, a `*-root` element); the page script renders with template-literal `innerHTML` on `DOMContentLoaded` and calls `renderChrome(activeKey)` for the shared header (nav, notification bell, user pill) and footer.

**Three layers:**
- `data.js` — storage only. `DB` holds 10 collections (users, units, categories, rooms, events, registrations, interests, reviews, notifications, bookings) under `localStorage` keys prefixed `neu_v2_`; bumping `DB.VERSION` forces a re-seed. `makeStore()` gives each collection `getAll/getById/where/create/update/remove` (e.g. `EventStore`, `UserStore`, `BookingStore`). `SessionStore` stores only the user id and re-reads the user on `current()` (so locked/deleted users are logged out). Seed data is built by `buildSeed()` with dates **relative to now** (`relDT`, `relHoursDT`), so there are always upcoming, ongoing and ended events. Student/organizer/admin profile fields live on the `users` row rather than separate tables.
- `services.js` — all business rules from the spec (the intended replacement point for a real API). `AuthService`, `EventService`, `RegService`, `InterestService`, `ReviewService`, `BookingService`, `PointService`, `AdminService`, `ReportService`, `NotifyService`. Mutations return `{ ok, data }` / `{ ok: false, error }` with a Vietnamese message the UI shows directly. Page scripts should call services for any write, not stores. `EventService.sweep()` runs on every page load: auto-ends events past `end` (unattended registrations → `absent`) and sends 24h reminders.
- `main.js` — UI helpers: inline SVG icon set (`icon(name)`, Lucide-style, `currentColor` — no emoji anywhere), status/badge helpers, `eventCardHtml`, generic `openModal({ title, body, submitLabel, extraActions, onSubmit, onOpen })` where `onSubmit` returning a string shows it as an error and keeps the modal open, `askReason` for mandatory-reason dialogs, `showToast`, `downloadCsv`, `qrSvg` (decorative QR from the ticket code; check-in matches the code string).

**Datetimes** are stored as local `"YYYY-MM-DDTHH:mm"` strings and compared as strings (`nowDT()`); never mix in date-only strings or `Date` objects when comparing.

**Roles & lifecycle.** Roles: `student`, `organizer` (bound to `unitId`), `admin`, `union` (Đoàn trường), `facility` (Phòng Quản trị thiết bị). Event status: `draft → pending → published | rejected → ended | cancelled`, plus `removed` (admin takedown). Admin or union can approve; reject/cancel/remove require a reason. Organizers only manage events of their own unit (`EventService.canManage`). Editing a `published` event keeps it published but notifies registrants if time/location changed. Choosing a room on an offline event creates a `bookings` request for `facility` (`BookingService.syncForEvent`). Registration: status `registered | attended | absent | cancelled`; seats = capacity − non-cancelled regs; students may cancel only before the deadline; check-in opens 60 min before start.

**Dashboard (`dashboard.js`).** Single page whose sidebar comes from `DASH_NAV[role]`; the view is the URL hash (`dashboard.html#attendance`, `?event=<id>` preselects an event). `VIEWS[key](main)` renders a view; row buttons use `data-act="<action>" data-id="..."` handled by one delegated `ACTIONS` map; after a successful write call `result(r, msg)` which toasts and re-renders via `refresh()`. Transient filters live in `DASH_STATE`.

**Escaping.** Content is rendered through `innerHTML`; wrap any user/event-supplied text in `escapeHtml()`.

## Styling

Single stylesheet `css/style.css`, "Modern University Event Hub" style: tokens in `:root` (`--navy`, `--blue`, `--blue-50`, `--text`, `--text-2`, `--border`, status pairs `--success/--success-bg`, `--warning…`, `--error…`, `--neutral…`, spacing `--s1`…`--s8`, radii `--r-*`). Inter only; monospace (`--font-code`) only for ticket/reset codes. Category `color` keys (crimson, teal, gold, navy, slate) map to soft cover tints via `[data-color]`. Shared components live in `main.js`: `eventCardHtml` (21:9 `coverHtml`: real image if `cover` is set, otherwise a "date poster"; `coverImgError` falls back on broken images), `eventRowHtml` (compact row for the home week list and the events list view), `eventPhase`/`countdownText` (time phase, separate from registration `availability()`), header with account disclosure + mobile menu (`bindDisclosure`), `openModal` (focus trap, auto-validation via `formValidationError`, forms use `novalidate`), `enhancePasswordInputs`. Active states use `aria-current` / `aria-pressed` / `aria-selected` rather than `.active` classes. Avoid inline styles and hard-coded colors.

You must alway response by Vietnamese to me
