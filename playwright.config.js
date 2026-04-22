// playwright.config.js
// ─────────────────────────────────────────────────────────────────────
// Global Playwright configuration.
//
// Defines all 9 browser/device projects, screenshot thresholds,
// parallelism settings, timeouts, and the HTML reporter.
// ─────────────────────────────────────────────────────────────────────

require('dotenv').config(); // Load BASE_URL and other vars from .env

const { defineConfig, devices } = require('@playwright/test');

// Desktop viewport used by all three desktop browser projects.
// 1920×1080 matches the most common monitor resolution for a fair
// representation of what a typical user sees.
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

module.exports = defineConfig({

  // Where Playwright looks for test files.
  testDir: './tests',

  // Where golden baseline screenshots are stored and read from.
  // Organised as {snapshotDir}/{browser}/{device}/{page-id}.png
  snapshotDir: './golden-baselines',

  // How many times to retry a failed test before marking it failed.
  // Defaults to 0 (no retries). Can be overridden via RETRIES env var
  // if you want CI to retry flaky network conditions.
  retries: parseInt(process.env.RETRIES || '0', 10),

  // ── Parallelism ───────────────────────────────────────────────────
  // Both settings are intentionally conservative.
  //
  // fullyParallel: false — tests within a file run one at a time.
  // workers: 2           — at most 2 test files run simultaneously.
  //
  // Visual regression tests must be reproducible. Running too many
  // browser instances in parallel causes CPU/GPU contention which
  // produces slightly different rendering output between the baseline
  // capture run and the comparison run, leading to false failures.
  fullyParallel: true,
  workers: 5,

  // Hard ceiling for any single test (navigation + warm-up + screenshot).
  // Heavy product pages with many images (e.g. Dashboard-Ninja-with-AI) can
  // take 2-3 minutes for the three-pass load + volatility scan + screenshot.
  timeout: 300_000,

  // Where Playwright writes raw per-test artifacts (failure screenshots,
  // traces). Excluded from git via .gitignore.
  outputDir: 'test-results',

  // ── Settings shared across all projects ───────────────────────────
  use: {
    baseURL: process.env.BASE_URL, // Read from .env — e.g. https://www.ksolves.com/

    // Record a trace only on the first retry, keeping storage low.
    // View traces with: npx playwright show-trace trace.zip
    trace: 'on-first-retry',

    // Capture a screenshot only when a test fails (for the HTML report).
    screenshot: 'only-on-failure',

    // How long to wait for a single action (click, fill, etc.) to complete.
    actionTimeout: 30_000,
  },

  // ── Screenshot comparison thresholds ──────────────────────────────
  expect: {
    // How long toHaveScreenshot() waits before giving up.
    // Must be long enough for Playwright to scroll and render a full
    // mobile page — large pages can take 30s+ just to screenshot.
    timeout: 30_000,

    toHaveScreenshot: {
      // Allow up to 3% of pixels to differ before a test fails.
      // This absorbs sub-pixel anti-aliasing and minor font rendering
      // variance between operating systems. It does NOT absorb real
      // design changes. The per-assertion override in visual.spec.js
      // tightens this to 2% for actual comparisons.
      maxDiffPixelRatio: 0.03,

      // Separate timeout for the screenshot assertion itself.
      // Mirrors the expect.timeout above.
      timeout: 30_000,
    },
  },

  // ── Reporter ──────────────────────────────────────────────────────
  reporter: [
    ['list'],  // Prints each test result to the terminal as it runs
    // Generates an interactive HTML report with side-by-side diff images.
    // open: 'never' means it does not auto-launch after the run — use
    // `npm run report` to open it manually.
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // ── Browser / device projects ─────────────────────────────────────
  // 9 projects total:
  //   3 Desktop  — Chromium, Firefox, WebKit at 1920×1080
  //   3 Mobile   — iPhone 8, iPhone 12 Pro, Galaxy S20 Ultra (Chromium emulation)
  //   3 Tablet   — iPad Air, iPad Mini, iPad Pro (Chromium emulation)
  //
  // snapshotPathTemplate tells Playwright where to read/write baselines for
  // each project. {snapshotDir} = './golden-baselines', {arg} = page id,
  // {ext} = '.png'.
  projects: [

    // ── DESKTOP ───────────────────────────────────────────────────
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: DESKTOP_VIEWPORT },
      snapshotPathTemplate: '{snapshotDir}/chromium/desktop/{arg}{ext}',
    },
    {
      name: 'firefox-desktop',
      use: { browserName: 'firefox', viewport: DESKTOP_VIEWPORT },
      snapshotPathTemplate: '{snapshotDir}/firefox/desktop/{arg}{ext}',
    },
    {
      name: 'webkit-desktop',
      // WebKit is Apple's browser engine (used by Safari). Testing it on
      // desktop catches Safari-specific rendering quirks (font metrics,
      // CSS property support, image decoding differences).
      use: { browserName: 'webkit', viewport: DESKTOP_VIEWPORT },
      snapshotPathTemplate: '{snapshotDir}/webkit-desktop/{arg}{ext}',
    },

    // ── MOBILE (Chromium emulation) ────────────────────────────────
    // Spread operator pulls in the full device profile from Playwright's
    // built-in device registry: viewport size, device pixel ratio,
    // user-agent string, touch support, etc.
    {
      name: 'chromium-iphone-8',
      use: { ...devices['iPhone 8'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/iphone-8/{arg}{ext}',
    },
    {
      name: 'chromium-iphone-12-pro',
      use: { ...devices['iPhone 12 Pro'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/iphone-12-pro/{arg}{ext}',
    },
    {
      name: 'chromium-galaxy-s20-ultra',
      use: { ...devices['Galaxy S20 Ultra'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/galaxy-s20-ultra/{arg}{ext}',
    },

    // ── TABLET (Chromium emulation) ────────────────────────────────
    {
      name: 'chromium-ipad-air',
      // Playwright's 'iPad (gen 7)' profile maps to the standard iPad
      // viewport (810×1080 portrait). Named 'ipad-air' in our project
      // for clarity.
      use: { ...devices['iPad (gen 7)'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-air/{arg}{ext}',
    },
    {
      name: 'chromium-ipad-mini',
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-mini/{arg}{ext}',
    },
    {
      name: 'chromium-ipad-pro',
      use: { ...devices['iPad Pro 11'], browserName: 'chromium' },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-pro/{arg}{ext}',
    },
  ],
});
