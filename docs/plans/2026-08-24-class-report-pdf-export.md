# Kế hoạch Triển khai: Xuất Báo Cáo Toàn Diện Lớp Học (PDF) Chuẩn Học Thuật

> **For Agent/Engineer:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` hoặc `subagent-driven-development` để thực thi kế hoạch này theo từng tác vụ nguyên tử (bite-sized tasks).

**Mục tiêu (Goal):** Xây dựng tính năng xuất báo cáo toàn diện lớp học định dạng PDF chất lượng cao tại Server-side (Backend) sử dụng Puppeteer + Chart.js + Gemini AI, tuân thủ nghiêm ngặt phong cách báo cáo học thuật (nghiêm cấm emoji, hạn chế icon), tạo ra bản in A4 vector 300 DPI hoàn hảo không lỗi ngắt trang.

**Kiến trúc (Architecture):** 
1. **Aggregator Service**: Tổng hợp dữ liệu từ PostgreSQL (`AnalyticsRepository`, `Class`, `Assignments`, `Sm2Progress`).
2. **AI Pedagogical Engine**: Gọi Google Gemini AI (có Redis Cache 24h) sinh phân tích sư phạm chuyên sâu 4 phần với Zod Schema xác thực chặt chẽ.
3. **HTML-to-PDF Template Engine**: Render template HTML/CSS A4 chuẩn in ấn, nhúng Chart.js (với `animation: false`, `deviceScaleFactor: 2`), Puppeteer in ra PDF Buffer.
4. **Teacher UI**: Nút xuất báo cáo trên `ClassHeader` kèm Modal xem trước và tải file PDF.

**Tech Stack:** Express.js, TypeScript, Prisma ORM, Puppeteer, Chart.js, `@google/genai`, Redis, React, Tailwind CSS, i18next, Jest.

---

## Danh Sách Tác Vụ Triển Khai (Tasks)

### Task 1: Cài đặt Thư viện Puppeteer & Cấu hình Chromium Instance Pool

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/lib/puppeteer.ts`
- Test: `apps/api/src/lib/__tests__/puppeteer.test.ts`

**Step 1: Viết test kiểm tra khởi tạo và tái sử dụng Puppeteer Browser**

```typescript
// apps/api/src/lib/__tests__/puppeteer.test.ts
import { getBrowserInstance, closeBrowserInstance } from '../puppeteer';

describe('Puppeteer Browser Pool', () => {
  afterAll(async () => {
    await closeBrowserInstance();
  });

  it('should create and return a valid browser instance', async () => {
    const browser = await getBrowserInstance();
    expect(browser).toBeDefined();
    expect(browser.isConnected()).toBe(true);
  });
});
```

**Step 2: Chạy test để xác nhận test thất bại (Red)**
Run: `npm test -- apps/api/src/lib/__tests__/puppeteer.test.ts`
Expected: FAIL (Module not found)

**Step 3: Cài đặt package & Viết code triển khai tối ưu**
1. Cài đặt Puppeteer trong `apps/api`:
```bash
npm install puppeteer --save --workspace=@learning-system/api
npm install @types/puppeteer --save-dev --workspace=@learning-system/api
```
2. Triển khai singleton browser instance trong `apps/api/src/lib/puppeteer.ts`:
```typescript
import puppeteer, { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;

export async function getBrowserInstance(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none'
      ]
    });
  }
  return browserInstance;
}

export async function closeBrowserInstance(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}
```

**Step 4: Chạy test xác nhận vượt qua (Green)**
Run: `npm test -- apps/api/src/lib/__tests__/puppeteer.test.ts`
Expected: PASS

---

### Task 2: Mở rộng AI Service - Phân Tích Sư Phạm Chuyên Sâu 4 Phần

**Files:**
- Modify: `apps/api/src/modules/ai/ai.service.ts`
- Modify: `apps/api/src/modules/ai/ai.repository.ts`
- Test: `apps/api/src/modules/ai/__tests__/ai.report.test.ts`

**Step 1: Viết test cho phương thức `generateComprehensiveClassReport`**

