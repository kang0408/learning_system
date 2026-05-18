# Phần 5: Cấu Trúc Thư Mục Dự Án

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 5 / N — Cấu trúc thư mục & tổ chức source code

---

## 5.1 Tổng quan kiến trúc Monorepo

Dự án được tổ chức theo mô hình **Monorepo** — toàn bộ frontend, backend và các package dùng chung nằm trong một repository duy nhất. Công cụ quản lý: **npm Workspaces**.

**Lý do chọn Monorepo:**

| Lợi ích | Giải thích |
|---|---|
| Chia sẻ kiểu dữ liệu | TypeScript types (User, Question, SM2Progress...) viết một lần, dùng ở cả frontend lẫn backend |
| Đồng bộ version | Một lần `npm install` là đủ cho toàn dự án |
| Atomic commit | Thay đổi API + UI trong cùng một commit, không bao giờ lệch nhau |
| CI/CD đơn giản | Một pipeline GitHub Actions quản lý toàn bộ |

---

## 5.2 Cấu trúc thư mục gốc

```
adaptive-lang/                          ← Root của monorepo
│
├── apps/                               ← Các ứng dụng chạy được
│   ├── web/                            ← Frontend React.js (web app)
│   ├── mobile/                         ← Frontend React Native (mobile app)
│   └── api/                            ← Backend Node.js + Express
│
├── packages/                           ← Package dùng chung giữa các app
│   ├── types/                          ← TypeScript interfaces & types
│   ├── utils/                          ← Hàm tiện ích dùng chung
│   └── sm2-engine/                     ← Thuật toán SM-2 (core logic)
│
├── docs/                               ← Tài liệu dự án
│   ├── api/                            ← API documentation (OpenAPI/Swagger)
│   ├── database/                       ← ERD, migration notes
│   └── deployment/                     ← Hướng dẫn triển khai
│
├── scripts/                            ← Script tiện ích cho dev
│   ├── seed.ts                         ← Seed dữ liệu mẫu vào DB
│   ├── generate-types.ts               ← Sinh TypeScript types từ DB schema
│   └── check-env.ts                    ← Kiểm tra biến môi trường trước khi chạy
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      ← CI: lint + test khi push/PR
│       └── deploy.yml                  ← CD: deploy khi merge vào main
│
├── docker-compose.yml                  ← PostgreSQL + Redis cho local dev
├── docker-compose.prod.yml             ← Production docker compose
├── .env.example                        ← Mẫu biến môi trường (commit vào git)
├── .gitignore
├── package.json                        ← Workspace root config
├── tsconfig.base.json                  ← TypeScript config dùng chung
└── README.md
```

---

## 5.3 Backend — `apps/api/`

Backend theo mô hình **MVC + Service Layer + Repository Pattern**.

