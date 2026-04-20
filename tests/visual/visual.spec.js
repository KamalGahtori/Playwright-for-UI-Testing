// tests/visual/visual.spec.js
// ─────────────────────────────────────────────────────────────────────
// Visual Integrity Audit
//
// One test per endpoint. Each test:
//   1. Navigates to the page.
//   2. preparePage  — three-pass load strategy: force lazy assets, scroll
//                     to trigger IntersectionObserver, wait for every
//                     image to decode, wait for layout to stabilise.
//   3. stabilizePage — 5-phase pipeline: dismiss banners, behavioural
//                      volatility scan, hide widgets, freeze animations,
//                      build mask list.
//   4. toHaveScreenshot — one fullPage:true screenshot compared against
//                         the golden baseline.
//
// WHAT IS TESTED (always in the pixel diff):
//   Text content, alignment, padding, spacing, font sizes/weights/colours,
//   images, logos, component layout from header to footer.
//
// WHAT IS MASKED (excluded from the pixel diff):
//   Carousel/slider tracks and position indicators, auto-incrementing
//   counters, chat widgets, popups, CAPTCHA (question + input), videos,
//   anything that changed its own text or CSS transform in 500ms.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('../../utils/base-fixtures');
const endpoints        = require('../../endpoints.config');

const fs   = require('fs');
const path = require('path');

