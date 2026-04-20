// playwright.config.js
// ─────────────────────────────────────────────────────────────────────
// Playwright Configuration
// Visual Regression, Design Compliance & Content Verification Framework
//
// This file defines:
//   1. All 9 browser-device project combinations
//   2. Viewport sizes and device emulations
//   3. Screenshot comparison thresholds per device category
//   4. Report output (HTML)
//   5. Retry, parallelism, and trace settings
//   6. Environment variable loading from .env
// ─────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// ── Viewport Constants ──────────────────────────────────────────────
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

module.exports = defineConfig({
  // ── Test Directory ──────────────────────────────────────────────────
  testDir: './tests',

  // ── Golden Baseline Directory ───────────────────────────────────────
  snapshotDir: './golden-baselines',

  // ── Retry Policy ────────────────────────────────────────────────────
  retries: parseInt(process.env.RETRIES || '0', 10),

  // ── Parallelism ─────────────────────────────────────────────────────
  // We run synchronously for BOTH tests and updates to ensure 
  // identical timing and environment symmetry.
  fullyParallel: false,
  workers: 2,

  // ── Timeouts ────────────────────────────────────────────────────────
  timeout: 120_000,

  // ── Folder Management ──────────────────────────────────────────────
  // raw artifacts (screenshots of failures, traces) go here:
  outputDir: 'test-results',

  // ── Shared Browser Settings ─────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
  },

  // ── Screenshot Comparison Thresholds ────────────────────────────────
  expect: {
    timeout: 30_000, // Global timeout for all 'expect' assertions
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03, // Global tolerance for all 9 projects
      timeout: 30_000,         // Crucial: 30s for 17k-pixel mobile renders
    },
  },

  // ── Reporter Configuration ──────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // ── Project Definitions ─────────────────────────────────────────────
  // 9 projects total:
  //   3 Desktop (Chromium, Firefox, WebKit @ 1280×720)
  //   3 Mobile  (iPhone 12 Pro, iPhone 8, Galaxy S20 Ultra × Chromium)
  //   3 Tablet  (iPad Air, iPad Mini, iPad Pro × Chromium)
  // ────────────────────────────────────────────────────────────────────
  projects: [

    // ── DESKTOP BROWSERS ──
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium',
        viewport: DESKTOP_VIEWPORT,
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/desktop/{arg}{ext}',
    },
    {
      name: 'firefox-desktop',
      use: {
        browserName: 'firefox',
        viewport: DESKTOP_VIEWPORT,
      },
      snapshotPathTemplate: '{snapshotDir}/firefox/desktop/{arg}{ext}',
    },
    {
      name: 'webkit-desktop',
      use: {
        browserName: 'webkit',
        viewport: DESKTOP_VIEWPORT,
      },
      snapshotPathTemplate: '{snapshotDir}/webkit-desktop/{arg}{ext}',
    },

    // ── MOBILE DEVICES (Chromium Emulation) ──
    {
      name: 'chromium-iphone-8',
      use: {
        ...devices['iPhone 8'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/iphone-8/{arg}{ext}',
    },
    {
      name: 'chromium-iphone-12-pro',
      use: {
        ...devices['iPhone 12 Pro'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/iphone-12-pro/{arg}{ext}',
    },
    {
      name: 'chromium-galaxy-s20-ultra',
      use: {
        ...devices['Galaxy S20 Ultra'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/galaxy-s20-ultra/{arg}{ext}',
    },

    // ── TABLET DEVICES (Chromium Emulation) ──
    {
      name: 'chromium-ipad-air',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-air/{arg}{ext}',
    },
    {
      name: 'chromium-ipad-mini',
      use: {
        ...devices['iPad Mini'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-mini/{arg}{ext}',
    },
    {
      name: 'chromium-ipad-pro',
      use: {
        ...devices['iPad Pro 11'],
        browserName: 'chromium',
      },
      snapshotPathTemplate: '{snapshotDir}/chromium/ipad-pro/{arg}{ext}',
    },
  ],
});
