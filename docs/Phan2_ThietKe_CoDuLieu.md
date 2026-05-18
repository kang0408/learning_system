# Phần 2: Thiết Kế Cơ Sở Dữ Liệu

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 2 / N — Thiết kế Cơ sở Dữ liệu

---

## 2.1 Tổng quan thiết kế

Hệ thống sử dụng **PostgreSQL** làm cơ sở dữ liệu quan hệ chính, kết hợp **Redis** cho cache và **Firebase Storage** cho media. Thiết kế tuân theo các nguyên tắc:

- **Normalization 3NF**: tránh dư thừa dữ liệu, đảm bảo tính toàn vẹn.
- **UUID làm Primary Key**: tránh lộ thông tin tuần tự, hỗ trợ phân tán sau này.
- **Soft delete**: các bảng quan trọng dùng cột `deleted_at` thay vì xóa cứng.
- **Audit trail**: mọi bảng có `created_at` và `updated_at`.
- **Index có chủ đích**: chỉ đánh index các cột thực sự dùng trong `WHERE` / `JOIN`.

---

## 2.2 Sơ đồ quan hệ thực thể (ERD — tóm tắt)

```
users
 ├──< classes (teacher_id → users.id)
 ├──< class_members (student_id → users.id)
 ├──< questions (created_by → users.id)
 └──< sm2_progress (student_id → users.id)

classes
 ├──< class_members (class_id → classes.id)
 └──< assignments (class_id → classes.id)

assignments
 └──< assignment_questions (assignment_id → assignments.id)

questions
 ├──< assignment_questions (question_id → questions.id)
 ├──< answer_options (question_id → questions.id)
 └──< sm2_progress (question_id → questions.id)

sm2_progress
 └──< quiz_sessions (student_id + question_id → sm2_progress)

quiz_sessions
 └──< session_answers (session_id → quiz_sessions.id)
```

> **Ghi chú:** `<` ký hiệu quan hệ one-to-many (một bản ghi ở bảng trái → nhiều bản ghi ở bảng phải).

---

## 2.3 Schema chi tiết các bảng

### 2.3.1 Bảng `users` — Người dùng

Lưu toàn bộ người dùng hệ thống gồm học sinh, giáo viên và phụ huynh. Phân biệt vai trò qua cột `role`.

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,           -- bcrypt, cost=12
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL             -- 'student' | 'teacher' | 'parent'
                  CHECK (role IN ('student', 'teacher', 'parent')),
    avatar_url    VARCHAR(500),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ                       -- soft delete
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);
```

**Ghi chú thiết kế:**
- `password_hash` lưu output của bcrypt (cost 12), không bao giờ lưu plain text.
- Phụ huynh được liên kết với học sinh qua bảng `parent_student_links` (xem mục 2.3.9).
- `deleted_at IS NULL` là điều kiện mặc định trong mọi query.

---

### 2.3.2 Bảng `classes` — Lớp học

Giáo viên tạo lớp, mỗi lớp có mã tham gia duy nhất (`join_code`) để học sinh join.

```sql
CREATE TABLE classes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id  UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name        VARCHAR(100) NOT NULL,               -- VD: "Tiếng Anh 8A"
    subject     VARCHAR(50)  NOT NULL,               -- VD: "English"
    join_code   VARCHAR(10)  NOT NULL UNIQUE,        -- VD: "ENG8A2"
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_classes_teacher    ON classes(teacher_id);
CREATE UNIQUE INDEX idx_classes_join_code ON classes(join_code)
    WHERE deleted_at IS NULL;
```

**Ghi chú thiết kế:**
- `join_code` được sinh ngẫu nhiên 6 ký tự (chữ hoa + số), unique constraint đảm bảo không trùng.
- `ON DELETE RESTRICT` ngăn xóa giáo viên khi còn lớp học đang hoạt động.

---

### 2.3.3 Bảng `class_members` — Thành viên lớp

Quan hệ nhiều-nhiều giữa học sinh và lớp học.

```sql
CREATE TABLE class_members (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id    UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id  UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (class_id, student_id)
);

