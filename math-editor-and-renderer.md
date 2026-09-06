# Math Editor and Renderer Implementation Plan

## Goal
Tích hợp bộ soạn thảo đa năng **TextEditor + MathInput** (hỗ trợ định dạng văn bản, phím tắt công thức toán LaTeX, Live Preview) và bộ hiển thị **MathRenderer** trên toàn bộ hệ thống cho Giáo viên (Quản lý câu hỏi, Tạo lộ trình AI) và Học sinh (Làm Quiz, Xem giải thích, Đánh giá kết quả).

## Tasks
- [ ] **Task 1: Cài đặt KaTeX & Cấu hình Stylesheet**
  - Cài đặt `katex` & `@types/katex` trong `apps/web`.
  - Nhập `@import "katex/dist/katex.min.css";` vào `apps/web/src/index.css`.
  - *Verify:* Chạy `npm run dev` trong `apps/web` không báo lỗi thiếu module hoặc CSS.

- [ ] **Task 2: Xây dựng Bộ Base UI Components Dùng Chung**
  - Tạo `apps/web/src/components/ui/MathRenderer.tsx` (parse text & render LaTeX inline `$..$` / block `$$..$$` qua KaTeX với safe fallback).
  - Tạo `apps/web/src/components/ui/MathToolbar.tsx` (thanh phím tắt ký hiệu toán học: $\frac{a}{b}, \sqrt{x}, x^n, \int, \sum, \pm, \pi, \le, \ge, \dots$).
  - Tạo `apps/web/src/components/ui/RichMathEditor.tsx` (Textarea kết hợp Text format B/I/U/List/Code + MathToolbar + Live Preview).
  - Tạo `apps/web/src/components/ui/InlineMathTextEditor.tsx` (Input 1 dòng có popup ký hiệu toán và live preview pill).
  - *Verify:* Nhập thử chuỗi `Giải phương trình $x^2 + \sqrt{4} = \frac{6}{2}$` render đúng công thức toán và chữ in đậm/nghiêng.

- [ ] **Task 3: Cập nhật Backend AI Prompts Chuẩn Hóa LaTeX**
  - Cập nhật `apps/api/src/modules/ai/ai.service.ts` (`generateQuizQuestions`): Bổ sung quy tắc bắt buộc trả về công thức toán dạng LaTeX kẹp giữa `$ ... $`.
  - Cập nhật `apps/api/src/modules/ai/ai-wizard.service.ts` (`generateUnitTopicsAndQuestions`, `regenerateSingleQuestion`): Bổ sung quy tắc LaTeX cho trích xuất tài liệu và sinh bài tập.
  - *Verify:* Chạy test `npm test` trong `apps/api` pass không lỗi.

- [ ] **Task 4: Tích hợp Ngân hàng Đề & Chi tiết Chủ đề (Teacher Question Bank)**
  - Cập nhật `apps/web/src/features/teacher/question-bank/components/CreateQuestionModal.tsx` & `apps/web/src/features/teacher/topic-detail/components/SaveQuestionModal.tsx`: Dùng `RichMathEditor` cho đề bài / giải thích, và `InlineMathTextEditor` cho từng đáp án / cặp nối.
  - Cập nhật `apps/web/src/features/teacher/topic-detail/components/QuestionList.tsx`: Render câu hỏi & đáp án bằng `MathRenderer`.
  - Cập nhật `apps/web/src/features/teacher/topic-detail/components/GenerateAiQuestionsModal.tsx`: Render preview câu hỏi AI sinh bằng `MathRenderer`.
  - Cập nhật `apps/web/src/features/teacher/new-assignment/components/TopicQuestionsList.tsx` & `apps/web/src/features/teacher/edit-assignment/components/TopicQuestionsList.tsx`: Render math khi chọn câu hỏi vào Assignment.
  - *Verify:* Mở modal tạo/sửa câu hỏi, gõ công thức toán thấy preview ngay lập tức; lưu câu hỏi hiển thị đẹp trong QuestionList.

