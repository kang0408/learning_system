# Phase 5: Frontend Web Application Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Khởi tạo dự án React (Vite) trong Monorepo, thiết lập Design System (Tailwind CSS), Routing, Global State (Zustand) và xây dựng bộ giao diện cho tính năng quan trọng nhất: Quiz Session.

**Architecture:** Vite + React + TypeScript + Tailwind CSS. Feature-based structure.

**Tech Stack:** React 18, React Router v6, Zustand, Tailwind CSS, Axios.

---

### Task 1: Initialize Vite React App & Tailwind

**Files:**
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`
- Modify: `apps/web/src/index.css`

**Step 1: Write the failing test**
Run command to scaffold the app and install dependencies:
```bash
npm create vite@latest apps/web -- --template react-ts
cd apps/web && npm install
cd apps/web && npm install -D tailwindcss postcss autoprefixer @types/node
cd apps/web && npx tailwindcss init -p
cd apps/web && npm install react-router-dom zustand axios lucide-react
```

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Update `apps/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173
  }
});
```
Update `apps/web/tsconfig.json` to support aliases (add inside compilerOptions):
```json
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
```
Update `apps/web/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // Indigo-600
        secondary: '#10b981', // Emerald-500
        warning: '#f59e0b', // Amber-500
        danger: '#ef4444', // Red-500
        background: '#f8fafc',
        surface: '#ffffff'
      }
    },
  },
  plugins: [],
}
```
Update `apps/web/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-background text-slate-900;
}
```

**Step 4: Run test to verify it passes**
Run: `cd apps/web && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/web
git commit -m "feat(web): initialize react app with vite and tailwind"
```

---

### Task 2: Auth State & Router Setup

**Files:**
- Create: `apps/web/src/store/authStore.ts`
- Create: `apps/web/src/router.tsx`
- Modify: `apps/web/src/main.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/web/src/store/authStore.ts`:
```typescript
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  }
}));
```
Create dummy pages `apps/web/src/pages/Login.tsx` and `apps/web/src/pages/StudentDashboard.tsx`:
```typescript
// apps/web/src/pages/Login.tsx
export default function Login() { return <div>Login Page</div>; }
```
```typescript
// apps/web/src/pages/StudentDashboard.tsx
export default function StudentDashboard() { return <div>Student Dashboard</div>; }
```
Create `apps/web/src/router.tsx`:
```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, role }: { children: JSX.Element, role?: string }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <Navigate to="/student" replace /> },
  { 
    path: '/student', 
    element: <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute> 
  }
]);
```
Update `apps/web/src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

**Step 4: Run test to verify it passes**
Run: `cd apps/web && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/web/src
git commit -m "feat(web): setup zustand store and react router"
```

---

### Task 3: Quiz Session Full-screen UI

**Files:**
- Create: `apps/web/src/pages/QuizPage.tsx`
- Modify: `apps/web/src/router.tsx`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/web/src/pages/QuizPage.tsx`:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, XCircle } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const mockQuestion = {
    content: 'Which language is known as the "Mother of all languages"?',
    options: [
      { id: 1, text: 'Sanskrit' },
      { id: 2, text: 'Latin' },
      { id: 3, text: 'Greek' },
      { id: 4, text: 'Hebrew' },
    ]
  };

  const handleSelect = (id: number) => {
    if (feedback) return; // prevent changing answer
    setSelectedOption(id);
    
    // Mock validation
    const isCorrect = id === 1;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      // Move to next question or exit
      navigate('/student');
    }, 2000);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b bg-white">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div className="w-full max-w-md mx-4 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-secondary w-1/3 transition-all"></div>
        </div>
        <div className="text-warning font-bold">1/3</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">{mockQuestion.content}</h2>
        
        <div className="space-y-4">
          {mockQuestion.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                selectedOption === opt.id 
                  ? feedback === 'correct' 
                    ? 'border-secondary bg-emerald-50 text-secondary' 
                    : feedback === 'incorrect'
                      ? 'border-danger bg-red-50 text-danger'
                      : 'border-primary bg-indigo-50 text-primary'
                  : 'border-slate-200 hover:border-primary hover:bg-slate-50 text-slate-700'
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Panel */}
      <div className={`absolute bottom-0 left-0 w-full p-6 bg-white border-t-2 transition-transform duration-300 ${
        feedback ? 'translate-y-0' : 'translate-y-full'
      } ${feedback === 'correct' ? 'border-secondary' : 'border-danger'}`}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {feedback === 'correct' ? (
            <CheckCircle className="w-8 h-8 text-secondary" />
          ) : (
            <XCircle className="w-8 h-8 text-danger" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${feedback === 'correct' ? 'text-secondary' : 'text-danger'}`}>
              {feedback === 'correct' ? 'Excellent!' : 'Incorrect'}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
```
Update `apps/web/src/router.tsx` to add Quiz route:
```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import QuizPage from './pages/QuizPage';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, role }: { children: JSX.Element, role?: string }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <Navigate to="/student" replace /> },
  { 
    path: '/student', 
    element: <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute> 
  },
  { 
    path: '/quiz', 
    element: <ProtectedRoute role="student"><QuizPage /></ProtectedRoute> 
  }
]);
```

**Step 4: Run test to verify it passes**
Run: `cd apps/web && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/web/src/pages apps/web/src/router.tsx
git commit -m "feat(web): build quiz session interactive ui"
```
