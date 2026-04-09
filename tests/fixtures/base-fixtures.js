// tests/fixtures/base-fixtures.js
// ─────────────────────────────────────────────────────────────────────
// Shared Playwright Test Fixtures
//
// PURPOSE:
//   Extends Playwright's base test with custom fixtures shared across
//   ALL test types. Provides a stable page state before any assertion.
//
// Refactored to 'Zero-Config' model:
//   All masking, clicking, and hiding logic is now centralized here.
// ─────────────────────────────────────────────────────────────────────

const base = require('@playwright/test');

// ── Global Selectors (Central Intelligence) ──────────────────────────
// These ensure all pages automatically benefit from this 'scrubbing' logic.
const GLOBAL_CLICK_SELECTORS = [
  '.accept-cookie_btn'
];

const GLOBAL_HIDE_SELECTORS = [
  '#tawk-chat-container', 
  '#tawkto-chat-container',
  '#tawk-to-widget',
  '.whatsaap-icon-header',
  '.whatsapp-button',
  '.chatbot-button',
  'iframe[src*="facebook"]',
  'iframe[src*="google.com/maps"]'
];

const GLOBAL_MASK_SELECTORS = [
  '.slick-slider img',
  '.slick-list img',
  '.global-offices-section iframe',
  '.symbolic-moments-section img'
];
// ─────────────────────────────────────────────────────────────────────

const test = base.test.extend({

  // ── waitForPageStable ─────────────────────────────────────────────
  // A fixture function that waits for the page to reach a stable state.
  // Returns globalMasks to be used in assertions.
  // ──────────────────────────────────────────────────────────────────
  waitForPageStable: async ({ page }, use) => {
    /**
     * Waits for the page to reach a fully stable state.
     * @returns {Object} { globalMasks: string[] }
     */
    const stabilize = async () => {
      // ── Step 1: Wait for DOM & Warming ──────────────────────────────
      await page.waitForLoadState('domcontentloaded');
      
      // WebKit on Linux needs a moment to warm up
      if (page.context().browser().browserType().name() === 'webkit') {
        await page.waitForTimeout(2000);
      }

      // ── Step 2: Inject Eager Loading ──────────────────────────────
      await page.evaluate(() => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
          img.setAttribute('loading', 'eager');
        });
      });

      // Relaxed network idle wait
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch (e) { /* ignore */ }

      await page.waitForLoadState('load'); 

      // ── Step 3: Dismiss Overlays ──────────────────────────────────
      for (const selector of GLOBAL_CLICK_SELECTORS) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(500); 
          }
        } catch (e) { /* ignore */ }
      }

      // ── Step 4: Hide Flaky Elements ───────────────────────────────
      if (GLOBAL_HIDE_SELECTORS.length > 0) {
        await page.addStyleTag({
          content: `${GLOBAL_HIDE_SELECTORS.join(', ')} { display: none !important; opacity: 0 !important; visibility: hidden !important; }`
        });
      }

      // ── Step 5: Wait for fonts ────────────────────────────────────
      await page.evaluate(() => document.fonts.ready);

      // ── Step 6: Trigger lazy-loading (Scrolling) ──────────────────
      await page.evaluate(async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const scrollStep = 800;
        const scrollDelay = 150;
        for (let y = 0; y < document.body.scrollHeight; y += scrollStep) {
          window.scrollTo(0, y);
          await delay(scrollDelay);
        }
        window.scrollTo(0, document.body.scrollHeight);
        await delay(500);

        // INTERACTIVE SETTLE: Tiny shake at the bottom to trigger 'Sticky' footer items
        window.scrollBy(0, -100);
        await delay(200);
        window.scrollBy(0, 100);
        await delay(500);

        // HEIGHT STABILITY MONITOR: Wait until scrollHeight stops changing
        // This prevents the ±100px shifts on mobile caused by late-expanding containers.
        let lastHeight = document.body.scrollHeight;
        let stableCycles = 0;
        const requiredCycles = 4; // 1s of stability (250ms * 4)
        
        for (let i = 0; i < 20; i++) { // Max 5s total wait
          await delay(250);
          const currentHeight = document.body.scrollHeight;
          if (currentHeight === lastHeight) {
            stableCycles++;
          } else {
            stableCycles = 0;
            lastHeight = currentHeight;
          }
          if (stableCycles >= requiredCycles) break;
        }

        window.scrollTo(0, 0);
        await delay(2000); 
      });

      // ── Step 7: Wait for Image Decoding ───────────────────────────
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        await Promise.all(images.map(img => {
          if (img.complete) return img.decode().catch(() => {});
          return new Promise((resolve) => {
            img.addEventListener('load', () => img.decode().then(resolve).catch(resolve));
            img.addEventListener('error', resolve);
          });
        }));
      });

      // ── Step 8: Wait for Animations ───────────────────────────────
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const maxWait = 10000;
          const checkInterval = 200;
          let elapsed = 0;
          const check = () => {
            const animations = document.getAnimations().filter(a => a.playState === 'running');
            if (animations.length === 0 || elapsed >= maxWait) resolve();
            else { elapsed += checkInterval; setTimeout(check, checkInterval); }
          };
          check();
        });
      });

      // ── Step 9: Final Snap-to-top ─────────────────────────────────
      await page.evaluate(async () => {
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      return { globalMasks: GLOBAL_MASK_SELECTORS };
    };

    await use(stabilize);
  },
});

const expect = base.expect;
module.exports = { test, expect };
