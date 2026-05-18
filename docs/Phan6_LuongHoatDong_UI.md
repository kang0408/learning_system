# Phần 6: Luồng Hoạt Động Chi Tiết Các Chức Năng UI

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 6 / N — Luồng hoạt động UI từng chức năng theo vai trò

---

## 6.1 Tổng quan

Phần này mô tả chi tiết **luồng tương tác người dùng (User Interaction Flow)** cho từng chức năng chính của hệ thống, bao gồm:

- Trình tự các bước người dùng thực hiện trên giao diện
- Trạng thái UI tương ứng tại mỗi bước (loading, success, error)
- API call được kích hoạt và dữ liệu trao đổi
- Xử lý các trường hợp ngoại lệ (edge case)

Mỗi luồng được trình bày theo cấu trúc thống nhất: **Điều kiện tiên quyết → Các bước → Kết quả → Edge case**.

---

## 6.2 Luồng Xác thực (Authentication)

### 6.2.1 Đăng nhập

**Điều kiện tiên quyết:** Người dùng đã có tài khoản, chưa đăng nhập.

**Các bước:**

```
Bước 1 — Người dùng mở ứng dụng
  UI: Splash screen (logo + animation, ~1.5s)
  → Kiểm tra localStorage/SecureStore có refresh_token hợp lệ không
     ├── Có token hợp lệ → gọi POST /auth/refresh → vào app (bỏ qua bước 2–5)
     └── Không có / hết hạn → chuyển sang màn hình Login

Bước 2 — Màn hình Login hiển thị
  UI: Form 2 trường (Email, Mật khẩu) + nút "Đăng nhập" + link "Quên mật khẩu"
  State: idle

Bước 3 — Người dùng nhập thông tin
  UI: Validation inline (real-time):
    - Email: kiểm tra định dạng ngay khi blur khỏi trường
    - Mật khẩu: hiển thị/ẩn qua icon 👁
  State: typing → valid/invalid per field

Bước 4 — Người dùng nhấn "Đăng nhập"
  UI: Nút chuyển sang trạng thái loading (spinner thay text)
  API: POST /auth/login { email, password }
  State: submitting

Bước 5 — Xử lý kết quả
  ├── HTTP 200 → Lưu access_token + refresh_token
  │             → Decode JWT xác định role
  │             → Điều hướng đến Home tương ứng với role:
  │               • student  → /student/home
  │               • teacher  → /teacher/home
  │               • parent   → /parent/home
  └── HTTP 401 → Hiển thị toast error: "Email hoặc mật khẩu không đúng"
               → Xóa trường mật khẩu, giữ email
               → Nút trở lại idle
```

**Edge case:**

| Tình huống | Xử lý UI |
|---|---|
| Mạng chậm (> 5s) | Hiện skeleton + timeout toast sau 8s "Kết nối chậm, vui lòng thử lại" |
| Tài khoản bị khóa (`is_active = false`) | Toast: "Tài khoản đã bị vô hiệu hóa. Liên hệ giáo viên." |
| Nhập sai 5 lần liên tiếp | Rate limit 429 → Toast: "Quá nhiều lần thử. Vui lòng chờ 1 phút." |
| Thiếu trường bắt buộc | Inline validation đỏ trước khi gửi request |

---

### 6.2.2 Đăng ký tài khoản

**Điều kiện tiên quyết:** Người dùng chưa có tài khoản.

**Các bước:**

```
Bước 1 — Người dùng chọn "Tạo tài khoản" từ màn hình Login

Bước 2 — Màn hình Register hiển thị
  UI: Form 4 trường:
    • Họ và tên (text)
    • Email (email input)
    • Mật khẩu (password, ẩn mặc định)
    • Vai trò (radio/select: Học sinh / Giáo viên / Phụ huynh)

Bước 3 — Người dùng điền form
  Validation real-time:
    • Họ tên: tối thiểu 2 ký tự
    • Email: định dạng hợp lệ
    • Mật khẩu: strength indicator (yếu/trung bình/mạnh)
      ├── Yếu:   < 8 ký tự → bar đỏ
      ├── Vừa:   ≥ 8 ký tự, chỉ chữ → bar vàng
      └── Mạnh:  ≥ 8 ký tự, hoa + thường + số → bar xanh
    • Vai trò: bắt buộc chọn

Bước 4 — Nhấn "Tạo tài khoản"
  API: POST /auth/register { email, password, full_name, role }
  State: submitting (nút spinner)

Bước 5 — Xử lý kết quả
  ├── HTTP 201 → Lưu token → vào Home tương ứng role
  │             Toast success: "Chào mừng bạn đến với Adaptive Lang!"
  └── HTTP 409 → Toast error: "Email này đã được đăng ký"
               → Focus lại trường email
```

