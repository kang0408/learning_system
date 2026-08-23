import { getBrowserInstance } from '../../lib/puppeteer';
import { generateClassReportHtml } from './templates/class-report.template';
import { CompleteClassReportData } from './class-report.service';
import { generateStudentReportHtml } from './templates/student-report.template';
import { CompleteStudentReportData } from './student-report.service';

export class PdfGeneratorService {
  /**
   * Generates a high-resolution 300 DPI vector PDF report from aggregated class data.
   */
  async generateClassReportPdf(reportData: CompleteClassReportData): Promise<Buffer> {
    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    try {
      // 1. Set A4 true scale (800px width matches 210mm A4) with 2x Retina scale
      await page.setViewport({ width: 800, height: 1130, deviceScaleFactor: 2 });

      // 2. Set HTML content and wait for network/assets
      const htmlContent = generateClassReportHtml(reportData);
      await page.setContent(htmlContent, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000
      });

      // 3. Wait for Chart.js rendering flag
      try {
        await page.waitForFunction('window.chartRenderComplete === true', { timeout: 10000 });
      } catch (err) {
        // Fallback if chart flag took too long, continue rendering
      }

      // 4. Print to A4 PDF Buffer
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '14mm',
          left: '12mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width: 100%; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 12mm; font-family: sans-serif;">
            <span>Tài liệu nội bộ - Quản lý Giáo dục</span>
            <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>
        `
      });

      return Buffer.from(pdfUint8Array);
    } finally {
      await page.close();
    }
  }

  /**
   * Generates a high-resolution 300 DPI vector PDF diagnostic report for an individual student.
   */
  async generateStudentReportPdf(reportData: CompleteStudentReportData): Promise<Buffer> {
    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    try {
      // 1. Set A4 true scale with 2x Retina scale
      await page.setViewport({ width: 800, height: 1130, deviceScaleFactor: 2 });

      // 2. Set HTML content and wait for assets
      const htmlContent = generateStudentReportHtml(reportData);
      await page.setContent(htmlContent, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000
      });

      // 3. Wait for Chart.js rendering flag
      try {
        await page.waitForFunction('window.chartRenderComplete === true', { timeout: 10000 });
      } catch (err) {
        // Fallback if chart flag took too long
      }

      // 4. Print to A4 PDF Buffer
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '14mm',
          left: '12mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width: 100%; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 12mm; font-family: sans-serif;">
            <span>Hồ sơ Chẩn đoán Năng lực Học tập Cá nhân</span>
            <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>
        `
      });

      return Buffer.from(pdfUint8Array);
    } finally {
      await page.close();
    }
  }
}

