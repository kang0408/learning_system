# Phần 4: Thiết Kế Giao Diện UI/UX

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 4 / N — Thiết kế Giao diện Người dùng

---

## 4.1 Tổng quan triết lý thiết kế

### 4.1.1 Nguyên tắc cốt lõi

Hệ thống phục vụ 3 nhóm người dùng với nhu cầu khác nhau hoàn toàn. Thiết kế tuân theo 5 nguyên tắc xuyên suốt:

| Nguyên tắc | Áp dụng |
|---|---|
| **Clarity first** | Mỗi màn hình truyền đúng một thông điệp chính. Người dùng không cần đọc hướng dẫn để hiểu phải làm gì tiếp theo. |
| **Progressive disclosure** | Chỉ hiển thị thông tin cần thiết tại thời điểm đó. Thông tin phức tạp (SM-2 score, EF) ẩn theo mặc định, có thể mở rộng. |
| **Feedback tức thì** | Mọi hành động đều có phản hồi trong vòng 100ms (loading state, animation, toast). |
| **Mobile-first** | Thiết kế từ màn hình nhỏ nhất (375px) rồi mở rộng lên desktop. Học sinh chủ yếu dùng điện thoại. |
| **Accessibility** | Đạt chuẩn WCAG 2.1 AA: tỉ lệ tương phản ≥ 4.5:1, font size tối thiểu 16px, touch target ≥ 44×44px. Không sử dụng emoji trong UI |


### 4.1.2 Design system

**Bộ màu chính:**

```
Primary     #4F46E5  (Indigo 600)   — CTA, active state, progress
Success     #10B981  (Emerald 500)  — Đúng, hoàn thành, streak
Warning     #F59E0B  (Amber 500)    — Sắp đến hạn, cảnh báo nhẹ
Danger      #EF4444  (Red 500)      — Sai, quá hạn, lỗi
Neutral     #6B7280  (Gray 500)     — Text phụ, border, placeholder
Background  #F9FAFB  (Gray 50)      — Nền trang
Surface     #FFFFFF                  — Card, modal, input
```

**Typography:**

```
Font family:   "DM Sans" (body) + "DM Serif Display" (heading quan trọng)
Heading 1:     32px / 700 / line-height 1.2
Heading 2:     24px / 600 / line-height 1.3
Heading 3:     18px / 600 / line-height 1.4
Body:          16px / 400 / line-height 1.6
Small:         14px / 400 / line-height 1.5
Caption:       12px / 500 / line-height 1.4
```

**Spacing scale (8px base):**

```
4px   xs    — khoảng cách icon/text nội dòng
8px   sm    — padding nhỏ, gap giữa các item nhỏ
16px  md    — padding card, gap section nhỏ
24px  lg    — margin section, padding modal
32px  xl    — khoảng cách section lớn
48px  2xl   — padding page top/bottom
```

**Border radius:**

```
4px   — input, badge nhỏ
8px   — button, card nhỏ
12px  — card thông thường
16px  — modal, bottom sheet
24px  — card hero, quiz card
```

**Shadow:**

```
sm:   0 1px 3px rgba(0,0,0,0.08)  — input, chip
md:   0 4px 16px rgba(0,0,0,0.10) — card, dropdown
lg:   0 8px 32px rgba(0,0,0,0.14) — modal, floating action button
```

---

## 4.2 Kiến trúc điều hướng

### 4.2.1 Sơ đồ màn hình tổng thể

```
[Splash Screen]
       │
[Onboarding / Login / Register]
       │
       ├── [Student App]
       │      ├── Home (Dashboard cá nhân)
       │      ├── My Classes
       │      │      └── Class Detail
       │      │             └── Assignment Detail
       │      ├── Quiz Session (full-screen)
       │      │      └── Session Result
       │      ├── Progress
       │      │      ├── Overview
       │      │      ├── Weak Topics
       │      │      └── Calendar
       │      └── Profile
       │
       ├── [Teacher App]
       │      ├── Home (Dashboard lớp)
       │      ├── My Classes
       │      │      ├── Class Detail
       │      │      │      ├── Members
       │      │      │      └── Analytics
       │      │      └── Create Class
       │      ├── Question Bank
       │      │      ├── Question List
       │      │      ├── Create / Edit Question
       │      │      └── Import CSV
       │      ├── Assignments
       │      │      ├── Assignment List
       │      │      ├── Create Assignment
       │      │      └── Assignment Analytics
       │      └── Profile
       │
       └── [Parent App]
              ├── Home (Tóm tắt các con)
              ├── Child Detail
              │      ├── Progress Overview
              │      ├── Weekly Report
              │      └── Weak Topics
              └── Profile
```