CREATE INDEX idx_class_members_class   ON class_members(class_id);
CREATE INDEX idx_class_members_student ON class_members(student_id);
```

**Ghi chú thiết kế:**
- `UNIQUE (class_id, student_id)` ngăn học sinh join lớp hai lần.
- `is_active = FALSE` khi học sinh rời lớp, giữ lại lịch sử học tập.

---

### 2.3.4 Bảng `questions` — Ngân hàng câu hỏi

Lưu toàn bộ câu hỏi do giáo viên tạo. Hỗ trợ nhiều dạng câu hỏi.

```sql
CREATE TABLE questions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by   UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content      TEXT        NOT NULL,               -- nội dung câu hỏi
    question_type VARCHAR(30) NOT NULL               -- dạng câu hỏi
                 CHECK (question_type IN (
                     'multiple_choice',              -- trắc nghiệm 1 đáp án
                     'true_false',                   -- đúng/sai
                     'fill_blank',                   -- điền vào chỗ trống
                     'matching'                      -- nối cột
                 )),
    topic        VARCHAR(100),                       -- chủ đề: "Greetings", "Tenses"
    difficulty   SMALLINT    NOT NULL DEFAULT 3      -- 1 (dễ) → 5 (khó)
                 CHECK (difficulty BETWEEN 1 AND 5),
    explanation  TEXT,                               -- giải thích đáp án
    audio_url    VARCHAR(500),                       -- link Firebase Storage
    image_url    VARCHAR(500),
    is_public    BOOLEAN     NOT NULL DEFAULT FALSE, -- chia sẻ với GV khác
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_topic      ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

---

### 2.3.5 Bảng `answer_options` — Đáp án câu hỏi

Lưu các lựa chọn cho câu hỏi trắc nghiệm và true/false.

```sql
CREATE TABLE answer_options (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL,                -- nội dung lựa chọn
    is_correct  BOOLEAN     NOT NULL DEFAULT FALSE,
    order_index SMALLINT    NOT NULL DEFAULT 0,      -- thứ tự hiển thị
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answer_options_question ON answer_options(question_id);
```

**Ghi chú thiết kế:**
- Mỗi câu hỏi `multiple_choice` có 4 bản ghi trong bảng này, một trong số đó có `is_correct = TRUE`.
- Câu `fill_blank`: lưu 1 bản ghi với đáp án chuẩn để so sánh.

---

### 2.3.6 Bảng `assignments` — Bộ luyện tập

Giáo viên tạo bộ luyện tập, giao cho lớp kèm deadline.

```sql
CREATE TABLE assignments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id     UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_by   UUID        NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    mode         VARCHAR(20)  NOT NULL DEFAULT 'adaptive'
                 CHECK (mode IN (
                     'adaptive',   -- SM-2: câu hỏi cá nhân hóa theo từng học sinh
                     'fixed'       -- tất cả học sinh làm cùng bộ câu hỏi, cùng thứ tự
                 )),
    deadline     TIMESTAMPTZ,
    max_attempts SMALLINT    NOT NULL DEFAULT 0,     -- 0 = không giới hạn
    time_limit   SMALLINT,                           -- phút, NULL = không giới hạn
    is_published BOOLEAN     NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_assignments_class      ON assignments(class_id);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignments_deadline   ON assignments(deadline)
    WHERE deadline IS NOT NULL AND deleted_at IS NULL;
```

**Ghi chú thiết kế:**
- `mode = 'adaptive'`: SM-2 Engine chọn câu hỏi khác nhau cho từng học sinh dựa trên `sm2_progress`.
- `mode = 'fixed'`: mọi học sinh trong lớp nhận cùng danh sách câu hỏi theo thứ tự cố định.
- `is_published = FALSE` khi giáo viên còn soạn thảo; học sinh chỉ thấy sau khi `is_published = TRUE`.

---

### 2.3.7 Bảng `assignment_questions` — Câu hỏi trong bộ luyện tập

Quan hệ nhiều-nhiều giữa `assignments` và `questions`.