```
apps/api/
│
├── src/
│   │
│   ├── config/                         ← Cấu hình toàn cục
│   │   ├── database.ts                 ← Khởi tạo Prisma client
│   │   ├── redis.ts                    ← Khởi tạo Redis client
│   │   ├── firebase.ts                 ← Firebase Admin SDK
│   │   ├── env.ts                      ← Validate & export env vars (zod)
│   │   └── constants.ts                ← Hằng số: JWT_EXPIRY, RATE_LIMIT...
│   │
│   ├── modules/                        ← Tổ chức theo feature/domain
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts      ← Nhận request, gọi service, trả response
│   │   │   ├── auth.service.ts         ← Business logic: login, register, refresh
│   │   │   ├── auth.repository.ts      ← Query DB liên quan đến auth
│   │   │   ├── auth.routes.ts          ← Định nghĩa routes của module
│   │   │   ├── auth.validator.ts       ← Zod schema validate request body
│   │   │   └── auth.types.ts           ← Types riêng của module auth
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.validator.ts
│   │   │
│   │   ├── classes/
│   │   │   ├── classes.controller.ts
│   │   │   ├── classes.service.ts
│   │   │   ├── classes.repository.ts
│   │   │   ├── classes.routes.ts
│   │   │   └── classes.validator.ts
│   │   │
│   │   ├── questions/
│   │   │   ├── questions.controller.ts
│   │   │   ├── questions.service.ts
│   │   │   ├── questions.repository.ts
│   │   │   ├── questions.routes.ts
│   │   │   ├── questions.validator.ts
│   │   │   └── questions.importer.ts   ← Logic xử lý import CSV
│   │   │
│   │   ├── assignments/
│   │   │   ├── assignments.controller.ts
│   │   │   ├── assignments.service.ts
│   │   │   ├── assignments.repository.ts
│   │   │   ├── assignments.routes.ts
│   │   │   └── assignments.validator.ts
│   │   │
│   │   ├── sessions/                   ← Quiz sessions — module phức tạp nhất
│   │   │   ├── sessions.controller.ts
│   │   │   ├── sessions.service.ts     ← Orchestrate SM-2, session logic
│   │   │   ├── sessions.repository.ts
│   │   │   ├── sessions.routes.ts
│   │   │   └── sessions.validator.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts    ← Tổng hợp dữ liệu, tính metrics
│   │   │   ├── analytics.repository.ts ← Query phức tạp, JOIN nhiều bảng
│   │   │   └── analytics.routes.ts
│   │   │
│   │   └── notifications/
│   │       ├── notifications.service.ts ← Gửi email (Nodemailer), push
│   │       └── notifications.templates/ ← HTML templates email
│   │           ├── weekly-report.html
│   │           └── assignment-due.html
│   │
│   ├── middleware/                     ← Express middleware
│   │   ├── authenticate.ts             ← Verify JWT, gắn req.user
│   │   ├── authorize.ts                ← RBAC: kiểm tra role
│   │   ├── validate.ts                 ← Chạy Zod validator, trả 422 nếu lỗi
│   │   ├── rateLimiter.ts              ← express-rate-limit + Redis store
│   │   ├── errorHandler.ts             ← Global error handler, format lỗi chuẩn
│   │   ├── requestLogger.ts            ← Morgan logger
│   │   └── notFound.ts                 ← 404 handler
│   │
│   ├── shared/                         ← Code dùng chung trong backend
│   │   ├── errors/
│   │   │   ├── AppError.ts             ← Base class cho custom errors
│   │   │   ├── NotFoundError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   └── ValidationError.ts
│   │   ├── helpers/
│   │   │   ├── response.ts             ← Helper tạo response chuẩn {success, data, meta}
│   │   │   ├── pagination.ts           ← Parse query params phân trang
│   │   │   ├── hash.ts                 ← bcrypt wrap
│   │   │   └── jwt.ts                  ← sign/verify JWT wrap
│   │   └── cache/
│   │       ├── cache.service.ts        ← Wrap Redis get/set/del với TTL
│   │       └── cache.keys.ts           ← Định nghĩa tập trung tất cả Redis key pattern
│   │
│   ├── jobs/                           ← Background jobs (cron)
│   │   ├── scheduler.ts                ← Khởi tạo node-cron
│   │   ├── sendWeeklyReport.job.ts     ← Gửi báo cáo tuần mỗi Chủ nhật 8h
│   │   └── cleanExpiredSessions.job.ts ← Dọn quiz_sessions abandoned > 24h
│   │
│   ├── app.ts                          ← Khởi tạo Express app, gắn middleware, routes
│   └── server.ts                       ← Entry point: listen port, connect DB
│
├── prisma/
│   ├── schema.prisma                   ← Prisma schema — định nghĩa toàn bộ DB model
│   ├── migrations/                     ← Auto-generated migration files
│   │   ├── 20250901000000_init/
│   │   ├── 20250905000000_add_sm2/
│   │   └── ...
│   └── seed.ts                         ← Seed dữ liệu mẫu (link từ scripts/)
│
├── tests/
│   ├── unit/                           ← Unit test cho service & helper
│   │   ├── auth.service.test.ts
│   │   ├── sessions.service.test.ts
│   │   └── sm2.integration.test.ts     ← Test đặc biệt cho SM-2 logic
│   ├── integration/                    ← Integration test với DB thật (test DB)
│   │   ├── auth.routes.test.ts
│   │   └── sessions.routes.test.ts
│   └── fixtures/                       ← Dữ liệu mẫu dùng trong test
│       ├── users.fixture.ts
│       └── questions.fixture.ts
│
├── .env                                ← Biến môi trường local (không commit)
├── .env.test                           ← Biến môi trường cho test
├── jest.config.ts
├── tsconfig.json                       ← Extends tsconfig.base.json
├── Dockerfile
└── package.json
```