### 4.2.2 Navigation pattern

| Vai trò | Pattern | Lý do |
|---|---|---|
| Student (mobile) | Bottom Tab Bar (4 tab) | Thao tác một tay, phổ biến với học sinh |
| Teacher (web + mobile) | Side Navigation (web) + Bottom Tab (mobile) | Nhiều tính năng hơn, cần sidebar trên desktop |
| Parent (mobile) | Bottom Tab Bar (3 tab) | Ít tính năng, đơn giản nhất |

---

## 4.3 Màn hình Student

### 4.3.1 Home — Dashboard học sinh

**Mục tiêu:** Trả lời ngay câu hỏi "Hôm nay tôi cần học gì?" trong vòng 2 giây mở app.

**Layout (mobile, 375px):**

```
┌─────────────────────────────┐
│  Chào buổi sáng, An! 👋     │  ← Greeting động theo giờ
│  Streak: 🔥 5 ngày           │
├─────────────────────────────┤
│  [Card hero — CTA chính]    │
│                             │
│   8 câu hỏi cần ôn hôm nay │  ← Số lấy từ sm2_progress
│   Ôn tập • ~10 phút         │
│                             │
│   [    BẮT ĐẦU HỌC    ]    │  ← Primary button, full-width
└─────────────────────────────┘
│  Bài được giao              │
│  ┌──────────┐ ┌──────────┐  │
│  │Unit 3 📚 │ │Unit 4 📝 │  │  ← Horizontal scroll cards
│  │Còn 3 ngày│ │Quá hạn!  │  │
│  └──────────┘ └──────────┘  │
├─────────────────────────────┤
│  Tiến độ tuần này           │
│  M  T  W  T  F  S  S        │
│  ●  ●  ●  ○  ○  ○  ○       │  ← Dot calendar (● = đã học)
│  Độ chính xác: 74%          │
└─────────────────────────────┘
```

**Trạng thái đặc biệt:**

- **Không có gì để ôn hôm nay:** Hiển thị empty state vui → "Tuyệt vời! Hôm nay bạn đã ôn hết rồi 🎉 Quay lại vào ngày mai."
- **Streak bị gãy:** Banner màu cam nhẹ → "Streak của bạn đã bị gãy. Học hôm nay để bắt đầu streak mới!"
- **Có bài quá hạn:** Badge đỏ trên tab "Classes".

---

### 4.3.2 Quiz Session — Màn hình làm bài

Đây là màn hình quan trọng nhất — học sinh tương tác với nó nhiều nhất. Thiết kế **full-screen, không có distraction**.

**Phase 1 — Hiển thị câu hỏi:**

