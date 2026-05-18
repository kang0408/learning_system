# Phần 3: Thiết Kế API

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 3 / N — Thiết kế REST API

---

## 3.1 Nguyên tắc thiết kế API

Hệ thống sử dụng kiến trúc **REST API** theo các nguyên tắc sau:

| Nguyên tắc | Áp dụng |
|---|---|
| **Resource-based URL** | URL đặt tên theo danh từ, không dùng động từ trong path |
| **HTTP Method đúng ngữ nghĩa** | `GET` đọc, `POST` tạo, `PUT` thay toàn bộ, `PATCH` cập nhật một phần, `DELETE` xóa |
| **Stateless** | Mọi request mang đủ thông tin (JWT trong header), server không lưu session |
| **Versioning** | Prefix `/api/v1/` cho mọi endpoint, hỗ trợ nâng version không breaking change |
| **Consistent response shape** | Mọi response đều có cấu trúc `{ success, data, error, meta }` |
| **HTTP Status Code chuẩn** | 200, 201, 400, 401, 403, 404, 409, 422, 429, 500 |
| **Pagination chuẩn** | Cursor-based pagination cho danh sách lớn, offset cho danh sách nhỏ |
| **Rate limiting** | 100 req/phút cho user thường, 300 req/phút cho giáo viên |

---

## 3.2 Base URL & Versioning

```
Production:   https://api.adaptive-lang.com/api/v1
Development:  http://localhost:3000/api/v1
```

---

## 3.3 Authentication

### 3.3.1 Cơ chế JWT

Hệ thống dùng **JWT (JSON Web Token)** với 2 loại token:

| Token | Thời hạn | Mục đích |
|---|---|---|
| `access_token` | 1 giờ | Gọi các API được bảo vệ |
| `refresh_token` | 30 ngày | Lấy `access_token` mới khi hết hạn |

**Cấu trúc JWT payload:**

```json
{
  "sub": "uuid-of-user",
  "role": "student",
  "email": "user@example.com",
  "iat": 1716000000,
  "exp": 1716003600
}
```

### 3.3.2 Cách gửi token

```http
Authorization: Bearer <access_token>
```

### 3.3.3 RBAC — Phân quyền theo vai trò

| Role | Ký hiệu | Quyền hạn |
|---|---|---|
| `student` | 🎓 | Làm bài, xem tiến độ cá nhân |
| `teacher` | 👩‍🏫 | Quản lý lớp, câu hỏi, bộ luyện tập, xem dashboard lớp |
| `parent` | 👨‍👩‍👧 | Xem tiến độ con, nhận báo cáo |

> Ký hiệu dùng trong bảng endpoint: 🎓 = student, 👩‍🏫 = teacher, 👨‍👩‍👧 = parent, 🔓 = public (không cần auth)

---

## 3.4 Cấu trúc Response chuẩn

### Response thành công

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Response lỗi

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      { "field": "email", "message": "Email không đúng định dạng" }
    ]
  }
}
```

### Bảng mã lỗi chuẩn

| HTTP Status | Error Code | Ý nghĩa |
|---|---|---|
| 400 | `BAD_REQUEST` | Request sai cú pháp |
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập / token hết hạn |
| 401 | `TOKEN_EXPIRED` | Access token hết hạn, dùng refresh token |
| 403 | `FORBIDDEN` | Không có quyền truy cập resource này |
| 404 | `NOT_FOUND` | Resource không tồn tại |
| 409 | `CONFLICT` | Dữ liệu đã tồn tại (VD: email đã đăng ký) |
| 422 | `UNPROCESSABLE` | Dữ liệu hợp lệ nhưng không thể xử lý |
| 429 | `RATE_LIMITED` | Vượt giới hạn số lượng request |
| 500 | `INTERNAL_ERROR` | Lỗi phía server |

---

## 3.5 Danh sách Endpoint

### 3.5.1 Auth — Xác thực

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/auth/register` | 🔓 | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | 🔓 | Đăng nhập, nhận JWT |
| `POST` | `/auth/refresh` | 🔓 | Làm mới access token |
| `POST` | `/auth/logout` | 🎓👩‍🏫👨‍👩‍👧 | Đăng xuất, thu hồi refresh token |
| `POST` | `/auth/forgot-password` | 🔓 | Gửi email đặt lại mật khẩu |
| `POST` | `/auth/reset-password` | 🔓 | Đặt lại mật khẩu qua token email |