---

## 5.4 Frontend Web — `apps/web/`

Frontend React.js, tổ chức theo **Feature-based architecture**.

```
apps/web/
│
├── src/
│   │
│   ├── app/                            ← App-level setup
│   │   ├── App.tsx                     ← Root component, router, providers
│   │   ├── router.tsx                  ← React Router v6 route definitions
│   │   ├── queryClient.ts              ← TanStack Query client config
│   │   └── store.ts                    ← Zustand global store (auth state...)
│   │
│   ├── features/                       ← Tổ chức theo feature — cấu trúc chính
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.ts         ← Wrap TanStack mutation + toast
│   │   │   │   └── useAuthStore.ts     ← Zustand slice cho auth
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts         ← Axios calls cho /auth/*
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       └── RegisterPage.tsx
│   │   │
│   │   ├── classes/
│   │   │   ├── components/
│   │   │   │   ├── ClassCard.tsx
│   │   │   │   ├── ClassMembersTable.tsx
│   │   │   │   ├── JoinClassModal.tsx
│   │   │   │   └── CreateClassForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useClasses.ts
│   │   │   │   └── useClassMembers.ts
│   │   │   ├── api/
│   │   │   │   └── classes.api.ts
│   │   │   └── pages/
│   │   │       ├── ClassListPage.tsx
│   │   │       └── ClassDetailPage.tsx
│   │   │
│   │   ├── questions/
│   │   │   ├── components/
│   │   │   │   ├── QuestionCard.tsx
│   │   │   │   ├── QuestionForm.tsx    ← Dùng chung cho tạo và sửa
│   │   │   │   ├── AnswerOptionsList.tsx
│   │   │   │   ├── DifficultyPicker.tsx
│   │   │   │   └── ImportCSVModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useQuestions.ts
│   │   │   │   └── useQuestionForm.ts
│   │   │   ├── api/
│   │   │   │   └── questions.api.ts
│   │   │   └── pages/
│   │   │       ├── QuestionBankPage.tsx
│   │   │       └── CreateQuestionPage.tsx
│   │   │
│   │   ├── assignments/
│   │   │   ├── components/
│   │   │   │   ├── AssignmentCard.tsx
│   │   │   │   ├── AssignmentWizard/   ← Wizard 3 bước
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── Step1Info.tsx
│   │   │   │   │   ├── Step2Questions.tsx
│   │   │   │   │   └── Step3Settings.tsx
│   │   │   │   └── QuestionPicker.tsx  ← Panel chọn câu hỏi (2 cột)
│   │   │   ├── hooks/
│   │   │   │   ├── useAssignments.ts
│   │   │   │   └── useAssignmentWizard.ts
│   │   │   ├── api/
│   │   │   │   └── assignments.api.ts
│   │   │   └── pages/
│   │   │       ├── AssignmentListPage.tsx
│   │   │       └── CreateAssignmentPage.tsx
│   │   │
│   │   ├── quiz/                       ← Feature phức tạp nhất
│   │   │   ├── components/
│   │   │   │   ├── QuizLayout.tsx      ← Full-screen wrapper, ẩn nav
│   │   │   │   ├── QuizHeader.tsx      ← Progress bar + câu số x/total
│   │   │   │   ├── QuestionDisplay.tsx ← Hiển thị nội dung câu hỏi
│   │   │   │   ├── AnswerOptions/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── MultipleChoice.tsx
│   │   │   │   │   ├── TrueFalse.tsx
│   │   │   │   │   └── FillBlank.tsx
│   │   │   │   ├── FeedbackPanel.tsx   ← Slide-up sau khi trả lời
│   │   │   │   ├── SessionResult.tsx   ← Màn hình kết quả cuối
│   │   │   │   └── AbandonModal.tsx    ← Confirm bỏ dở phiên
│   │   │   ├── hooks/
│   │   │   │   ├── useQuizSession.ts   ← State machine của phiên làm bài
│   │   │   │   └── useTimer.ts         ← Countdown timer
│   │   │   ├── api/
│   │   │   │   └── sessions.api.ts
│   │   │   └── pages/
│   │   │       └── QuizPage.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── AccuracyByTopicChart.tsx  ← Bar chart (Chart.js)
│   │   │   │   ├── WeeklyActivityChart.tsx   ← Line chart
│   │   │   │   ├── ActivityCalendar.tsx      ← Dot calendar tháng
│   │   │   │   ├── StudentRankingTable.tsx
│   │   │   │   ├── WeakTopicsList.tsx
│   │   │   │   └── StatCard.tsx              ← Card hiển thị 1 chỉ số
│   │   │   ├── hooks/
│   │   │   │   ├── useStudentAnalytics.ts
│   │   │   │   └── useClassAnalytics.ts
│   │   │   ├── api/
│   │   │   │   └── analytics.api.ts
│   │   │   └── pages/
│   │   │       ├── StudentProgressPage.tsx
│   │   │       └── ClassAnalyticsPage.tsx
│   │   │
│   │   └── parent/
│   │       ├── components/
│   │       │   ├── ChildSummaryCard.tsx
│   │       │   ├── WeeklyReportCard.tsx
│   │       │   └── LinkChildModal.tsx
│   │       ├── hooks/
│   │       │   └── useChildren.ts
│   │       ├── api/
│   │       │   └── parent.api.ts
│   │       └── pages/
│   │           ├── ParentHomePage.tsx
│   │           └── ChildDetailPage.tsx
│   │
│   ├── shared/                         ← Component & hook dùng chung
│   │   ├── components/
│   │   │   ├── ui/                     ← Primitive components (atom level)
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx       ← Wrapper với sidebar / bottom nav
│   │   │   │   ├── PageHeader.tsx
│   │   │   │   ├── Sidebar.tsx         ← Desktop nav (teacher)
│   │   │   │   └── BottomTabBar.tsx    ← Mobile nav (student, parent)
│   │   │   └── feedback/
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LoadingPage.tsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── usePagination.ts
│   │   │   └── useMediaQuery.ts
│   │   └── lib/
│   │       ├── axios.ts                ← Axios instance + interceptors (auto refresh token)
│   │       ├── dayjs.ts                ← dayjs config + locale tiếng Việt
│   │       └── chartjs.ts             ← Chart.js global register
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── styles/
│   │   ├── globals.css                 ← CSS variables, reset
│   │   └── animations.css             ← Keyframe animations
│   │
│   └── main.tsx                        ← Entry point React
│
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 5.5 Package dùng chung — `packages/`

### 5.5.1 `packages/types/` — TypeScript shared types

```
packages/types/
├── src/
│   ├── user.types.ts
│   ├── class.types.ts
│   ├── question.types.ts
│   ├── assignment.types.ts
│   ├── session.types.ts
│   ├── sm2.types.ts                    ← SM2Progress, SM2Result, SM2Quality
│   ├── analytics.types.ts
│   └── index.ts                        ← Re-export tất cả
├── tsconfig.json
└── package.json                        ← name: "@adaptive-lang/types"
```

**Ví dụ nội dung `sm2.types.ts`:**

```typescript
export interface SM2Progress {
  id: string
  studentId: string
  questionId: string
  easinessFactor: number      // 1.30 – 5.00
  intervalDays: number
  repetitionCount: number
  nextReviewDate: string      // ISO date string
  lastReviewedAt: string | null
  totalAttempts: number
  correctAttempts: number
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5

export interface SM2UpdateResult {
  newEasinessFactor: number
  newIntervalDays: number
  newRepetitionCount: number
  nextReviewDate: string
}
```

---

### 5.5.2 `packages/sm2-engine/` — Core algorithm

Package quan trọng nhất. Chứa thuật toán SM-2 độc lập, không phụ thuộc Express hay React — có thể test hoàn toàn độc lập.

```
packages/sm2-engine/
├── src/
│   ├── sm2.ts                          ← Thuật toán SM-2 thuần túy
│   ├── quality.ts                      ← Tính sm2_quality từ is_correct + response_time
│   ├── scheduler.ts                    ← Chọn câu hỏi cần ôn theo ngày
│   └── index.ts
├── tests/
│   ├── sm2.test.ts                     ← Unit test đầy đủ cho mọi case
│   └── scheduler.test.ts
├── tsconfig.json
└── package.json                        ← name: "@adaptive-lang/sm2-engine"
```

**Ví dụ nội dung `sm2.ts`:**

```typescript
import type { SM2Progress, SM2Quality, SM2UpdateResult } from '@adaptive-lang/types'

const MIN_EASINESS_FACTOR = 1.3

/**
 * Cập nhật trạng thái SM-2 sau một lần trả lời.
 * @param progress  - Trạng thái hiện tại của cặp (student, question)
 * @param quality   - Chất lượng câu trả lời: 0 (tệ) → 5 (hoàn hảo)
 * @returns         - Giá trị mới cần lưu vào DB
 */
export function updateSM2(
  progress: SM2Progress,
  quality: SM2Quality
): SM2UpdateResult {
  let { easinessFactor, intervalDays, repetitionCount } = progress

  // Cập nhật Easiness Factor
  const newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const newEasinessFactor = Math.max(MIN_EASINESS_FACTOR, parseFloat(newEF.toFixed(2)))

  let newIntervalDays: number
  let newRepetitionCount: number

  if (quality < 3) {
    // Trả lời sai: reset về đầu
    newIntervalDays = 1
    newRepetitionCount = 0
  } else {
    // Trả lời đúng: tính interval mới
    if (repetitionCount === 0) {
      newIntervalDays = 1
    } else if (repetitionCount === 1) {
      newIntervalDays = 6
    } else {
      newIntervalDays = Math.round(intervalDays * newEasinessFactor)
    }
    newRepetitionCount = repetitionCount + 1
  }

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays)

