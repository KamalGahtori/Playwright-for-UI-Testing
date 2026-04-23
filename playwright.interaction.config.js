// playwright.interaction.config.js
// ─────────────────────────────────────────────────────────────────────
// Playwright configuration exclusively for the interaction audit suite.
//
// Kept separate from playwright.config.js (visual tests) so the two
// suites can run simultaneously without sharing artifacts, report
// folders, or timeouts.
//
// Key differences from visual config:
//   • timeout: 4 hours  — one test drives a full-site Crawlee crawl
//   • workers: 1        — single test, no parallelism needed
//   • outputDir: interaction-results/  (not test-results/)
//   • reporter → interaction-report/   (not playwright-report/)
//   • trace/screenshot: off — Crawlee manages its own browser + screenshots
// ─────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir:       './tests/interaction',
  timeout:       4 * 60 * 60 * 1000,  // 4 hours — full-site crawl
  retries:       0,
  fullyParallel: false,
  workers:       1,
  outputDir:     'interaction-results',

  use: {
    baseURL:       process.env.BASE_URL,
    actionTimeout: 30_000,
    trace:         'off',
    screenshot:    'off',
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'interaction-report', open: 'never' }],
  ],

  projects: [
    {
      name: 'chromium-desktop',
      use:  { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
  ],
});