---

#### `POST /auth/register`

**Request body:**

```json
{
  "email": "student@example.com",
  "password": "Abc@12345",
  "full_name": "Nguyễn Văn An",
  "role": "student"
}
```

**Validation:**
- `email`: định dạng email, unique
- `password`: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số
- `role`: chỉ chấp nhận `student` | `teacher` | `parent`

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "full_name": "Nguyễn Văn An",
      "role": "student"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

#### `POST /auth/login`

**Request body:**

```json
{
  "email": "student@example.com",
  "password": "Abc@12345"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "Nguyễn Văn An",
      "role": "student",
      "avatar_url": null
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 3600
  }
}
```

**Response `401` — Sai mật khẩu:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email hoặc mật khẩu không đúng"
  }
}
```

---

#### `POST /auth/refresh`

**Request body:**

```json
{
  "refresh_token": "eyJ..."
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "expires_in": 3600
  }
}
```

---

### 3.5.2 Users — Người dùng

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/users/me` | 🎓👩‍🏫👨‍👩‍👧 | Lấy thông tin bản thân |
| `PATCH` | `/users/me` | 🎓👩‍🏫👨‍👩‍👧 | Cập nhật thông tin cá nhân |
| `PATCH` | `/users/me/password` | 🎓👩‍🏫👨‍👩‍👧 | Đổi mật khẩu |
| `POST` | `/users/me/avatar` | 🎓👩‍🏫👨‍👩‍👧 | Upload ảnh đại diện |

---

#### `GET /users/me`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "full_name": "Nguyễn Văn An",
    "role": "student",
    "avatar_url": "https://storage.firebase.com/avatars/uuid.jpg",
    "is_active": true,
    "created_at": "2025-09-01T00:00:00Z"
  }
}
```

---

#### `PATCH /users/me`

**Request body** (chỉ gửi field muốn thay đổi):

```json
{
  "full_name": "Nguyễn Văn Bình"
}
```

---

### 3.5.3 Classes — Lớp học

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/classes` | 👩‍🏫 | Tạo lớp học mới |
| `GET` | `/classes` | 👩‍🏫 | Lấy danh sách lớp của giáo viên |
| `GET` | `/classes/:id` | 👩‍🏫🎓 | Xem chi tiết lớp |
| `PATCH` | `/classes/:id` | 👩‍🏫 | Cập nhật thông tin lớp |
| `DELETE` | `/classes/:id` | 👩‍🏫 | Xóa lớp (soft delete) |
| `GET` | `/classes/:id/members` | 👩‍🏫 | Lấy danh sách học sinh trong lớp |
| `DELETE` | `/classes/:id/members/:studentId` | 👩‍🏫 | Xóa học sinh khỏi lớp |
| `POST` | `/classes/join` | 🎓 | Học sinh tham gia lớp bằng mã |
| `GET` | `/classes/my` | 🎓 | Học sinh xem danh sách lớp đã tham gia |

---

#### `POST /classes`

**Request body:**

```json
{
  "name": "Tiếng Anh 8A",
  "subject": "English",
  "description": "Lớp tiếng Anh học kỳ 1 năm học 2025-2026"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tiếng Anh 8A",
    "subject": "English",
    "join_code": "ENG8A2",
    "teacher_id": "uuid",
    "member_count": 0,
    "created_at": "2025-09-01T00:00:00Z"
  }
}
```

---

#### `POST /classes/join`

Học sinh dùng mã lớp để tham gia.

**Request body:**

```json
{
  "join_code": "ENG8A2"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "class_id": "uuid",
    "class_name": "Tiếng Anh 8A",
    "teacher_name": "Trần Thị Lan",
    "joined_at": "2025-09-02T08:00:00Z"
  }
}
```

**Response `404` — Mã không tồn tại:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Mã lớp không tồn tại hoặc đã hết hiệu lực"
  }
}
```

**Response `409` — Đã tham gia:**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Bạn đã là thành viên của lớp này"
  }
}
```