  return {
    newEasinessFactor,
    newIntervalDays,
    newRepetitionCount,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0]
  }
}
```

---

### 5.5.3 `packages/utils/` — Hàm tiện ích dùng chung

```
packages/utils/
├── src/
│   ├── string.ts                       ← capitalizeFirst, slugify, truncate
│   ├── date.ts                         ← formatDate, getDaysDiff, isOverdue
│   ├── array.ts                        ← chunk, shuffle, groupBy
│   ├── validation.ts                   ← isValidEmail, isStrongPassword
│   └── index.ts
├── tsconfig.json
└── package.json                        ← name: "@adaptive-lang/utils"
```

---

## 5.6 Quy ước đặt tên file

| Loại file | Convention | Ví dụ |
|---|---|---|
| React component | PascalCase + `.tsx` | `QuestionCard.tsx` |
| Hook | camelCase, prefix `use` + `.ts` | `useQuizSession.ts` |
| Service (backend) | kebab-case + `.service.ts` | `sessions.service.ts` |
| Controller | kebab-case + `.controller.ts` | `sessions.controller.ts` |
| Repository | kebab-case + `.repository.ts` | `sessions.repository.ts` |
| Route | kebab-case + `.routes.ts` | `sessions.routes.ts` |
| Validator | kebab-case + `.validator.ts` | `sessions.validator.ts` |
| Test file | Tên file gốc + `.test.ts` | `sm2.test.ts` |
| Type file | kebab-case + `.types.ts` | `sm2.types.ts` |
| Config | kebab-case + `.ts` | `database.ts` |
| Constants | camelCase | `constants.ts` |

---

## 5.7 Quy ước tổ chức import

Thứ tự import trong mỗi file, phân cách bằng dòng trống:

```typescript
// 1. Node.js built-ins
import path from 'path'

