/* ==========================================================================
   data.js — "Cơ sở dữ liệu" giả lập bằng localStorage + dữ liệu mẫu
   --------------------------------------------------------------------------
   Mỗi bảng trong đặc tả (Tài khoản, Đơn vị, Danh mục, Sự kiện, Phiếu đăng ký,
   Quan tâm, Thông báo, Đánh giá, Phòng, Mượn phòng) là một "collection" lưu
   trong localStorage với tiền tố DB.PREFIX. Khi có backend thật, chỉ cần thay
   phần thân các Store (getAll/getById/create/update/remove) bằng fetch() tới
   API — các file giao diện không cần sửa.

   Ghi chú: để gọn cho frontend, bảng Sinh viên / Ban tổ chức / Quản trị viên
   được gộp vào bảng users (các trường riêng theo vai trò nằm cùng bản ghi).
   ========================================================================== */

/* ---- Tiện ích thời gian: mọi thời điểm lưu dạng "YYYY-MM-DDTHH:mm" (giờ địa phương)
   nên có thể so sánh trực tiếp bằng chuỗi. -------------------------------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toLocalDT(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function nowDT() {
  return toLocalDT(new Date());
}
// Ngày tương đối so với hôm nay, ví dụ relDT(3, "18:00") = 3 ngày nữa lúc 18:00
function relDT(days, hhmm) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = hhmm.split(":");
  d.setHours(+h, +m, 0, 0);
  return toLocalDT(d);
}
// Giờ tương đối so với hiện tại, làm tròn về đầu giờ
function relHoursDT(hours) {
  const d = new Date(Date.now() + hours * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalDT(d);
}
function newId(prefix) {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function ticketCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "NEU-" + s;
}

/* ---- Hằng số nghiệp vụ --------------------------------------------------- */
const ROLE_META = {
  student:   { label: "Sinh viên",               home: "my-events.html" },
  organizer: { label: "Ban tổ chức",             home: "dashboard.html" },
  admin:     { label: "Quản trị viên",           home: "dashboard.html" },
  union:     { label: "Đoàn trường",             home: "dashboard.html" },
  facility:  { label: "Phòng Quản trị thiết bị", home: "dashboard.html" },
};

const UNIT_TYPES = ["CLB", "Viện", "Khoa", "Phòng ban", "Đoàn - Hội"];
const CATEGORY_COLORS = ["crimson", "crimson-dark", "teal", "gold", "navy", "slate"];

/* ---- Dữ liệu mẫu (ngày tháng tính tương đối theo thời điểm khởi tạo,
   để bản demo luôn có sự kiện sắp tới / đang diễn ra / đã kết thúc) -------- */