```typescript
// apps/api/src/modules/ai/__tests__/ai.report.test.ts
import { AiService } from '../ai.service';
import { AiCacheRepository } from '../ai-cache.repository';
import { AiRepository } from '../ai.repository';

describe('AiService.generateComprehensiveClassReport', () => {
  let aiService: AiService;
  let mockCacheRepo: any;
  let mockAiRepo: any;

  beforeEach(() => {
    mockCacheRepo = { get: jest.fn(), setEx: jest.fn() };
    mockAiRepo = { createClassReport: jest.fn(), getLatestClassReport: jest.fn() };
    aiService = new AiService(mockCacheRepo, mockAiRepo);
  });

  it('should return cached report if available in Redis', async () => {
    const cachedData = {
      executive_summary: 'Tổng quan tốt',
      strengths_and_weaknesses: 'Nắm vững từ vựng',
      sm2_learning_analysis: 'Trí nhớ dài hạn ổn định',
      pedagogical_action_plan: ['Ôn tập thì quá khứ']
    };
    mockCacheRepo.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await aiService.generateComprehensiveClassReport('class-123', {});
    expect(result).toEqual(cachedData);
    expect(mockCacheRepo.get).toHaveBeenCalled();
  });
});
```

**Step 2: Chạy test xác nhận lỗi (Red)**
Run: `npm test -- apps/api/src/modules/ai/__tests__/ai.report.test.ts`

**Step 3: Triển khai phương thức AI với Prompt học thuật nghiêm ngặt trong `ai.service.ts`**

```typescript
// Thêm vào AiService:
async generateComprehensiveClassReport(classId: string, statsData: any): Promise<{
  executive_summary: string;
  strengths_and_weaknesses: string;
  sm2_learning_analysis: string;
  pedagogical_action_plan: string[];
} | null> {
  const todayStr = new Date().toISOString().split('T')[0];
  const cacheKey = `ai:class-report:comprehensive:${classId}:${todayStr}`;

  try {
    // 1. Kiểm tra cache
    const cached = await this.aiCacheRepo.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Tạo prompt học thuật chuyên sâu
    const prompt = `Bạn là một Chuyên gia Đánh giá và Kiểm định Chất lượng Giáo dục cấp cao.
Hãy phân tích bộ dữ liệu thống kê học tập của lớp học dưới đây và viết một bản Báo cáo Đánh giá Sư phạm Chuyên sâu:

DỮ LIỆU THỐNG KÊ LỚP HỌC:
${JSON.stringify(statsData, null, 2)}

YÊU CẦU NGHIÊM NGẶT VỀ VĂN PHONG VÀ ĐỊNH DẠNG:
1. TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ BIỂU TƯỢNG CẢM XÚC (EMOJI) HOẶC KÝ TỰ ICON NÀO.
2. Sử dụng tiếng Việt trang trọng, học thuật, chuẩn mực văn bản hành chính giáo dục.
3. Phân tích chi tiết, sâu sắc, lập luận dựa trên số liệu thực tế, tránh các nhận xét chung chung.

Báo cáo gồm 4 phần và trả về ĐÚNG định dạng JSON sau:
{
  "executive_summary": "Phân tích 150-200 từ về bức tranh tổng thể năng lực, sự chuyên cần và độ hoàn thành bài tập của cả lớp.",
  "strengths_and_weaknesses": "Phân tích 200-250 từ chỉ rõ các chuyên đề/chủ đề lớp đã làm chủ và mổ xẻ nguyên nhân các chuyên đề có tỷ lệ sai cao.",
  "sm2_learning_analysis": "Phân tích 150-200 từ về khả năng ghi nhớ dài hạn theo mô hình Spaced Repetition SM2 (tỷ lệ kiến thức vùng nguy cơ quên và nhóm học sinh cần lưu ý).",
  "pedagogical_action_plan": [
    "Khuyến nghị hành động 1: Cụ thể về thời lượng và chuyên đề cần bổ trợ",
    "Khuyến nghị hành động 2: Kế hoạch giao bài tập củng cố phân hóa",
    "Khuyến nghị hành động 3: Phương án kèm cặp học sinh vùng nguy cơ"
  ]
}`;

    const { response } = await generateContentWithFallback(this.ai, { contents: prompt });
    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
    const parsed = JSON.parse(jsonStr);

    // 3. Cache 24 giờ trong Redis
    await this.aiCacheRepo.setEx(cacheKey, 86400, JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}
```