```sql
CREATE TABLE assignment_questions (
    id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID     NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    question_id   UUID     NOT NULL REFERENCES questions(id)   ON DELETE RESTRICT,
    order_index   SMALLINT NOT NULL DEFAULT 0,       -- thứ tự trong mode 'fixed'
    UNIQUE (assignment_id, question_id)
);

CREATE INDEX idx_aq_assignment ON assignment_questions(assignment_id);
CREATE INDEX idx_aq_question   ON assignment_questions(question_id);
```

---

### 2.3.8 Bảng `sm2_progress` — Tiến độ SM-2 theo từng học sinh

**Đây là bảng cốt lõi của hệ thống.** Lưu trạng thái thuật toán SM-2 cho mỗi cặp (học sinh, câu hỏi).

```sql
CREATE TABLE sm2_progress (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    question_id      UUID        NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,

    -- SM-2 algorithm fields
    easiness_factor  NUMERIC(4,2) NOT NULL DEFAULT 2.50,  -- EF: 1.30 → 5.00
    interval_days    SMALLINT     NOT NULL DEFAULT 1,     -- ngày đến lần ôn tiếp theo
    repetition_count SMALLINT     NOT NULL DEFAULT 0,     -- số lần đã học thành công liên tiếp
    next_review_date DATE         NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,

    -- Performance tracking
    total_attempts   INTEGER      NOT NULL DEFAULT 0,
    correct_attempts INTEGER      NOT NULL DEFAULT 0,

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (student_id, question_id)
);

CREATE INDEX idx_sm2_student          ON sm2_progress(student_id);
CREATE INDEX idx_sm2_next_review      ON sm2_progress(student_id, next_review_date);
CREATE INDEX idx_sm2_question         ON sm2_progress(question_id);
```

**Giải thích các trường SM-2:**

| Trường | Kiểu | Mô tả | Phạm vi |
|---|---|---|---|
| `easiness_factor` | NUMERIC | Hệ số dễ/khó của câu hỏi với học sinh cụ thể | 1.30 – 5.00 |
| `interval_days` | SMALLINT | Số ngày đến lần ôn tiếp theo | 1 – 365+ |
| `repetition_count` | SMALLINT | Số lần trả lời đúng liên tiếp | 0 – N |
| `next_review_date` | DATE | Ngày hệ thống lên lịch ôn lại | Tương lai |

**Công thức SM-2 cập nhật sau mỗi lần trả lời:**

```
-- q: chất lượng trả lời (0–5), 0=sai hoàn toàn, 5=đúng ngay
-- EF mới = EF cũ + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
-- EF không được nhỏ hơn 1.3

IF q < 3 THEN
    interval = 1
    repetition_count = 0
ELSE
    IF repetition_count = 0 THEN interval = 1
    IF repetition_count = 1 THEN interval = 6
    ELSE interval = ROUND(interval * EF)
    repetition_count = repetition_count + 1
END IF

next_review_date = TODAY + interval
```

---

### 2.3.9 Bảng `quiz_sessions` — Phiên làm bài

Ghi nhận mỗi lần học sinh ngồi làm bài.

```sql
CREATE TABLE quiz_sessions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID        NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    assignment_id UUID        NOT NULL REFERENCES assignments(id)  ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    score         NUMERIC(5,2),                     -- % đúng: 0.00 → 100.00
    total_q       SMALLINT    NOT NULL DEFAULT 0,   -- tổng số câu đã làm
    correct_q     SMALLINT    NOT NULL DEFAULT 0,   -- số câu đúng
    status        VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX idx_sessions_student    ON quiz_sessions(student_id);
CREATE INDEX idx_sessions_assignment ON quiz_sessions(assignment_id);
CREATE INDEX idx_sessions_started    ON quiz_sessions(started_at);
```

---

### 2.3.10 Bảng `session_answers` — Chi tiết từng câu trả lời

Ghi nhận chi tiết câu trả lời của học sinh trong một phiên làm bài.

```sql
CREATE TABLE session_answers (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID        NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id      UUID        NOT NULL REFERENCES questions(id)     ON DELETE RESTRICT,
    selected_option  UUID        REFERENCES answer_options(id),        -- NULL nếu fill_blank
    text_answer      TEXT,                                             -- dùng cho fill_blank
    is_correct       BOOLEAN     NOT NULL,
    response_time_ms INTEGER     NOT NULL DEFAULT 0,                   -- ms để trả lời
    sm2_quality      SMALLINT    NOT NULL DEFAULT 0                    -- q-score 0–5 gửi vào SM-2
                     CHECK (sm2_quality BETWEEN 0 AND 5),
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_session  ON session_answers(session_id);
CREATE INDEX idx_answers_question ON session_answers(question_id);
```