function buildSeed() {
  const PW = "123456";
  const created = relDT(-60, "09:00");

  const users = [
    // Sinh viên
    { id: "sv-001", role: "student", status: "active", email: "anh.nm@st.neu.edu.vn", password: PW, createdAt: created,
      name: "Nguyễn Minh Anh", studentCode: "11216001", gender: "Nữ", dob: "2003-05-14", classInfo: "QTKD 63A",
      faculty: "Khoa Quản trị Kinh doanh", cohort: "K63", phone: "0912 345 601" },
    { id: "sv-002", role: "student", status: "active", email: "chau.tb@st.neu.edu.vn", password: PW, createdAt: created,
      name: "Trần Bảo Châu", studentCode: "11226002", gender: "Nữ", dob: "2004-09-02", classInfo: "KTQT 64B",
      faculty: "Viện Thương mại & Kinh tế quốc tế", cohort: "K64", phone: "0912 345 602" },
    { id: "sv-003", role: "student", status: "active", email: "huy.lq@st.neu.edu.vn", password: PW, createdAt: created,
      name: "Lê Quang Huy", studentCode: "11236003", gender: "Nam", dob: "2005-01-21", classInfo: "KHMT 65A",
      faculty: "Trường Công nghệ & Kinh tế số", cohort: "K65", phone: "0912 345 603" },
    { id: "sv-004", role: "student", status: "active", email: "ha.pt@st.neu.edu.vn", password: PW, createdAt: created,
      name: "Phạm Thu Hà", studentCode: "11226004", gender: "Nữ", dob: "2004-11-30", classInfo: "Marketing 64C",
      faculty: "Khoa Marketing", cohort: "K64", phone: "0912 345 604" },
    { id: "sv-005", role: "student", status: "locked", email: "nam.dv@st.neu.edu.vn", password: PW, createdAt: created,
      name: "Đỗ Văn Nam", studentCode: "11216005", gender: "Nam", dob: "2003-03-08", classInfo: "TCNH 63D",
      faculty: "Viện Ngân hàng - Tài chính", cohort: "K63", phone: "0912 345 605" },

    // Ban tổ chức (thuộc một đơn vị)
    { id: "org-doanhoi", role: "organizer", status: "active", email: "doanthanhnien@neu.edu.vn", password: PW, createdAt: created,
      name: "Hoàng Minh Tuấn", position: "Ủy viên BCH Đoàn trường", unitId: "unit-doan", phone: "0243 869 0001" },
    { id: "org-tinhnguyen", role: "organizer", status: "active", email: "sv20.neu@gmail.com", password: PW, createdAt: created,
      name: "Vũ Thị Lan", position: "Chủ nhiệm CLB", unitId: "unit-sv20", phone: "0987 200 020" },
    { id: "org-marketing", role: "organizer", status: "active", email: "mac.club@neu.edu.vn", password: PW, createdAt: created,
      name: "Bùi Đức Long", position: "Chủ nhiệm CLB", unitId: "unit-mac", phone: "0987 300 030" },
    { id: "org-ktkh", role: "organizer", status: "active", email: "khoaktkh@neu.edu.vn", password: PW, createdAt: created,
      name: "TS. Trần Thị Hồng", position: "Phó Trưởng khoa", unitId: "unit-ktkh", phone: "0243 869 0002" },
    { id: "org-career", role: "organizer", status: "active", email: "career@neu.edu.vn", password: PW, createdAt: created,
      name: "Lê Thu Trang", position: "Chuyên viên", unitId: "unit-career", phone: "0243 869 0003" },

    // Quản trị viên, Đoàn trường, Phòng Quản trị thiết bị
    { id: "admin-001", role: "admin", status: "active", email: "admin@neu.edu.vn", password: PW, createdAt: created,
      name: "Ban Quản trị Cổng thông tin", phone: "0243 869 0000" },
    { id: "union-001", role: "union", status: "active", email: "doantruong@neu.edu.vn", password: PW, createdAt: created,
      name: "Ban Thường vụ Đoàn trường", phone: "0243 869 0010" },
    { id: "fac-001", role: "facility", status: "active", email: "thietbi@neu.edu.vn", password: PW, createdAt: created,
      name: "Phòng Quản trị Thiết bị", phone: "0243 869 0020" },
  ];

  const units = [
    { id: "unit-doan", name: "Đoàn Thanh niên - Hội Sinh viên NEU", type: "Đoàn - Hội", logo: "flag", email: "doanthanhnien@neu.edu.vn",
      leader: "Hoàng Minh Tuấn", description: "Tổ chức Đoàn - Hội cấp trường, điều phối các phong trào tình nguyện, học thuật và văn hóa - thể thao của sinh viên." },
    { id: "unit-sv20", name: "CLB Tình nguyện SV20", type: "CLB", logo: "sprout", email: "sv20.neu@gmail.com",
      leader: "Vũ Thị Lan", description: "Câu lạc bộ tình nguyện với các dự án cộng đồng thường niên dành cho sinh viên NEU." },
    { id: "unit-mac", name: "CLB Marketing MaC", type: "CLB", logo: "megaphone", email: "mac.club@neu.edu.vn",
      leader: "Bùi Đức Long", description: "Câu lạc bộ học thuật về Marketing, tổ chức workshop kỹ năng và các cuộc thi chuyên môn." },
    { id: "unit-ktkh", name: "Khoa Kinh tế học", type: "Khoa", logo: "book", email: "khoaktkh@neu.edu.vn",
      leader: "TS. Trần Thị Hồng", description: "Đơn vị đào tạo chuyên ngành Kinh tế học, thường xuyên tổ chức hội thảo khoa học." },
    { id: "unit-career", name: "Trung tâm Hướng nghiệp NEU", type: "Phòng ban", logo: "briefcase", email: "career@neu.edu.vn",
      leader: "Lê Thu Trang", description: "Kết nối sinh viên với doanh nghiệp, tổ chức ngày hội việc làm và tư vấn nghề nghiệp." },
    { id: "unit-fc", name: "CLB Bóng đá NEU FC", type: "CLB", logo: "activity", email: "neufc@neu.edu.vn",
      leader: "Ngô Thành Đạt", description: "Câu lạc bộ thể thao, tổ chức các giải bóng đá sinh viên trong trường." },
  ];

  const categories = [
    { id: "competition", name: "Cuộc thi",         icon: "trophy", color: "crimson",      description: "Cuộc thi học thuật, ý tưởng, tài năng." },
    { id: "seminar",     name: "Hội thảo",          icon: "mic", color: "teal",         description: "Hội thảo, tọa đàm, talkshow chuyên đề." },
    { id: "workshop",    name: "Workshop",          icon: "wrench", color: "gold",         description: "Buổi học kỹ năng thực hành." },
    { id: "union",       name: "Đoàn - Hội",        icon: "flag", color: "crimson-dark", description: "Hoạt động phong trào Đoàn - Hội." },
    { id: "volunteer",   name: "Tình nguyện",       icon: "sprout", color: "teal",         description: "Hoạt động vì cộng đồng." },
    { id: "arts",        name: "Văn nghệ",          icon: "music", color: "navy",         description: "Chương trình ca nhạc, biểu diễn nghệ thuật." },
    { id: "sport",       name: "Thể thao",          icon: "activity", color: "slate",        description: "Giải đấu, hoạt động rèn luyện thể chất." },
    { id: "recruitment", name: "Tuyển thành viên",  icon: "user-plus", color: "gold",         description: "Vòng tuyển thành viên của CLB, đội, nhóm." },
    { id: "career",      name: "Hướng nghiệp",      icon: "briefcase", color: "navy",         description: "Ngày hội việc làm, tư vấn nghề nghiệp." },
  ];

  const rooms = [
    { id: "room-a2",      name: "Hội trường A2",                capacity: 500 },
    { id: "room-bighall", name: "Hội trường Big Hall, Nhà A1",  capacity: 800 },
    { id: "room-n10-305", name: "Phòng 305, Nhà 10",            capacity: 60 },
    { id: "room-n7-204",  name: "Phòng 204, Nhà 7",             capacity: 50 },
    { id: "room-n11-lab", name: "Phòng máy tính, Nhà 11",       capacity: 45 },
    { id: "room-stadium", name: "Sân vận động NEU",             capacity: 2000 },
    { id: "room-stage",   name: "Sân khấu ngoài trời, Nhà 10",  capacity: 400 },
  ];
  const roomName = (id) => rooms.find((r) => r.id === id).name;

  const ev = (o) =>
    Object.assign(
      {
        format: "offline", roomId: null, location: o.roomId ? roomName(o.roomId) : "", onlineUrl: "",
        featured: false, rejectReason: "", cancelReason: "", removeReason: "",
        unionPoints: null, pointsAwardedAt: null, approverId: null, approvedAt: null,
        createdAt: relDT(-20, "09:00"), submittedAt: relDT(-19, "09:00"),
      },
      o
    );
  const approved = { status: "published", approverId: "admin-001", approvedAt: relDT(-15, "10:00") };

  const events = [
    ev({ id: "evt-001", title: "NEU Startup Challenge 2026", category: "competition", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-a2", start: relDT(12, "08:00"), end: relDT(12, "17:00"), deadline: relDT(7, "23:59"), capacity: 200, featured: true,
      contact: "startup.neu@st.neu.edu.vn", ...approved,
      shortDesc: "Cuộc thi ý tưởng khởi nghiệp dành cho sinh viên toàn trường, tổng giải thưởng 100 triệu đồng.",
      fullDesc: "NEU Startup Challenge là sân chơi thường niên dành cho sinh viên có đam mê khởi nghiệp. Thí sinh sẽ trải qua 3 vòng: Ý tưởng, Phát triển sản phẩm và Chung kết thuyết trình trước hội đồng giám khảo là các nhà đầu tư, doanh nghiệp. Đội thắng cuộc nhận vốn ươm tạo và cơ hội kết nối quỹ đầu tư." }),
    ev({ id: "evt-002", title: "Hội thảo: Kinh tế số và Tương lai việc làm", category: "seminar", unitId: "unit-ktkh", creatorId: "org-ktkh",
      roomId: "room-bighall", start: relDT(4, "14:00"), end: relDT(4, "17:00"), deadline: relDT(3, "23:59"), capacity: 300, featured: true,
      contact: "khoaktkh@neu.edu.vn", ...approved,
      shortDesc: "Diễn giả từ Ngân hàng Thế giới chia sẻ về chuyển đổi số và xu hướng nghề nghiệp giai đoạn 2026-2030.",
      fullDesc: "Hội thảo quy tụ các chuyên gia kinh tế hàng đầu, thảo luận về tác động của công nghệ số tới thị trường lao động Việt Nam. Sinh viên tham dự được cấp giấy chứng nhận và có cơ hội đặt câu hỏi trực tiếp với diễn giả." }),
    ev({ id: "evt-003", title: "Workshop: Kỹ năng thiết kế CV & Phỏng vấn", category: "workshop", unitId: "unit-mac", creatorId: "org-marketing",
      roomId: "room-n10-305", start: relDT(2, "18:30"), end: relDT(2, "21:00"), deadline: relDT(1, "23:59"), capacity: 3,
      contact: "mac.club@neu.edu.vn", ...approved,
      shortDesc: "Hướng dẫn thực chiến cách viết CV nổi bật và luyện tập phỏng vấn cùng chuyên gia nhân sự. Số lượng rất giới hạn!",
      fullDesc: "Buổi workshop có sự tham gia của các anh/chị nhân sự đến từ doanh nghiệp lớn, hướng dẫn sinh viên xây dựng CV chuyên nghiệp, luyện tập phỏng vấn mô phỏng (mock interview) và nhận phản hồi trực tiếp." }),
    ev({ id: "evt-004", title: "Ngày hội Hiến máu Giọt hồng NEU", category: "volunteer", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-stadium", start: relDT(9, "07:30"), end: relDT(9, "11:30"), deadline: relDT(8, "17:00"), capacity: 500, featured: true,
      contact: "doanthanhnien@neu.edu.vn", ...approved,
      shortDesc: "Mỗi giọt máu cho đi, một cuộc đời ở lại — ngày hội hiến máu tình nguyện thường niên của sinh viên NEU.",
      fullDesc: "Ngày hội phối hợp cùng Viện Huyết học - Truyền máu Trung ương. Sinh viên tham gia được khám sức khỏe miễn phí, nhận giấy chứng nhận hiến máu và quà tặng từ Ban tổ chức." }),
    ev({ id: "evt-005", title: "Vòng tuyển thành viên CLB Tình nguyện SV20", category: "recruitment", unitId: "unit-sv20", creatorId: "org-tinhnguyen",
      roomId: "room-n7-204", start: relDT(6, "19:00"), end: relDT(6, "21:00"), deadline: relDT(5, "23:59"), capacity: 80,
      contact: "sv20.neu@gmail.com", ...approved,
      shortDesc: "Tuyển thành viên mới khóa 2026, ưu tiên tân sinh viên yêu thích hoạt động cộng đồng.",
      fullDesc: "SV20 tuyển thành viên qua 2 vòng: Đơn đăng ký online và Phỏng vấn trực tiếp. Thành viên mới sẽ được tham gia các dự án cộng đồng, đào tạo kỹ năng tổ chức sự kiện và networking với các CLB khác." }),
    ev({ id: "evt-006", title: "Ngày hội việc làm NEU Career Fair", category: "career", unitId: "unit-career", creatorId: "org-career",
      roomId: "room-stadium", start: relDT(20, "08:30"), end: relDT(20, "16:30"), deadline: relDT(18, "23:59"), capacity: 1500, featured: true,
      contact: "career@neu.edu.vn", ...approved,
      shortDesc: "Hơn 50 doanh nghiệp tham gia tuyển dụng thực tập sinh và nhân viên chính thức.",
      fullDesc: "NEU Career Fair là sự kiện kết nối sinh viên năm cuối với các doanh nghiệp hàng đầu trong lĩnh vực tài chính, ngân hàng, marketing và công nghệ. Sinh viên có thể nộp CV trực tiếp và tham gia phỏng vấn nhanh." }),
    ev({ id: "evt-007", title: "Workshop: Phân tích dữ liệu với Excel nâng cao", category: "workshop", unitId: "unit-mac", creatorId: "org-marketing",
      roomId: "room-n11-lab", start: relDT(15, "18:00"), end: relDT(15, "20:30"), deadline: relDT(14, "12:00"), capacity: 45,
      contact: "mac.club@neu.edu.vn", status: "pending", submittedAt: relDT(-1, "10:00"),
      shortDesc: "Học cách sử dụng Pivot Table, hàm nâng cao và trực quan hóa dữ liệu trong Excel.",
      fullDesc: "Workshop dành cho sinh viên muốn nâng cao kỹ năng xử lý số liệu phục vụ học tập và thực tập. Người tham gia cần mang laptop cá nhân đã cài Excel." }),
    ev({ id: "evt-008", title: "Đêm nhạc gây quỹ 'Ánh sáng học đường'", category: "arts", unitId: "unit-sv20", creatorId: "org-tinhnguyen",
      roomId: "room-stage", start: relDT(18, "19:30"), end: relDT(18, "22:00"), deadline: relDT(16, "23:59"), capacity: 400,
      contact: "sv20.neu@gmail.com", status: "pending", submittedAt: relDT(0, "08:00"),
      shortDesc: "Đêm nhạc gây quỹ ủng hộ học sinh vùng cao, có sự góp mặt của các ca sĩ sinh viên NEU.",
      fullDesc: "Toàn bộ số tiền thu được từ bán vé và quyên góp sẽ được chuyển tới quỹ học bổng cho học sinh vùng cao. Chương trình có sự tham gia của các CLB âm nhạc trong trường." }),
    ev({ id: "evt-009", title: "Cuộc thi Hùng biện tiếng Anh NEU Voice", category: "competition", unitId: "unit-mac", creatorId: "org-marketing",
      roomId: "room-a2", start: relDT(25, "13:30"), end: relDT(25, "17:30"), deadline: relDT(20, "23:59"), capacity: 120,
      contact: "mac.club@neu.edu.vn", status: "rejected", approverId: "admin-001", approvedAt: relDT(-3, "15:00"),
      rejectReason: "Thời gian tổ chức trùng lịch thi cuối kỳ của khóa K64. Đề nghị đơn vị chọn thời điểm khác và bổ sung thể lệ chi tiết rồi gửi lại.",
      shortDesc: "Sân chơi hùng biện tiếng Anh dành cho sinh viên yêu thích thử thách bản thân.",
      fullDesc: "Cuộc thi gồm 3 vòng: Video giới thiệu, Hùng biện theo chủ đề và Chung kết tranh biện." }),
    ev({ id: "evt-010", title: "Giải bóng đá sinh viên NEU Cup", category: "sport", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-stadium", start: relDT(8, "07:00"), end: relDT(8, "17:00"), deadline: relDT(5, "23:59"), capacity: 300,
      contact: "neufc@neu.edu.vn", status: "cancelled", approverId: "union-001", approvedAt: relDT(-14, "10:00"),
      cancelReason: "Sân vận động đang được cải tạo mặt cỏ, Ban tổ chức sẽ thông báo lịch tổ chức lại sau.",
      shortDesc: "Giải đấu thường niên giữa các lớp và CLB thể thao trong trường.",
      fullDesc: "Giải đấu theo thể thức vòng bảng và loại trực tiếp, mỗi đội gồm 7 cầu thủ chính thức và 3 dự bị." }),
    ev({ id: "evt-011", title: "Workshop Kỹ năng Thuyết trình chuyên nghiệp", category: "workshop", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-n10-305", start: relDT(-10, "18:00"), end: relDT(-10, "20:30"), deadline: relDT(-11, "23:59"), capacity: 60,
      contact: "doanthanhnien@neu.edu.vn", status: "ended", approverId: "union-001", approvedAt: relDT(-25, "10:00"),
      createdAt: relDT(-30, "09:00"), submittedAt: relDT(-30, "09:30"), unionPoints: 2, pointsAwardedAt: relDT(-8, "09:00"),
      shortDesc: "Rèn luyện kỹ năng đứng trước đám đông và xây dựng slide thuyết trình ấn tượng.",
      fullDesc: "Sự kiện đã diễn ra và kết thúc thành công. Tài liệu buổi học đã được lưu trữ trong thư viện số của Đoàn trường." }),
    ev({ id: "evt-012", title: "Tuyển quân CLB Marketing MaC khóa 8", category: "recruitment", unitId: "unit-mac", creatorId: "org-marketing",
      roomId: "room-n7-204", start: relDT(5, "18:00"), end: relDT(5, "20:00"), deadline: relDT(4, "23:59"), capacity: 60,
      contact: "mac.club@neu.edu.vn", ...approved,
      shortDesc: "MaC tuyển thành viên các ban: Nội dung, Sự kiện, Truyền thông và Đối ngoại.",
      fullDesc: "Ứng viên trúng tuyển sẽ được đào tạo bài bản về marketing, tổ chức sự kiện thực chiến và có cơ hội thực tập tại các doanh nghiệp đối tác của CLB." }),
    ev({ id: "evt-013", title: "Webinar: Lộ trình trở thành Data Analyst", category: "career", unitId: "unit-career", creatorId: "org-career",
      format: "online", location: "Trực tuyến qua Google Meet", onlineUrl: "https://meet.google.com/neu-data-2026",
      start: relDT(2, "20:00"), end: relDT(2, "21:30"), deadline: relDT(2, "12:00"), capacity: 500,
      contact: "career@neu.edu.vn", ...approved,
      shortDesc: "Chuyên gia dữ liệu chia sẻ lộ trình học SQL, Python, Power BI và kinh nghiệm ứng tuyển vị trí Data Analyst.",
      fullDesc: "Webinar trực tuyến 90 phút gồm phần chia sẻ lộ trình học tập, demo dự án thực tế và hỏi đáp. Đường dẫn tham gia sẽ hiển thị cho sinh viên sau khi đăng ký thành công." }),
    ev({ id: "evt-014", title: "Talkshow: Văn hóa đọc của sinh viên thời số", category: "seminar", unitId: "unit-mac", creatorId: "org-marketing",
      roomId: "room-a2", start: relDT(30, "14:00"), end: relDT(30, "16:30"), deadline: relDT(28, "23:59"), capacity: 200,
      contact: "mac.club@neu.edu.vn", status: "draft", submittedAt: null,
      shortDesc: "Trò chuyện cùng tác giả trẻ về thói quen đọc sách trong thời đại mạng xã hội.",
      fullDesc: "Bản nháp — đang hoàn thiện danh sách khách mời." }),
    ev({ id: "evt-015", title: "Olympic Kinh tế lượng NEU — Vòng loại", category: "competition", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-a2", start: relHoursDT(-1), end: relHoursDT(3), deadline: relDT(-1, "23:00"), capacity: 150,
      contact: "doanthanhnien@neu.edu.vn", ...approved,
      shortDesc: "Vòng loại cuộc thi Olympic Kinh tế lượng, thi viết 120 phút — đang diễn ra hôm nay.",
      fullDesc: "Thí sinh có mặt trước giờ thi 15 phút, mang theo thẻ sinh viên và máy tính cầm tay. Ban tổ chức điểm danh bằng mã vé QR tại cửa phòng thi." }),
    ev({ id: "evt-016", title: "NEU Run 2026 — Chạy vì cộng đồng", category: "sport", unitId: "unit-doan", creatorId: "org-doanhoi",
      roomId: "room-stadium", start: relDT(-5, "06:00"), end: relDT(-5, "09:00"), deadline: relDT(-7, "23:59"), capacity: 400,
      contact: "doanthanhnien@neu.edu.vn", status: "ended", approverId: "union-001", approvedAt: relDT(-20, "10:00"),
      shortDesc: "Giải chạy 5km gây quỹ học bổng cho sinh viên có hoàn cảnh khó khăn.",
      fullDesc: "Giải chạy quanh khuôn viên trường với cự ly 5km. Mỗi bib đăng ký tương ứng 20.000đ được trích vào quỹ học bổng." }),
  ];

  const reg = (id, studentId, eventId, status, code, extra = {}) =>
    Object.assign({ id, studentId, eventId, status, code, registeredAt: relDT(-12, "10:00"), checkinAt: null, cancelledAt: null }, extra);

  const registrations = [
    reg("reg-001", "sv-001", "evt-001", "registered", "NEU-7KQ2MA"),
    reg("reg-002", "sv-002", "evt-003", "registered", "NEU-C4H8TB"),
    reg("reg-003", "sv-003", "evt-003", "registered", "NEU-H9L3QX"),
    reg("reg-004", "sv-001", "evt-013", "registered", "NEU-D2R5WN"),
    reg("reg-005", "sv-004", "evt-002", "registered", "NEU-P6V8KE"),
    reg("reg-006", "sv-001", "evt-015", "registered", "NEU-OLY001"),
    reg("reg-007", "sv-002", "evt-015", "attended", "NEU-OLY002", { checkinAt: relHoursDT(-1) }),
    reg("reg-008", "sv-003", "evt-015", "registered", "NEU-OLY003"),
    reg("reg-009", "sv-004", "evt-015", "registered", "NEU-OLY004"),
    reg("reg-010", "sv-001", "evt-011", "attended", "NEU-TT2201", { checkinAt: relDT(-10, "17:52") }),
    reg("reg-011", "sv-002", "evt-011", "attended", "NEU-TT2202", { checkinAt: relDT(-10, "17:58") }),
    reg("reg-012", "sv-003", "evt-011", "absent", "NEU-TT2203"),
    reg("reg-013", "sv-001", "evt-016", "attended", "NEU-RUN501", { checkinAt: relDT(-5, "05:45") }),
    reg("reg-014", "sv-004", "evt-016", "attended", "NEU-RUN502", { checkinAt: relDT(-5, "05:50") }),
    reg("reg-015", "sv-002", "evt-016", "absent", "NEU-RUN503"),
    reg("reg-016", "sv-001", "evt-010", "cancelled", "NEU-FC1001", { cancelledAt: relDT(-2, "09:00") }),
    reg("reg-017", "sv-003", "evt-005", "cancelled", "NEU-SV2001", { cancelledAt: relDT(-1, "21:00") }),
    reg("reg-018", "sv-004", "evt-012", "registered", "NEU-MAC801"),
  ];

  const interests = [
    { id: "int-001", studentId: "sv-001", eventId: "evt-006", createdAt: relDT(-3, "20:00") },
    { id: "int-002", studentId: "sv-001", eventId: "evt-002", createdAt: relDT(-2, "21:00") },
    { id: "int-003", studentId: "sv-001", eventId: "evt-004", createdAt: relDT(-1, "08:00") },
    { id: "int-004", studentId: "sv-002", eventId: "evt-006", createdAt: relDT(-1, "08:00") },
  ];

  const reviews = [
    { id: "rv-001", studentId: "sv-002", eventId: "evt-011", stars: 5, createdAt: relDT(-9, "10:00"),
      comment: "Diễn giả rất nhiệt tình, phần thực hành thuyết trình theo nhóm cực kỳ bổ ích." },
    { id: "rv-002", studentId: "sv-004", eventId: "evt-016", stars: 4, createdAt: relDT(-4, "12:00"),
      comment: "Tổ chức chuyên nghiệp, chỉ tiếc khâu nhận bib hơi đông." },
  ];

  const n = (id, userId, type, title, body, link, sentAt, read = false) => ({ id, userId, type, title, body, link, sentAt, read });
  const notifications = [
    n("ntf-001", "sv-001", "registration", "Đăng ký thành công", "Bạn đã đăng ký tham gia \"NEU Startup Challenge 2026\". Email xác nhận đã được gửi tới anh.nm@st.neu.edu.vn.", "event-detail.html?id=evt-001", relDT(-12, "10:00"), true),
    n("ntf-002", "sv-001", "points", "Đã được cấp điểm Đoàn", "Bạn được cộng 2 điểm Đoàn cho sự kiện \"Workshop Kỹ năng Thuyết trình chuyên nghiệp\".", "my-events.html#history", relDT(-8, "09:00"), true),
    n("ntf-003", "sv-001", "cancel", "Sự kiện đã bị hủy", "\"Giải bóng đá sinh viên NEU Cup\" đã bị hủy. Lý do: Sân vận động đang được cải tạo mặt cỏ. Phiếu đăng ký của bạn đã chuyển sang Đã hủy.", "event-detail.html?id=evt-010", relDT(-2, "09:00")),
    n("ntf-004", "org-marketing", "approval", "Sự kiện bị từ chối", "\"Cuộc thi Hùng biện tiếng Anh NEU Voice\" bị từ chối. Lý do: Thời gian tổ chức trùng lịch thi cuối kỳ của khóa K64.", "dashboard.html#my-events", relDT(-3, "15:00")),
    n("ntf-005", "admin-001", "approval", "Sự kiện mới chờ duyệt", "CLB Marketing MaC vừa gửi duyệt \"Workshop: Phân tích dữ liệu với Excel nâng cao\".", "dashboard.html#pending", relDT(-1, "10:00")),
    n("ntf-006", "admin-001", "approval", "Sự kiện mới chờ duyệt", "CLB Tình nguyện SV20 vừa gửi duyệt \"Đêm nhạc gây quỹ 'Ánh sáng học đường'\".", "dashboard.html#pending", relDT(0, "08:00")),
    n("ntf-007", "union-001", "approval", "Sự kiện mới chờ duyệt", "CLB Tình nguyện SV20 vừa gửi duyệt \"Đêm nhạc gây quỹ 'Ánh sáng học đường'\".", "dashboard.html#pending", relDT(0, "08:00")),
    n("ntf-008", "fac-001", "booking", "Yêu cầu mượn phòng mới", "CLB Marketing MaC yêu cầu mượn Phòng máy tính, Nhà 11.", "dashboard.html#room-requests", relDT(-1, "10:00")),
    n("ntf-009", "fac-001", "booking", "Yêu cầu mượn phòng mới", "CLB Tình nguyện SV20 yêu cầu mượn Sân khấu ngoài trời, Nhà 10.", "dashboard.html#room-requests", relDT(0, "08:00")),
  ];

  // Phiếu mượn phòng: mỗi sự kiện trực tiếp có roomId sẽ có một phiếu
  const bookings = events
    .filter((e) => e.roomId && e.status !== "draft")
    .map((e, i) => ({
      id: "bk-" + String(i + 1).padStart(3, "0"),
      eventId: e.id, roomId: e.roomId, unitId: e.unitId, requesterId: e.creatorId,
      start: e.start, end: e.end, createdAt: e.submittedAt || e.createdAt,
      status: e.status === "pending" || e.status === "rejected" ? (e.status === "pending" ? "pending" : "cancelled") : e.status === "cancelled" ? "cancelled" : "approved",
      reviewerId: e.status === "pending" ? null : "fac-001", reviewedAt: e.status === "pending" ? null : relDT(-14, "15:00"), reason: "",
    }));

  return { users, units, categories, rooms, events, registrations, interests, reviews, notifications, bookings };
}

