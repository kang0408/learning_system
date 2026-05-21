# Zen Learning UI Design for Student Portal

## Overview
This document outlines the UI and UX redesign of the student portal. The goal is to move away from the traditional "admin dashboard" look (with heavy sidebars, complex charts, and boxy cards) and transition towards a "Zen Learning" experience. The new design is heavily inspired by modern minimalist tools like Notion, focusing entirely on large typography, abundant whitespace, and distraction-free learning.

## Architecture & Layout

### 1. Global Navigation (`StudentLayout.tsx`)
- **Concept:** Minimalist Topbar replacing the Sidebar.
- **Header:** A slim, sticky top-header with a transparent/blur effect. It will only contain the Logo (left) and a sleek Hamburger/Menu button (right).
- **Navigation Drawer:** Clicking the menu button opens a smooth fullscreen overlay or right-side drawer containing the main navigation links (Home, Classes, Profile, Logout).
- **Focus Mode:** When the student enters the `QuizPage` or an active learning session, the Topbar disappears entirely. The only navigation element will be a discrete "X" (close/back) icon in the top-left corner.

### 2. Dashboard (`StudentDashboard.tsx`)
- **Concept:** The "Learning Path" / "Feed" replacing grid cards and tabs.
- **Hero Section:** Instead of a complex stats card, the dashboard opens with a large, personalized typographic greeting (e.g., "Good morning, Khang. You have 20 words to review today.").
- **Today's Focus:** Assignments and SM-2 tasks are listed as a vertical checklist/feed rather than boxed cards. These rows will be wide, clean, and use micro-interactions (e.g., hovering slides the row slightly to the right and reveals the "Start" button).
- **Statistics:** Analytics (Streak, Accuracy, Activity) are moved to the bottom of the page as a clean "Summary" section, preventing stats anxiety from being the first thing the student sees.

### 3. Classes (`StudentClasses.tsx` & `StudentClassDetail.tsx`)
- **Concept:** Blog/Notion style reading layout.
- **Layout:** A single, max-width column centered on the screen. No heavy borders.
- **Details:** Class members and instructors are shown as horizontal inline avatar groups rather than large list items.
- **Assignments:** Displayed as clean vertical checklists with simple, recognizable icons (empty circle for pending, filled circle for completed).

### 4. Learning Experience (`QuizPage.tsx` & `SessionResult.tsx`)
- **QuizPage:** 100% Zen mode. Clean white/light-gray background. Questions are centered with huge, readable typography. Answer options are frameless blocks that gently highlight when hovered or selected. Navigation buttons (Next/Submit) float at the bottom or stick near the content.
- **SessionResult:** A vibrant but minimal success screen. Instead of complex charts, it will use a large "Completed!" typographic header, highlight the final score, and offer a simple primary action button ("Back to Learning Path").

## Key UI Tokens & Principles
- **Color:** Mostly monochromatic (white, gray, black) for layout structure. Brand/Action colors (e.g., Purple/Blue) used sparingly only for primary actions and highlights.
- **Typography:** Sans-serif (Inter, Roboto). Bold weights for headings, high contrast for text.
- **Spacing:** Massive padding around core components. Content should never feel cramped.
- **Components:** Avoid heavy `border`, heavy `shadow`, or deeply nested `card` containers. Prefer flat designs with subtle background hues or thin structural lines.

## Next Steps
Transition to `writing-plans` skill to map out the exact files to modify and the order of implementation.