```
┌─────────────────────────────┐
│  ←    Câu 3/15    [✕]       │  ← Nút X confirm trước khi thoát
├─────────────────────────────┤
│  ████████████░░░░░░░░  20% │  ← Progress bar animate smooth
├─────────────────────────────┤
│                             │
│  Grammar - Nouns     ⏱ 30s │  ← Topic badge + Timer (nếu có)
│                             │
│  What is the plural form    │
│  of "child"?                │  ← Question content, 20px, bold
│                             │
│  [🔊 Nghe phát âm]          │  ← Hiển thị nếu có audio_url
│                             │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │  A.  childs         │   │  ← Option card
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  B.  childes        │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  C.  children       │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  D.  childrens      │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Phase 2 — Sau khi chọn đáp án:**

```
┌─────────────────────────────┐
│  ←    Câu 3/15    [✕]       │
├─────────────────────────────┤
│  ████████████░░░░░░░░  20% │
├─────────────────────────────┤
│  ✅ Chính xác!              │  ← Feedback panel animate từ dưới lên
│  ─────────────────────────  │
│  ┌─────────────────────┐   │
│  │  A.  childs         │   │  ← Màu trắng (không chọn)
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  B.  childes        │   │  ← Màu trắng
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │✓ C.  children       │   │  ← Xanh lá (đúng)
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  D.  childrens      │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  💡 "child" là danh từ bất  │
│  quy tắc, số nhiều là       │
│  "children".                │  ← Explanation (nếu có)
│                             │
│  [      TIẾP THEO →     ]  │  ← Button để sang câu kế
└─────────────────────────────┘
```

**Màu sắc feedback:**

| Trạng thái | Màu option | Icon | Banner |
|---|---|---|---|
| Chưa chọn | Trắng + border xám | — | — |
| Hover/Press | Indigo 50 + border Indigo | — | — |
| Đúng | Emerald 50 + border Emerald | ✓ | Xanh "Chính xác!" |
| Sai | Red 50 + border Red | ✗ | Đỏ "Chưa đúng rồi!" + hiển thị đáp án đúng |

**Animation:**

- Chọn đáp án: option được chọn scale 0.97 → 1.0 (50ms) để có cảm giác "click vật lý"
- Feedback panel: slide-up từ bottom (200ms ease-out)
- Chuyển câu: fade-out + slide-left (150ms), câu mới fade-in + slide-in-right

---

### 4.3.3 Session Result — Kết quả phiên làm bài

```
┌─────────────────────────────┐
│                             │
│       🎉  80%               │  ← Score lớn, animate count-up
│    Hoàn thành tốt!          │
│                             │
│  12/15 câu đúng • 12 phút  │
├─────────────────────────────┤
│  Theo chủ đề                │
│  Grammar - Nouns    90% ██▓ │
│  Grammar - Tenses   67% █▓░ │  ← Mini bar chart
│  Vocabulary - Home 100% ███ │
├─────────────────────────────┤
│  ⚠️  Cần ôn thêm            │
│  Grammar - Tenses           │  ← Highlight điểm yếu
├─────────────────────────────┤
│  📅 Lần ôn tiếp: ngày mai  │  ← next_review_date từ SM-2
├─────────────────────────────┤
│  [ XEM CHI TIẾT ]           │
│  [ VỀ TRANG CHỦ ]           │
└─────────────────────────────┘
```

---

### 4.3.4 Progress — Màn hình tiến độ học sinh

**Tab 1: Tổng quan**

```
┌─────────────────────────────┐
│  Tiến độ học tập            │
├─────────────────────────────┤
│  ┌────────┐ ┌────────┐      │
│  │  360   │ │  74%   │      │
│  │ câu đã │ │ chính  │      │
│  │  làm   │ │  xác   │      │
│  └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐      │
│  │  45    │ │ 🔥 5   │      │
│  │  câu   │ │  ngày  │      │
│  │ thành  │ │ streak │      │
│  │ thạo   │ │        │      │
│  └────────┘ └────────┘      │
├─────────────────────────────┤
│  Hoạt động 7 ngày qua       │
│  [Line chart độ chính xác]  │
└─────────────────────────────┘
```

**Tab 2: Điểm yếu**

Danh sách topic sắp xếp theo độ chính xác tăng dần (yếu nhất lên đầu):

```
┌─────────────────────────────┐
│  Grammar - Tenses    55%    │
│  ████████░░░░░░░░░░ Ôn ngay │
├─────────────────────────────┤
│  Pronunciation       61%    │
│  ██████████░░░░░░░░         │
├─────────────────────────────┤
│  Vocabulary - Food   88%    │
│  ████████████████░░ Tốt     │
└─────────────────────────────┘
```

**Tab 3: Lịch học**

Calendar view tháng, mỗi ngày hiển thị dot màu theo độ chính xác:

```
Xanh lá   ≥ 80% chính xác
Vàng      60–79%
Đỏ        < 60%
Xám       Không học
```

---

## 4.4 Màn hình Teacher

### 4.4.1 Home — Dashboard giáo viên

```
┌─────────────────────────────────────────────────┐
│  Xin chào, cô Lan                               │
│  Thứ 2, 06/10/2025                              │
├──────────────┬──────────────┬──────────────────┤
│ 35           │ 28           │ 68.5%            │
│ Học sinh     │ Hoạt động    │ Độ chính xác     │
│ tổng cộng    │ tuần này     │ trung bình       │
├─────────────────────────────────────────────────┤
│  Lớp cần chú ý                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚠️ Tiếng Anh 8A  •  Grammar - Tenses    │   │
│  │ Cả lớp đang yếu chủ đề này (55%)        │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Bài sắp đến hạn                                │
│  Ôn tập Unit 3  •  Còn 2 ngày  •  28/35 nộp   │
│  Ôn tập Unit 4  •  Còn 5 ngày  •  10/35 nộp   │
└─────────────────────────────────────────────────┘
```

---

### 4.4.2 Class Analytics — Dashboard lớp học

Màn hình này là điểm mạnh nhất để thuyết trình hội đồng vì dữ liệu thay đổi real-time.

**Layout desktop (2 cột):**

```
┌───────────────────────────────────────────────────────┐
│  Tiếng Anh 8A  •  35 học sinh  •  Mã: ENG8A2          │
│  [+ Tạo bài]  [Quản lý HS]  [Xuất báo cáo]           │
├────────────────────────┬──────────────────────────────┤
│  Độ chính xác theo     │  Bảng xếp hạng tuần này      │
│  chủ đề                │                               │
│                        │  1. 🥇 Nguyễn Văn An   92%   │
│  Grammar - Tenses  55% │  2. 🥈 Trần Thị Bình   88%   │
│  ████████░░░░          │  3. 🥉 Lê Minh Cường   85%   │
│                        │  4.    Phạm Thu Hà     81%   │
│  Vocabulary - Home 82% │  5.    ...                    │
│  ███████████████░      │                               │
│                        │  [Xem tất cả]                 │
│  Pronunciation  61%    │                               │
│  ██████████░░░░        │                               │
├────────────────────────┴──────────────────────────────┤
│  Danh sách học sinh                                     │
│  ┌──────────────┬──────────┬──────────┬─────────────┐ │
│  │ Họ tên       │ Buổi/tuần│ Chính xác│ Điểm yếu    │ │
│  ├──────────────┼──────────┼──────────┼─────────────┤ │
│  │ Nguyễn Văn An│ 5 buổi   │ 92%      │ Pronunciation│ │
│  │ Trần Thị Bình│ 4 buổi   │ 88%      │ Gr. Tenses  │ │
│  │ ...          │ ...      │ ...      │ ...          │ │
│  └──────────────┴──────────┴──────────┴─────────────┘ │
└───────────────────────────────────────────────────────┘
```

---

### 4.4.3 Create Question — Tạo câu hỏi

Form tạo câu hỏi được thiết kế để giáo viên có thể nhập nhanh, hỗ trợ keyboard shortcut.

```
┌─────────────────────────────────────────────────┐
│  Tạo câu hỏi mới                                │
├─────────────────────────────────────────────────┤
│  Dạng câu hỏi                                   │
│  [Trắc nghiệm ●] [Đúng/Sai] [Điền chỗ trống]   │
├─────────────────────────────────────────────────┤
│  Nội dung câu hỏi *                             │
│  ┌─────────────────────────────────────────┐   │
│  │ What is the plural form of "child"?     │   │
│  └─────────────────────────────────────────┘   │
│  [🔊 Thêm audio]  [🖼 Thêm ảnh]               │
├─────────────────────────────────────────────────┤
│  Đáp án (chọn đáp án đúng bằng cách tick ☑)    │
│                                                 │
│  ☐  ┌──────────────────────┐  [🗑]             │
│     │ childs               │                   │
│     └──────────────────────┘                   │
│  ☑  ┌──────────────────────┐  [🗑]             │  ← Tick = đáp án đúng
│     │ children             │                   │
│     └──────────────────────┘                   │
│  ☐  ┌──────────────────────┐  [🗑]             │
│     │ childes              │                   │
│     └──────────────────────┘                   │
│  [+ Thêm đáp án]                               │
├─────────────────────────────────────────────────┤
│  Chủ đề *          Độ khó                       │
│  [Grammar - Nouns] [★★☆☆☆ — Dễ          ▼]    │
├─────────────────────────────────────────────────┤
│  Giải thích (không bắt buộc)                    │
│  ┌─────────────────────────────────────────┐   │
│  │ "child" là danh từ bất quy tắc...       │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│              [Huỷ]  [Lưu câu hỏi]              │
└─────────────────────────────────────────────────┘
```

**UX chi tiết:**

- Khi chọn dạng "Đúng/Sai": form tự động rút gọn còn 2 đáp án cố định "Đúng" và "Sai".
- Khi chọn dạng "Điền chỗ trống": đáp án chuyển thành input nhập đáp án chuẩn + danh sách đáp án chấp nhận được (alias).
- Độ khó dùng star rating 1–5, hover hiển thị label: 1=Rất dễ, 2=Dễ, 3=Trung bình, 4=Khó, 5=Rất khó.
- Autosave draft mỗi 30 giây — giáo viên không mất dữ liệu nếu đóng tab nhầm.

---

### 4.4.4 Create Assignment — Tạo bộ luyện tập

**Thiết kế theo bước (wizard pattern) — 3 bước:**

```
[Bước 1: Thông tin] ──● [Bước 2: Chọn câu hỏi] ──○ [Bước 3: Cài đặt]
```

**Bước 1 — Thông tin cơ bản:**

```
Tên bộ luyện tập *    [Ôn tập từ vựng Unit 3         ]
Mô tả                 [Các từ vựng chủ đề gia đình... ]
Lớp *                 [Tiếng Anh 8A               ▼  ]
Chế độ *              [● Adaptive (SM-2)]  [○ Cố định ]
```

**Bước 2 — Chọn câu hỏi:**

Panel 2 cột: bên trái là bộ lọc + danh sách câu hỏi, bên phải là giỏ câu đã chọn.

```
┌──────────────────────┬───────────────────────┐
│  Bộ lọc              │  Đã chọn (12 câu)      │
│  Topic: [Grammar ▼]  │                         │
│  Độ khó: [1-3    ▼]  │  1. What is the plural │
│  [Tìm kiếm...]       │     form of "child"?   │
│  ─────────────────   │  2. Choose the correct │
│  ☐ What is the...    │     ...                │
│  ☑ Choose the...     │  [↑↓ Kéo để sắp xếp]  │
│  ☐ Fill in the...    │                         │
│  ...                 │                         │
└──────────────────────┴───────────────────────┘
```

**Bước 3 — Cài đặt:**

```
Deadline             [15/10/2025  23:59     📅]
Số lần thử tối đa    [3 lần              ▼  ]
Giới hạn thời gian   [30 phút            ▼  ]
                     [□ Không giới hạn      ]

