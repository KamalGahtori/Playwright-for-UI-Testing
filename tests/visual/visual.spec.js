// tests/visual/visual.spec.js
// ─────────────────────────────────────────────────────────────────────
// Structural & Aesthetic Integrity Audit
//
// STRATEGY — Scroll to Load, Then Capture Once:
//   1. Navigate to the page.
//   2. preparePage  : scroll the full page to trigger every lazy loader,
//                     wait for every image to decode, wait for layout
//                     to stop shifting. Returns to top when done.
//   3. stabilizePage: run the full volatility pipeline on the entire page —
//                     dismiss banners, behavioral scan, hide widgets,
//                     freeze animations, build mask list.
//   4. ONE fullPage:true screenshot per page.
//
// WHAT IS TESTED:
//   - Text content (any copy change fails the test)
//   - Alignment, spacing, padding, margins
//   - Images and logos (fully loaded, correct position)
//   - Font sizes, weights, and colors
//   - Component layout from header to footer
//
// WHAT IS MASKED (ignored in comparison):
//   - Carousel/slider inner tracks (outer container layout is still tested)
//   - Auto-incrementing counters
//   - Chat widgets and popups
//   - CAPTCHA — both the math question AND the input field
//   - Video elements
//   - Any element that changed content/position in the 500ms scan window
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('../../utils/base-fixtures');
const endpoints        = require('../../endpoints.config');

const fs   = require('fs');
const path = require('path');

test.describe('Visual Integrity Audit', () => {

  for (const endpoint of endpoints) {

    test(`[${endpoint.id}] Full-Page Visual Check`, async ({ page, preparePage, stabilizePage }) => {

      const updateMode  = test.info().config.updateSnapshots;
      const isUpdating  = updateMode === 'all' || process.env.VISUAL_UPDATE === 'true';
      const projectName = test.info().project.name;
      const metadataPath = path.resolve(__dirname, '../../golden-baselines/LAST_UPDATED.json');

      // ── Metadata helpers ──────────────────────────────────────────
      const getMetadata = () => {
        try {
          return fs.existsSync(metadataPath)
            ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
            : {};
        } catch { return {}; }
      };

      // ── Mode annotation ───────────────────────────────────────────
      await test.step('Recording Run Metadata', async () => {
        const metadata    = getMetadata();
        const lastUpdated = metadata[endpoint.id]?.[projectName];

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

      // ── Write baseline timestamp ──────────────────────────────────
      if (isUpdating) {
        const metadata = getMetadata();
        if (!metadata[endpoint.id]) metadata[endpoint.id] = {};
        metadata[endpoint.id][projectName] = new Date().toLocaleString();
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }

      // ── Guard: baseline must exist before test mode runs ─────────
      await test.step('Verifying Baseline Exists', async () => {
        if (isUpdating) return;
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

      // ── Navigate ──────────────────────────────────────────────────
      await test.step(`Navigating to ${endpoint.path}`, async () => {
        try {
          const response = await page.goto(endpoint.path);
          if (!response || response.status() >= 400) {
            throw new Error(
              `\n\n⚠️ NAVIGATION FAILURE ⚠️\n` +
              `Could not reach: ${endpoint.path} (HTTP ${response?.status() ?? 'N/A'})\n`
            );
          }
        } catch (error) {
          if (error.message.includes('NAVIGATION FAILURE')) throw error;
          throw new Error(
            `\n\n⚠️ CONNECTION ERROR ⚠️\n` +
            `Failed to connect to: ${endpoint.path}\n` +
            `Error: ${error.message}\n`
          );
        }
      });

      // ── Full page warm-up ─────────────────────────────────────────
      // Scrolls, loads, waits for images and layout stability.
      const { stabilizationTime } = await test.step('Preparing Page (Load All Assets)', async () => {
        return await preparePage();
      });

      test.info().annotations.push({
        type: 'Page Load Time',
        description: `${stabilizationTime}s`,
      });

      // ── Full page stabilization ───────────────────────────────────
      // Runs volatility detection once across the entire page.
      const { maskSelectors, dismissedOverlays, hiddenWidgets, frozenContainers, volatileDetected } =
        await test.step('Stabilising Page (Detect & Mask Dynamic Content)', async () => {
          return await stabilizePage();
        });

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

      // ── Single full-page screenshot ───────────────────────────────
      // fullPage: true captures the entire document height in one image.
      // Playwright scrolls internally; page origin is always the top.
      const screenshotLabel = isUpdating
        ? `Capturing Golden Baseline [${endpoint.id}]`
        : `Comparing [${endpoint.id}] Against Baseline`;

      await test.step(screenshotLabel, async () => {
        try {
          await expect(page).toHaveScreenshot(`${endpoint.id}.png`, {
            fullPage:          true,
            mask:              maskSelectors.map(s => page.locator(s)),
            animations:        'disabled',
            maxDiffPixelRatio: 0.02,
            timeout:           60_000, // full-page renders on mobile can take 30s+
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