**Step 4: Chạy test xác nhận vượt qua (Green)**
Run: `npm test -- apps/api/src/modules/ai/__tests__/ai.report.test.ts`

---

### Task 3: Xây dựng Service Tổng Hợp Dữ Liệu Báo Cáo Toàn Diện (`ClassReportService`)

**Files:**
- Create: `apps/api/src/modules/classes/class-report.service.ts`
- Modify: `apps/api/src/modules/analytics/analytics.repository.ts`
- Test: `apps/api/src/modules/classes/__tests__/class-report.service.test.ts`

**Step 1: Viết test tổng hợp dữ liệu**

```typescript
// apps/api/src/modules/classes/__tests__/class-report.service.test.ts
import { ClassReportService } from '../class-report.service';

describe('ClassReportService.getCompleteReportData', () => {
  it('should aggregate class info, stats, topics, students, and AI insights', async () => {
    // Mock repos and assert structure
  });
});
```

**Step 2: Triển khai `ClassReportService` trong `apps/api/src/modules/classes/class-report.service.ts`**
- Truy vấn thông tin lớp + Giáo viên.
- Lấy thống kê tổng quan (sĩ số, điểm TB, tỷ lệ tích cực 7 ngày).
- Lấy thống kê SM2 phân bố lớp.
- Lấy danh sách độ chính xác theo chuyên đề (`getTeacherClassTopics`).
- Lấy bảng điểm chi tiết toàn bộ học sinh (`getTeacherClassStudents`).
- Gọi `AiService.generateComprehensiveClassReport`.

---

### Task 4: Thiết Kế HTML/CSS Template Báo Cáo A4 Vector & Chart.js

**Files:**
- Create: `apps/api/src/modules/classes/templates/class-report.template.ts`
- Create: `apps/api/src/modules/classes/templates/report.css.ts`

**Nội dung & Quy chuẩn thiết kế Template:**
1. **Trang 1: Bìa & Thông tin Hành chính + Đánh giá Sư phạm AI**:
   - Header: Tên Hệ thống, Tiêu đề *"BÁO CÁO TOÀN DIỆN CHẤT LƯỢNG LỚP HỌC"*, Mã lớp, Giáo viên, Ngày xuất.
   - Bảng 4 chỉ số KPI chính (Khung viền Slate tối giản, không icon).
   - Khối Đánh giá Sư phạm Chuyên sâu: Nhận định tổng quan, Phân tích lỗ hổng kiến thức.
2. **Trang 2: Hệ thống Biểu đồ Trực quan & Kế hoạch Hành động**:
   - Nhúng thư viện CDN `Chart.js` (hoặc inline JS bundle) vẽ:
     - Biểu đồ Cột ngang: Độ chính xác theo Chuyên đề (Topic Accuracy).
     - Biểu đồ Tròn: Phân bố mức độ ghi nhớ SM2 (New, Learning, Mastered, At-Risk).
   - Khối Kế hoạch Hành động Sư phạm (3–4 gạch đầu dòng do AI đề xuất).
3. **Trang 3+: Bảng Điểm Chi Tiết Toàn Bộ Học Sinh**:
   - Bảng Gradebook chuẩn mực: `STT | Họ và tên | Số bài nộp | Điểm TB | Tỷ lệ chính xác | SM2 Đã làm chủ | Hoạt động gần nhất`.
   - CSS Print: `page-break-inside: avoid;` cho các card và biểu đồ; `thead { display: table-header-group; }` để lặp lại header bảng ở các trang tiếp theo.

---

### Task 5: Xây dựng PDF Generation Engine & API Endpoint

**Files:**
- Create: `apps/api/src/modules/classes/pdf-generator.service.ts`
- Modify: `apps/api/src/modules/classes/classes.controller.ts`
- Modify: `apps/api/src/modules/classes/classes.routes.ts`
- Test: `apps/api/src/modules/classes/__tests__/pdf-generator.test.ts`

