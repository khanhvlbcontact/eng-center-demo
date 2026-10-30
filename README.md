# Bright English Center – bản demo

Frontend React (Vite) + API Node/Express + SQLite (`node:sqlite`, cần Node ≥ 22.13).

## Chạy

```bash
npm install
npm run server   # API tại http://127.0.0.1:3001 (tạo server/data.db lần đầu)
npm run dev      # giao diện tại http://localhost:5173 (proxy /api sang server)
```

## Hai chế độ

- **Guest**: chọn vai trò ở màn hình đăng nhập, dữ liệu mẫu chạy hoàn toàn trên trình duyệt, không cần server.
- **Đăng nhập thật**: tài khoản thử nghiệm ở `server/users.seed.js` (đổi/xoá khi triển khai thật). Dữ liệu lưu ở SQLite, server kiểm tra quyền theo ma trận phân quyền.

## Kiến trúc

- `src/engine.js`: reducer nghiệp vụ dùng chung (ghi danh, thu học phí, chi lương, điểm danh, chấm bài…). Guest chạy trên client; server nạp state từ DB, chạy cùng reducer rồi chỉ ghi lại các dòng thay đổi.
- `server/db.js`: schema quan hệ (khoá ngoại, CHECK, UNIQUE, chỉ mục), ánh xạ bảng ↔ state, lưu trong một transaction. DB cũ dạng JSON được tự động chuyển sang bảng ở lần chạy đầu.
- `server/index.js`: đăng nhập (scrypt + JWT 12h, giới hạn 10 lần sai/5 phút), `/api/state` (chỉ dữ liệu role được xem; học viên chỉ thấy của mình), `/api/action` (kiểm tra quyền, ép các trường nhạy cảm như tác giả, số tiền lương), nhật ký hoạt động.
- `server/users.js`: quản lý người dùng (tạo/sửa/khoá/xoá/đặt lại mật khẩu), liên kết tài khoản với hồ sơ học viên/giáo viên, đổi mật khẩu.

## Quản lý người dùng

- Chỉ vai trò có quyền `Người dùng & nhật ký` (mặc định Admin) dùng được. Admin không thể tự khoá/xoá/hạ quyền mình, và luôn còn ít nhất một admin hoạt động.
- Tài khoản mới hoặc vừa bị đặt lại mật khẩu bị buộc đổi mật khẩu trước khi dùng chức năng khác. Mật khẩu tạm chỉ hiện một lần.
- Khoá tài khoản, đổi vai trò, đặt lại hoặc đổi mật khẩu làm token cũ mất hiệu lực ngay.
- Chính sách mật khẩu: 10–128 ký tự, có chữ hoa, chữ thường, chữ số.

## Còn thiếu so với bản triển khai thật

- Chưa có HTTPS, refresh token, quên mật khẩu qua email, xác thực hai lớp.
- Nhật ký chưa có lọc/phân trang; ghi nhận nhưng chưa lưu trước/sau của từng thay đổi.
- Chưa có migration có phiên bản cho các lần đổi schema sau này.
