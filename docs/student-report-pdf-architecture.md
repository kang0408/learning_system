# Luồng Hoạt Động & Kiến Trúc Hệ Thống: Xuất Báo Cáo Chẩn Đoán Học Sinh (Student Diagnostic Report PDF)

Tài liệu này mô tả chi tiết quy trình xử lý từ đầu đến cuối (End-to-End Flow), cách thức tổng hợp dữ liệu, tích hợp Gemini AI và cơ chế sinh PDF Server-side không phụ thuộc client dành cho tính năng **Báo Cáo Chẩn Đoán Năng Lực Học Sinh Cá Nhân Hóa**.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

```
[Giáo viên / Gia sư] 
       │
       ▼ (Bấm "Xuất Báo Cáo PDF" trên StudentDetailHeader)
[Teacher Student Detail Web UI] ──> [ExportStudentReportModal]
       │ (GET /api/v1/classes/:classId/students/:studentId/report/pdf)
       ▼
[ClassesController.exportStudentReportPdf]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[StudentReportService]                  [Gemini AI Service]
  - Kiểm tra quyền sở hữu lớp             - Prompt Sư phạm Chẩn đoán
  - Tổng hợp song song:                   - Cache Redis 24h: `ai:student-report:diagnostic:...`
    + Hồ sơ cá nhân học sinh              - Fallback Rule-based thông minh
    + Điểm tích lũy & Độ chính xác        - Lưu DB bảng `ai_reports`
    + Mốc đối chiếu TB lớp (Benchmark)
    + Phân tích Spaced Repetition (SM2)
    + Lọc danh mục Lỗ hổng (< 60% accuracy)
    + Lịch sử nộp bài tập
       │
       ▼ (Dữ liệu CompleteStudentReportData)
[PdfGeneratorService.generateStudentReportPdf]
       │
       ▼ (Render HTML Template có Chart.js: horizontal bar & donut)
[Headless Chromium via Puppeteer Singleton]
       │
       ▼ (Chờ window.chartRenderComplete === true & Render Vector 300 DPI)
[Output: Buffer PDF A4] ──> (Stream Content-Disposition: attachment) ──> [Trình duyệt Tải Về]
```

---

## 2. Chi Tiết Các Thành Phần Cốt Lõi

### 2.1. Backend Data Aggregator (`StudentReportService`)
- **Tập trung hóa truy vấn song song (`Promise.all`)**:
  - `analyticsRepo.getSM2Summary(studentId)`: Lấy 5 trạng thái ghi nhớ Spaced Repetition (Đã thành thạo, Đang rèn luyện, Cần ôn tập gấp, Kiến thức mới, Cần ôn hôm nay).
  - `analyticsRepo.getTopicPerformance(studentId)`: Thống kê tỷ lệ chính xác trên từng chuyên đề kiến thức.
  - `analyticsRepo.getTeacherClassStudents(classId)`: Tính điểm trung bình và độ chính xác trung bình toàn bộ thành viên trong lớp (Benchmark đối chiếu).
  - `prisma.assignment.findMany`: Tổng hợp lịch sử bài tập, điểm số cao nhất, số lần làm và trạng thái nộp bài.
  - `prisma.quizSession.findMany`: Lấy phiên làm bài gần nhất và tổng điểm thực tế.
- **Xác định Lỗ hổng kiến thức (`weak_topics`)**: Tự động lọc các chủ đề có độ chính xác dưới $60\%$ và học sinh đã làm từ 2 câu trở lên.

### 2.2. Đánh Giá Sư Phạm Chuyên Sâu (`AiService.generatePersonalizedStudentReport`)
- **Prompt chẩn đoán 3 phần (Dành cho Gia sư & Giáo viên kèm cặp)**:
  1. *1.1. Nhận định tổng quan năng lực & thói quen làm bài*: Đánh giá mức độ hoàn thành nhiệm vụ, điểm mạnh nổi trội và thói quen giải đề.
  2. *1.2. Phân tích điểm mạnh & Lỗ hổng kiến thức cốt lõi*: Chỉ rõ các chuyên đề học sinh bị hổng kiến thức, phân tích nguyên nhân tiềm ẩn và định hướng sửa sai.
  3. *1.3. Đánh giá sức bền ghi nhớ dài hạn (Spaced Repetition SM2)*: Đánh giá độ bền trí nhớ, cảnh báo lượng kiến thức có nguy cơ quên lãng và tần suất ôn tập cần thiết.
- **Tiêu chuẩn chất lượng**: Nghiêm cấm emoji/icon, văn phong học thuật, gãy gọn, cụ thể từng số liệu.
- **Redis Cache & DB**: Cache 24h theo khóa `ai:student-report:diagnostic:{classId}:{studentId}:{date}`, lưu kết quả vào bảng `ai_reports`.

### 2.3. Thiết Kế Template In Ấn Khổ A4 (`student-report.template.ts`)
- **Trang 1: Hồ Sơ Hành Chính & 4 Chỉ Số KPI Chẩn Đoán + Đánh Giá AI**:
  - 4 Thẻ KPI: Điểm tích lũy (so với TB Lớp), Độ chính xác (so với TB Lớp), Kiến thức thành thạo (SM2), Cần ôn tập gấp (At Risk).
  - Khối I. Đánh Giá Sư Phạm Chẩn Đoán (AI Gemini 3 mục).
- **Trang 2: Hệ Thống Biểu Đồ Trực Quan & Danh Mục Lỗ Hổng**:
  - Biểu đồ Cột ngang: Độ chính xác theo Chuyên đề (%) bằng Chart.js.
  - Biểu đồ Tròn: Phân bố 4 tầng ghi nhớ SM2.
  - Khối III. Danh mục Lỗ hổng kiến thức cần phụ đạo (kèm số câu sai và trọng tâm kèm cặp).
- **Trang 3: Nhật Ký Bài Tập**:
  - Khối IV. Bảng tổng hợp chi tiết toàn bộ bài tập đã làm (Điểm, %, Số lần thử, Trạng thái, Ngày nộp).

### 2.4. Công Nghệ Puppeteer In PDF Server-side (`PdfGeneratorService`)
- Tái sử dụng Singleton browser instance, cấu hình Viewport A4 chuẩn `800x1130` với độ phân giải Retina `deviceScaleFactor: 2`.
- Lắng nghe cờ `window.chartRenderComplete === true` trước khi in, đảm bảo biểu đồ không bị trắng hoặc nhòe khi xuất.

### 2.5. Giao Diện Người Dùng Giáo Viên (`StudentDetailHeader` & `ExportStudentReportModal`)
- Nút **"Xuất Báo Cáo PDF"** tích hợp ngay trên thanh tiêu đề `StudentDetailHeader`.
- Modal xác nhận tinh gọn, hiển thị thông báo toast quá trình phân tích AI và kích hoạt tải file dạng `Bao_Cao_Hoc_Sinh_{TenHocSinh}_{YYYY-MM-DD}.pdf`.

---

## 3. Danh Sách Endpoint

| Phương thức | Đường dẫn API | Quyền hạn | Mục đích |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/classes/:classId/students/:studentId/report/pdf` | `teacher` | Tải file PDF chẩn đoán A4 hoàn chỉnh |
| `GET` | `/api/v1/classes/:classId/students/:studentId/report/data` | `teacher` | Lấy dữ liệu JSON chẩn đoán tổng hợp |