**Step 1: Triển khai `PdfGeneratorService`**

```typescript
// apps/api/src/modules/classes/pdf-generator.service.ts
import { getBrowserInstance } from '../../lib/puppeteer';
import { generateClassReportHtml } from './templates/class-report.template';

export class PdfGeneratorService {
  async generateClassReportPdf(reportData: any): Promise<Buffer> {
    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    try {
      // 1. Thiết lập viewport chuẩn A4 Retina (300 DPI)
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

      // 2. Đổ HTML và dữ liệu
      const htmlContent = generateClassReportHtml(reportData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

      // 3. Đợi Chart.js vẽ xong hoàn toàn
      await page.waitForFunction(() => (window as any).chartRenderComplete === true, { timeout: 10000 });

      // 4. Xuất PDF khổ A4 chuẩn in ấn
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width: 100%; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; padding: 0 15mm; font-family: 'Inter', sans-serif;">
            <span>Tài liệu nội bộ - Hệ thống Quản lý Học tập</span>
            <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>
        `
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }
}
```

**Step 2: Thêm Endpoint trong Controller & Routes**
- Route: `GET /api/v1/classes/:id/report/pdf` (Middleware: `requireAuth`, `requireTeacherRole`).
- Headers trả về:
  ```typescript
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_Cao_Lop_${safeClassName}_${dateStr}.pdf"`);
  res.send(pdfBuffer);
  ```

---

### Task 6: Tích Hợp Giao Diện Giáo Viên (Teacher Web UI)

**Files:**
- Modify: `apps/web/src/features/teacher/class-detail/components/ClassHeader.tsx`
- Create: `apps/web/src/features/teacher/class-detail/components/ExportReportModal.tsx`
- Modify: `apps/web/src/features/teacher/class-detail/api/classDetailApi.ts`
- Modify: `apps/web/src/locales/vi.json` & `apps/web/src/locales/en.json`

**Các bước thực hiện:**
1. Thêm nút **"Xuất Báo Cáo"** (Nút phong cách Brutalism/Corporate đồng bộ với hệ thống) trong `ClassHeader.tsx`.
2. Tạo Modal `ExportReportModal`:
   - Hiển thị tóm tắt các mục sẽ có trong báo cáo PDF.
   - Nút **"Tải Báo Cáo PDF"** (kèm Spinner và trạng thái downloading).
   - Sử dụng `classDetailApi.downloadClassPdfReport(classId)` kích hoạt tải file dạng blob trực tiếp trên trình duyệt.
3. Thêm bản dịch đa ngôn ngữ cho Tiếng Việt và Tiếng Anh trong `locales`.

---

### Task 7: Kiểm Thử E2E & Tối Ưu Hóa Render

**Quy trình kiểm thử:**
1. **Kiểm thử chất lượng PDF**: Mở file PDF xuất ra trên Adobe Acrobat / Chrome để kiểm tra độ sắc nét biểu đồ, độ chính xác của font chữ tiếng Việt Unicode.
2. **Kiểm thử ngắt trang (Page Break)**: Đảm bảo bảng danh sách học sinh ngắt trang mượt mà, lặp lại tiêu đề bảng ở đầu trang tiếp theo.
3. **Kiểm thử Redis Cache**: Bấm xuất PDF 2 lần liên tiếp, đảm bảo lần 2 phản hồi nhanh tức thì (dưới 1.5s) do đã cache kết quả phân tích AI.

---

## Lựa Chọn Thực Thi (Execution Handoff)

Kế hoạch đã được hoàn thiện và lưu tại `docs/plans/2026-08-24-class-report-pdf-export.md`. Bạn muốn triển khai theo hình thức nào?

1. **Subagent-Driven (Thực hiện trực tiếp trong phiên này)**: Tôi sẽ tự động chia nhỏ và thực thi từng task từ Task 1 đến Task 7, kiểm thử sau mỗi task và báo cáo tiến độ.
2. **Review & Chỉnh sửa thêm**: Bạn xem lại kế hoạch và góp ý chỉnh sửa bất kỳ phần nào trước khi bắt đầu code.
