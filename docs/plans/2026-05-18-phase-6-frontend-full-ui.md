# Phase 6: Full Frontend UI Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Xây dựng toàn bộ giao diện người dùng thực tế (Full UI) tuân thủ 100% tài liệu thiết kế Phần 4 và Phần 6, bao gồm hệ thống Routing, Auth Flows, Student App, Teacher App, Parent App và kết nối API thực.

**Architecture:** Mở rộng React Router với các Nested Routes (Layout), quản lý state bằng Zustand, fetch API bằng Axios + React Query (nếu cần, nhưng dùng Axios cơ bản + Zustand để theo stack hiện tại), và UI bằng Tailwind CSS v4 dựa trên các Reusable Components.

**Tech Stack:** React 18, React Router v6, Zustand, Tailwind CSS v4, Axios, Lucide React, Chart.js (tùy chọn cho biểu đồ).

---

### Task 1: Setup API Axios Instance & Global Layouts

**Files:**
- Create: `apps/web/src/api/axios.ts`
- Create: `apps/web/src/layouts/StudentLayout.tsx`
- Create: `apps/web/src/layouts/TeacherLayout.tsx`
- Create: `apps/web/src/layouts/ParentLayout.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. Tạo `axios.ts` config base URL và interceptor tự động attach token từ `localStorage`. Xử lý lỗi 401 tự logout.
2. Tạo các Layout có chung Sidebar (cho Web) hoặc Bottom Navigation (cho Mobile).
3. Cập nhật `router.tsx` để hỗ trợ nested routing cho từng role.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/web/src/api apps/web/src/layouts apps/web/src/router.tsx
git commit -m "feat(web): setup axios instance and role-based layouts"
```

---

### Task 2: Authentication Flows (Login & Register)

**Files:**
- Modify: `apps/web/src/pages/Login.tsx`
- Create: `apps/web/src/pages/Register.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. Xây dựng form Login với validation inline (email format). Gọi API `POST /api/auth/login`. Lưu token qua `useAuthStore` và redirect theo role.
2. Xây dựng form Register với các trường (Họ tên, Email, Mật khẩu có strength indicator cơ bản, Role selector). Gọi API `POST /api/auth/register`.
3. Khai báo `/register` trong router.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/web/src/pages apps/web/src/router.tsx
git commit -m "feat(web): build full authentication flow ui and logic"
```

---

### Task 3: Student App - Home & Classes

**Files:**
- Modify: `apps/web/src/pages/StudentDashboard.tsx`
- Create: `apps/web/src/pages/StudentClasses.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. `StudentDashboard`: Lấy dữ liệu API `GET /api/analytics/student/me` và `GET /api/assignments/my`. Hiển thị Hero Card "X câu cần ôn hôm nay" và danh sách Bài được giao.
2. `StudentClasses`: Form nhập mã lớp `POST /api/classes/join`. Hiển thị danh sách lớp.
3. Thêm các route `/student/classes` vào Layout của student.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "feat(web): implement student dashboard and class joining"
```

---

### Task 4: Student App - Real Quiz Session

**Files:**
- Modify: `apps/web/src/pages/QuizPage.tsx`
- Create: `apps/web/src/pages/SessionResult.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. Sửa `QuizPage` để nhận params (assignment_id).
2. Khi mount: Gọi `POST /api/sessions`.
3. Vòng lặp: Render câu hỏi. Khi submit gọi `POST /api/sessions/:id/answers`. Chuyển sang Feedback state (Xanh/Đỏ).
4. Khi hết câu: Gọi `POST /api/sessions/:id/finish` và navigate sang `SessionResult`.
5. Tạo `SessionResult.tsx` hiển thị điểm và next_review_date.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "feat(web): implement real sm2 quiz session flow with api"
```

---

### Task 5: Teacher App - Dashboard & Classes

**Files:**
- Create: `apps/web/src/pages/TeacherDashboard.tsx`
- Create: `apps/web/src/pages/TeacherClassDetail.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. `TeacherDashboard`: Liệt kê các lớp của giáo viên (`GET /api/classes`), hiển thị nút Tạo lớp (`POST /api/classes`).
2. `TeacherClassDetail`: Hiển thị bảng xếp hạng, phân tích độ chính xác theo chủ đề (`GET /api/analytics/class/:id`).
3. Đăng ký các route.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "feat(web): build teacher dashboard and class analytics"
```

---

### Task 6: Teacher App - Question Bank & Assignments

**Files:**
- Create: `apps/web/src/pages/QuestionBank.tsx`
- Create: `apps/web/src/pages/AssignmentWizard.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. `QuestionBank`: Danh sách câu hỏi (`GET /api/questions`) và Form tạo câu hỏi trắc nghiệm/điền từ (`POST /api/questions`).
2. `AssignmentWizard`: Form tạo bài tập qua 3 bước (Thông tin -> Chọn câu hỏi -> Publish) gọi `POST /api/assignments`.

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "feat(web): build question bank and assignment wizard for teacher"
```

---

### Task 7: Parent App - Dashboard

**Files:**
- Create: `apps/web/src/pages/ParentDashboard.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
1. `ParentDashboard`: Hiển thị danh sách con (`GET /api/analytics/parent/children`).
2. Form liên kết con (`POST /api/parent/link`).

**Step 4: Run test to verify it passes**
Run: `npm run build --workspace=web`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "feat(web): implement parent dashboard"
```
