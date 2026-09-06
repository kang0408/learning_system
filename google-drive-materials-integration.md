# Kế hoạch phát triển: Tích hợp Google Drive & Quản lý Tài liệu Bài học (Curriculum Materials)

## Mục tiêu (Goal)
Cho phép giáo viên liên kết Google Drive, thực hiện CRUD quản lý tài liệu (chủ động bật/tắt quyền Public "Anyone with link can view"), gán trực tiếp vào Lộ trình bài học (Curriculum); đồng thời cho phép học sinh mở và xem trực tiếp tài liệu thông qua modal nhúng Google Drive Viewer ngay trên website.

---

## Đánh giá Kiến trúc Backend (BFRI - Backend Feasibility & Risk Index)
Theo tiêu chuẩn `/backend-dev-guidelines`:
* **Architectural Fit (5/5):** Tuân thủ nghiêm ngặt mô hình phân tầng: Routes → Controllers (`BaseController`) → Services → Repositories → Database.
* **Testability (5/5):** Mock Google Drive API v3 dễ dàng bằng Jest cho Unit/Integration tests.
* **Complexity (2/5):** Nghiệp vụ xử lý OAuth 2.0 refresh token và toggle Google Drive permissions đơn giản, độc lập.
* **Data Risk (1/5):** Không tác động phá vỡ dữ liệu cũ; trường `file_url` trong `curriculum_materials` vẫn tương thích ngược 100%.
* **Operational Risk (2/5):** Quản lý refresh token Google OAuth cần mã hóa AES-256 trong DB.

$$BFRI = (5 + 5) - (2 + 1 + 2) = +5 \quad \text{(Safe / Moderate - Tiến hành triển khai tiêu chuẩn)}$$

---

## Danh sách công việc (Tasks)

- [x] **Task 1 (Frontend Teacher - Core):** Xây dựng module Quản lý Tài liệu Google Drive của Giáo viên (`apps/web/src/features/teacher/documents`) bao gồm liên kết tài khoản Google, danh sách file, tìm kiếm, lọc và nút toggle Public/Private trực tiếp trên từng file.  
  → **Verify:** Mở `/teacher/documents`, thấy giao diện liên kết Drive, danh sách file và toggle trạng thái Công khai/Riêng tư phản hồi tức thì.

- [x] **Task 2 (Frontend Teacher - Navigation & Routing):** Tạo trang `TeacherDocuments.tsx`, đăng ký route `/teacher/documents` trong `router.tsx` và thêm mục menu "Tài liệu Drive" vào `TeacherLayout.tsx`.  
  → **Verify:** Menu sidebar Giáo viên có mục "Tài liệu Drive", click chuyển hướng chuẩn xác và active menu.

- [x] **Task 3 (Frontend Teacher - Curriculum Integration):** Tích hợp modal chọn tài liệu từ Google Drive (`GoogleDrivePickerModal`) vào `CurriculumFormModal.tsx` tại mục Tài liệu bài học. Cho phép chọn file đã công khai hoặc 1-click "Công khai & Gán".  
  → **Verify:** Mở form tạo/sửa bài giảng, bấm "Chọn từ Google Drive", chọn file → thông tin tài liệu tự điền vào danh sách materials.

- [x] **Task 4 (Frontend Student - In-App Google Preview):** Nâng cấp `StudentCurriculumDetailFeature.tsx` và `LessonMaterialsList.tsx` với `GoogleDocPreviewModal`. Khi học sinh click vào tài liệu, mở popup nhúng Google Drive Preview (`/preview`) trực tiếp trên web với thanh điều khiển (Xem tab mới, Đóng, Loading spinner).  
  → **Verify:** Học sinh click tài liệu bài học, modal nhúng Google Preview mở lên mượt mà, đọc được nội dung mà không bị chuyển trang.

- [ ] **Task 5 (Backend - Database & Schema):** Cập nhật Prisma Schema (`schema.prisma`): thêm bảng `teacher_integrations` (lưu encrypted `refresh_token`, google email, storage quota) và thêm trường `drive_file_id` vào bảng `curriculum_materials`.  
  → **Verify:** Chạy `npx prisma migrate dev`, schema đồng bộ và gen Prisma Client thành công.

- [ ] **Task 6 (Backend - Google OAuth & Drive Service Layer):** Viết `googleDrive.repository.ts`, `googleDrive.service.ts`, `googleDrive.controller.ts`, và `googleDrive.routes.ts` sử dụng thư viện `googleapis`. Xử lý OAuth callback, refresh token rotation, CRUD file và `permissions.create(role: 'reader', type: 'anyone')`.  
  → **Verify:** Gửi request Postman test flow `/api/integrations/google-drive/auth-url`, callback exchange code và list files trả về HTTP 200.

- [ ] **Task 7 (End-to-End Testing & Sentry Logging):** Viết unit tests cho Google Drive service và integration tests cho routes; tích hợp Sentry error boundaries theo chuẩn `/backend-dev-guidelines`.  
  → **Verify:** `npm run test` pass 100%, không có unhandled promise rejections.

---

## Tiêu chí hoàn thành (Done When)
- [ ] Giáo viên liên kết được Google Drive cá nhân, thấy danh sách file trong kho và chủ động toggle Công khai / Riêng tư.
- [ ] Giáo viên có thể gán link file Drive vào bài học bằng 1 click từ modal chọn file.
- [ ] Học sinh bấm vào tài liệu thì modal Google Preview nhúng hiển thị ngay trên web, đọc tài liệu mượt mà, không bị lỗi truy cập.
