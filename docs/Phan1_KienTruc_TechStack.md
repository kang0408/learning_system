  
**BÁO CÁO ĐỒ ÁN TỐT NGHIỆP**

Ngành Kỹ thuật Phần mềm

**HỆ THỐNG LUYỆN TẬP NGOẠI NGỮ THÍCH ỨNGDỰA TRÊN THUẬT TOÁN SM-2**

*(Adaptive Language Learning System with SM-2 Algorithm)*

**PHẦN 1: TỔNG QUAN KIẾN TRÚC & TECH STACK**

## **1.1  Tổng quan hệ thống**

Hệ thống được xây dựng theo mô hình 3 tầng (Three-tier Architecture) bao gồm tầng Giao diện (Presentation Layer), tầng Xử lý nghiệp vụ (Business Logic Layer) và tầng Dữ liệu (Data Layer). Kiến trúc này tách biệt rõ ràng trách nhiệm của từng tầng, giúp hệ thống dễ bảo trì, mở rộng và kiểm thử độc lập.

Điểm cốt lõi phân biệt hệ thống này với các ứng dụng quiz thông thường là sự hiện diện của SM-2 Adaptive Engine — một module thuật toán chạy sau mỗi phiên làm bài, cá nhân hóa lịch ôn tập và thứ tự câu hỏi dựa trên lịch sử học tập của từng học sinh.

### **Bảng 1.1 — Kiến trúc tổng thể hệ thống**

| Tầng | Thành phần | Công nghệ | Vai trò chính |
| ----- | ----- | ----- | ----- |
| **Giao diện(Frontend)** | Web ApplicationMobile App | React.js, React Native | UI học sinh, giáo viên, phụ huynh |
| **Xử lý(Backend)** | REST APISM-2 EngineAnalytics | Node.js, Express.js | Xử lý nghiệp vụ, thuật toán adaptive, phân tích dữ liệu |
| **Dữ liệu(Database)** | RDBMSCacheFile Storage | PostgreSQL, Redis, Firebase Storage | Lưu trữ người dùng, câu hỏi, lịch sử học tập, media |
| **Vận hành(DevOps)** | CI/CDHosting | GitHub Actions, Docker, Railway / Render | Tự động kiểm thử, triển khai liên tục |

## **1.2  Mô hình kiến trúc chi tiết**

### **1.2.1  Tầng giao diện (Frontend)**

Tầng giao diện được xây dựng bằng React.js cho nền tảng web và React Native cho ứng dụng di động. Hai platform này chia sẻ phần lớn logic nghiệp vụ thông qua custom hooks và utility functions, giúp giảm thiểu công sức phát triển.

Hệ thống phục vụ 3 nhóm người dùng với giao diện riêng biệt:

* Học sinh: màn hình quiz, lịch ôn tập hôm nay, thống kê cá nhân, streak học tập.

* Giáo viên: quản lý ngân hàng câu hỏi, dashboard theo dõi tiến độ toàn lớp, tạo/phân công bài luyện tập.

* Phụ huynh: xem báo cáo tiến độ của con, số buổi học trong tuần, chủ đề đang yếu.

### **1.2.2  Tầng xử lý (Backend)**

Backend được xây dựng trên Node.js \+ Express.js, cung cấp REST API phục vụ cả hai client web và mobile. Kiến trúc backend được tổ chức theo mô hình MVC (Model–View–Controller) kết hợp Service Layer để tách biệt logic nghiệp vụ khỏi tầng controller.

Ba module chính trong Backend:

* REST API Gateway: xử lý authentication (JWT), phân quyền theo vai trò (RBAC), định tuyến request.

* SM-2 Engine: module core của hệ thống, chạy thuật toán Spaced Repetition sau mỗi phiên làm bài, cập nhật easiness factor (EF), interval và repetition count cho từng cặp (học sinh, câu hỏi).

* Analytics Service: tổng hợp dữ liệu học tập, tính điểm yếu theo chủ đề, sinh báo cáo định kỳ, gửi email tự động qua Nodemailer.

### **1.2.3  Tầng dữ liệu (Database)**

Hệ thống sử dụng kiến trúc đa cơ sở dữ liệu, mỗi loại được chọn phù hợp với đặc thù dữ liệu:

* PostgreSQL 15: lưu toàn bộ dữ liệu quan hệ — bảng users, questions, sessions, answer\_history, sm2\_progress. Đây là nguồn sự thật duy nhất (single source of truth) của hệ thống.