---

#### `GET /classes/:id/members`

**Query params:** `?page=1&limit=20&search=nguyen`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "student_id": "uuid",
      "full_name": "Nguyễn Văn An",
      "email": "an@example.com",
      "avatar_url": null,
      "joined_at": "2025-09-02T08:00:00Z",
      "last_active_at": "2025-10-01T14:30:00Z",
      "total_sessions": 12,
      "avg_accuracy": 72.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

---

### 3.5.4 Questions — Ngân hàng câu hỏi

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/questions` | 👩‍🏫 | Tạo câu hỏi mới |
| `GET` | `/questions` | 👩‍🏫 | Lấy danh sách câu hỏi (filter, search) |
| `GET` | `/questions/:id` | 👩‍🏫 | Xem chi tiết câu hỏi |
| `PUT` | `/questions/:id` | 👩‍🏫 | Cập nhật toàn bộ câu hỏi |
| `DELETE` | `/questions/:id` | 👩‍🏫 | Xóa câu hỏi (soft delete) |
| `POST` | `/questions/import` | 👩‍🏫 | Import hàng loạt từ file CSV |
| `GET` | `/questions/topics` | 👩‍🏫 | Lấy danh sách topic đã dùng |

---

#### `POST /questions`

**Request body:**

```json
{
  "content": "What is the plural form of 'child'?",
  "question_type": "multiple_choice",
  "topic": "Grammar - Nouns",
  "difficulty": 2,
  "explanation": "'Child' là danh từ bất quy tắc, dạng số nhiều là 'children'.",
  "answer_options": [
    { "content": "childs",   "is_correct": false, "order_index": 1 },
    { "content": "childes",  "is_correct": false, "order_index": 2 },
    { "content": "children", "is_correct": true,  "order_index": 3 },
    { "content": "childrens","is_correct": false, "order_index": 4 }
  ]
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "What is the plural form of 'child'?",
    "question_type": "multiple_choice",
    "topic": "Grammar - Nouns",
    "difficulty": 2,
    "answer_options": [ ... ],
    "created_at": "2025-09-05T10:00:00Z"
  }
}
```

---

#### `GET /questions`

**Query params:**

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `page` | int | 1 | Trang hiện tại |
| `limit` | int | 20 | Số bản ghi/trang |
| `topic` | string | — | Lọc theo chủ đề |
| `difficulty` | int 1–5 | — | Lọc theo độ khó |
| `type` | string | — | Lọc theo dạng câu hỏi |
| `search` | string | — | Tìm trong nội dung câu hỏi |

**Ví dụ:** `GET /questions?topic=Grammar&difficulty=3&limit=10`

---

### 3.5.5 Assignments — Bộ luyện tập

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/assignments` | 👩‍🏫 | Tạo bộ luyện tập mới |
| `GET` | `/assignments` | 👩‍🏫 | Lấy danh sách bộ luyện tập đã tạo |
| `GET` | `/assignments/:id` | 👩‍🏫🎓 | Xem chi tiết bộ luyện tập |
| `PATCH` | `/assignments/:id` | 👩‍🏫 | Cập nhật bộ luyện tập |
| `DELETE` | `/assignments/:id` | 👩‍🏫 | Xóa bộ luyện tập |
| `POST` | `/assignments/:id/publish` | 👩‍🏫 | Publish — học sinh bắt đầu thấy bài |
| `POST` | `/assignments/:id/unpublish` | 👩‍🏫 | Ẩn bộ luyện tập |
| `GET` | `/assignments/my` | 🎓 | Học sinh xem bài được giao |

---

#### `POST /assignments`

**Request body:**

```json
{
  "class_id": "uuid",
  "title": "Ôn tập từ vựng Unit 3",
  "description": "Các từ vựng chủ đề gia đình và nhà cửa",
  "mode": "adaptive",
  "deadline": "2025-10-15T23:59:00Z",
  "max_attempts": 3,
  "time_limit": 30,
  "question_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Ôn tập từ vựng Unit 3",
    "class_id": "uuid",
    "mode": "adaptive",
    "question_count": 3,
    "deadline": "2025-10-15T23:59:00Z",
    "is_published": false,
    "created_at": "2025-10-01T08:00:00Z"
  }
}
```

