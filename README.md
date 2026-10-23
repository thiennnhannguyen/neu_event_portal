# NEU Event Portal — Frontend

Frontend HTML/CSS/JS thuần cho đồ án "Quản lý dự án xây dựng website Cổng thông tin sự kiện tại Đại học Kinh tế Quốc dân".

## Cách chạy

Vì các trang gọi lẫn nhau bằng đường dẫn tương đối và dùng `localStorage`, nên mở bằng một local server thay vì mở file trực tiếp (double-click):

```bash
cd neu-event-portal
python3 -m http.server 8080
# hoặc: npx serve .
```

Sau đó mở `http://localhost:8080`.

## Cấu trúc thư mục

```
neu-event-portal/
├── index.html             Trang chủ
├── events.html            Danh sách sự kiện (tìm kiếm + lọc danh mục, đơn vị, thời gian, hình thức, còn chỗ)
├── event-detail.html      Chi tiết sự kiện: đăng ký / hủy, vé QR, quan tâm, đánh giá
├── login.html             Đăng nhập email + mật khẩu (kèm danh sách tài khoản demo)
├── register.html          Đăng ký tài khoản sinh viên
├── forgot-password.html   Quên mật khẩu (mã xác nhận mô phỏng)
├── profile.html           Hồ sơ cá nhân + đổi mật khẩu
├── my-events.html         Hoạt động của tôi: vé, lịch tháng, quan tâm, lịch sử, điểm Đoàn
├── notifications.html     Hộp thông báo
├── dashboard.html         Trang quản lý theo vai trò (BTC / Admin / Đoàn trường / Phòng Thiết bị)
├── css/style.css          Toàn bộ style (CSS variables; phần bổ sung nằm sau mục "PHẦN MỞ RỘNG")
└── js/
    ├── data.js            "CSDL" localStorage (10 bảng) + dữ liệu mẫu
    ├── services.js        Quy tắc nghiệp vụ (đóng vai backend)
    ├── main.js            Header/Footer, bộ icon SVG, modal, toast, tiện ích chung
    └── home.js, events.js, detail.js, login.js, register.js, forgot.js,
        profile.js, my-events.js, notifications.js, dashboard.js
```

## Tài khoản demo (mật khẩu chung: `123456`)

| Vai trò | Email |
|---|---|
| Sinh viên | anh.nm@st.neu.edu.vn, chau.tb@st.neu.edu.vn, huy.lq@st.neu.edu.vn, ha.pt@st.neu.edu.vn (nam.dv@… bị khóa) |
| Ban tổ chức | doanthanhnien@neu.edu.vn, mac.club@neu.edu.vn, sv20.neu@gmail.com, khoaktkh@neu.edu.vn, career@neu.edu.vn |
| Quản trị viên | admin@neu.edu.vn |
| Đoàn trường | doantruong@neu.edu.vn |
| Phòng Quản trị thiết bị | thietbi@neu.edu.vn |

Trang `login.html` có danh sách tài khoản demo, bấm vào để điền nhanh. Dữ liệu mẫu được tạo với ngày tương đối so với hôm nay (luôn có sự kiện sắp tới, đang diễn ra và đã kết thúc). Nút **"Khôi phục dữ liệu demo"** ở chân trang đưa mọi dữ liệu về ban đầu.

## Cách dữ liệu hoạt động (quan trọng khi nối Backend)

- `js/data.js`: mỗi bảng là một Store (`EventStore`, `UserStore`, `RegistrationStore`…) với `getAll / getById / create / update / remove`.
- `js/services.js`: toàn bộ ràng buộc nghiệp vụ (hạn đăng ký, số chỗ, quyền theo đơn vị, lý do từ chối, sinh thông báo…). Mỗi hàm trả về `{ ok, data }` hoặc `{ ok: false, error }`.

**Khi làm Backend thật**: thay phần thân các service bằng `fetch()` gọi API (giữ nguyên tên hàm và kết quả trả về) — các trang giao diện không cần sửa.

## Luồng trạng thái

```
Sự kiện:  Bản nháp → Chờ duyệt → Đã đăng → Đã kết thúc
                              ↘ Từ chối (kèm lý do) → sửa & gửi lại
          Đã đăng → Đã hủy (BTC, kèm lý do)   |   Đã đăng → Đã gỡ (Admin, vi phạm)
Phiếu:    Đã đăng ký → Đã tham dự (điểm danh) | Vắng mặt (khi sự kiện kết thúc) | Đã hủy
```

Các lựa chọn cho những điểm đặc tả chưa rõ:
- Quản trị viên **hoặc** Đoàn trường duyệt sự kiện (một cấp, bên nào duyệt trước).
- Sự kiện trực tiếp chọn phòng → tự tạo yêu cầu mượn phòng gửi Phòng Quản trị thiết bị (không chặn việc duyệt sự kiện).
- Đoàn trường cấp điểm Đoàn theo sự kiện đã kết thúc, cho sinh viên có phiếu Đã tham dự.
- Sinh viên chỉ được hủy đăng ký **trước hạn đăng ký**; điểm danh mở từ 60 phút trước giờ bắt đầu.
- Email xác nhận và mã quên mật khẩu được mô phỏng (hiển thị trên giao diện / trong thông báo).

## Thiết kế

Phong cách "Modern University Event Hub": nền sáng, màu chủ đạo navy `#12305B` / xanh dương `#2457D6` (định hướng sản phẩm, không phải bộ nhận diện chính thức của NEU), một font sans-serif (Inter), icon SVG nét mảnh một màu (`icon()` trong `main.js`). Toàn bộ token (màu, khoảng cách 4–64px, bo góc, bóng) nằm ở `:root` trong `css/style.css`.

- Thẻ sự kiện dùng chung (`eventCardHtml`): ảnh bìa 21:9 từ trường `cover` (tùy chọn, nhập ở form tạo sự kiện); thiếu ảnh hoặc ảnh lỗi sẽ hiển thị "poster ngày" (ngày, tháng, thứ, danh mục). Trang Sự kiện có chế độ Lưới / Danh sách (lưu ở key riêng `neu_ui_events_view`); trang chi tiết có khối đếm ngược, "Thêm vào lịch" (.ics) và "Sao chép liên kết". Trạng thái "Sắp hết chỗ / Hết chỗ / Hết hạn" tính từ dữ liệu thật.
- Mobile: menu thu gọn, bộ lọc dạng bottom sheet (chỉ áp dụng khi bấm "Xem N kết quả"), thanh CTA đăng ký cố định ở trang chi tiết, menu quản lý thu gọn ở dashboard.
