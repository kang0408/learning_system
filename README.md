# 🎓 Adaptive Language Learning System (AdaptiveLang)

An intelligent, multi-tenant language learning platform featuring **SuperMemo-2 (SM-2) Spaced Repetition**, **Google Gemini AI automated question generation**, **interactive classroom & curriculum roadmaps**, and **deep real-time learning analytics**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Monorepo Structure](#-architecture--monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Variables](#-environment-variables)
- [Database Management](#-database-management)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

**AdaptiveLang** is designed for educational institutions, teachers, and students to personalize language acquisition. By integrating cognitive learning algorithms (SM-2) with generative AI, it automatically calculates question difficulty, predicts memory decay, and schedules optimal review sessions for students while providing teachers with actionable classroom performance metrics.

---

## ✨ Key Features

### 👨‍🎓 For Students
- **Adaptive Quiz & Spaced Repetition (SM-2)**: Dynamically adjusts question intervals and calculates memory retention based on answer accuracy and response times.
- **Interactive Class Curriculum**: Step-by-step lesson roadmaps with embedded video lectures (Google Drive, YouTube, Vimeo, MP4), downloadable learning materials, and linked practice assignments.
- **Detailed Session Review**: Instant feedback with answer explanations, accuracy scoring, and retry capabilities.
- **Multi-language Support (i18n)**: Seamless English & Vietnamese bilingual interface.

### 👩‍🏫 For Teachers
- **Classroom & Student Management**: Generate join codes, track student participation, and manage enrollment.
- **AI-Powered Question Bank**: Generate high-quality multiple-choice questions automatically using Google Gemini AI, with bulk CSV import and manual editing.
- **Curriculum & Lesson Builder**: Visual drag-and-drop lesson reordering, rich text editor for lesson notes, video embedding, and material attachments.
- **Knowledge Graph & Retention Analytics**: Spider charts and retention decay matrices across question topics to identify struggling students early.

### 🛠️ For Administrators
- **AI Ops & System Observability**: Monitor Gemini AI token usage, latency metrics, error rates, and API traffic in real-time.
- **Database & Performance Deep Dive**: Slow query tracking, connection pool status, and automated background jobs monitoring.

---

## 🏗 Architecture & Monorepo Structure

The project is structured as an npm/pnpm workspace monorepo:

```
language_learning_system/
├── apps/
│   ├── api/                     # Node.js + Express + Prisma REST API
│   │   ├── prisma/              # Prisma schema, migrations, and seeds
│   │   ├── src/
│   │   │   ├── modules/         # Domain-driven modules (auth, classes, curriculums, questions, etc.)
│   │   │   ├── middlewares/     # Auth, metrics collector, error handling, rate limiting
│   │   │   ├── jobs/            # Node-cron background jobs (decay recalculation)
│   │   │   └── lib/             # Redis client, nodemailer, Gemini AI wrapper
│   │   └── package.json
│   │
│   └── web/                     # React 19 + Vite + Tailwind CSS v4 SPA
│       ├── src/
│       │   ├── components/      # Reusable UI components (Modals, Badges, RichTextEditor, Loaders)
│       │   ├── features/        # Feature slices (student, teacher, admin, auth)
│       │   ├── locales/         # Bilingual i18n dictionaries (en.json, vi.json)
│       │   ├── store/           # Zustand global state (auth store)
│       │   └── router.tsx       # Role-based route guards and lazy-loaded pages
│       └── package.json
│
├── packages/
│   ├── sm2-engine/              # Pure TypeScript SuperMemo-2 core algorithm engine
│   └── types/                   # Shared TypeScript models, DTOs, and SM-2 interfaces
│
├── docker-compose.yml           # PostgreSQL 15 & Redis 7 container configuration
├── package.json                 # Root monorepo workspace definition
└── tsconfig.base.json           # Shared TypeScript base configuration
```

### Data Flow Diagram

```
[ Student / Teacher / Admin Browser ]
               │
               ▼ (HTTPS / REST API)
    [ Express API Gateway ] ── (Metrics & Sentry Tracking)
         │           │
         ├───────────┼───────────────────────────┐
         ▼           ▼                           ▼
  [ Prisma ORM ]  [ Redis Cache ]       [ Google Gemini AI ]
         │
         ▼
[ PostgreSQL 15 ]
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query v5, Zustand, React Router v7, Lucide Icons, Chart.js, i18next |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM 5, Zod validation, JWT, Helmet, CORS, Node-Cron, Sentry |
| **Database & Cache** | PostgreSQL 15, Redis 7 (Alpine) |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Algorithms** | SuperMemo-2 Spaced Repetition (custom engine in `packages/sm2-engine`) |
| **Styling** | Modern Neo-Brutalism Design System |

---

## 📋 Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**: `v9.x` or higher
- **Docker & Docker Compose**: For local PostgreSQL and Redis services
- **Google Gemini API Key**: For AI question generation

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/kang0408/learning_system.git
cd learning_system
```

### 2. Install Workspace Dependencies
```bash
npm install
```

### 3. Start Database and Cache Containers
```bash
docker-compose up -d
```
*This starts PostgreSQL on port `5432` and Redis on port `6379`.*

### 4. Configure Environment Variables
Copy and configure the environment variables:
```bash
# In the root directory (or apps/api)
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long
DATABASE_URL=postgresql://user:password@localhost:5432/adaptive_lang_dev
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 5. Run Database Migrations & Seed Data
```bash
cd apps/api
npx prisma migrate dev
npm run db:seed
```
*Default Seed Accounts:*
- **Teacher**: `teacher@example.com` / `Password123!`
- **Student**: `student@example.com` / `Password123!`
- **Admin**: `admin@example.com` / `Password123!`

### 6. Start Development Servers
From the root directory, you can run both the API and Web frontend concurrently:

```bash
# Terminal 1: Backend API (runs on http://localhost:4000)
cd apps/api
npm run dev

# Terminal 2: Frontend Web (runs on http://localhost:5173)
cd apps/web
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## ⚙️ Environment Variables

### Root / API (`apps/api/.env`)

| Variable | Description | Required | Default |
|---|---|---|---|
| `PORT` | HTTP port for the Express server | No | `4000` |
| `NODE_ENV` | Environment mode (`development` \| `production` \| `test`) | Yes | `development` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:password@localhost:5432/adaptive_lang_dev` |
| `REDIS_URL` | Redis connection URL for caching and rate limiting | Yes | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Google Gemini API Key for question generation | Yes | - |
| `SENTRY_DSN` | Sentry monitoring DSN | No | - |
| `SMTP_HOST` | Mail server host for notifications | No | `smtp.ethereal.email` |
| `SMTP_PORT` | Mail server port | No | `587` |
| `SMTP_USER` | Mail server username | No | - |
| `SMTP_PASS` | Mail server password | No | - |

---

## 🗄️ Database Management

```bash
cd apps/api

# Open Prisma Studio (visual database browser)
npx prisma studio

# Generate Prisma Client after schema updates
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name <migration_name>

# Reset database completely and re-seed
npx prisma migrate reset
```

---

## 🧪 Testing

```bash
# Run backend test suite (unit and integration tests)
cd apps/api
npm test

# Run SM-2 engine unit tests
cd packages/sm2-engine
npm test

# Run frontend typecheck and linter
cd apps/web
npm run lint
npx tsc --noEmit
```

---

## 📦 Production Deployment

### 1. Backend Build
```bash
cd apps/api
npm run build
# Starts production server with compiled JS in dist/
npm start
```

### 2. Frontend Build
```bash
cd apps/web
npm run build
# Output bundle will be located in apps/web/dist
```

---

## 🔧 Troubleshooting

### 1. Database Connection Refused
- **Symptom:** `Can't reach database server at localhost:5432`
- **Solution:** Verify Docker container is running with `docker ps`. If stopped, run `docker-compose up -d`.

### 2. Missing Gemini API Key
- **Symptom:** API fails to start with `❌ Invalid environment variables: GEMINI_API_KEY is required`
- **Solution:** Add a valid Gemini API key from [Google AI Studio](https://aistudio.google.com/) to your `.env` file.

### 3. Module Resolution in Monorepo
- **Symptom:** `Cannot find module '@adaptive-lang/types'`
- **Solution:** Run `npm install` in the monorepo root to link workspace packages.

---

## 📄 License
This project is licensed under the MIT License.
