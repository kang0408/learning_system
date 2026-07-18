
Dưới đây là **Bản Kế hoạch Triển khai Chi tiết (Implementation Plan)** cho tính năng **Knowledge Graph & SM2 Analytics**. Bản kế hoạch này tuân thủ nghiêm ngặt các quy chuẩn từ các bộ Guidelines mà bạn đã cung cấp (Layered Architecture, Zod, Suspense-first, Feature-based, Progressive Disclosure).

---

## GIAI ĐOẠN 1: KIẾN TRÚC DATABASE & DATA LAYER (Theo `backend-architect`)

**Mục tiêu:** Chuyển đổi cấu trúc Topic phẳng sang cấu trúc Đệ quy (Hierarchical) và chuẩn bị query.

1. **Prisma Schema Update:**
   - Thêm trường `parent_id` (`@db.Uuid`) vào model `Topic` có quan hệ tự trỏ (Self-relation) `parent` và `children`.
   - **Performance Note:** Vì Cây kỹ năng có thể sâu, tạo index trên `parent_id` để tăng tốc độ truy vấn.

2. **Database Migration Plan:**
   - Tạo migration script bằng Prisma.
   - Viết Data Seeder tạo một cây kiến thức mẫu (VD: `Tiếng Anh -> Ngữ pháp -> Thì hiện tại`) để phục vụ việc test UI sau này.

---

## GIAI ĐOẠN 2: BACKEND API & BUSINESS LOGIC (Theo `backend-dev-guidelines` & `cc-skill-backend-patterns`)

**Mục tiêu:** Xây dựng API trả về dữ liệu Cây kỹ năng và Thống kê SM2 theo chuẩn Layered Architecture (Routes → Controllers → Services → Repositories).

1. **Repository Layer (`analytics.repository.ts`):**
   - Tránh lỗi N+1 Query: Không dùng vòng lặp để query từng Topic con.
   - Thay vào đó, sử dụng tính năng gộp của Prisma hoặc viết một **Raw SQL với đệ quy (Recursive CTE)** để lấy toàn bộ nhánh cây Topic của một lớp/học sinh chỉ trong 1 lần gọi DB.

2. **Service Layer (`analytics.service.ts`):**
   - Viết hàm `buildStudentSkillTree(studentId)`. Hàm này chịu trách nhiệm:
     - Lấy cây Topic từ Repository.
     - Lấy dữ liệu `Sm2Progress` của học sinh đó.
     - Thuật toán Roll-up (Gộp điểm): Duyệt cây từ dưới (Leaf) lên trên (Root). `mastery_score` của Node cha bằng trung bình cộng của các Node con.
   - Viết hàm `calculateForgettingCurve(studentId, topicId)` tính toán tỷ lệ % còn nhớ bài dựa trên công thức Ebbinghaus.

3. **Controller & Route Layer (`analytics.controller.ts`):**
   - Sử dụng **Zod** để validate mọi params (ví dụ: `studentId` phải chuẩn UUID).
   - Bọc toàn bộ handler trong `asyncErrorWrapper`. Bất kỳ lỗi logic hay DB nào cũng phải bắn thẳng về **Sentry**, không dùng `console.log`.
   - Chuẩn hóa Response format thống nhất (VD: `{ success: true, data: ... }`).

4. **Cập nhật các Module Lõi liên đới (Ripple Effect):**
   - **Module `topics`:** Nâng cấp API lấy danh sách trả về dạng cây (Tree). Xử lý logic xóa an toàn (Cascade hoặc Block) khi xóa Topic Cha. Bổ sung `parent_id` vào logic Tạo/Sửa.
   - **Module `questions`:** Điều chỉnh API lấy câu hỏi theo `topic_id` bằng đệ quy (tự động lấy luôn các câu hỏi của mọi nhánh Topic Con).
   - **Module `assignments`:** Khi giao bài tập theo Topic, logic bốc câu hỏi (`findQuestionsByTopicIds`) phải được dàn phẳng đệ quy để quét trọn vẹn nhánh kiến thức.
   - **Module `sessions`:** Nâng cấp hàm `computeTopicPerformance` để gom nhóm (roll-up) điểm số theo nhóm Topic Cha (hoặc trả về full đường dẫn) tránh việc thống kê bị xé vụn.

---

## GIAI ĐOẠN 3: FRONTEND ARCHITECTURE & DATA FETCHING (Theo `frontend-dev-guidelines`)

**Mục tiêu:** Cấu trúc mã nguồn Frontend rõ ràng, fetch data không bị block UI.

1. **Tích hợp vào Feature hiện có (student-detail):**
   - Không tạo feature mới để tránh phân mảnh. Tính năng Knowledge Graph và Analytics sẽ được tích hợp trực tiếp vào: `apps/web/src/features/teacher/student-detail`.
   - Tổ chức code bên trong thư mục này: thêm các file vào `api/` (gọi API), `components/` (chứa Radar Chart, Tree Table), `hooks/`, `types/` liên quan đến analytics.

2. **Suspense-First Data Fetching (Bắt buộc):**
   - TUYỆT ĐỐI KHÔNG dùng `useState` + `useEffect` để fetch data và check `if (isLoading) return <Spinner/>`.
   - Sử dụng `useSuspenseQuery` (của React Query) ở Data Layer.
   - Bọc component chứa Radar Chart và Tree Table trong thẻ `<Suspense fallback={<AnalyticsSkeleton />}>` ở cấp độ Page.

