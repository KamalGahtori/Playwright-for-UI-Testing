// tests/visual-regression/visual.spec.js
// ─────────────────────────────────────────────────────────────────────
// Data-Driven Visual Regression Suite
//
// PURPOSE:
//   This suite uses a Viewport-by-Viewport execution framework to take 
//   stable piecemeal screenshots. This completely bypasses the Playwright
//   native `fullPage: true` logic which fundamentally breaks aggressive 
//   lazy-loaders (like WP Rocket) and dynamic footer calculations.
// ─────────────────────────────────────────────────────────────────────

const { test, expect } = require('../fixtures/base-fixtures');
const endpoints = require('../../endpoints.config');

test.describe('Visual Regression Suite', () => {

  for (const endpoint of endpoints) {
    
    test(`[${endpoint.id}] Visual Regression Check`, async ({ page, preparePage, stabilizeViewport }) => {
      
      const updateMode = test.info().config.updateSnapshots;
      const isUpdating = updateMode === 'all' || process.env.VISUAL_UPDATE === 'true';
      const projectName = test.info().project.name;
      const fs = require('fs');
      const path = require('path');
      const metadataPath = path.resolve(__dirname, '../../golden-baselines/LAST_UPDATED.json');

      const getMetadata = () => {
        try { return fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : {}; }
        catch (e) { return {}; }
      };

      await test.step(isUpdating ? `Updating Golden Baseline for ${endpoint.id}` : `Comparing ${endpoint.id} against Baseline`, async () => {
        const metadata = getMetadata();
        const lastUpdated = metadata[endpoint.id]?.[projectName];
        
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

      if (isUpdating) {
        const metadata = getMetadata();
        if (!metadata[endpoint.id]) metadata[endpoint.id] = {};
        metadata[endpoint.id][projectName] = new Date().toLocaleString();
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }

      await test.step('Verifying Golden Baseline exists', async () => {
        if (isUpdating) return;
        // In the chunked methodology, we just check if ANY baseline part exists.
        const expectedPath = test.info().snapshotPath(`${endpoint.id}-part-1.png`);
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

      const { stabilizationTime } = await test.step('Preparing Page (Network & Assets)', async () => {
        return await preparePage();
      });

      test.info().annotations.push({
        type: 'Initial Load Time',
        description: `${stabilizationTime} seconds`
      });

      const screenshotStepName = isUpdating 
        ? `Creating/Updating chunked baseline [${endpoint.id}]`
        : `Comparing chunked baseline [${endpoint.id}]`;

      await test.step(screenshotStepName, async () => {
        let currentScroll = 0;
        let partNumber = 1;
        
        let viewportHeight = await page.evaluate(() => window.innerHeight);
        let lastHeight = await page.evaluate(() => document.body.scrollHeight);
        
        const mismatchErrors = [];

        // Loop until we reach the bottom of the page
        while (currentScroll < lastHeight) {
          
          await test.step(`Processing Viewport Part ${partNumber}`, async () => {
            // 1. Scroll exactly to this depth
            await page.evaluate((y) => {
              window.scrollTo({ top: y, behavior: 'instant' });
              // Trigger WP Rocket natively
              window.dispatchEvent(new Event('scroll'));
            }, currentScroll);
            
            // 2. Wait explicitly for grid/logo settlement at this exact Y-axis!
            await page.waitForTimeout(600);

            // 3. Freeze & Mask ONLY what is visible right now
            const { maskSelectors, dismissedOverlays, frozenContainers, hiddenWidgets } = await stabilizeViewport();

            if (dismissedOverlays.length > 0 || frozenContainers.length > 0) {
              test.info().annotations.push({ type: `Processing Part ${partNumber}`, description: `Frozen: ${frozenContainers.length}, Dismissed: ${dismissedOverlays.length}, Masked: ${maskSelectors.length}` });
            }

            // 4. Capture exactly the viewport (fullPage: false)
            try {
              await expect(page).toHaveScreenshot(`${endpoint.id}-part-${partNumber}.png`, {
                fullPage: false,
                mask: maskSelectors.map(s => page.locator(s)),
                timeout: 10_000,
                animations: 'disabled',
                maxDiffPixelRatio: 0.02
              });
            } catch (err) {
              mismatchErrors.push(`Part ${partNumber} modified!`);
            }
          });

          // Move down
          currentScroll += viewportHeight;
          partNumber++;
          
          // Re-measure height in case lazy-loading expanded the page
          lastHeight = await page.evaluate(() => document.body.scrollHeight);
        }

        // Final Bottom-Out Pass (Footer capture!)
        // In case the viewport loop missed the very last few pixels of the footer.
        await test.step(`Processing Footer Part ${partNumber}`, async () => {
           await page.evaluate(() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
              window.dispatchEvent(new Event('scroll'));
           });
           await page.waitForTimeout(1000); // the footer might make a late API call
           
           const { maskSelectors } = await stabilizeViewport();
           
           try {
             await expect(page).toHaveScreenshot(`${endpoint.id}-part-${partNumber}-footer.png`, {
               fullPage: false,
               mask: maskSelectors.map(s => page.locator(s)),
               timeout: 10_000,
               animations: 'disabled',
               maxDiffPixelRatio: 0.02
             });
           } catch (err) {
              mismatchErrors.push(`Footer Part ${partNumber} modified!`);
           }
        });

        if (mismatchErrors.length > 0) {
          throw new Error(`\n\n❌ VISUAL MISMATCH DETECTED ❌\nThe live page for '${endpoint.id}' has changed in sections:\n- ${mismatchErrors.join('\n- ')}\n\nACTION: Run 'npm run report' to see the exact Diff per section.\n`);
        }
      });

    });
  }
});