**Edge case:**

| Tình huống | Xử lý UI |
|---|---|
| Email đã tồn tại | Inline error dưới trường email + toast |
| Mật khẩu quá yếu | Disable nút submit cho đến khi password đạt mức "Mạnh" |
| Mất kết nối giữa chừng | Giữ nguyên dữ liệu form, toast "Không có mạng. Thử lại." |

---

### 6.2.3 Quên mật khẩu

```
Bước 1 → Chọn "Quên mật khẩu?" từ màn Login
Bước 2 → Nhập email → POST /auth/forgot-password
Bước 3 → UI hiện: "Kiểm tra hộp thư của bạn" (bất kể email có tồn tại hay không — tránh lộ thông tin)
Bước 4 → Người dùng click link trong email → mở màn đặt mật khẩu mới
Bước 5 → Nhập mật khẩu mới (2 lần xác nhận) → POST /auth/reset-password
Bước 6 → Success → redirect về Login, toast: "Mật khẩu đã được cập nhật"
```

---

## 6.3 Luồng Học sinh (Student Flows)

### 6.3.1 Mở app — Tải Dashboard Home

**Điều kiện tiên quyết:** Học sinh đã đăng nhập.

**Các bước:**

```
Bước 1 — App khởi động, access_token còn hạn
  → Gọi song song (Promise.all):
     • GET /analytics/student/me          → lấy streak, tổng thống kê
     • GET /assignments/my?status=pending → lấy bài được giao chưa hoàn thành
  UI: Skeleton screen cho tất cả card trong lúc chờ

Bước 2 — Dữ liệu trả về
  → Tính số câu cần ôn hôm nay từ questions_due_today trong analytics response
  → Render:
     • Hero card: "X câu hỏi cần ôn hôm nay" + nút "BẮT ĐẦU HỌC"
     • Section "Bài được giao": horizontal scroll cards, mỗi card hiển thị tên + deadline
     • Dot calendar tuần này (7 ngày)
     • Streak badge

Bước 3 — Phân nhánh theo dữ liệu
  ├── questions_due_today > 0 → Hero card màu indigo (primary), CTA nổi bật
  ├── questions_due_today = 0 → Empty state vui: "Hôm nay đã ôn xong! 🎉"
  └── Có bài quá hạn (deadline < now) → Badge đỏ trên tab "Lớp học"
```

**Mapping dữ liệu → UI:**

| Dữ liệu API | Hiển thị trên UI |
|---|---|
| `questions_due_today` | Số câu trong hero card |
| `current_streak_days` | 🔥 số ngày streak |
| `weekly_activity[i].sessions > 0` | ● (chấm tròn đặc) trong dot calendar |
| `overall_accuracy` | "Độ chính xác: XX%" |
| `assignment.deadline` gần | Badge "Còn X ngày" hoặc "Quá hạn!" màu đỏ |

---

### 6.3.2 Tham gia lớp học bằng mã

**Điều kiện tiên quyết:** Học sinh chưa ở trong lớp, có mã lớp từ giáo viên.

**Các bước:**

```
Bước 1 — Học sinh vào tab "Lớp học" → chọn "Nhập mã lớp"
  UI: Bottom sheet / Modal với 1 input text (mã 6 ký tự, tự động uppercase)

Bước 2 — Nhập mã → nhấn "Tham gia"
  API: POST /classes/join { join_code: "ENG8A2" }
  State: submitting

Bước 3 — Kết quả
  ├── HTTP 200 → Đóng modal
  │             Toast: "Đã tham gia lớp Tiếng Anh 8A!"
  │             Danh sách lớp refresh tự động (invalidate cache TanStack Query)
  └── HTTP 404 → Toast error: "Mã lớp không tồn tại. Kiểm tra lại."
  └── HTTP 409 → Toast error: "Bạn đã là thành viên của lớp này."
```

---

### 6.3.3 Làm bài luyện tập (Quiz Session) — Luồng cốt lõi

Đây là luồng phức tạp nhất và quan trọng nhất của hệ thống.

**Điều kiện tiên quyết:** Học sinh đã ở trong lớp, có bài được giao hoặc có câu hỏi SM-2 đến hạn.

#### Pha 1: Khởi tạo phiên

