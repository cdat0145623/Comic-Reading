# MTC Admin

Ứng dụng Admin độc lập cho Mê Truyện Chữ. Luồng đăng nhập đã nối Auth.js,
PostgreSQL và role thật; dữ liệu dashboard vẫn là mock trong phase giao diện.

## Chạy local

```bash
cp admin/.env.example admin/.env.local
npm run dev:admin
```

Chạy lệnh từ workspace root. Admin mở tại `http://localhost:3001`.

Các biến bắt buộc:

- `DATABASE_URL`: cùng PostgreSQL với app đọc truyện.
- `ADMIN_AUTH_SECRET`: secret riêng, không dùng chung `NEXTAUTH_SECRET`.
- `ADMIN_APP_URL`: URL public cố định của Admin ở production. Trong development,
  Auth.js lấy host và port từ request hiện tại.
- `READER_APP_URL`: URL app đọc truyện, dùng cho link quên mật khẩu.

## Vai trò

- `ADMIN`: vận hành toàn hệ thống, xử lý report, duyệt nội dung, banner, user,
  ranking/job và audit log.
- `UPLOADER`: người đăng truyện, bao gồm phương pháp Dịch, Convert và AI dịch;
  chỉ xem và quản lý dữ liệu truyện thuộc quyền sở hữu.

Role được lấy từ session, không còn đọc từ query string hoặc role switcher.
Tài khoản `USER`, tài khoản chưa xác minh email hoặc không có password
credentials đều bị từ chối.

Admin dùng JWT cookie namespace riêng với app đọc truyện và có hạn tuyệt đối 8
giờ. Dashboard kiểm tra session ở middleware và kiểm tra lại role/session trong
server layout.

## Cấp role

Chạy từ workspace root:

```bash
npm run user:set-role -- --email user@example.com --role ADMIN
npm run user:set-role -- --email uploader@example.com --role UPLOADER
```

## Giới hạn phase hiện tại

- Chưa nối dữ liệu dashboard, audit log và mutation quản trị.
- Chưa triển khai quên mật khẩu riêng trong Admin; link quay về flow reader.
- Chưa cho đăng nhập Google trong Admin.