/* ---- DB: lớp lưu trữ chung ---------------------------------------------- */
const DB = {
  PREFIX: "neu_v2_",
  VERSION: "2",
  COLLECTIONS: ["users", "units", "categories", "rooms", "events", "registrations", "interests", "reviews", "notifications", "bookings"],

  init() {
    if (localStorage.getItem(this.PREFIX + "version") !== this.VERSION) this.reset();
  },

  reset() {
    const seed = buildSeed();
    this.COLLECTIONS.forEach((c) => this._write(c, seed[c] || []));
    localStorage.setItem(this.PREFIX + "version", this.VERSION);
    // Dọn dữ liệu của phiên bản cũ
    localStorage.removeItem("neu_events");
    localStorage.removeItem("neu_session");
  },

  _read(c) {
    try {
      return JSON.parse(localStorage.getItem(this.PREFIX + c)) || [];
    } catch (e) {
      return [];
    }
  },
  _write(c, rows) {
    localStorage.setItem(this.PREFIX + c, JSON.stringify(rows));
  },

  all(c) {
    this.init();
    return this._read(c);
  },
};

/* Tạo một Store CRUD cho từng bảng — API giống EventStore của bản gốc */
function makeStore(collection, idPrefix) {
  return {
    getAll() {
      return DB.all(collection);
    },
    getById(id) {
      return this.getAll().find((r) => r.id === id) || null;
    },
    where(fn) {
      return this.getAll().filter(fn);
    },
    create(row) {
      const rows = this.getAll();
      row.id = row.id || newId(idPrefix);
      rows.unshift(row);
      DB._write(collection, rows);
      return row;
    },
    update(id, patch) {
      const rows = this.getAll();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch };
      DB._write(collection, rows);
      return rows[idx];
    },
    remove(id) {
      DB._write(collection, this.getAll().filter((r) => r.id !== id));
    },
  };
}