[← Quay lại]               [Lưu nháp] [Publish ngay]
```

---

## 4.5 Màn hình Parent

### 4.5.1 Home — Tóm tắt các con

```
┌─────────────────────────────┐
│  Tiến độ học tập các con    │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │  👦 Nguyễn Văn An    │   │
│  │  Tiếng Anh 8A        │   │
│  │                      │   │
│  │  5 buổi tuần này     │   │
│  │  Độ chính xác: 74%   │   │
│  │  🔥 Streak: 5 ngày   │   │
│  │                      │   │
│  │  Điểm yếu:           │   │
│  │  Grammar - Tenses ⚠️ │   │
│  │                      │   │
│  │  [Xem báo cáo chi tiết]  │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### 4.5.2 Weekly Report — Báo cáo tuần

Được thiết kế để phụ huynh đọc nhanh trong 30 giây, không cần hiểu kỹ thuật.

```
┌─────────────────────────────┐
│  Báo cáo tuần              │
│  30/09 – 06/10/2025         │
├─────────────────────────────┤
│  ✅ An đã học 5/7 ngày     │  ← Câu tóm tắt plain language
│  📈 Cải thiện so với tuần  │
│     trước: +8%              │
├─────────────────────────────┤
│  Hoạt động theo ngày        │
│  T2 ●  T3 ●  T4 ●          │
│  T5 ●  T6 ●  T7 ○  CN ○   │
├─────────────────────────────┤
│  Cần chú ý                  │
│  ⚠️ Grammar - Tenses: 55%  │
│  Con đang gặp khó ở phần    │
│  thì động từ. Giáo viên đã  │
│  giao bài ôn tập thêm.      │
├─────────────────────────────┤
│  Bài tập sắp đến hạn        │
│  • Ôn tập Unit 3 • 3 ngày  │
└─────────────────────────────┘
```