3. **TypeScript Kỷ luật thép:**
   - Định nghĩa rõ ràng interface `SkillTreeNode` đệ quy:
     `interface SkillTreeNode { id: string; name: string; mastery: number; children: SkillTreeNode[] }`.
   - Không sử dụng `any` ở bất cứ đâu.

---

## GIAI ĐOẠN 4: THIẾT KẾ UI/UX & COMPONENTS (Theo `frontend-design` & `senior-frontend`)

**Mục tiêu:** Tạo ra một giao diện độc bản (Distinctive), có ý đồ (Intentional Aesthetic) và dẫn dắt hành động thay vì dùng template mặc định.

1. **Aesthetic Direction (Định hướng Thẩm mỹ):**
   - Style: _Clean & Data-Driven (Gọn gàng & Phân tích dữ liệu)_.
   - Hạn chế tối đa các khung viền (borders) thừa. Sử dụng không gian trắng (White space) làm cấu trúc phân tách.
   - Hệ màu có mục đích: Dùng các biến CSS, định nghĩa thang màu Mastery (Red < 50, Yellow 50-80, Emerald > 80).

2. **Component Phân tầng Hiển thị (Progressive Disclosure):**
   - **Tầng 1 (Root Level):** Dùng thư viện `Recharts` dựng **Radar Chart**. Thiết kế UI của Chart không dùng nét đứt mặc định mà dùng fill gradient tinh tế để tạo cảm giác "Premium".
   - **Tầng 2 (Drill-down):** Component **Tree Table** (Có thể dùng TanStack Table hoặc tự viết đệ quy Component).
     - Render thanh Progress Bar mini thẳng vào trong cột bảng.
     - Dùng Component lồng nhau đệ quy để render các dòng con khi bấm mở rộng `[+]`.

3. **Tương tác Hành động (The Actionable UI):**
   - Viết Custom Hook `useAssignReview()`.
   - Khi hover vào một hàng (Topic con) có điểm Mastery thấp, xuất hiện nút **"Giao bài ôn tập"**.
   - Click nút này sẽ mở Modal (Lazy loaded) sinh sẵn các câu hỏi yếu của phần đó.

4. **Cập nhật UI/UX các tính năng liên đới (Ripple Effect):**
   - **Màn hình Quản lý Topic:** Thay thế danh sách dạng bảng phẳng bằng Component **Tree Table** (Bảng dạng cây có nút Expand/Collapse). Thêm Component `TreeSelect` vào form Tạo/Sửa Topic để chọn Topic Cha.
   - **Màn hình Tạo/Sửa Câu hỏi (SaveQuestionModal):** Loại bỏ thẻ `<Select>` phẳng hiện hành và thay bằng Component **TreeSelect** (hoặc Cascader). API get Topics sẽ trả về cấu trúc cây, UI sẽ render các cấp độ thụt lề để giáo viên chọn chính xác nhánh lá (VD: `Tiếng Anh ➔ Ngữ pháp ➔ Thì hiện tại`).
   - **Màn hình Tạo Bài tập (Assignments):** Cập nhật bộ lọc/chọn Topic khi tạo bài tập sử dụng chung **TreeSelect** như trên. Khi giáo viên chọn Topic Cha, UI cần làm rõ (visual cue) rằng các nhánh con cũng được bao gồm.
   - **Màn hình Kết quả Bài làm (Detailed Review):** Hiển thị "Full Path" của Topic (Ví dụ: `Ngữ pháp ➔ Thì quá khứ đơn`) ở biểu đồ hiệu suất bài làm thay vì chỉ hiện tên Topic lá.

---

## GIAI ĐOẠN 5: PERFORMANCE & KIỂM THỬ (Theo `senior-frontend` & `backend-dev-guidelines`)

1. **Backend Performance:**
   - Dùng Redis để cache kết quả API `SkillTree` trong 5-10 phút (nếu hệ thống lớn), vì việc duyệt SM2 đệ quy là một tác vụ tính toán nặng. Invalidate cache khi học sinh làm xong một phiên Quiz mới.
2. **Frontend Bundle Size:**
   - Chart library (`Recharts`) khá nặng. Bắt buộc phải **Lazy Load (Dynamic Import)** các component chứa biểu đồ để giảm Initial Bundle Size.
3. **Kiểm thử (Testing):**
   - Bắt buộc viết Unit Test cho `analytics.service.ts` (đặc biệt là logic toán học tính điểm Mastery gộp).
   - Frontend: Viết test (Vitest/RTL) đảm bảo hành vi bấm nút Expand `[+]` trên Tree Table hoạt động chính xác.

---

**Kết luận:** Nếu chúng ta thực thi chuẩn xác theo Plan này, bạn sẽ có một bộ Source Code cực kỳ chuyên nghiệp từ luồng đi của Data (Backend) cho đến cách Render không độ trễ (Frontend). Bạn muốn bắt đầu bước vào **Giai đoạn 1 (Prisma Schema)** hay thiết kế **API Contract (Giai đoạn 2)** trước?