// 2. Third-party packages
import express from 'express'
import { z } from 'zod'

// 3. Internal packages (@adaptive-lang/*)
import type { SM2Progress } from '@adaptive-lang/types'
import { updateSM2 } from '@adaptive-lang/sm2-engine'

// 4. App-level imports (config, middleware, shared)
import { prisma } from '@/config/database'
import { AppError } from '@/shared/errors/AppError'

// 5. Same-module imports (relative)
import { sessionsRepository } from './sessions.repository'
import type { CreateSessionDto } from './sessions.validator'
```

---

## 5.8 Biến môi trường

File `.env.example` commit vào git để làm tài liệu. File `.env` thật không commit.

```bash
# ─── App ─────────────────────────────────
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000/api/v1
WEB_URL=http://localhost:5173

# ─── Database ────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/adaptive_lang_dev
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/adaptive_lang_test

# ─── Redis ───────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── JWT ─────────────────────────────────
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# ─── Firebase ────────────────────────────
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# ─── Email (Nodemailer) ──────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Adaptive Lang "

# ─── Rate Limiting ────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 5.9 Scripts npm quan trọng

**Root `package.json`:**

```json
{
  "scripts": {
    "dev":           "concurrently \"npm run dev -w apps/api\" \"npm run dev -w apps/web\"",
    "build":         "npm run build --workspaces",
    "test":          "npm run test --workspaces",
    "lint":          "npm run lint --workspaces",
    "db:migrate":    "npm run db:migrate -w apps/api",
    "db:seed":       "npm run db:seed -w apps/api",
    "db:studio":     "npx prisma studio --schema=apps/api/prisma/schema.prisma",
    "type-check":    "tsc --noEmit --project tsconfig.base.json"
  }
}
```