**Ghi chú thiết kế:**
- `sm2_quality` được tính từ `is_correct` + `response_time_ms`:
  - Đúng nhanh (< 5s) → q = 5
  - Đúng bình thường (5–15s) → q = 4
  - Đúng chậm (> 15s) → q = 3
  - Sai nhưng gần đúng → q = 2
  - Sai hoàn toàn → q = 1
  - Bỏ qua / hết giờ → q = 0

---

### 2.3.11 Bảng `parent_student_links` — Liên kết phụ huynh–học sinh

```sql
CREATE TABLE parent_student_links (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (parent_id, student_id)
);

CREATE INDEX idx_psl_parent  ON parent_student_links(parent_id);
CREATE INDEX idx_psl_student ON parent_student_links(student_id);
```

**Ghi chú thiết kế:**
- Một phụ huynh có thể liên kết nhiều học sinh (ví dụ: 2 con cùng dùng app).
- Liên kết thực hiện qua mã học sinh hoặc email, cần học sinh xác nhận.

---

## 2.4 Tóm tắt quan hệ giữa các bảng

| Quan hệ | Loại | Ý nghĩa |
|---|---|---|
| `users` → `classes` | 1–N | Một giáo viên tạo nhiều lớp |
| `classes` → `class_members` | 1–N | Một lớp có nhiều học sinh |
| `users` → `class_members` | 1–N | Một học sinh tham gia nhiều lớp |
| `classes` → `assignments` | 1–N | Một lớp có nhiều bộ luyện tập |
| `assignments` → `assignment_questions` | 1–N | Một bộ luyện tập có nhiều câu hỏi |
| `questions` → `answer_options` | 1–N | Một câu hỏi có nhiều lựa chọn |
| `users` → `sm2_progress` | 1–N | Một học sinh có nhiều bản ghi tiến độ |
| `questions` → `sm2_progress` | 1–N | Một câu hỏi được theo dõi cho nhiều học sinh |
| `users` → `quiz_sessions` | 1–N | Một học sinh có nhiều phiên làm bài |
| `quiz_sessions` → `session_answers` | 1–N | Một phiên có nhiều câu trả lời |
| `users` → `parent_student_links` | N–N | Phụ huynh – học sinh liên kết nhiều chiều |

---

## 2.5 Các query quan trọng

### Query 1: Lấy câu hỏi cần ôn hôm nay (SM-2 adaptive)

Dùng trong Bước 4 của luồng học sinh — SM-2 Engine gọi query này để lấy danh sách câu hỏi đến hạn ôn.

```sql
SELECT
    q.id,
    q.content,
    q.question_type,
    q.topic,
    q.difficulty,
    q.audio_url,
    sp.easiness_factor,
    sp.repetition_count,
    sp.next_review_date
FROM sm2_progress sp
JOIN questions q ON q.id = sp.question_id
WHERE
    sp.student_id       = :student_id
    AND sp.next_review_date <= CURRENT_DATE
    AND q.deleted_at    IS NULL
ORDER BY
    sp.next_review_date ASC,    -- ưu tiên câu quá hạn lâu nhất
    sp.easiness_factor  ASC     -- ưu tiên câu khó nhất (EF thấp nhất)
LIMIT :limit;                   -- thường là 20 câu/phiên
```

---

### Query 2: Dashboard giáo viên — tỷ lệ đúng theo chủ đề của cả lớp

```sql
SELECT
    q.topic,
    COUNT(sa.id)                                           AS total_answers,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)        AS correct_answers,
    ROUND(
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)
        * 100.0 / NULLIF(COUNT(sa.id), 0), 2
    )                                                      AS accuracy_pct
FROM class_members cm
JOIN quiz_sessions qs   ON qs.student_id    = cm.student_id
JOIN assignments   a    ON a.id             = qs.assignment_id
JOIN session_answers sa ON sa.session_id   = qs.id
JOIN questions     q    ON q.id            = sa.question_id
WHERE
    cm.class_id  = :class_id
    AND a.class_id = :class_id
    AND qs.status = 'completed'
GROUP BY q.topic
ORDER BY accuracy_pct ASC;     -- topic yếu nhất lên đầu
```

