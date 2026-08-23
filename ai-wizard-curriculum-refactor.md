# AI Wizard Curriculum Refactor (Full Lesson & Assignment Settings, Dynamic Topics, & Clean Loading UI)

## Goal
Cải tiến toàn diện luồng tạo lộ trình AI: hỗ trợ cấu hình đầy đủ thông số bài học và bài tập (kiểu bài tập mặc định Luyện tập `standard`, số lần làm tối đa, giới hạn thời gian, hạn chót, bật/tắt phát hành bài tập, bật/tắt công khai bài học trong lộ trình), quản lý chủ đề động (mặc định 1 chủ đề/bài học, tạo chủ đề mới, đổi chủ đề câu hỏi, lưu chủ đề rỗng) và tinh gọn giao diện với icon loading.

## Tasks
- [x] **Task 1 (Backend Schema & Prompt)**: Cập nhật `ai-wizard.schema.ts` bổ sung các trường cấu hình bài học & bài tập (`assignment_mode`, `max_attempts`, `time_limit_minutes`, `deadline`, `is_assignment_published`, `is_curriculum_published`) cho `WizardLesson`. Tinh chỉnh prompt trong `ai-wizard.service.ts` để mỗi bài học sinh ra 1 chủ đề chính duy nhất và câu hỏi tự động gán vào chủ đề này → Verified (code 0).
- [x] **Task 2 (Backend Commit Transaction)**: Cập nhật hàm `commitWizardToDatabase` trong `ai-wizard.repository.ts` để:
  1. Tạo `ClassCurriculum` với `is_published: lesson.is_curriculum_published ?? true`.
  2. Lưu tất cả `Topic` độc lập (chủ đề không có câu hỏi vẫn được tạo trong DB).
  3. Khởi tạo `Assignment` với đầy đủ các cấu hình gia sư đã chỉnh sửa (`mode`, `max_attempts`, `time_limit`, `deadline`, `is_published`) → Verified (code 0).
- [x] **Task 3 (Frontend Type Definitions)**: Cập nhật `WizardLesson` trong `apps/web/src/features/teacher/class-detail/types/aiWizard.types.ts` bổ sung đầy đủ các trường cấu hình bài tập & lộ trình → Verified (code 0).
- [x] **Task 4 (Frontend UI Cleanup)**: Xóa bỏ khối thanh tiến trình dài (Progress Bar box) trong `AiWizardLessonsStage.tsx`. Giữ lại biểu tượng spinner `Loader2 animate-spin` gọn gàng trên nút bấm và thẻ bài học đang tạo trong `AiLessonCard.tsx` → Verified (code 0).
- [x] **Task 5 (Frontend Lesson & Assignment Settings in Detail Modal)**: Trong `AiLessonDetailModal.tsx` và `AiLessonCard.tsx`, thiết kế tab và khu vực "Cấu hình Bài học & Bài tập" đầy đủ: Kiểu bài tập, Số lần làm tối đa, Giới hạn thời gian, Hạn chót, Bật/tắt phát hành bài tập, Bật/tắt công khai bài học → Verified (code 0).
- [x] **Task 6 (Frontend Dynamic Topics & Question Topic Reassign)**: Trong `AiLessonDetailModal.tsx`, thêm nút "Thêm chủ đề mới" cho bài học và dropdown chọn chủ đề trên từng thẻ câu hỏi → Verified (code 0).
- [x] **Task 7 (Locales i18n)**: Bổ sung các nhãn song ngữ cho toàn bộ các thiết lập mới vào `apps/web/src/locales/vi.json` và `apps/web/src/locales/en.json` → Verified (code 0).
- [x] **Task 8 (Verification & Build Check)**: Chạy kiểm tra biên dịch TypeScript `npx tsc -b --noEmit` trên cả `apps/web` và `apps/api` → Đạt 0 lỗi biên dịch trên cả hai ứng dụng.

## Done When
- [x] Gia sư khi mở xem chi tiết bài học có thể chỉnh sửa: Kiểu bài tập, Số lần làm tối đa, Giới hạn thời gian, Hạn chót, Bật/tắt phát hành bài tập, Bật/tắt công khai bài học trong lộ trình.
- [x] Mỗi bài học mặc định có 1 chủ đề; gia sư có thể tạo thêm chủ đề mới và đổi chủ đề cho từng câu hỏi.
- [x] Chủ đề mới dù không gán câu hỏi nào vẫn được lưu vào cơ sở dữ liệu khi Hoàn tất lộ trình.
- [x] Giao diện khi đang sinh câu hỏi loại bỏ thanh trạng thái dài, chỉ hiển thị icon loading quay tròn tinh gọn.
- [x] Toàn bộ hệ thống chạy trơn tru, không có lỗi TypeScript hay xung đột dữ liệu.