- [ ] **Task 5: Tích hợp Tạo Lộ Trình AI & Soạn Bài Học (AI Curriculum Wizard)**
  - Cập nhật `apps/web/src/features/teacher/class-detail/components/ai-wizard/AiLessonDetailModal.tsx`: Tích hợp `RichMathEditor` cho sửa câu hỏi và `InlineMathTextEditor` cho đáp án; hỗ trợ thêm câu hỏi thủ công.
  - Cập nhật `apps/web/src/features/teacher/class-detail/components/ai-wizard/AiLessonCard.tsx`: Render tóm tắt `lesson.summary` bằng `MathRenderer`.
  - Cập nhật `apps/web/src/components/ui/RichTextEditor.tsx` & `apps/web/src/features/teacher/class-detail/components/CurriculumFormModal.tsx`: Thêm nút chèn công thức LaTeX ($\sum$) vào trình soạn bài giảng.
  - *Verify:* Mở modal chi tiết bài học AI Wizard, kiểm tra gõ sửa câu hỏi toán hiển thị preview trực tiếp và lưu không lỗi.

- [ ] **Task 6: Tích hợp Giao Diện Học Sinh Làm Bài & Xem Kết Quả**
  - Cập nhật `apps/web/src/features/student/quiz/components/QuizQuestion.tsx`: Render đề bài, nút đáp án trắc nghiệm, thẻ kéo thả bằng `MathRenderer`.
  - Cập nhật `apps/web/src/features/student/quiz/components/QuizFeedback.tsx`: Render giải thích Markdown + Math và đáp án đúng bằng `MathRenderer`.
  - Cập nhật `apps/web/src/features/student/session-result/components/DetailedReview.tsx` & `apps/web/src/features/teacher/student-detail/components/SessionResultModal.tsx`: Render chi tiết kết quả thi bằng `MathRenderer`.
  - Cập nhật `apps/web/src/features/student/class-detail/components/StudentCurriculumDetailFeature.tsx` & `apps/web/src/features/teacher/class-detail/components/CurriculumDetailModal.tsx`: Render bài giảng lý thuyết.
  - *Verify:* Học sinh làm bài quiz có công thức toán hiển thị sắc nét trên các nút bấm đáp án và màn hình review kết quả.

- [ ] **Task 7: Kiểm Thử Toàn Diện & Typecheck**
  - Chạy `npm run build` hoặc `tsc -b` ở cả `apps/web` và `apps/api`.
  - Kiểm tra giao diện trên cả màn hình Desktop và Mobile (đảm bảo không bị vỡ layout hoặc tràn màn hình).
  - *Verify:* Build thành công với 0 lỗi TypeScript, 0 cảnh báo lint nghiêm trọng.

## Done When
- [ ] Giáo viên có thể định dạng văn bản (B, I, U, List) và chèn công thức toán học ($\frac{a}{b}, \sqrt{x}, \int...$) với Live Preview ở tất cả modal tạo/sửa câu hỏi và AI Wizard.
- [ ] Toàn bộ câu hỏi, đáp án, giải thích, bài giảng lý thuyết hiển thị công thức toán KaTeX chuẩn đẹp mắt ở cả phía Giáo viên và Học sinh.
- [ ] AI sinh câu hỏi và lộ trình tự động định dạng chuẩn cú pháp LaTeX `$ ... $`.
- [ ] Build dự án pass sạch sẽ.

## Notes
- Toàn bộ parsing toán học sử dụng `throwOnError: false` trong KaTeX để tránh crash UI khi người dùng nhập công thức chưa hoàn chỉnh.
- Sử dụng regex nhận diện thông minh tránh parse nhầm các ký tự tiền tệ đô la `$100` bằng cách yêu cầu biểu thức toán không có khoảng trắng ngay sau dấu mở đầu (ví dụ `$x^2$` thay vì `$ 100 $`).