```
Bước 1 — Học sinh nhấn "BẮT ĐẦU HỌC" (từ Home) hoặc chọn bài từ danh sách
  → Nếu từ Home: hệ thống tự chọn assignment có câu hỏi SM-2 đến hạn nhiều nhất
  → Nếu chọn thủ công: học sinh chọn bài cụ thể trong tab "Lớp học"

Bước 2 — Gọi API khởi tạo
  API: POST /sessions { assignment_id: "uuid" }
  UI: Full-screen loading overlay ("Đang chuẩn bị bài học...")

Bước 3 — Nhận câu hỏi đầu tiên
  → Lưu session_id vào state
  → Lưu total_questions, time_limit_seconds vào state
  → Chuyển sang Quiz Screen (full-screen, ẩn navigation bar)
  → Animate câu hỏi đầu tiên slide-in từ phải
```

#### Pha 2: Vòng lặp trả lời câu hỏi

```
[Trạng thái QUESTION — Hiển thị câu hỏi]

  UI hiển thị:
    • Header: nút ← (xác nhận thoát), "Câu X/Y", nút ✕
    • Progress bar animate đến X/Y %
    • Topic badge + Timer countdown (nếu có giới hạn thời gian)
    • Nội dung câu hỏi (text, có thể kèm audio/ảnh)
    • 4 option cards (multiple_choice) hoặc input (fill_blank)

  Sự kiện người dùng:
    ├── Chọn 1 option → chuyển sang [Trạng thái FEEDBACK]
    ├── Nhấn 🔊 → phát audio phát âm (nếu có audio_url)
    └── Timer hết → tự động submit answer null → sm2_quality = 0

─────────────────────────────────────────────

[Trạng thái FEEDBACK — Hiển thị kết quả câu vừa trả lời]

  API: POST /sessions/:id/answers {
    question_id, selected_option_id, response_time_ms
  }

  UI trong lúc chờ API (optimistic):
    → Option vừa chọn: highlight nhạt (border indigo)
    → Các option khác: disabled

  UI sau khi nhận response:
    ├── Đúng (is_correct = true):
    │   • Option đúng: nền xanh lá + icon ✓
    │   • Animation: confetti nhỏ (500ms)
    │   • Feedback panel slide-up: "✅ Chính xác!"
    │   • Giải thích (explanation) nếu có
    │   • "Ôn lại sau X ngày" (next_review_in_days)
    │
    └── Sai (is_correct = false):
        • Option đã chọn: nền đỏ nhạt + icon ✗
        • Option đúng: nền xanh lá + icon ✓ (reveal đáp án)
        • Feedback panel slide-up: "❌ Chưa đúng"
        • Giải thích lý do (explanation)

  Nút "TIẾP THEO" xuất hiện (hoặc tự chuyển sau 1.5s nếu user không tương tác)
    → Câu tiếp theo slide-in từ phải
    → Câu vừa làm slide-out sang trái

  [Lặp lại cho đến khi next_question = null]
```

#### Pha 3: Kết thúc phiên

```
Bước 1 — next_question = null → tự động gọi POST /sessions/:id/finish
  UI: Loading overlay "Đang tính kết quả..."

Bước 2 — Hiển thị màn hình kết quả (Session Result)
  Animation: Điểm số count-up từ 0 đến giá trị thực (800ms)

  Bố cục:
    ┌─────────────────────────────┐
    │  🎉 Hoàn thành!             │
    │  Điểm: 80/100               │  ← count-up animation
    │  12/15 câu đúng • 12 phút  │
    ├─────────────────────────────┤
    │  Theo chủ đề:               │
    │  Grammar - Nouns    90% ████│
    │  Grammar - Tenses   67% ███ │
    │  Vocabulary - Home 100% █████│
    ├─────────────────────────────┤
    │  Chủ đề cần cải thiện:      │
    │  ⚠️ Grammar - Tenses        │
    ├─────────────────────────────┤
    │  Ôn lại vào: ngày mai       │
    │  [Xem lại từng câu] [Về nhà]│
    └─────────────────────────────┘

Bước 3 — Học sinh chọn hành động:
  ├── "Xem lại từng câu" → màn hình review: hiển thị lại câu hỏi + đáp án + giải thích
  └── "Về nhà" → chuyển về Home, navigation bar hiện lại
```

**Edge case Quiz Session:**

