# Kế Hoạch Triển Khai Refactor UI Teacher Bằng 29 Shadcn UI Primitives

> **Mục tiêu**: Chuẩn hóa toàn bộ giao diện Giáo viên (Teacher) bằng bộ 29 Shadcn UI Primitives mà không làm thay đổi hay phá vỡ logic xử lý dữ liệu, không ảnh hưởng đến phần Student/Auth/Admin, đảm bảo tương thích ngược 100%.

---

## 📌 Nguyên Tắc Triển Khai
1. **Không làm hỏng logic**: Giữ nguyên toàn bộ State, React Query Hooks, API payload và Event Handlers hiện tại.
2. **Bảo toàn tương thích ngược**: Các UI Primitives có sẵn (`Button`, `Card`, `Dialog`, `Input`, `Select`) giữ nguyên Props Interface cũ, chỉ bổ sung thêm variants và styling bằng `cn()`.
3. **Kiểm tra theo từng Phase**: Sau mỗi Phase hoàn thành, phải chạy lệnh kiểm tra TypeScript (`tsc -b`) và kiểm tra runtime để đảm bảo 0 lỗi.
4. **Tổng kiểm tra giao diện cuối cùng**: Chạy build sản phẩm, kiểm tra kết quả giao diện màn hình Teacher & Student, phát hiện lỗi và xử lý triệt để.

---

## 🚀 Các Phase Triển Khai (Phased Breakdown)

# Kế Hoạch Triển Khai Refactor UI Teacher Bằng 29 Shadcn UI Primitives

> **Mục tiêu**: Chuẩn hóa toàn bộ giao diện Giáo viên (Teacher) bằng bộ 29 Shadcn UI Primitives mà không làm thay đổi hay phá vỡ logic xử lý dữ liệu, không ảnh hưởng đến phần Student/Auth/Admin, đảm bảo tương thích ngược 100%.

---

## 📌 Nguyên Tắc Triển Khai
1. **Không làm hỏng logic**: Giữ nguyên toàn bộ State, React Query Hooks, API payload và Event Handlers hiện tại.
2. **Bảo toàn tương thích ngược**: Các UI Primitives có sẵn (`Button`, `Card`, `Dialog`, `Input`, `Select`) giữ nguyên Props Interface cũ, chỉ bổ sung thêm variants và styling bằng `cn()`.
3. **Kiểm tra theo từng Phase**: Sau mỗi Phase hoàn thành, phải chạy lệnh kiểm tra TypeScript (`tsc -b`) và kiểm tra runtime để đảm bảo 0 lỗi.
4. **Tổng kiểm tra giao diện cuối cùng**: Chạy build sản phẩm, kiểm tra kết quả giao diện màn hình Teacher & Student, phát hiện lỗi và xử lý triệt để.

---

## 🚀 Các Phase Triển Khai (Phased Breakdown)