---

#### `POST /assignments/:id/publish`

Khi giáo viên publish, hệ thống tự động:
1. Set `is_published = TRUE`, lưu `published_at`
2. Khởi tạo bản ghi `sm2_progress` cho toàn bộ học sinh trong lớp với từng câu hỏi (nếu chưa có)
3. Gửi push notification đến học sinh

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_published": true,
    "published_at": "2025-10-01T09:00:00Z",
    "notified_students": 32
  }
}
```

---

#### `GET /assignments/my`

Học sinh xem danh sách bài được giao (tất cả lớp).

**Query params:** `?status=pending&page=1&limit=10`

| status | Ý nghĩa |
|---|---|
| `pending` | Chưa làm hoặc chưa đủ lần |
| `completed` | Đã hoàn thành |
| `overdue` | Quá deadline chưa làm |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Ôn tập từ vựng Unit 3",
      "class_name": "Tiếng Anh 8A",
      "mode": "adaptive",
      "deadline": "2025-10-15T23:59:00Z",
      "time_limit": 30,
      "my_attempts": 1,
      "max_attempts": 3,
      "best_score": 75.0,
      "due_questions_today": 8,
      "status": "pending"
    }
  ]
}
```

---

### 3.5.6 Quiz Sessions — Phiên làm bài

Đây là nhóm endpoint phức tạp nhất, xử lý toàn bộ luồng học sinh làm bài và cập nhật SM-2.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/sessions` | 🎓 | Bắt đầu phiên làm bài mới |
| `GET` | `/sessions/:id` | 🎓 | Lấy trạng thái phiên + câu hỏi tiếp theo |
| `POST` | `/sessions/:id/answers` | 🎓 | Nộp câu trả lời cho 1 câu hỏi |
| `POST` | `/sessions/:id/finish` | 🎓 | Kết thúc phiên, nhận kết quả tổng kết |
| `POST` | `/sessions/:id/abandon` | 🎓 | Bỏ dở phiên làm bài |
| `GET` | `/sessions/:id/result` | 🎓 | Xem kết quả chi tiết sau khi hoàn thành |

---

#### `POST /sessions` — Bắt đầu phiên làm bài

**Request body:**

```json
{
  "assignment_id": "uuid"
}
```

**Xử lý phía server:**
1. Kiểm tra học sinh có trong lớp của assignment không
2. Kiểm tra số lần thử chưa vượt `max_attempts`
3. Nếu `mode = 'adaptive'`: gọi SM-2 Engine lấy danh sách câu hỏi đến hạn ôn hôm nay
4. Nếu `mode = 'fixed'`: lấy câu hỏi theo `order_index` trong `assignment_questions`
5. Tạo bản ghi `quiz_sessions` với `status = 'in_progress'`
6. Cache danh sách câu hỏi vào Redis key `session:{session_id}:questions`

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "assignment_title": "Ôn tập từ vựng Unit 3",
    "total_questions": 15,
    "time_limit_seconds": 1800,
    "started_at": "2025-10-05T08:00:00Z",
    "first_question": {
      "id": "uuid",
      "content": "What is the plural form of 'child'?",
      "question_type": "multiple_choice",
      "audio_url": null,
      "image_url": null,
      "answer_options": [
        { "id": "uuid-a", "content": "childs" },
        { "id": "uuid-b", "content": "childes" },
        { "id": "uuid-c", "content": "children" },
        { "id": "uuid-d", "content": "childrens" }
      ],
      "question_index": 1
    }
  }
}
```

> **Lưu ý bảo mật:** `is_correct` không được trả về trong `answer_options` — tránh học sinh inspect response để biết đáp án.

---

#### `POST /sessions/:id/answers` — Nộp câu trả lời

**Request body:**

```json
{
  "question_id": "uuid",
  "selected_option_id": "uuid-c",
  "response_time_ms": 4200
}
```