* Redis: cache session người dùng, leaderboard theo lớp, kết quả quiz tạm thời trong phiên làm bài. Giảm tải đáng kể cho PostgreSQL.

* Firebase Storage: lưu trữ file audio phát âm và ảnh minh họa từ vựng. Tận dụng CDN toàn cầu của Google để tăng tốc độ tải media cho học sinh.

## **1.3  Tech Stack chi tiết & lý do lựa chọn**

Bảng dưới đây trình bày toàn bộ công nghệ được sử dụng trong dự án, kèm lý do lựa chọn cụ thể dựa trên yêu cầu kỹ thuật và giới hạn thời gian phát triển trong khuôn khổ đồ án tốt nghiệp.

### **Bảng 1.2 — Danh sách công nghệ sử dụng**

| Công nghệ | Loại | Lý do chọn | Tầng |
| ----- | ----- | ----- | :---: |
| React.js 18 | Frontend Web | Component-based, tái sử dụng cao; hệ sinh thái lớn (Chart.js, react-query) | **Web** |
| React Native | Mobile App | Dùng chung logic với React.js; tiết kiệm thời gian phát triển | **Optional** |
| Node.js \+ Express | Backend API | Non-blocking I/O, phù hợp xử lý nhiều request đồng thời từ học sinh | **Backend** |
| PostgreSQL 15 | Primary Database | RDBMS đáng tin cậy; quan hệ phức tạp giữa user, question, session, history | **Database** |
| Redis | Cache / Session | Lưu session, leaderboard, throttle request quiz — tăng tốc response | **Database** |
| Firebase Storage | Media Storage | Lưu audio phát âm, ảnh minh họa từ vựng; CDN toàn cầu | **Database** |
| SM-2 Algorithm | Adaptive Engine | Thuật toán spaced repetition khoa học; cơ sở của Anki, SuperMemo | **Core Logic** |
| Chart.js | Data Visualization | Vẽ biểu đồ tiến độ học sinh, phân tích điểm yếu trực quan | **Frontend** |
| JWT \+ RBAC | Authentication | JSON Web Token; phân quyền 3 vai trò: học sinh, giáo viên, phụ huynh | **Security** |
| Nodemailer | Email Notification | Gửi báo cáo tuần tự động cho phụ huynh và giáo viên | **Backend** |
| GitHub Actions | CI/CD | Tự động chạy test, lint, deploy khi push code | **DevOps** |
| Docker | Containerization | Đóng gói môi trường, dễ triển khai trên server bất kỳ | **DevOps** |

## **1.4  Phân rã module hệ thống**

Hệ thống được chia thành 8 module độc lập, mỗi module có trách nhiệm rõ ràng và có thể được phát triển, kiểm thử song song:

### **Bảng 1.3 — Danh sách module hệ thống**

| ID | Module | Mô tả |
| ----- | ----- | ----- |
| **M01** | **Authentication & Authorization** | Đăng nhập, quản lý JWT, phân quyền RBAC 3 vai trò |
| **M02** | **Question Bank Management** | Giáo viên tạo/sửa/xóa câu hỏi, gắn tag chủ đề, mức độ khó |
| **M03** | **SM-2 Adaptive Engine** | Thuật toán lên lịch ôn tập cá nhân hóa; tính EF, interval, repetition |
| **M04** | **Quiz Session** | Luồng làm bài của học sinh, ghi nhận câu trả lời, tính điểm tức thì |
| **M05** | **Schedule Generator** | Sinh lịch ôn tập hàng ngày/tuần cho từng học sinh dựa trên SM-2 |
| **M06** | **Analytics & Report** | Dashboard biểu đồ tiến độ, phân tích điểm yếu theo chủ đề |
| **M07** | **Notification & Email** | Gửi báo cáo tuần tự động, nhắc nhở ôn tập qua email |
| **M08** | **Parent Portal** | Xem tiến độ con, báo cáo học tập, số buổi ôn trong tuần |

## **1.5  Nguyên tắc thiết kế áp dụng**

### **1.5.1  Separation of Concerns**

Mỗi tầng trong kiến trúc 3 tầng chỉ thực hiện đúng một nhóm trách nhiệm. Frontend không chứa business logic; Backend không trực tiếp truy vấn raw SQL mà thông qua ORM (Sequelize/Prisma); Database không chứa stored procedure phức tạp.

### **1.5.2  Role-Based Access Control (RBAC)**