**Nguyên tắc viết nội dung cho phụ huynh:**

- Dùng ngôn ngữ đời thường, không dùng thuật ngữ kỹ thuật (không viết "EF", "interval", "SM-2").
- Mỗi chỉ số đều có câu giải thích ý nghĩa.
- Tập trung vào xu hướng (tốt hơn / xấu hơn tuần trước) thay vì số tuyệt đối.

---

## 4.6 Các component dùng chung

### 4.6.1 Empty State

Mỗi trạng thái trống đều có: illustration nhỏ + tiêu đề + mô tả + CTA rõ ràng.

| Màn hình | Tiêu đề | CTA |
|---|---|---|
| Chưa có lớp (học sinh) | "Chưa tham gia lớp nào" | "Nhập mã lớp" |
| Không có bài hôm nay | "Hôm nay đã ôn xong!" | "Xem tiến độ" |
| Ngân hàng câu hỏi trống | "Chưa có câu hỏi nào" | "Tạo câu hỏi đầu tiên" |

### 4.6.2 Loading State

- **Skeleton screen** thay vì spinner cho tất cả danh sách và card — tránh layout shift.
- **Spinner** chỉ dùng cho action button (submit, publish) khi đang chờ API.
- Timeout: nếu load quá 8 giây → hiển thị thông báo lỗi + nút "Thử lại".