**Xử lý phía server:**
1. Kiểm tra `selected_option_id` có thuộc `question_id` không
2. Tính `is_correct` và `sm2_quality` từ `is_correct` + `response_time_ms`
3. Lưu bản ghi vào `session_answers`
4. Cập nhật `sm2_progress` cho cặp (student_id, question_id): tính lại EF, interval, repetition_count, next_review_date
5. Tăng counter `total_answers`, `correct_answers` trên `quiz_sessions`
6. Lấy câu hỏi tiếp theo từ Redis cache

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "correct_option_id": "uuid-c",
    "explanation": "'Child' là danh từ bất quy tắc, dạng số nhiều là 'children'.",
    "sm2_quality": 5,
    "next_review_in_days": 6,
    "next_question": {
      "id": "uuid-2",
      "content": "Choose the correct verb form: She ___ to school every day.",
      "question_type": "multiple_choice",
      "answer_options": [ ... ],
      "question_index": 2
    },
    "session_progress": {
      "answered": 1,
      "total": 15,
      "correct_so_far": 1
    }
  }
}
```

> Khi `next_question = null` tức là đã hết câu hỏi, client tự động gọi `POST /sessions/:id/finish`.

---

#### `POST /sessions/:id/finish` — Kết thúc phiên

**Request body:** _(không cần body)_

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "score": 80.0,
    "total_questions": 15,
    "correct_questions": 12,
    "duration_seconds": 742,
    "finished_at": "2025-10-05T08:12:22Z",
    "performance_by_topic": [
      { "topic": "Grammar - Nouns",   "accuracy": 90.0 },
      { "topic": "Grammar - Tenses",  "accuracy": 66.7 },
      { "topic": "Vocabulary - Home", "accuracy": 100.0 }
    ],
    "weakest_topic": "Grammar - Tenses",
    "next_session_due": "2025-10-06T00:00:00Z"
  }
}
```

---

### 3.5.7 Analytics — Thống kê & Báo cáo

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/analytics/student/me` | 🎓 | Thống kê cá nhân học sinh |
| `GET` | `/analytics/student/me/calendar` | 🎓 | Lịch học trong tháng |
| `GET` | `/analytics/student/me/weak-topics` | 🎓 | Các chủ đề đang yếu |
| `GET` | `/analytics/class/:classId` | 👩‍🏫 | Tổng quan tiến độ cả lớp |
| `GET` | `/analytics/class/:classId/topics` | 👩‍🏫 | Phân tích theo chủ đề cả lớp |
| `GET` | `/analytics/class/:classId/students` | 👩‍🏫 | Bảng xếp hạng học sinh trong lớp |
| `GET` | `/analytics/parent/children` | 👨‍👩‍👧 | Tiến độ các con |
| `GET` | `/analytics/parent/children/:studentId/weekly` | 👨‍👩‍👧 | Báo cáo tuần của một học sinh |

---

#### `GET /analytics/student/me`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "total_sessions": 24,
    "total_questions_answered": 360,
    "overall_accuracy": 74.2,
    "current_streak_days": 5,
    "longest_streak_days": 12,
    "questions_due_today": 8,
    "mastered_questions": 45,
    "learning_questions": 120,
    "new_questions": 35,
    "weekly_activity": [
      { "date": "2025-10-01", "sessions": 1, "questions": 15, "accuracy": 80.0 },
      { "date": "2025-10-02", "sessions": 0, "questions": 0,  "accuracy": null },
      { "date": "2025-10-03", "sessions": 2, "questions": 28, "accuracy": 71.4 }
    ]
  }
}
```

---

#### `GET /analytics/class/:classId`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "class_name": "Tiếng Anh 8A",
    "total_students": 35,
    "active_students_this_week": 28,
    "avg_accuracy": 68.5,
    "avg_sessions_per_student": 8.2,
    "completion_rate": 72.0,
    "topic_breakdown": [
      { "topic": "Grammar - Tenses",  "avg_accuracy": 55.0, "student_count": 35 },
      { "topic": "Vocabulary - Home", "avg_accuracy": 82.3, "student_count": 32 }
    ],
    "weakest_topic": "Grammar - Tenses",
    "assignments_summary": [
      {
        "assignment_id": "uuid",
        "title": "Ôn tập từ vựng Unit 3",
        "submitted_count": 28,
        "avg_score": 71.4,
        "deadline": "2025-10-15T23:59:00Z"
      }
    ]
  }
}
```

---

### 3.5.8 Parent — Phụ huynh

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/parent/link` | 👨‍👩‍👧 | Liên kết với học sinh qua email |
| `GET` | `/parent/children` | 👨‍👩‍👧 | Danh sách con đã liên kết |
| `DELETE` | `/parent/children/:studentId` | 👨‍👩‍👧 | Hủy liên kết |