**`apps/api/package.json`:**

```json
{
  "scripts": {
    "dev":         "tsx watch src/server.ts",
    "build":       "tsc -p tsconfig.json",
    "start":       "node dist/server.js",
    "test":        "jest --runInBand",
    "test:watch":  "jest --watch",
    "test:cov":    "jest --coverage",
    "db:migrate":  "prisma migrate dev",
    "db:deploy":   "prisma migrate deploy",
    "db:seed":     "tsx prisma/seed.ts",
    "db:reset":    "prisma migrate reset --force",
    "lint":        "eslint src --ext .ts"
  }
}
```

**`apps/web/package.json`:**

```json
{
  "scripts": {
    "dev":        "vite",
    "build":      "tsc && vite build",
    "preview":    "vite preview",
    "test":       "vitest run",
    "test:watch": "vitest",
    "lint":       "eslint src --ext .tsx,.ts"
  }
}
```

---

## 5.10 Docker cho local development

**`docker-compose.yml`** — chỉ chạy infrastructure, không chạy app:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: adaptive_lang_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: adaptive_lang_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: adaptive_lang_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Lệnh khởi động môi trường dev:**

```bash
# 1. Khởi động PostgreSQL + Redis
docker-compose up -d

# 2. Cài dependencies
npm install

# 3. Chạy DB migration và seed
npm run db:migrate
npm run db:seed

# 4. Khởi động cả API và Web cùng lúc
npm run dev
```

---

## 5.11 Tổng kết Phần 5

Cấu trúc thư mục được thiết kế theo 3 nguyên tắc cốt lõi:

**Nguyên tắc 1: Tổ chức theo feature, không theo loại file.** Thay vì có thư mục `controllers/`, `services/`, `models/` riêng biệt, mỗi feature (auth, classes, questions...) gom toàn bộ controller + service + repository + routes của mình vào cùng một thư mục. Khi cần sửa tính năng "classes", developer chỉ cần vào `modules/classes/` — không cần nhảy qua lại giữa nhiều thư mục.

**Nguyên tắc 2: Tách biệt core logic khỏi framework.** Thuật toán SM-2 sống trong `packages/sm2-engine/` — không biết Express tồn tại, không biết Prisma tồn tại. Có thể test độc lập 100%, có thể dùng lại ở bất kỳ project nào. TypeScript types dùng chung sống trong `packages/types/` — frontend và backend nói chung một ngôn ngữ.

**Nguyên tắc 3: Mọi thứ đều predictable.** Đặt tên file nhất quán, thứ tự import cố định, env vars có file `.example` làm tài liệu. Một developer mới tham gia dự án chỉ cần 30 phút để hiểu cần tìm gì ở đâu.

---

> **Phần tiếp theo:** Phần 6 — Kế hoạch triển khai & CI/CD (deployment, GitHub Actions, môi trường production).