---

### Query 3: Báo cáo tiến độ học sinh cho phụ huynh

```sql
SELECT
    u.full_name                                  AS student_name,
    COUNT(DISTINCT qs.id)                        AS total_sessions,
    COUNT(sa.id)                                 AS total_answers,
    ROUND(
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)
        * 100.0 / NULLIF(COUNT(sa.id), 0), 2
    )                                            AS overall_accuracy,
    COUNT(DISTINCT CASE
        WHEN qs.started_at >= NOW() - INTERVAL '7 days'
        THEN DATE(qs.started_at)
    END)                                         AS active_days_this_week
FROM users u
JOIN parent_student_links psl ON psl.student_id = u.id
JOIN quiz_sessions qs         ON qs.student_id  = u.id
JOIN session_answers sa       ON sa.session_id  = qs.id
WHERE
    psl.parent_id = :parent_id
    AND psl.is_active = TRUE
    AND qs.status = 'completed'
GROUP BY u.id, u.full_name;
```

---

## 2.6 Chiến lược Redis Cache

| Key Pattern | Dữ liệu cache | TTL | Lý do |
|---|---|---|---|
| `session:{user_id}` | JWT payload + role | 1 giờ | Tránh decode JWT mọi request |
| `sm2:due:{student_id}:{date}` | Danh sách câu hỏi hôm nay | 15 phút | Query SM-2 tốn kém, cache per ngày |
| `leaderboard:{class_id}` | Top 10 học sinh theo điểm | 5 phút | Cập nhật thường xuyên, không cần realtime |
| `class:{class_id}:stats` | Thống kê tổng hợp lớp | 15 phút | Dashboard giáo viên đọc nhiều |
| `user:{user_id}:profile` | Thông tin cơ bản user | 30 phút | Tránh JOIN users mọi request |

**Chiến lược invalidation:**
- Cache `sm2:due` bị xóa ngay sau khi học sinh hoàn thành phiên làm bài.
- Cache `leaderboard` và `class:stats` bị xóa sau mỗi phiên làm bài hoàn thành của bất kỳ học sinh nào trong lớp.

---

## 2.7 Yêu cầu phi chức năng về dữ liệu

| Yêu cầu | Giải pháp |
|---|---|
| Tính toàn vẹn dữ liệu | Foreign key constraints + CHECK constraints trên mọi bảng |
| Hiệu năng đọc | Index có chủ đích, Redis cache cho query phức tạp |
| Hiệu năng ghi | Batch update SM-2 sau mỗi phiên thay vì sau mỗi câu |
| Backup | PostgreSQL WAL + daily pg_dump lên Firebase Storage |
| Migration | Sử dụng Prisma Migrate / Flyway để quản lý schema version |

---

## 2.8 Tổng kết Phần 2

Thiết kế cơ sở dữ liệu của hệ thống xoay quanh **bảng `sm2_progress`** — đây là trái tim của tính năng adaptive learning. Mọi phiên làm bài (`quiz_sessions`) → câu trả lời (`session_answers`) → đều phản hồi ngược lại để cập nhật `sm2_progress`, tạo thành vòng lặp học tập khép kín.

Điểm mạnh của thiết kế:

- **Tách biệt rõ ràng** giữa dữ liệu nội dung (questions, answer_options) và dữ liệu hành vi học tập (sm2_progress, session_answers).
- **Hỗ trợ đa vai trò** từ cùng một schema — teacher, student, parent đều có đủ dữ liệu phục vụ màn hình của mình.
- **Dễ mở rộng** — thêm loại câu hỏi mới chỉ cần thêm giá trị vào `CHECK` constraint của `question_type`.

---

> **Phần tiếp theo:** Phần 3 — Thiết kế API (REST API Endpoints, request/response schema, authentication flow).