test.describe('Visual Integrity Audit', () => {

  for (const endpoint of endpoints) {

    test(`[${endpoint.id}] Full-Page Visual Check`, async ({ page, preparePage, stabilizePage }) => {

      // ── Determine run mode ─────────────────────────────────────────
      // test.info().config.updateSnapshots reflects the --update-snapshots
      // CLI flag. VISUAL_UPDATE env var is set by the npm update:baseline
      // scripts so the mode annotation is accurate even when the flag
      // is passed indirectly.
      const updateMode  = test.info().config.updateSnapshots;
      const isUpdating  = updateMode === 'all' || process.env.VISUAL_UPDATE === 'true';
      const projectName = test.info().project.name;

      // LAST_UPDATED.json tracks when each baseline was last captured,
      // keyed by { [endpoint.id]: { [projectName]: timestamp } }.
      const metadataPath = path.resolve(__dirname, '../../golden-baselines/LAST_UPDATED.json');

      // ── Metadata helpers ───────────────────────────────────────────
      const getMetadata = () => {
        try {
          return fs.existsSync(metadataPath)
            ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
            : {};
        } catch { return {}; }
      };

      // ── Mode annotation (shown in HTML report) ─────────────────────
      await test.step('Recording Run Metadata', async () => {
        const metadata    = getMetadata();
        const lastUpdated = metadata[endpoint.id]?.[projectName];

        // Annotations appear in the Playwright HTML report alongside the test.
        test.info().annotations.push({
          type: 'Baseline Freshness',
          description: lastUpdated ? `Last Updated: ${lastUpdated}` : 'Not yet captured',
        });
        test.info().annotations.push({
          type: 'Mode',
          description: isUpdating ? 'Capturing Golden Baseline' : 'Comparing Against Baseline',
        });

        console.log(`${isUpdating ? 'CAPTURE' : 'TEST'} | [${endpoint.id}] | ${endpoint.path} | ${projectName}`);
      });

      // ── Write timestamp when capturing a new baseline ──────────────
      if (isUpdating) {
        const metadata = getMetadata();
        if (!metadata[endpoint.id]) metadata[endpoint.id] = {};
        metadata[endpoint.id][projectName] = new Date().toLocaleString();
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }

      // ── Guard: baseline must exist before comparison mode runs ─────
      // Fail early with a clear message instead of letting Playwright
      // throw a cryptic "snapshot doesn't exist" error.
      await test.step('Verifying Baseline Exists', async () => {
        if (isUpdating) return; // skip check when capturing
        const expectedPath = test.info().snapshotPath(`${endpoint.id}.png`);
        if (!fs.existsSync(expectedPath)) {
          throw new Error(
            `\n\n🚨 BASELINE MISSING 🚨\n` +
            `No golden baseline found for '${endpoint.id}' on project '${projectName}'.\n\n` +
            `ACTION REQUIRED:\n` +
            `  npm run update:baseline -- -g "[${endpoint.id}]"\n`
          );
        }
      });

      // ── Navigate ───────────────────────────────────────────────────
      await test.step(`Navigating to ${endpoint.path}`, async () => {
        try {
          const response = await page.goto(endpoint.path);
          // Treat 4xx/5xx responses as hard failures so the test does not
          // proceed to screenshot a broken/empty error page.
          if (!response || response.status() >= 400) {
            throw new Error(
              `\n\n⚠️ NAVIGATION FAILURE ⚠️\n` +
              `Could not reach: ${endpoint.path} (HTTP ${response?.status() ?? 'N/A'})\n`
            );
          }
        } catch (error) {
          if (error.message.includes('NAVIGATION FAILURE')) throw error;
          // Network-level failures (DNS, refused connection) produce a
          // different error type — wrap them for a consistent message.
          throw new Error(
            `\n\n⚠️ CONNECTION ERROR ⚠️\n` +
            `Failed to connect to: ${endpoint.path}\n` +
            `Error: ${error.message}\n`
          );
        }
      });

      // ── Phase 1: Full page warm-up ─────────────────────────────────
      // Scrolls the entire page, forces all lazy assets to load, and
      // waits for layout to stop shifting. Returns to top when done.
      const { stabilizationTime } = await test.step('Preparing Page (Load All Assets)', async () => {
        return await preparePage();
      });

      test.info().annotations.push({
        type: 'Page Load Time',
        description: `${stabilizationTime}s`,
      });

      // ── Phase 2: Stabilisation ─────────────────────────────────────
      // Runs the 5-phase volatility pipeline across the full page:
      // dismiss → scan → hide → freeze → mask. Returns the mask selector
      // list and a report of what was detected.
      const { maskSelectors, dismissedOverlays, hiddenWidgets, frozenContainers, volatileDetected } =
        await test.step('Stabilising Page (Detect & Mask Dynamic Content)', async () => {
          return await stabilizePage();
        });

      // Stabilisation summary is visible in the HTML report.
      test.info().annotations.push({
        type: 'Stabilisation Report',
        description: [
          `Volatile (behavioural): ${volatileDetected}`,
          `Frozen (animations): ${frozenContainers.length}`,
          `Hidden (widgets): ${hiddenWidgets.length}`,
          `Dismissed (banners): ${dismissedOverlays.length}`,
          `Mask selectors: ${maskSelectors.length}`,
        ].join(' | '),
      });

      // ── Screenshot comparison ──────────────────────────────────────
      const screenshotLabel = isUpdating
        ? `Capturing Golden Baseline [${endpoint.id}]`
        : `Comparing [${endpoint.id}] Against Baseline`;

      await test.step(screenshotLabel, async () => {
        try {
          await expect(page).toHaveScreenshot(`${endpoint.id}.png`, {
            // Capture the entire document height in one image.
            // Playwright scrolls internally — no need to manage scroll position here.
            fullPage: true,

            // maskSelectors is an array of CSS selector strings.
            // page.locator(s) creates a Playwright locator resolved at
            // screenshot time — so late-initialising elements (e.g. carousels
            // loaded by WP Rocket's lazy JS) are correctly masked.
            mask: maskSelectors.map(s => page.locator(s)),

            // Belt-and-braces: disable all CSS animations during screenshot
            // in addition to the [data-vr-frozen] pausing done in Phase 2.
            animations: 'disabled',

            // Tighter per-assertion tolerance than the global 0.03 default.
            // 2% absorbs anti-aliasing and sub-pixel rendering variance.
            maxDiffPixelRatio: 0.02,

            // Full-page renders on mobile can take 30s+ just to scroll and paint.
            timeout: 60_000,
          });
        } catch (err) {
          throw new Error(
            `\n\n❌ VISUAL MISMATCH DETECTED ❌\n` +
            `The live page for '${endpoint.id}' has changed visually.\n\n` +
            `ACTION: Run 'npm run report' to review the pixel diff.\n` +
            `If the change is intentional, re-capture: npm run update:baseline -- -g "[${endpoint.id}]"\n`
          );
        }
      });

    });
  }
});