| Tình huống | Xử lý UI |
|---|---|
| Học sinh nhấn ← hoặc ✕ giữa chừng | Confirmation dialog: "Bỏ dở? Tiến độ câu hiện tại sẽ không được lưu." → [Tiếp tục] [Thoát] |
| Thoát app giữa chừng (background) | Session vẫn `in_progress` trong DB; lần sau mở app hỏi "Tiếp tục phiên cũ?" |
| Mất mạng giữa phiên | Toast: "Mất kết nối. Câu trả lời sẽ được lưu khi có mạng trở lại." (retry queue) |
| SM-2 Engine lỗi (fallback) | Hệ thống tự chuyển sang chế độ random, học sinh không nhận thấy sự thay đổi |
| Hết thời gian giới hạn (timer = 0) | Auto-submit, chuyển sang feedback "Hết giờ" với sm2_quality = 0 |

---

### 6.3.4 Xem tiến độ cá nhân

```
Bước 1 — Học sinh vào tab "Tiến độ"
  → Gọi song song:
     • GET /analytics/student/me
     • GET /analytics/student/me/weak-topics
     • GET /analytics/student/me/calendar

Bước 2 — Render 3 tab con:
  ├── [Tổng quan]
  │   • Vòng tròn accuracy tổng (donut chart — Chart.js)
  │   • Thống kê: tổng phiên, tổng câu, streak hiện tại, streak dài nhất
  │   • Mini bar chart: hoạt động 7 ngày gần nhất (số câu/ngày)
  │
  ├── [Điểm yếu]
  │   • Danh sách topic sắp xếp tăng dần theo accuracy
  │   • Mỗi topic: tên + progress bar + % + badge (🔴 < 60%, 🟡 60–80%, 🟢 > 80%)
  │   • Nút "Ôn ngay" → tạo quick session cho topic đó
  │
  └── [Lịch học]
      • Calendar view theo tháng
      • Mỗi ngày: không học (xám), có học (indigo nhạt → đậm tùy số câu)
      • Click vào ngày → tooltip: "X phiên, Y câu, Z% chính xác"
```

---

## 6.4 Luồng Giáo viên (Teacher Flows)

### 6.4.1 Tạo lớp học mới

```
Bước 1 — Giáo viên vào "Lớp học" → nhấn nút [+] hoặc "Tạo lớp mới"

Bước 2 — Form tạo lớp hiển thị (modal hoặc trang mới):
  Fields:
    • Tên lớp *         [Tiếng Anh 8A]
    • Môn học *         [English / Vietnamese / French / ...]
    • Mô tả            [textarea, tùy chọn]

Bước 3 — Nhấn "Tạo lớp"
  API: POST /classes { name, subject, description }
  State: submitting

Bước 4 — Kết quả
  ├── HTTP 201 → Modal đóng lại
  │             Toast: "Lớp học đã được tạo!"
  │             → Chuyển vào trang chi tiết lớp vừa tạo
  │             → Hiển thị join_code nổi bật trong card lớn:
  │               ┌───────────────────────────┐
  │               │  Mã tham gia lớp          │
  │               │  ENG8A2                   │  ← Font lớn, monospace
  │               │  [📋 Sao chép mã]         │
  │               └───────────────────────────┘
  └── HTTP lỗi → Toast lỗi tương ứng
```

---

### 6.4.2 Tạo câu hỏi mới

**Điều kiện tiên quyết:** Giáo viên ở trong Question Bank.

```
Bước 1 — Giáo viên nhấn "Tạo câu hỏi" → mở form (trang hoặc slide-over panel)

Bước 2 — Chọn dạng câu hỏi (bắt buộc chọn trước)
  [Trắc nghiệm] [Đúng/Sai] [Điền chỗ trống] [Nối cột]
  → Form bên dưới thay đổi động theo lựa chọn

Bước 3 — Điền nội dung (theo dạng câu)

  Dạng Trắc nghiệm:
    • Nội dung câu hỏi (textarea)
    • 4 ô đáp án + radio button chọn đáp án đúng
    • Nút [+ Thêm đáp án] (tối đa 6)
    • Nút [🗑] xóa đáp án

  Dạng Đúng/Sai:
    • Nội dung câu hỏi
    • 2 radio cố định: ○ Đúng  ○ Sai

  Dạng Điền chỗ trống:
    • Nội dung có dấu ___ (gợi ý highlight tự động)
    • Trường "Đáp án chuẩn" (dùng để chấm)
    • Trường "Đáp án chấp nhận khác" (alias, phân cách bằng dấu phẩy)

Bước 4 — Thông tin bổ sung
  • Chủ đề (dropdown có thể tự nhập)
  • Độ khó (star rating 1–5)
  • Giải thích (tùy chọn)
  • Upload audio (kéo thả hoặc chọn file, max 5MB, .mp3/.m4a)
  • Upload ảnh (kéo thả hoặc chọn file, max 2MB, .jpg/.png)

Bước 5 — Autosave draft mỗi 30s (lưu vào localStorage, không gọi API)

Bước 6 — Nhấn "Lưu câu hỏi"
  → Validate toàn bộ form
  ├── Hợp lệ:
  │   • Upload media lên Firebase Storage (nếu có) → lấy URL
  │   • API: POST /questions { ...data, audio_url, image_url }
  │   • Toast: "Câu hỏi đã được lưu vào ngân hàng"
  │   • Form reset, sẵn sàng tạo câu tiếp theo (hỏi: "Tạo câu tiếp theo?")
  └── Không hợp lệ:
      • Scroll đến trường lỗi đầu tiên
      • Inline error đỏ dưới mỗi trường sai
```

