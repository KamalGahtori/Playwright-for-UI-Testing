require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test'); // devices used when mobile/tablet projects are uncommented

const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

module.exports = defineConfig({
  testDir: './tests',
  snapshotDir: './golden-baselines',
  retries: parseInt(process.env.RETRIES || '0', 10),
  fullyParallel: true,
  workers: 5,
  timeout: 300_000,
  outputDir: 'test-results',

  use: {
    baseURL: process.env.BASE_URL,
    /* Add the custom header for AWS WAF bypass */
    extraHTTPHeaders: {
      'x-waf-bypass-secret': 'a3NvbHZlc3BsYXl3cmlnaHQ=',
    },

    /* Recommended: Also set a standard User-Agent to avoid generic bot detection */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    // Other settings...
    extraHTTPHeaders: {
      'x-test-bypass-token': 'a3NvbHZlc3BsYXl3cmlnaHQ=',
    },
  },

  expect: {
    timeout: 30_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
      timeout: 30_000,
    },
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // ── Active projects ────────────────────────────────────────────────
  // To run more devices: uncomment the relevant block, then run:
  //   npm run baseline
  // to capture baselines before running visual tests.
  projects: [

    // ── Desktop ───────────────────────────────────────────────────────
    { name: 'chromium-desktop', use: { browserName: 'chromium', viewport: DESKTOP_VIEWPORT }, snapshotPathTemplate: '{snapshotDir}/chromium/desktop/{arg}{ext}' },
    // { name: 'firefox-desktop',  use: { browserName: 'firefox',  viewport: DESKTOP_VIEWPORT }, snapshotPathTemplate: '{snapshotDir}/firefox/desktop/{arg}{ext}' },
    // { name: 'webkit-desktop', use: { browserName: 'webkit', viewport: DESKTOP_VIEWPORT }, snapshotPathTemplate: '{snapshotDir}/webkit-desktop/{arg}{ext}' },

    // ── Mobile ────────────────────────────────────────────────────────
    // { name: 'chromium-iphone-8',          use: { ...devices['iPhone 8'],        browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/iphone-8/{arg}{ext}' },
    // { name: 'chromium-iphone-12-pro',     use: { ...devices['iPhone 12 Pro'],   browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/iphone-12-pro/{arg}{ext}' },
    // { name: 'chromium-galaxy-s20-ultra',  use: { ...devices['Galaxy S20 Ultra'],browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/galaxy-s20-ultra/{arg}{ext}' },

    // ── Tablet ────────────────────────────────────────────────────────
    // { name: 'chromium-ipad-air',  use: { ...devices['iPad (gen 7)'], browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/ipad-air/{arg}{ext}' },
    // { name: 'chromium-ipad-mini', use: { ...devices['iPad Mini'],    browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/ipad-mini/{arg}{ext}' },
    // { name: 'chromium-ipad-pro',  use: { ...devices['iPad Pro 11'],  browserName: 'chromium' }, snapshotPathTemplate: '{snapshotDir}/chromium/ipad-pro/{arg}{ext}' },
  ],
});
