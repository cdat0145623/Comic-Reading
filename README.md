# Me Truyen Chu Workspace

Workspace gồm hai ứng dụng Next.js dùng chung PostgreSQL và chính sách xác thực:

- `metruyenchu`: trang đọc truyện, mặc định chạy cổng `3000`.
- `admin`: trang vận hành cho `ADMIN` và `UPLOADER`, mặc định chạy cổng `3001`.
- `packages/database`: Prisma schema, migrations và Prisma client dùng chung.
- `packages/auth`: cấu hình Auth.js và policy role/session dùng chung.

## Cài đặt

```bash
npm install
```

Lệnh trên tự generate Prisma client. Workspace chỉ dùng
`package-lock.json` ở thư mục root.

## Chạy local

```bash
npm run dev:web
npm run dev:admin
```

Hai lệnh được chạy ở hai terminal khác nhau. App Admin cần file
`admin/.env.local` theo mẫu `admin/.env.example`.

## Database

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
```

Prisma schema và migration nằm tại `packages/database/prisma`.

## Cấp quyền Admin

```bash
npm run user:set-role -- --email user@example.com --role ADMIN
npm run user:set-role -- --email uploader@example.com --role UPLOADER
```

Tài khoản phải có mật khẩu credentials và `emailVerified` mới đăng nhập được
Admin. Đổi role tăng `authVersion`, làm mất hiệu lực các JWT cũ của user.

## Kiểm tra

```bash
npm run lint
npm test
npm run build
```

Integration test credentials với PostgreSQL:

```bash
npm run test:admin-auth:db --workspace metruyenchu
```
