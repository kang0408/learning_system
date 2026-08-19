# Kế Hoạch Phát Triển & Tích Hợp Giám Sát Hệ Thống Chuyên Sâu (AI Ops, API Traffic, Database Deep Metrics)

## Goal
Phát triển và tích hợp 3 nhóm chỉ số giám sát nâng cao (AI & LLM Operations, API & Network Performance, Database Deep Metrics) vào Backend `/api/analytics/admin/system` và giao diện Admin Analytics tại `apps/web/src/features/admin/analytics`.

## Tasks
- [x] Task 1: Thiết kế & cập nhật cấu trúc dữ liệu (`SystemMetrics`) tại `apps/web/src/features/admin/analytics/types.ts` và Backend Types để bổ sung 3 schema: `aiOps`, `apiTraffic`, `databaseDeep`. → Verify: TypeScript biên dịch không lỗi interface.
- [x] Task 2: Cài đặt middleware thu thập chỉ số API Traffic (RPS, response time, HTTP status code 2xx/4xx/5xx) & đếm active SSE connections tại `apps/api/src/middlewares/metrics.middleware.ts`. → Verify: Gọi request và kiểm tra metrics middleware ghi nhận đúng số lượng request và mã status code.
- [x] Task 3: Thu thập dữ liệu AI Ops (Token usage, latency, tổng số AI reports & câu hỏi sinh bởi AI) và PostgreSQL Deep Metrics (Cache hit ratio, active transactions/locks) tại `apps/api/src/modules/analytics/analytics.repository.ts`. → Verify: Gọi `getRealTimeSystemMetrics()` trả về đầy đủ các trường `aiOps` và `databaseDeep` có số liệu thực tế.
- [x] Task 4: Cập nhật `RealtimeHealthBanner.tsx` để hiển thị trạng thái động (HEALTHY, WARNING, CRITICAL) tổng hợp từ Database, Server, AI và API Traffic kèm badge trực quan. → Verify: Banner hiển thị đúng màu (Xanh/Vàng/Đỏ) và có badge chi tiết cho từng subsystem.
- [x] Task 5: Xây dựng component `AiOpsMetricsCard.tsx` hiển thị AI tokens, AI generation count, AI latency & error rate. → Verify: Component render dữ liệu AI đẹp mắt, có badge đánh giá hiệu năng AI.
- [x] Task 6: Xây dựng component `ApiTrafficCard.tsx` hiển thị RPS, biểu đồ tỷ lệ mã HTTP Status (2xx, 4xx, 5xx) và số lượng SSE connection đang live. → Verify: Component render biểu đồ phân bố HTTP code và số liệu RPS cập nhật realtime theo SSE.
- [x] Task 7: Xây dựng component `DatabaseDeepCard.tsx` hiển thị Cache hit ratio, Slow queries counter, Lock contention và kết nối DB chi tiết. → Verify: Component hiển thị Cache hit ratio (với thanh % trực quan) và thông tin bảng/kết nối Postgres.
- [x] Task 8: Tích hợp các component mới vào trang Admin System Analytics (`apps/web/src/pages/admin/AdminSystemAnalytics.tsx`) và viết unit test xác thực tại `analytics.admin.test.ts`. → Verify: Chạy `npm test` trong `apps/api` pass 100% và mở giao diện Web Admin `/admin/system` thấy hiển thị đầy đủ các dashboard card mới mượt mà.

## Done When
- [x] Backend API `/api/analytics/admin/system` và SSE stream `/api/analytics/admin/system/stream` cung cấp đầy đủ dữ liệu thời gian thực cho cả 3 nhóm chỉ số mới.
- [x] Giao diện Admin System Analytics tại `apps/web` hiển thị trực quan các thẻ chỉ số AI Ops, API Traffic và Database Deep Metrics với đồ thị, màu sắc trạng thái chuẩn UX/UI.
- [x] Toàn bộ unit test backend chạy thành công và không gây ảnh hưởng đến hiệu năng core app.

## Notes
- Các chỉ số API Traffic lưu trữ dạng in-memory rolling window với vòng xoay 60s để tránh tốn RAM và đảm bảo tốc độ phản hồi dưới 10ms.
- Truy vấn PostgreSQL Deep Metrics sử dụng các view hệ thống an toàn (`pg_stat_database`, `pg_stat_activity`) với fallback an toàn.
