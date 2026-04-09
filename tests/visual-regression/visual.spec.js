// tests/visual-regression/visual.spec.js
// ─────────────────────────────────────────────────────────────────────
// Data-Driven Visual Regression Suite
//
// PURPOSE:
//   This suite dynamically reads all endpoints defined in 
//   `endpoints.config.js` and runs a full-page visual regression
//   test against each one.
//
// HOW TO TARGET SPECIFIC ENDPOINTS:
//   Because the test name includes the endpoint `id`, you can run 
//   a specific endpoint using the --grep flag:
//     npm run test:visual:device "chromium-desktop" -- -g "[homepage]"
//     npm run update:baseline:device "chromium-desktop" -- -g "[homepage]"
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('../fixtures/base-fixtures');
const endpoints = require('../../endpoints.config');

test.describe('Visual Regression Suite', () => {

  // ── Loop through each endpoint configured in endpoints.config.js ──
  for (const endpoint of endpoints) {
    
    // Title is static to avoid worker-process crashes.
    // [id] is preserved for CLI filtering (grep).
    test(`[${endpoint.id}] Visual Regression Check`, async ({ page, waitForPageStable }) => {
      
      const updateMode = test.info().config.updateSnapshots;
      const isUpdating = updateMode === 'all' || process.env.VISUAL_UPDATE === 'true';
      const projectName = test.info().project.name;
      const fs = require('fs');
      const path = require('path');
      const metadataPath = path.resolve(__dirname, '../../golden-baselines/LAST_UPDATED.json');

      // Helper to manage metadata
      const getMetadata = () => {
        try { return fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : {}; }
        catch (e) { return {}; }
      };

      // 1. Initial Step: Indicate the operation mode and last update time
      await test.step(isUpdating ? `Updating Golden Baseline for ${endpoint.id}` : `Comparing ${endpoint.id} against Baseline`, async () => {
        const metadata = getMetadata();
        const lastUpdated = metadata[endpoint.id]?.[projectName];
        
        // Add Annotation to the Report
        test.info().annotations.push({
          type: 'Baseline Freshness',
          description: lastUpdated ? `Last Updated: ${lastUpdated}` : 'Baseline timestamp not recorded yet'
        });

        test.info().annotations.push({
          type: 'Mode',
          description: isUpdating ? 'Creating/Updating Golden Baselines' : 'Comparing live page against Goldens'
        });

        console.log(`${isUpdating ? 'CAPTURE' : 'TEST'} | ${endpoint.id} | ${endpoint.path} | Project: ${projectName}`);
      });

      // Update metadata only during capture mode
      // This runs at the end of the test, ensuring it only updates if capture finishes.
      if (isUpdating) {
        const metadata = getMetadata();
        if (!metadata[endpoint.id]) metadata[endpoint.id] = {};
        metadata[endpoint.id][projectName] = new Date().toLocaleString();
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }

      await test.step('Verifying Golden Baseline exists', async () => {
        if (isUpdating) return;

        const expectedPath = test.info().snapshotPath(`${endpoint.id}-full.png`);
        const fs = require('fs');

        if (!fs.existsSync(expectedPath)) {
          throw new Error(`\n\n🚨 BASELINE MISSING 🚨\nNo Golden Baseline found for '${endpoint.id}'.\n\nACTION REQUIRED:\n1. Review the webpage manually.\n2. Run: npm run update:baseline -- -g "[${endpoint.id}]"\n`);
        }
      });

      await test.step(`Navigating to ${endpoint.path}`, async () => {
        try {
          const response = await page.goto(endpoint.path);
          if (!response || response.status() >= 400) {
            throw new Error(`\n\n⚠️ NAVIGATION FAILURE ⚠️\nCould not reach: ${endpoint.path} (Status: ${response ? response.status() : 'N/A'})\n`);
          }
        } catch (error) {
          if (error.message.includes('NAVIGATION FAILURE')) throw error;
          throw new Error(`\n\n⚠️ CONNECTION ERROR ⚠️\nFailed to connect to: ${endpoint.path}\nError: ${error.message}\n`);
        }
      });

      const { globalMasks } = await test.step('Waiting for page to fully stabilize', async () => {
        try {
          return await waitForPageStable();
        } catch (error) {
          throw new Error(`\n\n⏳ STABILITY TIMEOUT ⏳\nThe page did not stop shifting/loading. Check for infinite animations.\n`);
        }
      });

      // 2. Screenshot Step: Use requested wording
      const screenshotStepName = isUpdating 
        ? `Creating/Updating baseline [${endpoint.id}]`
        : `Comparing with baseline [${endpoint.id}]`;

      await test.step(screenshotStepName, async () => {
        const mismatchError = `\n\n❌ VISUAL MISMATCH DETECTED ❌\nThe live page for '${endpoint.id}' has changed!\n\nACTION: Run 'npm run report' to see the Diff.\n`;

        await expect(page, mismatchError).toHaveScreenshot(`${endpoint.id}-full.png`, {
          fullPage: true,
          mask: (globalMasks || []).map(s => page.locator(s)),
          timeout: 30_000,      // HARD OVERRIDE: 30s for the capture
          animations: 'disabled',
          scale: 'css',
        });
      });

    });
  }
});
