# Kế Hoạch Triển Khai: Xuất Báo Cáo Chẩn Đoán Học Lực Cá Nhân Hóa Dành Cho Gia Sư (Student Performance PDF Report)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Xây dựng tính năng xuất Báo cáo PDF Chẩn đoán Năng lực Học sinh cá nhân hóa (khổ A4 chuẩn in ấn, có Gemini AI phân tích sư phạm không emoji/icon, đồ thị Chart.js và danh mục lỗ hổng kiến thức) dành riêng cho Giáo viên/Gia sư tại trang chi tiết học sinh (`student-detail`).

**Architecture:** Server-Side PDF Rendering sử dụng Singleton Puppeteer Pool kết hợp phân tích chuyên sâu từ Gemini AI (có Redis Cache 24h) và Chart.js vector visualization. Toàn bộ quá trình tổng hợp số liệu học tập cá nhân, so sánh tương quan lớp (benchmark), vẽ biểu đồ và xuất PDF được xử lý tập trung tại Backend để đảm bảo độ nét cao (300 DPI) và bảo mật dữ liệu.

**Tech Stack:** Node.js, Express, TypeScript, Puppeteer, Chart.js, Gemini API, Redis, Prisma, React, Tailwind CSS.

---

## Danh Sách Tác Vụ Chi Tiết (Bite-Sized Tasks)

### Task 1: AI Service - Mở Rộng Prompt Chẩn Đoán Sư Phạm Cá Nhân Hóa
**Mục tiêu:** Thêm phương thức `generatePersonalizedStudentReport` vào `AiService` với prompt học thuật nghiêm ngặt dành cho Gia sư (không emoji, không icon), phân tích 3 phần chẩn đoán và cấu hình Redis cache 24h.

**Files:**
- Modify: `apps/api/src/modules/ai/ai.service.ts`
- Test: `apps/api/src/modules/ai/__tests__/ai.student-report.test.ts`

**Step 1: Viết test kiểm thử trước (TDD)**
Tạo `apps/api/src/modules/ai/__tests__/ai.student-report.test.ts` kiểm thử logic tạo prompt, gọi Gemini model và lưu cache Redis 24h.

**Step 2: Chạy test để xác nhận FAIL**
Chạy: `npx jest src/modules/ai/__tests__/ai.student-report.test.ts` (Expected: FAIL do chưa có phương thức).

**Step 3: Cài đặt phương thức `generatePersonalizedStudentReport`**
Thêm hàm vào `apps/api/src/modules/ai/ai.service.ts`:
- Phân tích:
  1. `executive_summary`: Nhận định năng lực thực tế, tốc độ làm bài và thói quen học tập.
  2. `strengths_and_weaknesses`: Phân tích điểm mạnh và lỗ hổng kiến thức cốt lõi dựa trên danh mục weak topics.
  3. `sm2_learning_analysis`: Đánh giá sức bền ghi nhớ dài hạn Spaced Repetition (số câu có nguy cơ quên, số câu thành thạo).
- Lưu cache Redis: `ai:student-report:diagnostic:${classId}:${studentId}:${date}` (TTL 24h).
- Lưu bản ghi vào bảng `ai_reports`.

**Step 4: Chạy test để xác nhận PASS**
Chạy: `npx jest src/modules/ai/__tests__/ai.student-report.test.ts` (Expected: PASS).

---

### Task 2: Service Tổng Hợp Dữ Liệu Học Sinh Cá Nhân Hóa (`StudentReportService`)
**Mục tiêu:** Tạo `StudentReportService` tổng hợp song song các chỉ số của học sinh (Điểm tích lũy, độ chính xác, so sánh benchmark trung bình lớp, phân bố SM2, danh mục chủ đề yếu và lịch sử bài tập).

**Files:**
- Create: `apps/api/src/modules/classes/student-report.service.ts`
- Test: `apps/api/src/modules/classes/__tests__/student-report.service.test.ts`

**Step 1: Viết test cho `StudentReportService`**
Kiểm thử truy vấn dữ liệu học sinh, tính toán độ lệch benchmark lớp và gọi AI service.

**Step 2: Chạy test để xác nhận FAIL**
Chạy: `npx jest src/modules/classes/__tests__/student-report.service.test.ts` (Expected: FAIL).

**Step 3: Cài đặt `StudentReportService`**
- Truy vấn thông tin học sinh, lớp học, giáo viên phụ trách.
- Truy vấn điểm trung bình và độ chính xác trung bình của cả lớp để làm mốc đối chiếu (Benchmark).
- Thống kê Spaced Repetition (Đã thành thạo, Đang rèn luyện, Cần ôn tập gấp, Kiến thức mới).
- Truy vấn Top chủ đề yếu (Weak Topics: độ chính xác < 60%) và lịch sử các bài tập đã nộp.
- Gọi `AiService.generatePersonalizedStudentReport` để lấy nhận định sư phạm.

