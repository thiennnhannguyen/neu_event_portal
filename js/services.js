/* ==========================================================================
   services.js — Quy tắc nghiệp vụ (đóng vai trò "backend" phía client)
   --------------------------------------------------------------------------
   Mọi thao tác thay đổi dữ liệu đều đi qua các service dưới đây để đảm bảo
   ràng buộc ở mục 5 của đặc tả (hạn đăng ký, số chỗ, quyền theo đơn vị,
   lý do từ chối, sinh thông báo...). Mỗi hàm trả về { ok: true, data } hoặc
   { ok: false, error } để giao diện hiển thị lý do rõ ràng.
   ========================================================================== */

function ok(data) {
  return { ok: true, data };
}
function fail(error) {
  return { ok: false, error };
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/* ---- Thông báo ----------------------------------------------------------- */
const NotifyService = {
  send(userIds, { type = "system", title, body, link = "" }) {
    [...new Set(userIds)].filter(Boolean).forEach((userId) =>
      NotificationStore.create({ userId, type, title, body, link, sentAt: nowDT(), read: false })
    );
  },
  usersByRole(role) {
    return UserStore.where((u) => u.role === role && u.status === "active").map((u) => u.id);
  },
  unitMembers(unitId) {
    return UserStore.where((u) => u.role === "organizer" && u.unitId === unitId).map((u) => u.id);
  },
  forUser(userId) {
    return NotificationStore.where((n) => n.userId === userId).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  },
  unreadCount(userId) {
    return NotificationStore.where((n) => n.userId === userId && !n.read).length;
  },
  markRead(id) {
    NotificationStore.update(id, { read: true });
  },
  markAllRead(userId) {
    this.forUser(userId).filter((n) => !n.read).forEach((n) => NotificationStore.update(n.id, { read: true }));
  },
};

/* ---- Tài khoản ----------------------------------------------------------- */
const AuthService = {
  findByEmail(email) {
    const e = (email || "").trim().toLowerCase();
    return UserStore.getAll().find((u) => u.email.toLowerCase() === e) || null;
  },

  login(email, password) {
    const user = this.findByEmail(email);
    if (!user) return fail("Email chưa được đăng ký trong hệ thống.");
    if (user.password !== password) return fail("Mật khẩu không chính xác.");
    if (user.status === "locked") return fail("Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên.");
    SessionStore.login(user);
    return ok(user);
  },

  registerStudent(data) {
    if (!data.name || !data.studentCode || !data.email) return fail("Vui lòng nhập đầy đủ họ tên, mã sinh viên và email.");
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return fail("Email không hợp lệ.");
    if (this.findByEmail(data.email)) return fail("Email này đã được sử dụng.");
    if (UserStore.getAll().some((u) => u.studentCode === data.studentCode)) return fail("Mã sinh viên này đã có tài khoản.");
    if ((data.password || "").length < 6) return fail("Mật khẩu cần tối thiểu 6 ký tự.");
    if (data.password !== data.confirm) return fail("Mật khẩu nhập lại không khớp.");
    const { confirm, ...rest } = data;
    const user = UserStore.create({ ...rest, email: data.email.trim(), role: "student", status: "active", createdAt: nowDT() });
    NotifyService.send([user.id], {
      type: "system",
      title: "Chào mừng đến với NEU Event Portal",
      body: "Tài khoản của bạn đã được tạo. Hãy cập nhật hồ sơ và khám phá các sự kiện sắp diễn ra.",
      link: "events.html",
    });
    SessionStore.login(user);
    return ok(user);
  },

  // Mô phỏng gửi mã khôi phục qua email: mã được trả về để hiển thị trên màn hình demo
  requestReset(email) {
    const user = this.findByEmail(email);
    if (!user) return fail("Không tìm thấy tài khoản với email này.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    UserStore.update(user.id, { resetCode: code });
    return ok({ code, email: user.email });
  },

  resetPassword(email, code, password, confirm) {
    const user = this.findByEmail(email);
    if (!user || !user.resetCode || user.resetCode !== code.trim()) return fail("Mã xác nhận không đúng.");
    if (password.length < 6) return fail("Mật khẩu cần tối thiểu 6 ký tự.");
    if (password !== confirm) return fail("Mật khẩu nhập lại không khớp.");
    UserStore.update(user.id, { password, resetCode: null });
    return ok();
  },

  changePassword(user, oldPw, newPw, confirm) {
    if (user.password !== oldPw) return fail("Mật khẩu hiện tại không đúng.");
    if (newPw.length < 6) return fail("Mật khẩu mới cần tối thiểu 6 ký tự.");
    if (newPw !== confirm) return fail("Mật khẩu nhập lại không khớp.");
    if (newPw === oldPw) return fail("Mật khẩu mới phải khác mật khẩu hiện tại.");
    UserStore.update(user.id, { password: newPw });
    return ok();
  },

  updateProfile(user, patch) {
    if (patch.name !== undefined && !patch.name.trim()) return fail("Họ tên không được để trống.");
    return ok(UserStore.update(user.id, patch));
  },
};

/* ---- Sự kiện ------------------------------------------------------------- */
const EventService = {
  unitName(evt) {
    return getUnit(evt.unitId).name;
  },

  canManage(user, evt) {
    if (!user || !evt) return false;
    return user.role === "admin" || (user.role === "organizer" && evt.unitId === user.unitId);
  },

  // Ai được xem trang chi tiết của sự kiện
  canView(user, evt) {
    if (["published", "ended"].includes(evt.status)) return true;
    if (!user) return false;
    if (this.canManage(user, evt)) return true;
    if (user.role === "union" && evt.status === "pending") return true;
    if (user.role === "student") return !!RegService.activeReg(user.id, evt.id) || RegistrationStore.where((r) => r.studentId === user.id && r.eventId === evt.id).length > 0;
    return false;
  },

  publicList() {
    return EventStore.where((e) => e.status === "published");
  },

  validate(p) {
    if (!p.title || !p.category || !p.start || !p.end || !p.deadline) return "Vui lòng nhập đủ tên, danh mục, thời gian và hạn đăng ký.";
    if (p.end <= p.start) return "Thời gian kết thúc phải sau thời gian bắt đầu.";
    if (p.deadline >= p.start) return "Hạn đăng ký phải trước giờ bắt đầu sự kiện.";
    if (!(p.capacity > 0)) return "Số lượng tối đa phải lớn hơn 0.";
    if (p.format === "online" && !/^https?:\/\//.test(p.onlineUrl || "")) return "Sự kiện trực tuyến cần đường dẫn tham gia hợp lệ (http/https).";
    if (p.format === "offline" && !p.location) return "Vui lòng chọn phòng hoặc nhập địa điểm.";
    if (!p.shortDesc || !p.fullDesc) return "Vui lòng nhập mô tả ngắn và mô tả chi tiết.";
    return null;
  },

  /* Lưu sự kiện. submit=true: gửi duyệt; submit=false: lưu nháp.
     Với sự kiện đã đăng: lưu thay đổi và thông báo cho sinh viên nếu đổi lịch/địa điểm. */
  save(user, payload, submit) {
    const existing = payload.id ? EventStore.getById(payload.id) : null;
    if (existing && !this.canManage(user, existing)) return fail("Bạn chỉ được sửa sự kiện thuộc đơn vị mình.");
    if (existing && ["ended", "cancelled", "removed"].includes(existing.status)) return fail("Không thể sửa sự kiện đã kết thúc, đã hủy hoặc đã bị gỡ.");

    const data = { ...payload };
    delete data.id;
    if (data.format === "online") data.roomId = null;
    if (data.roomId) data.location = getRoom(data.roomId).name;

    // Bản nháp chỉ cần tên sự kiện; gửi duyệt hoặc sửa sự kiện đã đăng cần hợp lệ đầy đủ
    const needFull = submit || (existing && ["pending", "published"].includes(existing.status));
    if (!data.title) return fail("Vui lòng nhập tên sự kiện.");
    if (needFull) {
      const err = this.validate(data);
      if (err) return fail(err);
    }

    let evt;
    if (!existing) {
      evt = EventStore.create({
        ...data,
        unitId: data.unitId || user.unitId,
        creatorId: user.id,
        status: submit ? "pending" : "draft",
        rejectReason: "", cancelReason: "", removeReason: "",
        unionPoints: null, pointsAwardedAt: null, approverId: null, approvedAt: null,
        featured: !!data.featured,
        createdAt: nowDT(),
        submittedAt: submit ? nowDT() : null,
      });
    } else {
      const patch = { ...data };
      if (["draft", "rejected"].includes(existing.status)) {
        patch.status = submit ? "pending" : "draft";
        if (submit) {
          patch.submittedAt = nowDT();
          patch.rejectReason = "";
        }
      }
      evt = EventStore.update(existing.id, patch);

      if (existing.status === "published") {
        const changed = existing.start !== evt.start || existing.end !== evt.end || existing.location !== evt.location || existing.onlineUrl !== evt.onlineUrl;
        if (changed) {
          NotifyService.send(RegService.byEvent(evt.id).filter((r) => r.status === "registered").map((r) => r.studentId), {
            type: "change",
            title: "Sự kiện thay đổi lịch / địa điểm",
            body: `"${evt.title}" đã cập nhật: ${fmtDT(evt.start)} – ${fmtDT(evt.end).slice(-5)}, ${evt.location}.`,
            link: "event-detail.html?id=" + evt.id,
          });
        }
      }
    }

    BookingService.syncForEvent(evt, user);

    if (evt.status === "pending" && (!existing || existing.status !== "pending")) {
      NotifyService.send([...NotifyService.usersByRole("admin"), ...NotifyService.usersByRole("union")], {
        type: "approval",
        title: "Sự kiện mới chờ duyệt",
        body: `${this.unitName(evt)} vừa gửi duyệt "${evt.title}".`,
        link: "dashboard.html#pending",
      });
    }
    return ok(evt);
  },

  submit(user, id) {
    const evt = EventStore.getById(id);
    return this.save(user, { ...evt }, true);
  },

  deleteDraft(user, id) {
    const evt = EventStore.getById(id);
    if (!this.canManage(user, evt)) return fail("Bạn không có quyền xóa sự kiện này.");
    if (!["draft", "rejected"].includes(evt.status) && user.role !== "admin") return fail("Chỉ xóa được bản nháp hoặc sự kiện bị từ chối.");
    EventStore.remove(id);
    BookingStore.where((b) => b.eventId === id).forEach((b) => BookingStore.remove(b.id));
    return ok();
  },

  approve(user, id) {
    if (!["admin", "union"].includes(user.role)) return fail("Bạn không có quyền duyệt sự kiện.");
    const evt = EventStore.getById(id);
    if (evt.status !== "pending") return fail("Sự kiện không ở trạng thái Chờ duyệt.");
    EventStore.update(id, { status: "published", approverId: user.id, approvedAt: nowDT(), rejectReason: "" });
    NotifyService.send(NotifyService.unitMembers(evt.unitId), {
      type: "approval",
      title: "Sự kiện đã được duyệt",
      body: `"${evt.title}" đã được ${ROLE_META[user.role].label} duyệt và hiển thị công khai.`,
      link: "event-detail.html?id=" + id,
    });
    return ok();
  },

  reject(user, id, reason) {
    if (!["admin", "union"].includes(user.role)) return fail("Bạn không có quyền từ chối sự kiện.");
    if (!reason || reason.trim().length < 5) return fail("Từ chối sự kiện bắt buộc phải ghi lý do (tối thiểu 5 ký tự).");
    const evt = EventStore.getById(id);
    if (evt.status !== "pending") return fail("Sự kiện không ở trạng thái Chờ duyệt.");
    EventStore.update(id, { status: "rejected", rejectReason: reason.trim(), approverId: user.id, approvedAt: nowDT() });
    BookingStore.where((b) => b.eventId === id && b.status === "pending").forEach((b) => BookingStore.update(b.id, { status: "cancelled" }));
    NotifyService.send(NotifyService.unitMembers(evt.unitId), {
      type: "approval",
      title: "Sự kiện bị từ chối",
      body: `"${evt.title}" bị từ chối. Lý do: ${reason.trim()}`,
      link: "dashboard.html#my-events",
    });
    return ok();
  },

  // Hủy các phiếu đăng ký đang hiệu lực và báo cho sinh viên
  _cancelRegistrations(evt, title, body) {
    const regs = RegService.byEvent(evt.id).filter((r) => r.status === "registered");
    regs.forEach((r) => RegistrationStore.update(r.id, { status: "cancelled", cancelledAt: nowDT() }));
    NotifyService.send(regs.map((r) => r.studentId), { type: "cancel", title, body, link: "event-detail.html?id=" + evt.id });
    BookingStore.where((b) => b.eventId === evt.id && ["pending", "approved"].includes(b.status)).forEach((b) =>
      BookingStore.update(b.id, { status: "cancelled" })
    );
    return regs.length;
  },

  cancel(user, id, reason) {
    const evt = EventStore.getById(id);
    if (!this.canManage(user, evt)) return fail("Bạn chỉ được hủy sự kiện thuộc đơn vị mình.");
    if (!["published", "pending"].includes(evt.status)) return fail("Chỉ hủy được sự kiện đang chờ duyệt hoặc đã đăng.");
    if (!reason || reason.trim().length < 5) return fail("Vui lòng ghi lý do hủy để thông báo tới sinh viên.");
    EventStore.update(id, { status: "cancelled", cancelReason: reason.trim() });
    const count = this._cancelRegistrations(evt, "Sự kiện đã bị hủy",
      `"${evt.title}" đã bị hủy. Lý do: ${reason.trim()} Phiếu đăng ký của bạn đã chuyển sang Đã hủy.`);
    return ok(count);
  },

  removeViolation(user, id, reason) {
    if (user.role !== "admin") return fail("Chỉ Quản trị viên được gỡ sự kiện vi phạm.");
    if (!reason || reason.trim().length < 5) return fail("Vui lòng ghi rõ lý do gỡ sự kiện.");
    const evt = EventStore.getById(id);
    EventStore.update(id, { status: "removed", removeReason: reason.trim() });
    this._cancelRegistrations(evt, "Sự kiện đã bị gỡ", `"${evt.title}" đã bị Ban quản trị gỡ khỏi cổng thông tin. Phiếu đăng ký của bạn đã bị hủy.`);
    NotifyService.send(NotifyService.unitMembers(evt.unitId), {
      type: "cancel",
      title: "Sự kiện bị gỡ do vi phạm",
      body: `"${evt.title}" đã bị gỡ. Lý do: ${reason.trim()}`,
      link: "dashboard.html#my-events",
    });
    return ok();
  },

  // Kết thúc sự kiện: phiếu chưa điểm danh chuyển Vắng mặt
  finish(id) {
    const evt = EventStore.getById(id);
    if (!evt || evt.status !== "published") return fail("Chỉ kết thúc được sự kiện đang ở trạng thái Đã đăng.");
    EventStore.update(id, { status: "ended" });
    RegService.byEvent(id).filter((r) => r.status === "registered").forEach((r) => RegistrationStore.update(r.id, { status: "absent" }));
    return ok();
  },

  finishManually(user, id) {
    const evt = EventStore.getById(id);
    if (!this.canManage(user, evt)) return fail("Bạn không có quyền với sự kiện này.");
    if (nowDT() < evt.start) return fail("Sự kiện chưa bắt đầu nên chưa thể kết thúc.");
    return this.finish(id);
  },

  // Chạy mỗi lần tải trang: tự kết thúc sự kiện quá giờ + gửi nhắc lịch trước 24 giờ
  sweep() {
    const now = nowDT();
    EventStore.where((e) => e.status === "published" && e.end <= now).forEach((e) => this.finish(e.id));

    const soon = toLocalDT(new Date(Date.now() + 24 * 3600 * 1000));
    const upcoming = EventStore.where((e) => e.status === "published" && e.start > now && e.start <= soon);
    if (!upcoming.length) return;
    const notifs = NotificationStore.getAll();
    upcoming.forEach((evt) => {
      const regUsers = RegService.byEvent(evt.id).filter((r) => r.status === "registered").map((r) => r.studentId);
      const intUsers = InterestStore.where((i) => i.eventId === evt.id).map((i) => i.studentId);
      const link = "event-detail.html?id=" + evt.id;
      const targets = [...new Set([...regUsers, ...intUsers])].filter(
        (uid) => !notifs.some((n) => n.userId === uid && n.type === "reminder" && n.link === link)
      );
      NotifyService.send(targets, {
        type: "reminder",
        title: "Nhắc lịch sự kiện",
        body: `"${evt.title}" sẽ bắt đầu lúc ${fmtDT(evt.start)} tại ${evt.location}.`,
        link,
      });
    });
  },
};

/* ---- Đăng ký tham gia & điểm danh -------------------------------------- */
const RegService = {
  byEvent(eventId) {
    return RegistrationStore.where((r) => r.eventId === eventId);
  },
  byStudent(studentId) {
    return RegistrationStore.where((r) => r.studentId === studentId);
  },
  // Phiếu còn hiệu lực (không tính phiếu đã hủy)
  activeReg(studentId, eventId) {
    return RegistrationStore.getAll().find((r) => r.studentId === studentId && r.eventId === eventId && r.status !== "cancelled") || null;
  },
  takenSeats(eventId) {
    return this.byEvent(eventId).filter((r) => r.status !== "cancelled").length;
  },
  seatsLeft(evt) {
    return Math.max(0, evt.capacity - this.takenSeats(evt.id));
  },

  // Sự kiện sinh viên đã đăng ký có thời gian trùng với evt
  conflicts(studentId, evt) {
    return this.byStudent(studentId)
      .filter((r) => r.status === "registered" && r.eventId !== evt.id)
      .map((r) => EventStore.getById(r.eventId))
      .filter((e) => e && overlaps(evt.start, evt.end, e.start, e.end));
  },

  // Trả về lý do không thể đăng ký, hoặc null nếu hợp lệ
  blockReason(user, evt) {
    if (!user) return "Vui lòng đăng nhập để đăng ký.";
    if (user.role !== "student") return "Chỉ tài khoản Sinh viên mới có thể đăng ký sự kiện.";
    if (evt.status !== "published") return "Sự kiện chưa mở hoặc không còn nhận đăng ký.";
    if (this.activeReg(user.id, evt.id)) return "Bạn đã đăng ký sự kiện này.";
    if (nowDT() >= evt.deadline) return "Đã hết hạn đăng ký.";
    if (this.seatsLeft(evt) <= 0) return "Sự kiện đã hết chỗ.";
    return null;
  },

  register(user, eventId) {
    const evt = EventStore.getById(eventId);
    const reason = this.blockReason(user, evt);
    if (reason) return fail(reason);
    const reg = RegistrationStore.create({
      studentId: user.id, eventId, status: "registered", code: ticketCode(),
      registeredAt: nowDT(), checkinAt: null, cancelledAt: null,
    });
    NotifyService.send([user.id], {
      type: "registration",
      title: "Đăng ký thành công",
      body: `Bạn đã đăng ký "${evt.title}" (mã vé ${reg.code}). Email xác nhận đã được gửi tới ${user.email}.`,
      link: "event-detail.html?id=" + evt.id,
    });
    return ok(reg);
  },

  canCancel(reg, evt) {
    return reg.status === "registered" && evt.status === "published" && nowDT() < evt.deadline;
  },

  cancel(user, regId) {
    const reg = RegistrationStore.getById(regId);
    if (!reg || reg.studentId !== user.id) return fail("Không tìm thấy phiếu đăng ký.");
    const evt = EventStore.getById(reg.eventId);
    if (!this.canCancel(reg, evt)) return fail("Chỉ được hủy đăng ký trước hạn đăng ký.");
    RegistrationStore.update(regId, { status: "cancelled", cancelledAt: nowDT() });
    NotifyService.send([user.id], {
      type: "registration",
      title: "Đã hủy đăng ký",
      body: `Bạn đã hủy đăng ký "${evt.title}".`,
      link: "event-detail.html?id=" + evt.id,
    });
    return ok();
  },

  canCheckIn(evt) {
    // Mở điểm danh từ 60 phút trước giờ bắt đầu cho tới khi sự kiện kết thúc
    const open = toLocalDT(new Date(new Date(evt.start).getTime() - 60 * 60 * 1000));
    return evt.status === "published" && nowDT() >= open;
  },

  // Điểm danh bằng mã vé (quét QR hoặc nhập tay)
  checkInByCode(user, eventId, code) {
    const evt = EventStore.getById(eventId);
    if (!EventService.canManage(user, evt)) return fail("Bạn chỉ được điểm danh sự kiện của đơn vị mình.");
    if (!this.canCheckIn(evt)) return fail("Chỉ điểm danh được từ 60 phút trước giờ bắt đầu, khi sự kiện chưa kết thúc.");
    const c = (code || "").trim().toUpperCase();
    const reg = this.byEvent(eventId).find((r) => r.code === c);
    if (!reg) return fail(`Mã ${c || "(trống)"} không thuộc danh sách đăng ký sự kiện này.`);
    if (reg.status === "cancelled") return fail("Phiếu đăng ký này đã bị hủy.");
    if (reg.status === "attended") return fail(`Sinh viên đã được điểm danh lúc ${fmtDT(reg.checkinAt).slice(-5)}.`);
    RegistrationStore.update(reg.id, { status: "attended", checkinAt: nowDT() });
    return ok(UserStore.getById(reg.studentId));
  },

  setAttendance(user, regId, attended) {
    const reg = RegistrationStore.getById(regId);
    const evt = EventStore.getById(reg.eventId);
    if (!EventService.canManage(user, evt)) return fail("Bạn không có quyền điểm danh sự kiện này.");
    if (!this.canCheckIn(evt)) return fail("Chỉ điểm danh được từ 60 phút trước giờ bắt đầu, khi sự kiện chưa kết thúc.");
    if (reg.status === "cancelled") return fail("Phiếu đăng ký đã bị hủy.");
    RegistrationStore.update(regId, attended ? { status: "attended", checkinAt: nowDT() } : { status: "registered", checkinAt: null });
    return ok();
  },
};

/* ---- Quan tâm ------------------------------------------------------------ */
const InterestService = {
  isInterested(studentId, eventId) {
    return InterestStore.getAll().some((i) => i.studentId === studentId && i.eventId === eventId);
  },
  toggle(user, eventId) {
    if (!user || user.role !== "student") return fail("Đăng nhập bằng tài khoản Sinh viên để đánh dấu quan tâm.");
    const found = InterestStore.getAll().find((i) => i.studentId === user.id && i.eventId === eventId);
    if (found) {
      InterestStore.remove(found.id);
      return ok(false);
    }
    InterestStore.create({ studentId: user.id, eventId, createdAt: nowDT() });
    return ok(true);
  },
  byStudent(studentId) {
    return InterestStore.where((i) => i.studentId === studentId);
  },
};

/* ---- Đánh giá ------------------------------------------------------------ */
const ReviewService = {
  byEvent(eventId) {
    return ReviewStore.where((r) => r.eventId === eventId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  average(eventId) {
    const list = this.byEvent(eventId);
    return list.length ? list.reduce((s, r) => s + r.stars, 0) / list.length : 0;
  },
  hasReviewed(studentId, eventId) {
    return ReviewStore.getAll().some((r) => r.studentId === studentId && r.eventId === eventId);
  },
  canReview(user, evt) {
    if (!user || user.role !== "student") return false;
    const reg = RegService.activeReg(user.id, evt.id);
    return !!reg && reg.status === "attended" && !this.hasReviewed(user.id, evt.id);
  },
  add(user, eventId, stars, comment) {
    const evt = EventStore.getById(eventId);
    if (!this.canReview(user, evt)) return fail("Chỉ sinh viên đã tham dự mới được đánh giá, mỗi sự kiện một lần.");
    if (!(stars >= 1 && stars <= 5)) return fail("Vui lòng chọn số sao từ 1 đến 5.");
    return ok(ReviewStore.create({ studentId: user.id, eventId, stars, comment: (comment || "").trim(), createdAt: nowDT() }));
  },
};

/* ---- Mượn phòng (Phòng Quản trị thiết bị) ------------------------------- */
const BookingService = {
  // Tạo phiếu mượn phòng khi sự kiện trực tiếp chọn phòng (hoặc đổi phòng / đổi giờ)
  syncForEvent(evt, user) {
    if (evt.status === "draft") return;
    const active = BookingStore.where((b) => b.eventId === evt.id && ["pending", "approved"].includes(b.status));
    const same = active.find((b) => b.roomId === evt.roomId && b.start === evt.start && b.end === evt.end);
    if (same) return;
    active.forEach((b) => BookingStore.update(b.id, { status: "cancelled" }));
    if (!evt.roomId) return;
    BookingStore.create({
      eventId: evt.id, roomId: evt.roomId, unitId: evt.unitId, requesterId: user.id,
      start: evt.start, end: evt.end, status: "pending", reason: "", createdAt: nowDT(), reviewerId: null, reviewedAt: null,
    });
    NotifyService.send(NotifyService.usersByRole("facility"), {
      type: "booking",
      title: "Yêu cầu mượn phòng mới",
      body: `${getUnit(evt.unitId).name} yêu cầu mượn ${getRoom(evt.roomId).name} cho "${evt.title}".`,
      link: "dashboard.html#room-requests",
    });
  },

  forEvent(eventId) {
    return BookingStore.where((b) => b.eventId === eventId && b.status !== "cancelled")[0] || null;
  },

  // Các phiếu đã duyệt của cùng phòng bị trùng giờ
  conflicts(booking) {
    return BookingStore.where(
      (b) => b.id !== booking.id && b.roomId === booking.roomId && b.status === "approved" && overlaps(b.start, b.end, booking.start, booking.end)
    );
  },

  approve(user, id) {
    if (user.role !== "facility") return fail("Chỉ Phòng Quản trị thiết bị được duyệt mượn phòng.");
    const b = BookingStore.getById(id);
    if (this.conflicts(b).length) return fail("Phòng đã được duyệt cho sự kiện khác trong khung giờ này.");
    BookingStore.update(id, { status: "approved", reviewerId: user.id, reviewedAt: nowDT(), reason: "" });
    const evt = EventStore.getById(b.eventId);
    NotifyService.send(NotifyService.unitMembers(b.unitId), {
      type: "booking",
      title: "Đã duyệt mượn phòng",
      body: `${getRoom(b.roomId).name} đã được duyệt cho "${evt ? evt.title : ""}".`,
      link: "dashboard.html#bookings",
    });
    return ok();
  },

  reject(user, id, reason) {
    if (user.role !== "facility") return fail("Chỉ Phòng Quản trị thiết bị được từ chối mượn phòng.");
    if (!reason || reason.trim().length < 5) return fail("Từ chối mượn phòng cần ghi lý do.");
    const b = BookingStore.getById(id);
    BookingStore.update(id, { status: "rejected", reviewerId: user.id, reviewedAt: nowDT(), reason: reason.trim() });
    const evt = EventStore.getById(b.eventId);
    NotifyService.send(NotifyService.unitMembers(b.unitId), {
      type: "booking",
      title: "Yêu cầu mượn phòng bị từ chối",
      body: `${getRoom(b.roomId).name} cho "${evt ? evt.title : ""}" bị từ chối. Lý do: ${reason.trim()}`,
      link: "dashboard.html#bookings",
    });
    return ok();
  },
};

/* ---- Điểm Đoàn (Đoàn trường) ------------------------------------------- */
const PointService = {
  award(user, eventId, points) {
    if (user.role !== "union") return fail("Chỉ Đoàn trường được cấp điểm Đoàn.");
    const evt = EventStore.getById(eventId);
    if (evt.status !== "ended") return fail("Chỉ cấp điểm cho sự kiện đã kết thúc.");
    if (evt.pointsAwardedAt) return fail("Sự kiện này đã được cấp điểm.");
    if (!(points > 0 && points <= 10)) return fail("Số điểm phải từ 1 đến 10.");
    EventStore.update(eventId, { unionPoints: points, pointsAwardedAt: nowDT(), pointsAwardedBy: user.id });
    const attendees = RegService.byEvent(eventId).filter((r) => r.status === "attended").map((r) => r.studentId);
    NotifyService.send(attendees, {
      type: "points",
      title: "Đã được cấp điểm Đoàn",
      body: `Bạn được cộng ${points} điểm Đoàn cho sự kiện "${evt.title}".`,
      link: "my-events.html#history",
    });
    return ok(attendees.length);
  },

  // Tổng điểm Đoàn của sinh viên = tổng điểm các sự kiện đã tham dự và đã được cấp điểm
  history(studentId) {
    return RegService.byStudent(studentId)
      .filter((r) => r.status === "attended")
      .map((r) => EventStore.getById(r.eventId))
      .filter((e) => e && e.pointsAwardedAt);
  },
  total(studentId) {
    return this.history(studentId).reduce((s, e) => s + e.unionPoints, 0);
  },
};

/* ---- Quản trị: tài khoản, đơn vị, danh mục ------------------------------ */
const AdminService = {
  createAccount(admin, data) {
    if (admin.role !== "admin") return fail("Bạn không có quyền tạo tài khoản.");
    if (!data.name || !data.email) return fail("Vui lòng nhập họ tên và email.");
    if (AuthService.findByEmail(data.email)) return fail("Email đã tồn tại trong hệ thống.");
    if ((data.password || "").length < 6) return fail("Mật khẩu cần tối thiểu 6 ký tự.");
    if (data.role === "organizer" && !data.unitId) return fail("Tài khoản Ban tổ chức cần chọn đơn vị.");
    return ok(UserStore.create({ ...data, status: "active", createdAt: nowDT() }));
  },
  setStatus(admin, userId, status) {
    if (userId === admin.id) return fail("Không thể tự khóa tài khoản của mình.");
    UserStore.update(userId, { status });
    return ok();
  },
  setRole(admin, userId, role, unitId) {
    if (userId === admin.id) return fail("Không thể tự đổi vai trò của mình.");
    if (role === "organizer" && !unitId) return fail("Vai trò Ban tổ chức cần gắn với một đơn vị.");
    UserStore.update(userId, { role, unitId: role === "organizer" ? unitId : null });
    return ok();
  },
  deleteAccount(admin, userId) {
    if (userId === admin.id) return fail("Không thể xóa tài khoản đang đăng nhập.");
    UserStore.remove(userId);
    return ok();
  },

  saveUnit(data) {
    if (!data.name) return fail("Vui lòng nhập tên đơn vị.");
    if (data.id) return ok(UnitStore.update(data.id, data));
    return ok(UnitStore.create({ ...data, id: undefined }));
  },
  deleteUnit(id) {
    if (EventStore.where((e) => e.unitId === id).length) return fail("Đơn vị đang có sự kiện, không thể xóa.");
    if (UserStore.where((u) => u.unitId === id).length) return fail("Đơn vị đang có tài khoản Ban tổ chức, không thể xóa.");
    UnitStore.remove(id);
    return ok();
  },

  saveCategory(data) {
    if (!data.name) return fail("Vui lòng nhập tên danh mục.");
    if (data.id) return ok(CategoryStore.update(data.id, data));
    return ok(CategoryStore.create({ ...data, id: undefined }));
  },
  deleteCategory(id) {
    if (EventStore.where((e) => e.category === id).length) return fail("Danh mục đang được sử dụng, không thể xóa.");
    CategoryStore.remove(id);
    return ok();
  },
};

/* ---- Báo cáo thống kê --------------------------------------------------- */
const ReportService = {
  // Khoảng thời gian [from, to) theo kỳ báo cáo
  range(period, ref) {
    const d = ref ? new Date(ref + "T00:00") : new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    if (period === "day") {
      const from = new Date(y, m, d.getDate());
      const to = new Date(y, m, d.getDate() + 1);
      return { from: toLocalDT(from), to: toLocalDT(to), label: "Ngày " + from.toLocaleDateString("vi-VN") };
    }
    if (period === "month") {
      return { from: toLocalDT(new Date(y, m, 1)), to: toLocalDT(new Date(y, m + 1, 1)), label: `Tháng ${m + 1}/${y}` };
    }
    if (period === "semester") {
      // HK1: 08–12, HK2: 01–05, HK hè: 06–07
      if (m >= 7) return { from: toLocalDT(new Date(y, 7, 1)), to: toLocalDT(new Date(y + 1, 0, 1)), label: `Học kỳ 1 năm học ${y}–${y + 1}` };
      if (m <= 4) return { from: toLocalDT(new Date(y, 0, 1)), to: toLocalDT(new Date(y, 5, 1)), label: `Học kỳ 2 năm học ${y - 1}–${y}` };
      return { from: toLocalDT(new Date(y, 5, 1)), to: toLocalDT(new Date(y, 7, 1)), label: `Học kỳ hè năm ${y}` };
    }
    return { from: "0000", to: "9999", label: "Toàn bộ thời gian" };
  },

  build({ unitId = null, period = "all", ref = null }) {
    const r = this.range(period, ref);
    const events = EventStore.where((e) => (!unitId || e.unitId === unitId) && e.start >= r.from && e.start < r.to);

    const countBy = (keyFn) => {
      const map = {};
      events.forEach((e) => {
        const k = keyFn(e);
        map[k] = (map[k] || 0) + 1;
      });
      return map;
    };

    const rows = events.map((e) => {
      const regs = RegService.byEvent(e.id).filter((x) => x.status !== "cancelled");
      const attended = regs.filter((x) => x.status === "attended").length;
      const reviews = ReviewService.byEvent(e.id);
      return {
        evt: e,
        registered: regs.length,
        attended,
        rate: regs.length ? attended / regs.length : 0,
        rating: reviews.length ? reviews.reduce((s, x) => s + x.stars, 0) / reviews.length : null,
        reviewCount: reviews.length,
      };
    });

    const totalReg = rows.reduce((s, x) => s + x.registered, 0);
    const totalAtt = rows.reduce((s, x) => s + x.attended, 0);
    const rated = rows.filter((x) => x.rating !== null);
    const allReviews = rated.reduce((s, x) => s + x.reviewCount, 0);

    return {
      label: r.label,
      events,
      rows,
      byStatus: countBy((e) => e.status),
      byUnit: countBy((e) => e.unitId),
      byCategory: countBy((e) => e.category),
      totals: {
        events: events.length,
        registered: totalReg,
        attended: totalAtt,
        rate: totalReg ? totalAtt / totalReg : 0,
        rating: allReviews ? rated.reduce((s, x) => s + x.rating * x.reviewCount, 0) / allReviews : null,
      },
      top: [...rows].sort((a, b) => b.registered - a.registered).slice(0, 5),
    };
  },
};

/* Định dạng ngày giờ ngắn gọn dùng trong nội dung thông báo */
function fmtDT(s) {
  if (!s) return "";
  const [d, t] = s.split("T");
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y} ${t}`;
}

// Cập nhật trạng thái tự động mỗi lần tải trang
EventService.sweep();