---

#### `POST /parent/link`

Phụ huynh nhập email con để gửi yêu cầu liên kết.

**Request body:**

```json
{
  "student_email": "con@example.com"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "message": "Đã gửi yêu cầu liên kết đến học sinh. Học sinh cần xác nhận qua ứng dụng."
  }
}
```

---

## 3.6 Luồng hoàn chỉnh: học sinh làm bài

Tóm tắt chuỗi API call theo thứ tự khi một học sinh mở app và làm bài:

```
1. POST /auth/login
   → Nhận access_token

2. GET /assignments/my?status=pending
   → Xem bài được giao, chọn bài muốn làm

3. POST /sessions
   { assignment_id: "uuid" }
   → Nhận session_id + câu hỏi đầu tiên

4. [Lặp cho mỗi câu hỏi]
   POST /sessions/:id/answers
   { question_id, selected_option_id, response_time_ms }
   → Nhận kết quả đúng/sai + câu hỏi tiếp theo
   → SM-2 Engine cập nhật ngầm

5. POST /sessions/:id/finish
   → Nhận tổng kết: điểm, topic yếu, ngày ôn tiếp theo

6. GET /analytics/student/me
   → Cập nhật dashboard cá nhân
```

---

## 3.7 Middleware stack

Mọi request đi qua middleware theo thứ tự:

```
Request
  │
  ├─ 1. CORS middleware
  ├─ 2. Rate limiter (express-rate-limit + Redis)
  ├─ 3. Request logger (Morgan)
  ├─ 4. Body parser (JSON, max 1MB)
  ├─ 5. JWT verifier → gắn req.user
  ├─ 6. RBAC checker → kiểm tra role
  ├─ 7. Input validator (Joi / Zod)
  │
  └─ Route handler
       │
       └─ Global error handler
```

---

## 3.8 Bảo mật API

| Biện pháp | Chi tiết |
|---|---|
| **HTTPS only** | Redirect toàn bộ HTTP sang HTTPS |
| **Rate limiting** | 100 req/min/user; 300 req/min/teacher; 10 req/min cho auth endpoints |
| **Input sanitization** | Escape SQL injection qua Prisma parameterized queries; strip XSS qua `validator.js` |
| **JWT rotation** | Refresh token dùng một lần (rotate on use) — thu hồi token cũ sau khi refresh |
| **Helmet.js** | Set security headers: HSTS, X-Frame-Options, CSP, X-XSS-Protection |
| **CORS whitelist** | Chỉ cho phép domain frontend đã đăng ký |
| **Sensitive data** | Không trả về `password_hash`, không log JWT trong console production |

---

## 3.9 Tổng kết Phần 3

API được thiết kế theo nguyên tắc **REST thuần túy** với 3 ưu tiên:

1. **Nhất quán** — mọi endpoint dùng chung response shape, error code, và convention đặt tên. Frontend developer chỉ cần học một lần.

2. **Bảo mật theo lớp** — JWT + RBAC + rate limiting + input validation + Helmet tạo thành 5 lớp bảo vệ độc lập, mỗi lớp chặn một loại tấn công khác nhau.

3. **Hiệu năng thực tiễn** — SM-2 cập nhật bất đồng bộ (async) sau mỗi câu trả lời, không block response trả về cho học sinh; Redis cache giảm tải cho PostgreSQL ở các điểm đọc nhiều nhất (danh sách câu hỏi hôm nay, dashboard).

---

> **Phần tiếp theo:** Phần 4 — Thiết kế Giao diện (UI/UX Design) cho 3 vai trò: học sinh, giáo viên, phụ huynh.