### 4.6.3 Toast Notification

Vị trí: top-center trên mobile, bottom-right trên desktop.

| Loại | Màu | Ví dụ |
|---|---|---|
| Success | Xanh lá | "Câu hỏi đã được lưu" |
| Error | Đỏ | "Không thể kết nối. Kiểm tra internet." |
| Warning | Vàng | "Bài sắp đến hạn trong 1 ngày" |
| Info | Xanh dương | "Giáo viên vừa giao bài mới" |

Tự động ẩn sau 4 giây. Có nút ✕ để đóng thủ công.

### 4.6.4 Confirmation Dialog

Dùng cho các hành động không thể hoàn tác: xóa câu hỏi, xóa lớp, hủy phiên làm bài.

```
┌─────────────────────────────┐
│  Xác nhận xóa câu hỏi?     │
│                             │
│  Hành động này không thể   │
│  hoàn tác. Câu hỏi sẽ bị  │
│  xóa khỏi tất cả bài tập   │
│  đang dùng nó.              │
│                             │
│  [  Huỷ  ]  [ Xóa câu hỏi ]│
│               ← màu đỏ      │
└─────────────────────────────┘
```

---

## 4.7 Responsive Design

| Breakpoint | Kích thước | Áp dụng |
|---|---|---|
| Mobile S | 320–374px | Layout 1 cột, font giảm 1 bậc |
| Mobile M | 375–767px | Layout 1 cột chuẩn — thiết kế primary |
| Tablet | 768–1023px | 2 cột, bottom tab → side nav |
| Desktop | 1024px+ | Full desktop layout, side nav cố định |

**Quiz Session:** Luôn full-screen bất kể breakpoint — ẩn toàn bộ navigation trong khi làm bài.

---

## 4.8 Accessibility

| Tiêu chí | Thực hiện |
|---|---|
| Color contrast | Tỉ lệ ≥ 4.5:1 cho text, ≥ 3:1 cho UI component |
| Font size | Tối thiểu 16px cho body, 14px cho caption |
| Touch target | Tối thiểu 44×44px cho mọi interactive element |
| Keyboard navigation | Tab order hợp lý, focus ring rõ ràng |
| Screen reader | `aria-label` cho icon button, `role` cho custom component |
| Error message | Lỗi form không chỉ dùng màu đỏ mà còn có text + icon |
| Reduced motion | `@media (prefers-reduced-motion)` tắt animation với người dùng nhạy cảm |

---

## 4.9 Micro-interaction quan trọng

| Hành động | Animation | Mục đích |
|---|---|---|
| Chọn đáp án | Scale 0.97 → 1.0 (50ms) | Cảm giác "nhấn vật lý" |
| Đáp án đúng | Confetti nhỏ (500ms) | Tăng cảm giác thành tích |
| Streak tăng | Số count-up + 🔥 pulse | Khuyến khích duy trì thói quen |
| Publish bài | Button spinner → checkmark | Xác nhận action thành công |
| Score kết quả | Count-up từ 0 → điểm thực | Tạo kịch tính, ăn mừng |
| Câu chuyển tiếp | Slide-left (150ms) | Cảm giác tiến về phía trước |

---

## 4.10 Tổng kết Phần 4

Thiết kế UI/UX của hệ thống được xây dựng xung quanh một nguyên tắc duy nhất: **mỗi vai trò chỉ thấy đúng thứ họ cần, đúng lúc họ cần**.

- **Học sinh** mở app → thấy ngay "8 câu cần ôn hôm nay" → bấm một nút là vào bài. Không cần menu, không cần tìm kiếm.
- **Giáo viên** mở dashboard → thấy ngay lớp nào đang yếu chủ đề gì → hành động ngay (giao thêm bài ôn). Dữ liệu biến thành hành động.
- **Phụ huynh** mở báo cáo → đọc câu tiếng Việt đơn giản → hiểu con đang học tốt hay cần hỗ trợ thêm. Không thuật ngữ, không số liệu thô.

Ba giao diện khác nhau, nhưng cùng phục vụ một mục tiêu: đưa học sinh ôn đúng thứ, đúng lúc, nhờ sức mạnh của SM-2 Adaptive Engine.

---

> **Phần tiếp theo:** Phần 5 — Cài đặt thuật toán SM-2 (chi tiết implementation, pseudocode, test cases).
