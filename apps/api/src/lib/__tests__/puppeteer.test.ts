import { getBrowserInstance, closeBrowserInstance } from '../puppeteer';

describe('Puppeteer Singleton Pool', () => {
  afterAll(async () => {
    await closeBrowserInstance();
  });

  it('should initialize and return connected browser', async () => {
    const browser = await getBrowserInstance();
    expect(browser).toBeDefined();
    expect(browser.connected).toBe(true);

    const version = await browser.version();
    expect(version).toBeTruthy();

    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test Report</h1></body></html>');
    const content = await page.content();
    expect(content).toContain('Test Report');
    await page.close();
  }, 30000);
});
