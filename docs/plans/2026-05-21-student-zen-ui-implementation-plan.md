# Zen Learning UI Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Refactor the student portal UI into a minimalist, distraction-free "Zen Learning" experience by removing the traditional admin dashboard layout.

**Architecture:** We will replace the fixed sidebar with a sleek, conditionally rendered Topbar (hidden during quizzes). Data presentation on Dashboard and Classes will move from grid cards to clean, readable vertical lists (Learning Paths) with large typography and generous whitespace.

**Tech Stack:** React, Tailwind CSS, lucide-react.

---

### Task 1: Refactor Layout Structure

**Files:**
- Modify: `apps/web/src/layouts/StudentLayout.tsx`

**Step 1: Write the implementation**
Refactor the `StudentLayout` component.
- Remove the left Sidebar completely.
- Add a sticky Topbar with a blur effect (`bg-white/80 backdrop-blur-md`).
- Add a "Menu" button that opens a fullscreen overlay or drawer with the navigation items (`Home`, `My Classes`, `Practice`, `Logout`).
- Check if the current route is `/quiz` or `/session-result`. If yes, hide the Topbar and render just the `Outlet` (with an absolute positioned "X" / Back button in the top left).

**Step 2: Commit**
```bash
git add "apps/web/src/layouts/StudentLayout.tsx"
git commit -m "feat(ui): implement minimalist Topbar layout for students"
```

---

### Task 2: Refactor Student Dashboard

**Files:**
- Modify: `apps/web/src/pages/student/StudentDashboard.tsx`

**Step 1: Write the implementation**
Redesign the Dashboard to follow the "Learning Path" style.
- Remove the tab navigation. The page is now a single continuous scroll.
- Add a large typographic Greeting / Hero section indicating "What to learn today".
- Present the SM-2 Schedule and Assignments as a vertical feed. Use wide, borderless rows with `hover:translate-x-1` and `transition-all` classes for smooth interactions.
- Move the Statistics (Streak, Accuracy, Activity dots) to the bottom of the page under a "Your Progress" section, using clean typography instead of heavy bordered cards.

**Step 2: Commit**
```bash
git add "apps/web/src/pages/student/StudentDashboard.tsx"
git commit -m "feat(ui): redesign dashboard into vertical learning path"
```

---

### Task 3: Refactor Classes & Details

**Files:**
- Modify: `apps/web/src/pages/student/StudentClasses.tsx`
- Modify: `apps/web/src/pages/student/StudentClassDetail.tsx`

**Step 1: Write the implementation**
Redesign the Classes list and Detail views.
- Constrain the main content width (e.g., `max-w-4xl mx-auto`) for a centered, blog-post reading feel.
- Convert class lists into clean typography-heavy rows.
- In Class Details, list assignments as a vertical checklist using simple empty/filled circle icons.
- Format instructors and members as horizontal, inline avatar lists without heavy borders.

**Step 2: Commit**
```bash
git add "apps/web/src/pages/student/StudentClasses.tsx"
git add "apps/web/src/pages/student/StudentClassDetail.tsx"
git commit -m "feat(ui): apply zen layout to student classes"
```

---

### Task 4: Refactor Immersive Quiz & Result

**Files:**
- Modify: `apps/web/src/pages/student/QuizPage.tsx`
- Modify: `apps/web/src/pages/student/SessionResult.tsx`

**Step 1: Write the implementation**
Refactor the learning mode pages to be 100% immersive.
- **QuizPage:** Use a clean, distraction-free background (`bg-gray-50` or `bg-white`). Center the question text with large typography (`text-3xl` or `text-4xl`). Ensure answer options are clean blocks that lightly highlight on hover.
- **SessionResult:** Use a vibrant but minimalist completion screen. Large text "Hoàn thành!", distinct scores, and a clean primary action button. Remove any complex statistical charts from this view.

**Step 2: Commit**
```bash
git add "apps/web/src/pages/student/QuizPage.tsx"
git add "apps/web/src/pages/student/SessionResult.tsx"
git commit -m "feat(ui): create immersive quiz and result experience"
```
