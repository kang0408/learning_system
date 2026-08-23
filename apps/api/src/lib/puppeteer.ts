import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';

let browserInstance: Browser | null = null;

function getSystemChromePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const path of candidatePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return undefined;
}

/**
 * Returns a singleton instance of Chromium browser for PDF rendering.
 * Configured with memory-efficient and sandbox-safe flags.
 */
export async function getBrowserInstance(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const executablePath = getSystemChromePath();

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
  }

  if (!browserInstance) {
    throw new Error('Failed to initialize Puppeteer browser instance');
  }

  return browserInstance;
}

/**
 * Gracefully closes the browser instance on process termination.
 */
export async function closeBrowserInstance(): Promise<void> {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}