**Edge case:**

| Tình huống | Xử lý UI |
|---|---|
| Upload audio thất bại | Toast warning: "Không upload được audio. Lưu câu hỏi không có audio?" [Có] [Thử lại] |
| Chưa chọn đáp án đúng (trắc nghiệm) | Inline error: "Vui lòng đánh dấu ít nhất một đáp án đúng" |
| Chưa điền đáp án chuẩn (fill_blank) | Inline error dưới trường đáp án chuẩn |
| Đóng tab trình duyệt khi đang soạn | beforeunload event: "Bạn có thay đổi chưa được lưu. Rời đi?" |

---

### 6.4.3 Import câu hỏi từ CSV

```
Bước 1 — Nhấn "Import CSV" trong Question Bank
  → Mở drawer/modal hướng dẫn

Bước 2 — Tải file mẫu
  → Nút "Tải file CSV mẫu" → download template có header + 2 dòng ví dụ

Bước 3 — Upload file
  → Drag & drop hoặc chọn file (.csv, max 1000 dòng, max 5MB)
  → Hiển thị preview 5 dòng đầu để xác nhận đúng định dạng

Bước 4 — Parse & Validate phía client
  → Kiểm tra header đúng tên cột
  → Đếm số dòng hợp lệ / không hợp lệ
  → Hiện bảng preview:
    ┌─────┬─────────────────────────┬──────┐
    │ STT │ Nội dung                │ Lỗi  │
    ├─────┼─────────────────────────┼──────┤
    │  1  │ What is the plural...   │  ✓   │
    │  2  │ (dòng thiếu cột)        │  ⚠️   │
    │  3  │ Fill in the blank: _    │  ✓   │
    └─────┴─────────────────────────┴──────┘
  → "X dòng hợp lệ, Y dòng có lỗi (bỏ qua)"

Bước 5 — Xác nhận Import
  API: POST /questions/import (multipart/form-data, file CSV)
  UI: Progress bar theo % dòng đã xử lý (stream hoặc polling)

Bước 6 — Kết quả
  Toast: "Đã import thành công X câu hỏi. Bỏ qua Y dòng lỗi."
  → Download report lỗi nếu Y > 0
```

---

### 6.4.4 Tạo bộ luyện tập (Assignment) — Wizard 3 bước

