# 💻 @learning-system/web - Frontend Single Page Application

High-performance, modern Single Page Application (SPA) for the **Adaptive Language Learning System**, built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **TanStack Query v5**, **Zustand**, and **i18next**.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Design System (Neo-Brutalism)](#-design-system-neo-brutalism)
- [Feature Modules](#-feature-modules)
- [Internationalization (i18n)](#-internationalization-i18n)
- [State Management & Data Fetching](#-state-management--data-fetching)
- [Routing & Access Control](#-routing--access-control)
- [Available Scripts](#-available-scripts)
- [Build & Deployment](#-build--deployment)

---

## 🛠 Architecture & Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 with `@vitejs/plugin-react`
- **Language**: TypeScript (`verbatimModuleSyntax: true`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@tailwindcss/postcss`)
- **State Management**:
  - **Server State**: `@tanstack/react-query` v5
  - **Client / Auth State**: `zustand` v5
- **Routing**: `react-router-dom` v7
- **Internationalization**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- **Charts & Visualizations**: `chart.js`, `react-chartjs-2`
- **Icons**: `lucide-react`
- **HTTP Client**: `axios` with global request/response interceptors

### Directory Structure
```
apps/web/src/
├── components/              # Shared UI design system primitives
│   └── ui/                  # Button, Badge, Modal, Card, SuspenseLoader, RichTextEditor
├── features/                # Feature-based modular architecture
│   ├── admin/               # System overview, AI ops monitoring, DB performance charts
│   ├── auth/                # Login, Register, Forgot Password forms
│   ├── student/             # Student dashboard, adaptive quiz player, curriculum viewer
│   │   └── class-detail/    # Class header, curriculum tabs, lesson roadmap, video player
│   └── teacher/             # Classroom management, curriculum editor, question bank
│       └── class-detail/    # Curriculum CRUD, drag-and-drop ordering, modal forms
├── hooks/                   # Custom reusable React hooks
├── locales/                 # Bilingual translation JSON files (en.json, vi.json)
├── pages/                   # Top-level page wrappers with Suspense boundaries
├── store/                   # Zustand stores (useAuthStore)
├── types/                   # Frontend-specific type definitions
├── utils/                   # Helper utilities (cn, date formatters, token handlers)
├── App.tsx                  # Root layout & providers
├── index.css                # Global CSS & Tailwind v4 theme configuration
├── main.tsx                 # Application entry point
└── router.tsx               # Route definitions with role-based ProtectedRoute guards
```

---

## 🎨 Design System (Neo-Brutalism)

The UI follows a bold, energetic **Neo-Brutalist** aesthetic:
- **Sharp Borders & Hard Drop Shadows**: `border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b]` with active hover state translations (`hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none`).
- **High-contrast Palette**: Vibrant Indigo (`#4f46e5`), Amber (`#f59e0b`), Rose (`#f43f5e`), Emerald (`#10b981`), and deep Zinc (`#18181b`).
- **Typography**: Heavy, punchy headings (`font-black uppercase tracking-tight`) paired with clean sans-serif body copy and monospace meta tags (`font-mono font-bold text-xs uppercase`).
- **Animated Components**: Staggered jumping squares loader (`SuspenseLoader`), smooth modal zoom transitions, and interactive progress bars.

---

## 🚀 Feature Modules

### 1. 🎓 Student Experience
- **Dashboard**: Quick metrics overview, due assignments alert banner, and enrolled class cards.
- **Class Detail & Curriculum**:
  - **Curriculum Tab**: Step-by-step lesson roadmap showing lesson progress and material badges.
  - **Lesson Detail View**: 16:9 embedded video lecture player (Google Drive, YouTube, Vimeo, direct MP4), HTML lesson content, downloadable documents, and linked quiz assignments.
  - **Interactive Quiz Player**: Instant feedback on correctness, answer explanations, time limits, and attempt tracking.
- **Session Results**: Score breakdowns and review of past quiz attempts.

### 2. 👩‍🏫 Teacher Studio
- **Class Management**: View enrolled students, generate join codes, and create assignments.
- **Curriculum Builder**:
  - Add / edit / delete lessons with integrated **Rich Text Editor**.
  - Attach video lectures (with Google Drive permission tips) and downloadable learning materials.
  - Drag-and-drop visual lesson reordering.
  - Link published assignments directly to lessons.
- **Question Bank & AI Generator**:
  - Generate multiple-choice questions automatically with Google Gemini AI.
  - Import questions via CSV upload.
  - Filter questions by topic hierarchy and difficulty.
- **Class Analytics**: Student retention decay metrics and radar charts across topics.

### 3. 🛠️ Administrator Console
- **AI Ops Monitoring**: Real-time tracking of Gemini API calls, token consumption, response latencies, and error rates.
- **System & Database Metrics**: PostgreSQL connection pool status, slow queries log, memory usage, and API throughput.

---

## 🌐 Internationalization (i18n)

Full English and Vietnamese bilingual support is powered by `react-i18next`:
- **Vietnamese**: [`src/locales/vi.json`](./src/locales/vi.json)
- **English**: [`src/locales/en.json`](./src/locales/en.json)

Switching languages happens dynamically via the language switcher component without requiring page reloads.

---

## 🔄 State Management & Data Fetching

### TanStack Query (Server State)
- API requests are wrapped in custom hooks utilizing `useQuery`, `useMutation`, and `useSuspenseQueries`.
- Optimistic updates and automatic query invalidation upon successful mutation.

### Zustand (Client State)
- `useAuthStore`: Manages user authentication tokens, active role (`student`, `teacher`, `admin`), and profile data persisted in `localStorage`.

---

## 🔒 Routing & Access Control

Defined in [`src/router.tsx`](./src/router.tsx):
- **`ProtectedRoute`**: Inspects user authentication state and role permissions.
- **Lazy Loading**: Route components are dynamically imported with `React.lazy()` and wrapped in `<SuspenseLoader />` for instant initial bundle loading.

---

## 📜 Available Scripts

```bash
# Start local Vite development server (http://localhost:5173)
npm run dev

# Run TypeScript type check and compile production bundle to dist/
npm run build

# Run ESLint validation
npm run lint

# Preview production build locally
npm run preview
```

---

## 📦 Build & Deployment

When building for production:
```bash
npm run build
```
The output directory is `apps/web/dist/`, which is ready for static hosting on **Vercel**, **Netlify**, **Cloudflare Pages**, or **AWS S3 / CloudFront**. Ensure client-side SPA rewrite rules are configured to point all non-asset requests to `index.html`.