Toàn bộ API endpoint được bảo vệ bằng middleware kiểm tra JWT và role. Ba role được định nghĩa rõ ràng: STUDENT, TEACHER, PARENT. Mỗi role chỉ có thể truy cập các endpoint được cấp phép, tránh leo thang đặc quyền.

### **1.5.3  Stateless Backend**

Backend được thiết kế không lưu state trong bộ nhớ. Toàn bộ session được quản lý qua JWT (stateless token) và Redis. Điều này cho phép scale ngang (horizontal scaling) dễ dàng khi cần triển khai nhiều instance.

### **1.5.4  Fail-safe SM-2 Engine**

Nếu SM-2 Engine gặp lỗi trong quá trình tính toán, hệ thống sẽ fallback về chế độ quiz ngẫu nhiên thay vì trả về lỗi cho học sinh. Điều này đảm bảo trải nghiệm người dùng không bị gián đoạn trong mọi tình huống.

## **1.6  Luồng dữ liệu chính (Data Flow)**

Luồng dữ liệu cốt lõi của hệ thống diễn ra theo chu trình khép kín giữa học sinh và SM-2 Engine, đảm bảo mỗi phiên học đều được cá nhân hóa dựa trên dữ liệu thực tế:

* Học sinh mở ứng dụng → hệ thống gọi API lấy danh sách câu hỏi được SM-2 Engine xếp lịch cho ngày hôm nay.

* Học sinh làm bài → mỗi câu trả lời được gửi lên Backend kèm thời gian phản hồi (response time).

* Backend nhận kết quả → SM-2 Engine tính lại EF, interval, repetition count cho cặp (student\_id, question\_id).

* Kết quả được lưu vào bảng sm2\_progress trong PostgreSQL → Analytics Service cập nhật báo cáo.

* Giáo viên và phụ huynh xem dashboard → dữ liệu được đọc từ cache Redis (cập nhật mỗi 15 phút).

| Ghi chú thiết kế:   Vòng lặp học tập trên đảm bảo rằng không có hai học sinh nào nhận được cùng một bộ câu hỏi theo cùng một thứ tự — đây là điểm khác biệt cốt lõi so với hệ thống quiz thông thường (như Google Forms hay Quizlet). |
| :---- |

## **1.7  Yêu cầu phi chức năng (Non-functional Requirements)**

| Tiêu chí | Mục tiêu | Phương án đảm bảo |
| :---- | :---- | :---- |
| **Hiệu năng** | API response \< 300ms (P95) | Redis cache; index PostgreSQL; pagination; lazy loading |
| **Bảo mật** | OWASP Top 10 compliance | JWT expiry 1h; bcrypt password; input validation; rate limiting |
| **Khả năng mở rộng** | Hỗ trợ 500 CCU (học sinh đồng thời) | Stateless backend; connection pooling; Redis session |
| **Độ tin cậy** | Uptime \> 99% | Docker containerization; GitHub Actions CI/CD; health check endpoint |
| **Khả năng bảo trì** | Code coverage \> 70% | Jest unit test; Postman API test; ESLint; module hóa rõ ràng |

## **1.8  Tổng kết Phần 1**

Kiến trúc 3 tầng kết hợp SM-2 Adaptive Engine là nền tảng kỹ thuật vững chắc cho hệ thống luyện tập ngoại ngữ thích ứng. Việc lựa chọn React.js \+ Node.js \+ PostgreSQL đảm bảo sự cân bằng giữa tốc độ phát triển và chất lượng kỹ thuật phù hợp với khuôn khổ đồ án tốt nghiệp.

Điểm mạnh kiến trúc có thể tóm gọn qua 3 đặc điểm:

* Tách biệt rõ ràng: 3 tầng độc lập, 8 module riêng biệt, dễ phân công nhóm và kiểm thử từng phần.

* Core algorithm có cơ sở khoa học: SM-2 được nghiên cứu từ 1987, là nền tảng của Anki và SuperMemo — đảm bảo độ tin cậy về mặt học thuật.

* Hệ sinh thái 3 vai trò: học sinh, giáo viên, phụ huynh — lấp gap mà không có sản phẩm nào trên thị trường Việt Nam đang làm đầy đủ.

| Phần tiếp theo:   Phần 2 sẽ trình bày chi tiết Thiết kế Cơ sở Dữ liệu — bao gồm ERD, schema các bảng chính và cách tổ chức dữ liệu SM-2 progress tracking. |
| :---- |