### Phase 1: Bổ sung & Chuẩn hóa 29 Shadcn UI Primitives
*Mục tiêu*: Xây dựng bộ UI Primitives dùng chung tại [src/components/ui](file:///f:/Workplace/My%20Project/language_learning_system/apps/web/src/components/ui).

- [x] **Task 1.1**: Chuẩn hóa các primitives có sẵn (`Button.tsx`, `Card.tsx`, `Dialog.tsx`, `Input.tsx`, `Select.tsx`, `TreeSelect.tsx`).
- [x] **Task 1.2**: Tạo mới bộ primitives hiển thị cơ bản (`Badge.tsx`, `Avatar.tsx`, `Progress.tsx`, `Tooltip.tsx`, `Separator.tsx`, `Label.tsx`).
- [x] **Task 1.3**: Tạo mới bộ primitives điều hướng & dữ liệu (`Table.tsx`, `Tabs.tsx`, `Pagination.tsx`, `Breadcrumb.tsx`, `DropdownMenu.tsx`).
- [x] **Task 1.4**: Tạo mới bộ primitives form & tương tác (`Textarea.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`, `Switch.tsx`).
- [x] **Task 1.5**: Tạo mới bộ primitives hệ thống (`Sheet.tsx`, `Skeleton.tsx`, `Alert.tsx`, `Accordion.tsx`, `ScrollArea.tsx`, `StatCard.tsx`, `EmptyState.tsx`, `FileUploadDropzone.tsx`).

👉 **Kiểm tra Phase 1**: Đã hoàn thành (0 lỗi TypeScript).

---

### Phase 2: Refactor Layout Giáo Viên (`TeacherLayout.tsx`)
*Mục tiêu*: Nâng cấp Sidebar, Header di động, Navigation và User Avatar trong [TeacherLayout.tsx](file:///f:/Workplace/My%20Project/language_learning_system/apps/web/src/layouts/TeacherLayout.tsx).

- [x] **Task 2.1**: Nâng cấp Avatar giáo viên dùng `Avatar` primitive kèm `AvatarFallback`.
- [x] **Task 2.2**: Nâng cấp Mobile Sidebar dùng `Sheet` (Side Drawer) primitive thay cho backdrop tự dựng.
- [x] **Task 2.3**: Nâng cấp Sidebar Thu gọn (`w-20`) tích hợp `Tooltip` hiển thị nhãn khi hover.
- [x] **Task 2.4**: Chuẩn hóa nút bấm Đổi ngôn ngữ & Đăng xuất dùng `Button` primitive.

👉 **Kiểm tra Phase 2**: Đã hoàn thành (0 lỗi TypeScript & runtime layout).

---

### Phase 3: Refactor Các Module Lớp Học & Dashboard
*Mục tiêu*: Refactor các module `dashboard`, `class-detail`, `class-members` trong [features/teacher](file:///f:/Workplace/My%20Project/language_learning_system/apps/web/src/features/teacher).

- [x] **Task 3.1**: Refactor `features/teacher/dashboard` (`ClassCard` dùng `Card`/`Badge`/`StatCard`, `CreateClassModal` dùng `Dialog`/`Input`/`Switch`, `EmptyState`).
- [x] **Task 3.2**: Refactor `features/teacher/class-detail` (`ClassHeader` dùng `Breadcrumb`/`Tabs`, `AssignmentsTab` & `StudentsTab` dùng `Table`/`Badge`/`DropdownMenu`/`Progress`, `AnalyticsTab` dùng `StatCard`/`Accordion`).
- [x] **Task 3.3**: Refactor `features/teacher/class-members` (Dùng `Table`, `Avatar`, `DropdownMenu` nút 3 chấm, `Pagination`).

👉 **Kiểm tra Phase 3**: Đã hoàn thành (0 lỗi TypeScript).

---

### Phase 4: Refactor Các Module Ngân Hàng Câu Hỏi & Bài Tập & Thống Kê
*Mục tiêu*: Refactor `question-bank`, `new-assignment`, `edit-assignment`, `student-detail`, `topic-detail`, `profile`.

- [x] **Task 4.1**: Refactor `features/teacher/question-bank` (`CreateQuestionModal` dùng `RadioGroup`/`Checkbox`/`ScrollArea`, `ImportCsvModal` dùng `FileUploadDropzone`/`Alert`, `TopicList` dùng `TreeSelect`).
- [x] **Task 4.2**: Refactor `features/teacher/new-assignment` & `edit-assignment` (`NewAssignmentForm` dùng `Switch`/`RadioGroup`/`Checkbox`, `TopicQuestionsList` dùng `Accordion`).
- [x] **Task 4.3**: Refactor `features/teacher/student-detail` (`StudentStatsOverview` dùng `StatCard`, `StudentSm2Status` dùng `Progress`/`Tooltip`, `SessionResultModal` dùng `Dialog`/`Accordion`).
- [x] **Task 4.4**: Refactor `features/teacher/topic-detail` & `features/teacher/profile` (Avatar upload `FileUploadDropzone`, `Input`, `Label`, `Button`).

👉 **Kiểm tra Phase 4**: Đã hoàn thành (0 lỗi TypeScript).

---

### Phase 5: Tổng Kiểm Tra Lỗi & Verification Toàn Hệ Thống
*Mục tiêu*: Đảm bảo không có bất kỳ rủi ro nào về giao diện cũng như logic cho cả **Teacher** và **Student**.

- [x] **Task 5.1**: Chạy lệnh Build kiểm tra loại bỏ hoàn toàn lỗi TypeScript / JSX (`pnpm --filter web build` & `npx vite build`).
- [x] **Task 5.2**: Kiểm tra độc lập giao diện **Student** ([pages/student](file:///f:/Workplace/My%20Project/language_learning_system/apps/web/src/pages/student)) để khẳng định 100% không bị vỡ giao diện hay lỗi component dùng chung.
- [x] **Task 5.3**: Kiểm tra giao diện **Teacher** trên cả màn hình Desktop và Mobile (Responsive check).
- [x] **Task 5.4**: Sửa chữa triệt để bất kỳ lỗi UI / Style dư thừa phát hiện được trong quá trình tổng kiểm tra.

---

## 🎯 Tiêu Chí Hoàn Thành (Definition of Done)
- [x] Đã xây dựng đủ **29 UI Primitives** chuẩn Shadcn UI tại [src/components/ui](file:///f:/Workplace/My%20Project/language_learning_system/apps/web/src/components/ui).
- [x] 100% mã nguồn trong `TeacherLayout.tsx`, `pages/teacher`, và `features/teacher` được chuẩn hóa bằng UI Primitives.
- [x] Lệnh `npx vite build` & `tsc -b` chạy thành công không có bất kỳ cảnh báo/lỗi Type nào.
- [x] Giao diện **Student** hoạt động bình thường mà không bị ảnh hưởng.