**Step 4: Chạy test để xác nhận PASS**
Chạy: `npx jest src/modules/classes/__tests__/student-report.service.test.ts` (Expected: PASS).

---

### Task 3: Thiết Kế HTML/CSS Template Báo Cáo Học Sinh Khổ A4
**Mục tiêu:** Tạo HTML template `student-report.template.ts` tích hợp Chart.js cho hồ sơ học sinh, chuẩn in ấn A4 không icon/emoji.

**Files:**
- Create: `apps/api/src/modules/classes/templates/student-report.template.ts`

**Chi tiết thiết kế 3 trang:**
- **Trang 1: Hồ sơ Chẩn đoán Năng lực & Đánh giá Sư phạm**:
  - Thông tin học sinh, lớp, môn học, ngày xuất.
  - 4 thẻ KPI có đối chiếu Benchmark lớp (Điểm số, Độ chính xác, Kiến thức thành thạo, Cần ôn tập gấp).
  - Khối nhận định sư phạm AI 3 phần (1.1, 1.2, 1.3).
- **Trang 2: Bản đồ Chuyên đề & Bảng Lỗ hổng cần Kèm cặp**:
  - Biểu đồ cột ngang (Topic Accuracy %) full-width.
  - Biểu đồ tròn (SM2 Memory Distribution) full-width.
  - Bảng danh mục lỗ hổng kiến thức cần phụ đạo (`Diagnostic Table`).
- **Trang 3+: Bảng Chi tiết Bài tập Đã làm**:
  - Bảng nhật ký bài tập (Tên bài, Điểm, Độ chính xác, Số lần thử, Ngày nộp).

---

### Task 4: Mở Endpoint Backend & Unit Test Sinh PDF
**Mục tiêu:** Tạo hàm render PDF trong `PdfGeneratorService`, thêm controller và route tải PDF học sinh.

**Files:**
- Modify: `apps/api/src/modules/classes/pdf-generator.service.ts`
- Modify: `apps/api/src/modules/classes/classes.controller.ts`
- Modify: `apps/api/src/modules/classes/classes.routes.ts`
- Test: `apps/api/src/modules/classes/__tests__/student-pdf-generator.test.ts`

**Step 1: Viết test cho luồng sinh PDF học sinh**
Kiểm thử Puppeteer nạp dữ liệu mẫu của học sinh và sinh buffer PDF hợp lệ (`> 10000 bytes`, `%PDF-1.4`).

**Step 2: Cài đặt Controller & Route**
- `GET /api/v1/classes/:classId/students/:studentId/report/pdf`
- `GET /api/v1/classes/:classId/students/:studentId/report/data`
- Bảo vệ bằng middleware `requireAuth` và kiểm tra quyền giáo viên quản lý lớp.

**Step 3: Chạy test xác nhận PASS**
Chạy: `npx jest src/modules/classes/__tests__/student-pdf-generator.test.ts` (Expected: PASS).

---

### Task 5: Tích Hợp Giao Diện Giáo Viên (Teacher Student Detail UI)
**Mục tiêu:** Thêm nút "Xuất Báo Cáo PDF" trên Header trang chi tiết học sinh và tạo Modal xác nhận tải báo cáo.

**Files:**
- Create: `apps/web/src/features/teacher/student-detail/components/ExportStudentReportModal.tsx`
- Modify: `apps/web/src/features/teacher/student-detail/components/StudentDetailHeader.tsx`
- Modify: `apps/web/src/features/teacher/student-detail/api/teacherStudentDetailApi.ts`
- Modify: `apps/web/src/features/teacher/student-detail/index.tsx`
- Modify: `apps/web/src/locales/vi.json` & `apps/web/src/locales/en.json`

**Chi tiết các bước UI:**
1. Thêm hàm `downloadStudentReportPdf(classId, studentId, studentName)` vào `teacherStudentDetailApi.ts`.
2. Tạo Modal `ExportStudentReportModal.tsx` sử dụng component `Dialog` tinh gọn.
3. Thêm nút **"Xuất Báo Cáo PDF"** vào `StudentDetailHeader.tsx`.
4. Bổ sung các key dịch thuật vào `vi.json` và `en.json`.

---

### Task 6: Kiểm Thử Toàn Diện & TypeCheck
**Mục tiêu:** Chạy kiểm tra TypeScript và kiểm thử toàn bộ test suite để đảm bảo 0 lỗi hồi quy (zero regression).

**Step 1: TypeCheck Frontend**
Chạy: `npx tsc --noEmit` trong `apps/web`.

**Step 2: TypeCheck Backend**
Chạy: `npx tsc --noEmit` trong `apps/api`.

**Step 3: Run Full Test Suites**
Chạy: `npx jest src/modules/ai/__tests__ src/modules/classes/__tests__ --runInBand` trong `apps/api`.
