// tests/fixtures/base-fixtures.js
// ─────────────────────────────────────────────────────────────────────
// Shared Playwright Test Fixtures
//
// PURPOSE:
//   Extends Playwright's base test with custom fixtures shared across
//   ALL test types. Provides a stable page state before any assertion.
//
// Viewport-by-Viewport Architecture:
//   Instead of scrolling the whole page and running one massive fullPage
//   screenshot, we now use `preparePage` and `stabilizeViewport` to 
//   sequentially process the page chunk-by-chunk in visual.spec.js.
// ─────────────────────────────────────────────────────────────────────

const base = require('@playwright/test');
const volatilityDetector = require('./volatility-detector');

const test = base.test.extend({

  // ── preparePage ───────────────────────────────────────────────────
  // A fixture function that handles the initial network and font load.
  // ──────────────────────────────────────────────────────────────────
  preparePage: async ({ page }, use) => {
    const prepare = async () => {
      const startTime = Date.now();
      
      // 1. Initial Load & Network Settle
      await test.step('Initial DOM Load & Network Settle', async () => {
        await page.waitForLoadState('domcontentloaded');
        
        // WebKit warm-up
        if (page.context().browser().browserType().name() === 'webkit') {
          await page.waitForTimeout(2000);
        }

        try {
          await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (e) { /* continue anyway */ }
        await page.waitForLoadState('load');
        try {
            await page.evaluate(() => Promise.race([
                document.fonts.ready,
                new Promise(resolve => setTimeout(resolve, 3000))
            ]));
        } catch (e) {}
      });

      // 2. Trigger WP Rocket and lazy classes initially
      await test.step('Wake Up Lazy Loaders', async () => {
        await page.evaluate(() => {
          document.querySelectorAll('[class*="lazy"]').forEach(el => {
            el.classList.add('lazyloaded', 'entered');
            const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-lazy');
            if (dataSrc) el.setAttribute('src', dataSrc);
          });
          document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.setAttribute('loading', 'eager');
          });
        });
          
        let currentScroll = 0;
        let viewportHeight = await page.evaluate(() => window.innerHeight);

        // Pre-flight scroll to bottom to lock in image layout heights
        while (currentScroll < await page.evaluate(() => document.body.scrollHeight)) {
            await page.evaluate((y) => {
               window.scrollTo({ top: y, behavior: 'instant' });
               window.dispatchEvent(new Event('scroll'));
            }, currentScroll);
            await page.waitForTimeout(200);
            currentScroll += viewportHeight;
        }
        
        // Return to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);
      });

      return {
        isStable: true,
        stabilizationTime: ((Date.now() - startTime) / 1000).toFixed(1)
      };
    };

    await use(prepare);
  },

  // ── stabilizeViewport ─────────────────────────────────────────────
  // A fixture function that applies the volatility detector to the
  // currently visible viewport.
  // ──────────────────────────────────────────────────────────────────
  stabilizeViewport: async ({ page }, use) => {
    const stabilize = async () => {
       const dismissed = await volatilityDetector.dismissOverlays(page);
       const hidden = await volatilityDetector.hideWidgetsAndOverlays(page);
       const frozen = await volatilityDetector.freezeVolatileContent(page);
       const masks = await volatilityDetector.detectMaskTargets(page);

       return {
           maskSelectors: masks,
           dismissedOverlays: dismissed,
           hiddenWidgets: hidden,
           frozenContainers: frozen
       };
    };

    await use(stabilize);
  }

});

const expect = base.expect;
module.exports = { test, expect };
