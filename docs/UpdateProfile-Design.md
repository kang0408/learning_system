# Thiết kế Tính năng: Cập nhật thông tin cá nhân (Profile)

## 1. Tóm tắt yêu cầu (Understanding Summary)
- **Đang xây dựng:** Tính năng cập nhật thông tin cá nhân (Họ tên, SĐT, Địa chỉ, Avatar).
- **Mục đích:** Giúp người dùng quản lý hồ sơ cá nhân của họ luôn cập nhật và chính xác.
- **Đối tượng sử dụng:** Học sinh (Student), Giáo viên (Teacher) và Phụ huynh (Parent).
- **Các ràng buộc chính:**
  - *Frontend:* Giao diện cập nhật nằm tách biệt ở Dashboard riêng của từng đối tượng.
  - *Backend:* Ảnh Avatar sẽ được lưu trữ cục bộ (Local Storage) trên ổ cứng của server.
- **Ngoài phạm vi:** Không bao gồm việc thay đổi Email hay Mật khẩu.

## 2. Các giả định và Rủi ro (Assumptions & Risks)
- **Bảo mật:** API sẽ kiểm tra Authorization chặt chẽ qua JWT Token để đảm bảo user chỉ được phép cập nhật thông tin của chính họ.
- **Hiệu năng & Quản lý file:** Upload Avatar sẽ được giới hạn kích thước (tối đa 5MB) và chỉ cho phép định dạng ảnh hợp lệ (jpg, png, webp).
- **Rủi ro (Risk):** Vì lưu ảnh trực tiếp trên Backend, nếu ứng dụng scale ra nhiều server (Load Balancing), file tải lên 1 server sẽ không có ở server kia nếu không dùng chung ổ cứng chia sẻ. Giải pháp tạm thời hiện tại là chấp nhận rủi ro này ở môi trường 1 server.

## 3. Nhật ký quyết định (Decision Log)
- **Lưu trữ Avatar:** Chọn lưu file cục bộ (Backend Local Storage) qua `multer`.
  - *Lý do:* Nhanh gọn, dễ triển khai ở giai đoạn đầu, không phụ thuộc bên thứ 3.
- **Thiết kế Backend API:** Chọn dùng 1 endpoint API duy nhất `PATCH /api/users/profile`.
  - *Lý do:* Tái sử dụng logic upload và update cho cả 3 roles, quản lý tập trung.
- **Thiết kế Frontend UI:** Chọn tạo Form riêng biệt ở mỗi dashboard (`pages/student/Profile`, v.v.).
  - *Lý do:* Mỗi role tương lai có thể mở rộng UI khác biệt, ưu tiên tính linh hoạt trên giao diện.

## 4. Thiết kế chi tiết (Final Design)

### 4.1 Backend
- **Endpoint:** `PATCH /api/users/profile` (Format: `multipart/form-data`)
- **Middlewares:**
  - *Auth:* Xác thực JWT, gắn `user.id` vào request.
  - *Multer:* Validate size/type, lưu file vào `public/uploads/avatars/`, đổi tên file thành `[userId]-[timestamp].[ext]`.
- **Logic cập nhật:**
  - Parse các trường `fullName`, `phone`, `address` từ body. Lấy URL ảnh từ `req.file`.
  - Cập nhật User trong DB.
  - Xóa file avatar cũ (nếu là local file) để dọn dẹp dung lượng.
  - Trả về User object mới.

### 4.2 Frontend
- **Cấu trúc File:**
  - `apps/web/src/pages/student/Profile.tsx` (và tương tự cho Teacher, Parent).
- **State & Form Handling:**
  - Sử dụng React Hook Form để handle validate (required, phone format).
  - Avatar Preview: Dùng `URL.createObjectURL()` khi người dùng chọn file.
- **Data Flow:**
  - Gửi data thông qua đối tượng `FormData`.
  - Fetch `PATCH /api/users/profile`.
  - Success: Hiện Toast báo thành công, update User trong Global State.
  - Error: Hiện Toast báo lỗi.
