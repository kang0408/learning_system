# 🎓 Learning System (Adaptive Language Learning Platform)

An intelligent, multi-tenant language learning platform featuring **SuperMemo-2 (SM-2) Spaced Repetition**, **Google Gemini AI automated question generation**, **interactive classroom & curriculum roadmaps**, and **deep real-time learning analytics**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Monorepo Structure](#-architecture--monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [Option A: Full-Stack Docker (Recommended)](#option-a-full-stack-docker-1-command)
  - [Option B: Local Development](#option-b-local-development)
- [Available Workspace Scripts](#-available-workspace-scripts)
- [Environment Variables](#-environment-variables)
- [Database Management](#-database-management)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

**Learning System** is designed for educational institutions, teachers, and students to personalize language acquisition. By integrating cognitive learning algorithms (SM-2) with generative AI, it automatically calculates question difficulty, predicts memory decay, and schedules optimal review sessions for students while providing teachers with actionable classroom performance metrics.

---

## ✨ Key Features

### 👨‍🎓 For Students
- **Adaptive Quiz & Spaced Repetition (SM-2)**: Dynamically adjusts question intervals and calculates memory retention based on answer accuracy and response times.
- **Interactive Class Curriculum**: Step-by-step lesson roadmaps with embedded video lectures (Google Drive, YouTube, Vimeo, MP4), downloadable learning materials, and linked practice assignments.
- **Detailed Session Review**: Instant feedback with answer explanations, accuracy scoring, and retry capabilities.
- **Multi-language Support (i18n)**: Seamless English & Vietnamese bilingual interface.

### 👩‍🏫 For Teachers
- **Classroom & Student Management**: Generate join codes, track student participation, and manage enrollment.
- **AI-Powered Question Bank**: Generate high-quality multiple-choice questions automatically using Google Gemini AI, with comprehensive manual editing and topic taxonomy.
- **Curriculum & Lesson Builder**: Visual drag-and-drop lesson reordering, rich text editor for lesson notes, video embedding, and material attachments.
- **Knowledge Graph & Retention Analytics**: Spider charts and retention decay matrices across question topics to identify struggling students early.

### 🛠️ For Administrators
- **AI Ops & System Observability**: Monitor Gemini AI token usage, latency metrics, error rates, and API traffic in real-time.
- **Database & Performance Deep Dive**: Slow query tracking, connection pool status, and automated background jobs monitoring.

---

## 🏗 Architecture & Monorepo Structure

The project is structured as an npm/pnpm workspace monorepo:

```
learning_system/
├── apps/
│   ├── api/                     # @learning-system/api (Node.js + Express + Prisma REST API)
│   │   ├── Dockerfile           # Multi-stage production container
│   │   ├── prisma/              # Prisma schema, migrations, and seeds
│   │   └── src/
│   │       ├── modules/         # Domain-driven modules (auth, classes, curriculums, questions, etc.)
│   │       ├── middlewares/     # Auth, metrics collector, error handling, rate limiting
│   │       ├── jobs/            # Node-cron background jobs (decay recalculation)
│   │       └── lib/             # Redis client, nodemailer, Gemini AI wrapper
│   │
│   └── web/                     # Frontend SPA (React 19 + Vite + Tailwind CSS v4)
│       ├── Dockerfile           # Multi-stage Vite build + Nginx Alpine runner
│       ├── nginx.conf           # Gzip, security headers, SPA fallback, API reverse proxy
│       └── src/
│           ├── components/      # Neo-Brutalist UI design system (Modals, Badges, Loaders)
│           ├── features/        # Feature slices (student, teacher, admin, auth)
│           ├── locales/         # Bilingual i18n dictionaries (en.json, vi.json)
│           ├── store/           # Zustand global state (auth store)
│           └── router.tsx       # Role-based route guards and lazy-loaded pages
│
├── packages/
│   ├── sm2-engine/              # @learning-system/sm2-engine (SuperMemo-2 core algorithm)
│   └── types/                   # @learning-system/types (Shared TypeScript interfaces & DTOs)
│
├── docker-compose.yml           # Full-stack Compose v2 orchestrator (Postgres, Redis, API, Web)
├── .dockerignore                # Optimized build exclusion rules
├── package.json                 # Monorepo root definition & unified scripts
└── tsconfig.base.json           # Shared TypeScript compiler options
```

### Data Flow Diagram

```
[ Browser Client ]
       │
       ▼ (Port 80 - Nginx Reverse Proxy)
 ┌────────────────────────────────────────┐
 │  Web SPA (Static Assets / SPA Routing) │
 │  └── Proxy `/api/` ──────────────┐     │
 └──────────────────────────────────┼─────┘
                                    ▼
                         [ Express API (Port 4000) ]
                              │           │
                 ┌────────────┴───┐   ┌───┴───────────────────────┐
                 ▼                ▼   ▼                           ▼
        [ Prisma ORM ]      [ Redis Cache ]             [ Google Gemini AI ]
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
| **Containerization** | Docker, Docker Compose V2, Nginx 1.27 Alpine |
| **Design System** | Modern Neo-Brutalism Design |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher
- **npm**: `v9.x` or higher
- **Docker & Docker Compose**: For containerized deployment
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/kang0408/learning_system.git
cd learning_system
```

### 2. Configure Environment Variables
Copy and adjust the root environment template:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` and custom `JWT_SECRET`.

---

### Option A: Full-Stack Docker (1 Command)
Run the entire platform (Postgres, Redis, API, and Web SPA with Nginx):

```bash
docker compose up --build -d
```

- 🌐 **Web Application**: Open [http://localhost](http://localhost) (port 80)
- 🔌 **API Healthcheck**: Open [http://localhost:4000/health](http://localhost:4000/health)

To view logs or stop:
```bash
docker compose logs -f
docker compose down
```

---

### Option B: Local Development

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Infrastructure Containers (PostgreSQL & Redis)
```bash
npm run docker:dev
# or: docker compose up -d postgres redis
```

#### 3. Run Migrations & Seed Data
```bash
npm run db:migrate
npm run db:seed
```
*Default Demo Accounts:*
- **Teacher**: `teacher@example.com` / `Password123!`
- **Student**: `student@example.com` / `Password123!`
- **Admin**: `admin@example.com` / `Password123!`

#### 4. Start Development Servers
Run the API and Web applications in separate terminals:

```bash
# Terminal 1: Backend API (http://localhost:4000)
npm run dev:api

# Terminal 2: Frontend Web (http://localhost:5173)
npm run dev:web
```

---

## 📜 Available Workspace Scripts

From the repository root, you can run:

| Command | Description |
|---|---|
| `npm run dev:api` | Start backend API in development mode with hot-reload |
| `npm run dev:web` | Start frontend Vite development server |
| `npm run build` | Build both API and Web packages for production |
| `npm run build:api` | Compile TypeScript backend into `apps/api/dist` |
| `npm run build:web` | Build Vite frontend bundle into `apps/web/dist` |
| `npm run docker:up` | Build and start all Docker containers in background |
| `npm run docker:down` | Stop and remove all Docker containers |
| `npm run docker:dev` | Start only Postgres and Redis containers for local development |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed database with initial sample data |

---

## ⚙️ Environment Variables

### Root / API Configuration (`.env` / `apps/api/.env`)

| Variable | Description | Required | Default |
|---|---|---|---|
| `PORT` | HTTP port for Express server | No | `4000` |
| `NODE_ENV` | Environment mode (`development` \| `production` \| `test`) | Yes | `development` |
| `JWT_SECRET` | Secret key for JWT signing & verification | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:password@localhost:5432/adaptive_lang_dev` |
| `REDIS_URL` | Redis connection URL for caching | Yes | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Google Gemini API Key for AI question generation | Yes | - |
| `SENTRY_DSN` | Sentry error tracking & profiling DSN | No | - |
| `POSTGRES_USER` | PostgreSQL container username | No | `user` |
| `POSTGRES_PASSWORD`| PostgreSQL container password | No | `password` |
| `POSTGRES_DB` | PostgreSQL container database name | No | `adaptive_lang_dev` |
| `WEB_PORT` | Docker host port for Nginx web frontend | No | `80` |

---

## 🗄️ Database Management

```bash
cd apps/api

# Open Prisma Studio (visual database explorer)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply new database migration
npx prisma migrate dev --name <migration_name>

# Reset database and re-seed
npx prisma migrate reset
```

---

## 🧪 Testing

```bash
# Run backend unit and integration test suite
npm test --workspace=@learning-system/api

# Run SM-2 algorithm unit tests
npm test --workspace=@learning-system/sm2-engine

# Run frontend typecheck and linter
cd apps/web
npm run lint
npx tsc --noEmit
```

---

## 📦 Production Deployment

### Containerized Deployment (Recommended)
Deploy via Docker Compose on any VPS or Cloud VM (AWS EC2, DigitalOcean, Hetzner):
```bash
docker compose up --build -d
```

---

## 🔧 Troubleshooting

### 1. Database Connection Refused
- **Symptom:** `Can't reach database server at localhost:5432`
- **Solution:** Verify Docker container is running with `docker ps`. If stopped, run `npm run docker:dev` or `docker compose up -d postgres`.

### 2. Missing Gemini API Key
- **Symptom:** API fails to start with `❌ Invalid environment variables: GEMINI_API_KEY is required`
- **Solution:** Add a valid Gemini API key from [Google AI Studio](https://aistudio.google.com/) to your `.env` file.

### 3. Module Resolution in Monorepo
- **Symptom:** `Cannot find module '@learning-system/types'`
- **Solution:** Run `npm install` in the root workspace to regenerate npm symlinks.

---

## 📄 License
This project is licensed under the MIT License.
