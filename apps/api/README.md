# 🚀 @learning-system/api - Backend REST API

High-performance Express & TypeScript REST API service powering the **Adaptive Language Learning System**, built with **Prisma ORM**, **PostgreSQL**, **Redis**, **Google Gemini AI**, and **SuperMemo-2 (SM-2)** algorithm integration.

---

## 📑 Table of Contents
- [Architecture & Modular Design](#-architecture--modular-design)
- [Tech Stack](#-tech-stack)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Core Engines & Integrations](#-core-engines--integrations)
- [Environment Configuration](#-environment-configuration)
- [Database Setup & Migrations](#-database-setup--migrations)
- [Scripts & Development](#-scripts--development)
- [Testing](#-testing)

---

## 🏛 Architecture & Modular Design

The API follows a **Domain-Driven Layered Architecture**. Each feature module is self-contained with:
- **`*.routes.ts`**: Express route definitions with middleware guards.
- **`*.controller.ts`**: Request handling and HTTP response transformation.
- **`*.service.ts`**: Business logic, algorithm execution, and external integrations.
- **`*.repository.ts`**: Prisma database queries and data persistence.
- **`*.schema.ts`**: Strict request validation using **Zod**.
- **`__tests__/`**: Automated unit and integration tests using **Jest & Supertest**.

### Directory Layout
```
apps/api/src/
├── config/                  # Validated environment configuration (Zod)
├── jobs/                    # Node-cron background jobs (decay recalculation)
├── lib/                     # Database client, Redis cache, Mailer, AI SDK
├── middlewares/             # Auth JWT, Role guards, Error handling, Rate limiting, Metrics
├── modules/
│   ├── ai/                  # Google Gemini question generation
│   ├── analytics/           # Retention charts, teacher/admin stats, AI Ops
│   ├── assignments/         # Quiz assignment creation, publishing, submissions
│   ├── auth/                # Register, login, refresh, logout
│   ├── classes/             # Classroom management & join codes
│   ├── curriculums/         # Lesson roadmap, video embeddings, material uploads
│   ├── questions/           # Question CRUD, AI generation
│   ├── sessions/            # Real-time quiz taking session engine
│   ├── sm2/                 # Spaced repetition calculation endpoints
│   ├── topics/              # Knowledge graph taxonomy
│   └── users/               # Profile management and admin user controls
├── app.ts                   # Express application setup
├── server.ts                # Server startup and cron initialization
└── instrument.ts            # Sentry telemetry & profiling
```

---

## 🛠 Tech Stack

- **Runtime**: Node.js `v20+`
- **Framework**: Express.js
- **Language**: TypeScript (`verbatimModuleSyntax: true`)
- **Database ORM**: Prisma ORM 5 with PostgreSQL 15
- **Caching**: Redis 7
- **Validation**: Zod 4
- **Security**: Helmet, CORS, bcrypt, jsonwebtoken
- **Background Tasks**: Node-Cron
- **Observability**: Sentry with Profiling, Custom Request Metrics Collector
- **AI Model**: Google Gemini (`@google/genai`)

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (student/teacher) | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/auth/me` | Get current logged-in user profile | Authenticated |

### 🏫 Classes (`/api/classes`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/classes` | List user's classes | Authenticated |
| `POST` | `/api/classes` | Create new classroom | Teacher / Admin |
| `GET` | `/api/classes/:id` | Get class details & members | Authenticated |
| `POST` | `/api/classes/join` | Join class using 6-character code | Student |

### 📚 Class Curriculums (`/api/classes/:classId/curriculums`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/classes/:classId/curriculums` | Get class curriculum roadmap | Authenticated |
| `POST` | `/api/classes/:classId/curriculums` | Create a new lesson | Teacher / Admin |
| `GET` | `/api/classes/:classId/curriculums/:id` | Get detailed lesson with materials & assignments | Authenticated |
| `PUT` | `/api/classes/:classId/curriculums/:id` | Update lesson details | Teacher / Admin |
| `PUT` | `/api/classes/:classId/curriculums/reorder` | Bulk reorder lessons in roadmap | Teacher / Admin |
| `DELETE`| `/api/classes/:classId/curriculums/:id` | Delete lesson and attachments | Teacher / Admin |

### ❓ Questions & Question Bank (`/api/questions`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/questions` | List questions with pagination and filters | Teacher / Admin |
| `POST` | `/api/questions` | Create question manually | Teacher / Admin |
| `POST` | `/api/questions/generate-ai` | Generate multiple-choice questions with Gemini AI | Teacher / Admin |

### 📝 Quiz Sessions & SM-2 (`/api/sessions`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/sessions/start` | Start adaptive or standard quiz session | Student |
| `POST` | `/api/sessions/:id/submit` | Submit question answer and receive instant SM-2 calculation | Student |
| `POST` | `/api/sessions/:id/finish` | Complete quiz and calculate final score | Student |
| `GET` | `/api/sessions/:id/result` | Retrieve session result with full answer breakdown | Authenticated |

### 📊 Analytics & AI Ops (`/api/analytics`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/analytics/student` | Student memory retention matrix & topic radar | Student |
| `GET` | `/api/analytics/teacher` | Class-wide progress and weak topic distribution | Teacher |
| `GET` | `/api/analytics/admin/system` | AI token metrics, latency, DB connections, API traffic | Admin |

---

## 🧠 Core Engines & Integrations

### 1. SuperMemo-2 (SM-2) Spaced Repetition Engine
Located in `@learning-system/sm2-engine`:
- Calculates new **Easiness Factor ($EF$)** based on question response time, difficulty rating, and answer correctness.
- Dynamically computes the **Inter-repetition Interval ($I$)** in days.
- Automatically adjusts for lapses (resetting repetitions if response grade $q < 3$).

### 2. Google Gemini AI Integration
Located in `modules/ai/`:
- Utilizes the official `@google/genai` SDK.
- Structures prompts to return strictly validated JSON matching question schemas with answer choices and explanations.
- Tracks input/output token usage for administrative auditing.

---

## ⚙️ Environment Configuration

Create a `.env` file in `apps/api/`:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=super_secure_jwt_secret_key_minimum_32_characters
DATABASE_URL=postgresql://user:password@localhost:5432/adaptive_lang_dev
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key
SENTRY_DSN=optional_sentry_dsn_url
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

---

## 🗃️ Database Setup & Migrations

```bash
# Generate Prisma Client types
npx prisma generate

# Apply pending migrations
npx prisma migrate dev

# Run database seed (creates demo users, topics, questions, and classrooms)
npm run db:seed

# Inspect database visually
npx prisma studio
```

---

## 📜 Scripts & Development

```bash
# Start development server with auto-reload
npm run dev

# Compile TypeScript to JavaScript in dist/
npm run build

# Start production server
npm start
```

---

## 🧪 Testing

```bash
# Run all unit and integration test suites
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test suite
npm test -- curriculums.test.ts
```
