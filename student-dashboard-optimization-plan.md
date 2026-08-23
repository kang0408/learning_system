# Student Dashboard Scalability & Performance Optimization Plan

## Goal
Optimize the student dashboard for large-scale data (hundreds of assignments & topics) using a Neo-Brutalist action-driven UI and high-performance pre-aggregated backend architecture.

## Design & Implementation Constraints
- **Icon Usage**: Hạn chế tối đa icon, chỉ sử dụng icon chức năng cơ bản (như mũi tên điều hướng, chevron mở rộng).
- **Emoji Policy**: **NGHIÊM CẤM DÙNG EMOJI** trong toàn bộ giao diện. Sử dụng Typography in hoa, Color Badges (Đỏ/Vàng/Xanh/Tím), và khung viền Neo-Brutalism để tạo điểm nhấn trực quan.
- **Verification Gate**: Sau mỗi task PHẢI kiểm tra lỗi nghiêm túc (typecheck, linting, code build, logic testing) và fix triệt để trước khi chuyển sang task tiếp theo.
- **Git Policy**: Tuyệt đối KHÔNG tự ý thực hiện commit sau khi hoàn thành.

## Tasks
- [x] Task 1: **Database Indexing & Read-Model Aggregation**
  - Add composite indexes for `sm2_progress(student_id, next_review_date, easiness_factor)` and `assignments(class_id, is_published, deleted_at, deadline)` in `schema.prisma`.
  - Create table `student_topic_stats` for pre-aggregated topic performance.
  - → *Verify*: Run prisma generation / validate schema and test database queries.

- [x] Task 2: **Lightweight Dashboard Summary Endpoint**
  - Create `GET /api/analytics/student/me/dashboard-summary` returning only: `urgent_count`, `due_today_count`, Top 3 prioritized assignments, and Top 3 weak topics.
  - Implement caching/optimization for this summary endpoint with invalidation hooks on quiz submission.
  - → *Verify*: Test controller/service response and type contracts.

- [x] Task 3: **Keyset/Cursor & Filtered Paginated Assignments API**
  - Update `getMyAssignments` in `apps/api/src/modules/assignments/assignments.service.ts` to support topic filtering, search, class filtering, and priority sorting.
  - → *Verify*: Test API queries with filters for class, status, and topic.

- [x] Task 4: **Hierarchical Topic Tree & Mastery Endpoint**
  - Create `GET /api/analytics/student/me/topics-tree` that leverages the existing `Topic.parent_id` self-relation to roll up mastery scores (% mastery, weak questions) from leaf topics to parents.
  - → *Verify*: Verify nested topic tree JSON structure with aggregated metrics.

- [x] Task 5: **Frontend Smart Focus ("Today's Urgent Actions") Component**
  - Create `SmartFocus.tsx` in `apps/web/src/features/student/dashboard/components/` with Neo-Brutalism style (`border-2 border-zinc-900`, hard shadow).
  - NO emojis. High-contrast typography and text badges. Display max 3 cards: Urgent deadline (<24h), 1 SM-2 Daily Review batch, and 1 targeted weak topic recovery.
  - → *Verify*: Typecheck and render verification.

- [x] Task 6: **Frontend Grouped & Filterable ActionItems with Accordion & Search**
  - Refactor `ActionItems.tsx` to add Tab filters (`[ALL]`, `[BY CLASS]`, `[BY TOPIC]`, `[OVERDUE]`), search bar, and collapsible accordions.
  - High performance rendering with zero lag even with 100+ assignments.
  - → *Verify*: Typecheck, test switching tabs and collapsible sections without DOM freeze.

- [x] Task 7: **Frontend Bento Mastery Matrix / Topic Explorer**
  - Upgrade `FocusAreas.tsx` to a high-contrast Neo-Brutalism Bento Grid / Topic drawer with text status indicators (WEAK, STABLE, MASTERED) and color bands.
  - Clicking any topic triggers filtering in the ActionItems list.
  - → *Verify*: Typecheck and verify topic selection filter callback.

- [x] Task 8: **E2E Integration & Verification**
  - Connect `useDashboardData.ts` and `studentDashboardApi.ts` to the new endpoints.
  - Verify overall web and API build (`pnpm build` / typecheck).
  - Ensure zero emojis, clean Neo-Brutalist aesthetic, fast load time.
  - → *Verify*: Full frontend and backend typecheck and build pass cleanly.

## Done When
- [x] Dashboard load time is optimized for hundreds of assignments and topics.
- [x] UI presents a clear 3-item daily focus without cognitive overload, matching Neo-Brutalism style with NO emojis.
- [x] All topic hierarchies and assignments are browsable through tabs, search, and accordions.
- [x] Code passes all lint and TypeScript checks with zero errors.