```
[Bước 1/3 — Thông tin cơ bản]

  Fields:
    • Tên bộ luyện tập *
    • Mô tả (tùy chọn)
    • Lớp *              [dropdown các lớp giáo viên đang quản lý]
    • Chế độ *           [● Adaptive (SM-2)] [○ Cố định]
      └── Tooltip "?" giải thích sự khác biệt:
          "Adaptive: mỗi học sinh nhận câu hỏi phù hợp với điểm yếu cá nhân.
           Cố định: tất cả học sinh làm cùng bộ câu hỏi, cùng thứ tự."

  Nhấn [Tiếp theo →] → Validate, chuyển sang bước 2

────────────────────────────────────────

[Bước 2/3 — Chọn câu hỏi]

  Layout 2 cột:
    Cột trái — Bộ lọc + danh sách:
      • Dropdown: Chủ đề
      • Dropdown: Độ khó (1–5)
      • Ô tìm kiếm full-text
      • Danh sách câu hỏi (checkbox, infinite scroll)
        Mỗi item: checkbox + nội dung rút gọn + badge topic + badge độ khó

    Cột phải — Giỏ đã chọn:
      • Tiêu đề: "Đã chọn (X câu)"
      • Danh sách có thể kéo-thả để sắp xếp lại (drag handle ≡)
        [Chỉ áp dụng cho chế độ "Cố định"]
      • Nút ✕ xóa từng câu
      • Gợi ý số câu tối ưu: "Khuyến nghị 10–20 câu/phiên"

  Nhấn [← Quay lại] hoặc [Tiếp theo →]
  → Validate: phải chọn ít nhất 1 câu hỏi

────────────────────────────────────────

[Bước 3/3 — Cài đặt & Publish]

  Fields:
    • Deadline           [date-time picker] hoặc [☐ Không có deadline]
    • Số lần thử tối đa  [1 / 2 / 3 / Không giới hạn]
    • Giới hạn thời gian [15 / 20 / 30 / 45 / 60 phút] hoặc [☐ Không giới hạn]

  Tóm tắt (preview card):
    ┌─────────────────────────────┐
    │ Ôn tập từ vựng Unit 3       │
    │ Lớp: Tiếng Anh 8A           │
    │ 15 câu • Chế độ Adaptive    │
    │ Deadline: 15/10/2025 23:59  │
    │ Tối đa 3 lần thử            │
    └─────────────────────────────┘

  Hành động:
    [← Quay lại]  [Lưu nháp]  [Publish ngay]

  ├── "Lưu nháp": POST /assignments { ...data, is_published: false }
  │   Toast: "Đã lưu nháp. Học sinh chưa thấy bài này."
  └── "Publish ngay": POST /assignments { ...data, is_published: true }
      Toast: "Bài luyện tập đã được giao cho lớp Tiếng Anh 8A!"
      → Notification push/email gửi đến học sinh (background job)
```

---

### 6.4.5 Xem Dashboard lớp học

```
Bước 1 — Giáo viên chọn lớp → vào tab "Phân tích"
  → Gọi song song:
     • GET /analytics/class/:classId
     • GET /analytics/class/:classId/topics
     • GET /analytics/class/:classId/students

Bước 2 — Render dashboard (skeleton trong lúc chờ):

  Section 1 — Tổng quan:
    • 4 metric card: Học sinh hoạt động / Tỷ lệ hoàn thành / Điểm trung bình / Chủ đề yếu nhất
    • Mỗi card có arrow 📈/📉 so sánh tuần trước

  Section 2 — Phân tích theo chủ đề:
    • Horizontal bar chart (Chart.js) — topic xếp theo accuracy tăng dần
    • Topic dưới 60%: bar màu đỏ + badge "Cần chú ý"
    • Click vào topic → drill-down: danh sách học sinh yếu topic đó

  Section 3 — Bảng xếp hạng học sinh:
    • Bảng có thể sort theo: Điểm TB / Số phiên / Độ chính xác / Lần học gần nhất
    • Mỗi hàng: avatar + tên + các chỉ số + badge streak
    • Click vào học sinh → modal chi tiết của học sinh đó

  Section 4 — Tiến độ từng bài luyện tập:
    • Bảng: Tên bài / Số HS đã nộp / Điểm TB / Deadline
    • Bài quá deadline mà < 100% đã nộp → highlight vàng
```

---

### 6.4.6 Giao thêm bài ôn cho topic yếu

```
Từ màn Dashboard → click vào topic yếu → modal "Giao bài ôn thêm"

  Hiển thị:
    • Topic: "Grammar - Tenses"
    • Học sinh đang yếu topic này: X/Y học sinh (accuracy trung bình: 55%)
    • Câu hỏi gợi ý từ ngân hàng liên quan đến topic (tự động filter)

  Hành động:
    [Tạo bài luyện tập mới với câu hỏi đã lọc]
    → Chuyển vào wizard tạo Assignment với câu hỏi pre-selected
    → Bước 1 đã điền sẵn: "Ôn thêm Grammar - Tenses", chế độ Adaptive
```

---

## 6.5 Luồng Phụ huynh (Parent Flows)

### 6.5.1 Liên kết với tài khoản học sinh

**Điều kiện tiên quyết:** Phụ huynh đã đăng ký tài khoản với role `parent`.

```
Bước 1 — Màn hình Home của phụ huynh (chưa có con nào được liên kết)
  Empty state: "Chưa có học sinh nào. Thêm con của bạn để theo dõi tiến độ."
  CTA: [+ Thêm học sinh]

Bước 2 — Nhập email tài khoản của con
  Input: email
  API: POST /parent/link { student_email: "con@example.com" }

Bước 3 — Kết quả phía phụ huynh
  ├── Học sinh tồn tại:
  │   Toast: "Đã gửi yêu cầu liên kết. Chờ con xác nhận trong ứng dụng."
  │   Card học sinh hiện với trạng thái "⏳ Đang chờ xác nhận"
  └── Email không tồn tại (HTTP 404):
      Toast: "Không tìm thấy học sinh với email này."

Bước 4 — Phía học sinh nhận yêu cầu
  Notification in-app: "Phụ huynh [tên] muốn theo dõi tiến độ của bạn"
  [Chấp nhận] [Từ chối]
  → Chấp nhận: API cập nhật parent_student_links.is_active = true
  → Phụ huynh nhận notification: "Con bạn đã chấp nhận kết nối"
  → Card học sinh cập nhật hiển thị dữ liệu thực
```