const EventStore = makeStore("events", "evt");
EventStore.resetToSeed = () => DB.reset();
const UserStore = makeStore("users", "usr");
const UnitStore = makeStore("units", "unit");
const CategoryStore = makeStore("categories", "cat");
const RoomStore = makeStore("rooms", "room");
const RegistrationStore = makeStore("registrations", "reg");
const InterestStore = makeStore("interests", "int");
const ReviewStore = makeStore("reviews", "rv");
const NotificationStore = makeStore("notifications", "ntf");
const BookingStore = makeStore("bookings", "bk");

/* ---- SessionStore: lưu mã tài khoản đang đăng nhập ---------------------- */
const SessionStore = {
  KEY: "neu_v2_session",

  login(user) {
    localStorage.setItem(this.KEY, user.id);
  },
  logout() {
    localStorage.removeItem(this.KEY);
  },
  // Luôn đọc lại từ bảng users để phản ánh thay đổi hồ sơ / bị khóa
  current() {
    const id = localStorage.getItem(this.KEY);
    if (!id) return null;
    const user = UserStore.getById(id);
    if (!user || user.status !== "active") {
      this.logout();
      return null;
    }
    return user;
  },
};

/* ---- Tra cứu nhanh ------------------------------------------------------- */
function getCategory(id) {
  const cats = CategoryStore.getAll();
  return cats.find((c) => c.id === id) || { id: "other", name: "Khác", icon: "sparkle", color: "slate" };
}
function getUnit(id) {
  return UnitStore.getById(id) || { id, name: "Đơn vị không xác định", logo: "building" };
}
function getRoom(id) {
  return RoomStore.getById(id);
}