---

### 6.5.2 Xem tiến độ con

```
Bước 1 — Phụ huynh mở app → Home
  → GET /analytics/parent/children
  → Hiển thị card cho từng con:
     • Tên + ảnh đại diện
     • Số buổi học tuần này
     • Độ chính xác tổng
     • Streak
     • Điểm yếu nổi bật (nếu có)

Bước 2 — Phụ huynh chọn xem chi tiết 1 con
  → Chuyển vào màn hình Child Detail với 2 tab:

  Tab [Tổng quan]:
    • Số liệu tuần này vs tuần trước (arrow tăng/giảm)
    • Dot calendar 7 ngày
    • 3 topic yếu nhất (plain language, không thuật ngữ kỹ thuật)
    • Bài sắp đến deadline

  Tab [Báo cáo tuần]:
    → GET /analytics/parent/children/:studentId/weekly
    • Ngôn ngữ plain text: "An đã học 5 trong 7 ngày tuần này"
    • So sánh: "Cải thiện +8% so với tuần trước" / "Giảm X% so với tuần trước"
    • Phần "Cần chú ý": giải thích topic yếu bằng ngôn ngữ phụ huynh hiểu được
    • Bài tập sắp đến hạn
```

---

## 6.6 Luồng Thông báo & Email (Notification Flows)

### 6.6.1 Nhắc nhở ôn tập (Push / In-app)

```
Trigger: Cron job chạy lúc 7:00 sáng mỗi ngày

Logic:
  1. Truy vấn tất cả học sinh có sm2_progress.next_review_date <= TODAY
  2. Nhóm theo học sinh, đếm số câu đến hạn
  3. Gửi push notification nếu học sinh đã cài app mobile
     Nội dung: "Bạn có X câu cần ôn hôm nay. Học ngay để duy trì streak!"
  4. Nếu học sinh chưa học sau 18:00 → gửi reminder lần 2

Phía UI học sinh:
  → Nhận notification → click → mở thẳng vào Quiz Session
  → Deep link: app://quiz?auto_start=true
```

---

### 6.6.2 Báo cáo tuần tự động cho phụ huynh và giáo viên

```
Trigger: Cron job chạy lúc 8:00 sáng Chủ nhật

Logic:
  1. Với mỗi lớp:
     a. Tổng hợp dữ liệu tuần: số HS hoạt động, accuracy TB, topic yếu nhất
     b. Sinh báo cáo từ HTML template weekly-report.html
     c. Gửi email đến giáo viên qua Nodemailer

  2. Với mỗi phụ huynh:
     a. Tổng hợp dữ liệu từng con trong tuần
     b. Sinh báo cáo bằng ngôn ngữ plain (không thuật ngữ kỹ thuật)
     c. Gửi email

Email Design:
  • Subject: "[Adaptive Lang] Báo cáo tuần của An — 30/09–06/10"
  • Ngôn ngữ: đơn giản, thân thiện, dễ đọc trên mobile
  • CTA button: "Xem chi tiết trong app"
  • Không attachment, không data phức tạp
```

---

## 6.7 Luồng Quản lý Hồ sơ cá nhân

```
Áp dụng cho cả 3 vai trò.

Bước 1 — Vào tab "Hồ sơ"
  → GET /users/me
  Hiển thị: Ảnh đại diện, Họ tên, Email, Vai trò (badge), Ngày tham gia

Bước 2 — Chỉnh sửa thông tin
  → Nhấn "Chỉnh sửa" → form inline editable
  → PATCH /users/me { full_name }
  → Toast: "Thông tin đã được cập nhật"

Bước 3 — Đổi ảnh đại diện
  → Nhấn vào ảnh / icon camera
  → Chọn ảnh từ thư viện (crop tool, tỉ lệ 1:1)
  → Upload lên Firebase Storage
  → PATCH /users/me { avatar_url }
  → Avatar cập nhật real-time ở header

Bước 4 — Đổi mật khẩu
  → Form: Mật khẩu hiện tại + Mật khẩu mới + Xác nhận
  → PATCH /users/me/password
  → Logout tất cả session khác sau khi đổi thành công

Bước 5 — Đăng xuất
  → POST /auth/logout (thu hồi refresh token)
  → Xóa token khỏi storage
  → Redirect về màn hình Login
```

---

## 6.8 Bảng tổng hợp: Trigger → API → UI State

Bảng dưới đây tóm tắt toàn bộ các điểm tương tác chính, API được gọi và trạng thái UI tương ứng.

| Hành động người dùng | API call | UI State (Loading) | UI State (Success) | UI State (Error) |
|---|---|---|---|---|
| Mở app (có token) | `POST /auth/refresh` | Splash screen | Redirect Home | Redirect Login |
| Đăng nhập | `POST /auth/login` | Button spinner | Redirect Home | Toast lỗi |
| Tham gia lớp | `POST /classes/join` | Modal spinner | Toast + list refresh | Toast lỗi mã |
| Bắt đầu làm bài | `POST /sessions` | Full-screen loading | Quiz screen | Toast + fallback random |
| Trả lời câu hỏi | `POST /sessions/:id/answers` | Option highlight (optimistic) | Feedback panel | Retry tự động |
| Kết thúc bài | `POST /sessions/:id/finish` | Overlay "Tính kết quả..." | Result screen + animation | Retry |
| Tạo câu hỏi | `POST /questions` | Button spinner | Toast + form reset | Inline error |
| Import CSV | `POST /questions/import` | Progress bar | Toast số câu đã import | Toast + download lỗi |
| Tạo assignment | `POST /assignments` | Button spinner | Toast + redirect | Inline error wizard |
| Tải dashboard lớp | `GET /analytics/class/:id` | Skeleton toàn bộ section | Render chart + table | Retry banner |
| Liên kết phụ huynh-con | `POST /parent/link` | Button spinner | Toast chờ xác nhận | Toast email không tìm thấy |
| Xem báo cáo tuần | `GET /analytics/parent/children/:id/weekly` | Skeleton | Render plain-text report | Retry |

---

## 6.9 Nguyên tắc xử lý lỗi đồng nhất trên UI

Toàn bộ luồng đều tuân theo các nguyên tắc xử lý lỗi sau, đảm bảo trải nghiệm nhất quán:

**1. Lỗi mạng (Network Error / Timeout):**
Hiển thị toast "Không có kết nối. Kiểm tra internet và thử lại." kèm nút "Thử lại" inline tại component lỗi. Không xóa dữ liệu người dùng đã nhập.

**2. Lỗi 401 (Token hết hạn):**
Tự động gọi `POST /auth/refresh`. Nếu refresh thành công → retry request gốc trong suốt với người dùng. Nếu refresh thất bại → redirect về Login, toast "Phiên đăng nhập hết hạn."

**3. Lỗi 403 (Không có quyền):**
Toast "Bạn không có quyền thực hiện hành động này." Không điều hướng khỏi trang.

**4. Lỗi 500 (Server error):**
Toast "Đã có lỗi xảy ra. Vui lòng thử lại sau." Ghi log lỗi vào console (development) hoặc gửi đến error tracking service (production).

**5. Lỗi validation (422):**
Không dùng toast — hiển thị inline error trực tiếp dưới từng trường bị lỗi. Scroll tự động đến trường lỗi đầu tiên.

---

## 6.10 Tổng kết Phần 6

Phần này đã trình bày chi tiết luồng hoạt động cho **14 chức năng chính** trải đều trên 3 vai trò người dùng. Điểm nổi bật trong thiết kế luồng:

**Học sinh:** Toàn bộ luồng quiz được tối ưu để giảm tối đa "cognitive load" — từ lúc mở app đến lúc làm câu đầu tiên không quá 3 thao tác. SM-2 Engine hoạt động hoàn toàn trong suốt ở background.

**Giáo viên:** Các luồng tạo nội dung (câu hỏi, assignment) được thiết kế theo wizard pattern với validation từng bước, autosave chống mất dữ liệu, và preview trước khi publish.

**Phụ huynh:** Mọi dữ liệu kỹ thuật (EF, interval, SM-2 score) được dịch sang ngôn ngữ đời thường trước khi hiển thị — đảm bảo phụ huynh không cần hiểu hệ thống vẫn nắm được tiến độ của con.

---

> **Phần tiếp theo:** Phần 7 — Kế hoạch kiểm thử (Test Plan): unit test, integration test, và test case cho SM-2 Engine.
