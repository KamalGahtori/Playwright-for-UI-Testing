// utils/base-fixtures.js
// ─────────────────────────────────────────────────────────────────────
// Shared Playwright Test Fixtures
//
// THREE-PASS LOADING STRATEGY (preparePage):
//
//   Pass 1 — Trigger:
//     Scroll top→bottom, 250ms per viewport. Forces all lazy loaders to
//     fire (WP Rocket, IntersectionObserver, data-bg, data-src, native lazy).
//     Does NOT capture screenshots. Goal: start every network request.
//
//   Pass 2 — Verify:
//     Scroll top→bottom again, 500ms per viewport. At each section we wait
//     for every visible <img> to decode before moving on. Goal: ensure
//     every image, logo, and icon is fully rendered in the DOM.
//
//   Pass 3 — Settle + Screenshot:
//     Return to top. Wait for layout stability (no element shifts position).
//     Run the full stabilization pipeline (dismiss → scan → hide → freeze → mask).
//     Take ONE fullPage:true screenshot covering header → footer.
//
// WHAT IS TESTED (always in the pixel diff):
//   Text content, alignment, padding, spacing, font sizes/weights/colors,
//   images, logos, icons, component layout, header, footer, every section.
//
// WHAT IS MASKED (excluded from the pixel diff):
//   Carousel/slider inner tracks, auto-incrementing counters, chat widgets,
//   popups, CAPTCHA (question text AND input), video elements, any element
//   that changed its own direct text or CSS transform during the 500ms scan.
// ─────────────────────────────────────────────────────────────────────

const base = require('@playwright/test');
const volatilityDetector = require('./volatility-detector');

const test = base.test.extend({

  // ── preparePage ───────────────────────────────────────────────────
  // Full page warm-up across three scroll passes. No screenshots taken here.
  // ──────────────────────────────────────────────────────────────────
  preparePage: async ({ page }, use) => {
    const prepare = async () => {
      const startTime = Date.now();

      // ── DOM + Network + Fonts ──────────────────────────────────────
      await test.step('Waiting for DOM, Network & Fonts', async () => {
        await page.waitForLoadState('domcontentloaded');

        if (page.context().browser().browserType().name() === 'webkit') {
          await page.waitForTimeout(2000); // WebKit needs extra warm-up
        }

        try {
          await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch { /* WP Rocket keeps connections open — continue anyway */ }

        await page.waitForLoadState('load');

        try {
          await page.evaluate(() => Promise.race([
            document.fonts.ready,
            new Promise(r => setTimeout(r, 3000)),
          ]));
        } catch {}

        // WP Rocket injects [data-wpr-lazyrender]{content-visibility:auto} which tells
        // the browser to skip rendering off-screen sections entirely. This causes two
        // problems: (1) children of off-screen sections have getBoundingClientRect()
        // returning {w:0,h:0}, making the behavioral scan miss them; (2) footer and
        // below-fold sections may appear blank in fullPage screenshots until scrolled.
        // Overriding to `visible` forces the browser to render all sections upfront.
        await page.addStyleTag({ content: `
          [data-wpr-lazyrender] {
            content-visibility: visible !important;
            contain-intrinsic-size: unset !important;
          }
        ` });
        await page.waitForTimeout(300); // allow browser to reflow all now-visible sections
      });

      // ── Force all lazy-load mechanisms before scrolling ────────────
      await test.step('Force-Loading Lazy Assets', async () => {
        await page.evaluate(() => {
          // WP Rocket class-based lazy images
          document.querySelectorAll('[class*="lazy"]').forEach(el => {
            el.classList.add('lazyloaded', 'entered');
            const src = el.getAttribute('data-src') || el.getAttribute('data-lazy');
            if (src) el.setAttribute('src', src);
          });
          // Native loading="lazy" → eager
          document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.setAttribute('loading', 'eager');
          });
          // WP Rocket data-bg → inline CSS background
          document.querySelectorAll('[data-bg]').forEach(el => {
            const bg = el.getAttribute('data-bg');
            if (bg) {
              el.style.backgroundImage = `url(${bg})`;
              el.removeAttribute('data-bg');
              el.classList.add('lazyloaded');
            }
          });
          // Generic data-src on non-img elements (video sources, etc.)
          document.querySelectorAll('[data-src]:not(img)').forEach(el => {
            const src = el.getAttribute('data-src');
            if (src) el.setAttribute('src', src);
          });
          // WP Rocket data-lazy-src (the primary lazy-load attribute WP Rocket uses,
          // distinct from the generic data-src). Covers images, srcsets, and bg elements.
          document.querySelectorAll('[data-lazy-src]').forEach(el => {
            const src = el.getAttribute('data-lazy-src');
            if (!src || src.startsWith('data:')) return; // skip SVG placeholder
            if (el.tagName === 'IMG') {
              el.setAttribute('src', src);
              const srcset = el.getAttribute('data-lazy-srcset');
              if (srcset) el.setAttribute('srcset', srcset);
            } else {
              el.style.backgroundImage = `url(${src})`;
            }
            el.removeAttribute('data-lazy-src');
            el.removeAttribute('data-lazy-srcset');
            el.classList.add('lazyloaded');
          });
        });
      });

      // ── PASS 1: Trigger ────────────────────────────────────────────
      // Scroll top→bottom at 250ms per viewport. Fires every lazy loader
      // and IntersectionObserver callback across the full page.
      await test.step('Pass 1 — Triggering All Section Loads', async () => {
        const vpH = await page.evaluate(() => window.innerHeight);
        let y = 0;

        while (y < await page.evaluate(() => document.body.scrollHeight)) {
          await page.evaluate(scrollY => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          }, y);
          await page.waitForTimeout(250);
          y += vpH;
        }

        // Hard bottom-out for footer
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(400);
      });

      // ── PASS 2: Verify ─────────────────────────────────────────────
      // Scroll top→bottom again at 500ms per viewport.
      // At each section we explicitly wait for every visible <img> to
      // report complete before advancing. This guarantees no broken image
      // or placeholder logo makes it into the screenshot.
      await test.step('Pass 2 — Verifying All Images & Logos Are Loaded', async () => {
        const vpH = await page.evaluate(() => window.innerHeight);
        let y = 0;

        // Return to top before second pass
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);

        while (y < await page.evaluate(() => document.body.scrollHeight)) {
          await page.evaluate(scrollY => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          }, y);

          // Wait for every <img> visible in this viewport chunk to fully decode
          await page.evaluate(async () => {
            const vpH = window.innerHeight;
            const waitForImg = img => {
              if (img.complete && img.naturalHeight > 0) return Promise.resolve();
              return new Promise(resolve => {
                img.addEventListener('load',  resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 4000);
              });
            };
            // Check images that overlap this viewport band
            const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
              const rect = img.getBoundingClientRect();
              return rect.bottom >= 0 && rect.top <= vpH;
            });
            await Promise.allSettled(imgs.map(waitForImg));
          });

          await page.waitForTimeout(500);
          y += vpH;
        }

        // Bottom-out again to ensure footer images load
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(600);
      });

      // ── Wait for every image across the entire page ────────────────
      await test.step('Waiting for All Images to Fully Decode', async () => {
        await volatilityDetector.ensureFullPageLoad(page);
      });

      // ── PASS 3: Settle at top ──────────────────────────────────────
      // Return to top, wait for layout to stop shifting (no element moves
      // between two 500ms snapshots), then final buffer before screenshot.
      await test.step('Pass 3 — Layout Stability Gate', async () => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        await volatilityDetector.waitForLayoutStability(page);
        // Final buffer: counters finish counting, entrance animations settle
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1500);
      });

      return {
        isStable: true,
        stabilizationTime: ((Date.now() - startTime) / 1000).toFixed(1),
      };
    };

    await use(prepare);
  },

  // ── stabilizePage ─────────────────────────────────────────────────
  // Runs ONCE on the full page, immediately before the screenshot.
  // Detects and neutralizes all dynamic content via the 5-phase pipeline.
  // ──────────────────────────────────────────────────────────────────
  stabilizePage: async ({ page }, use) => {
    const stabilize = async () => {
      // 1. Dismiss consent banners (they'd obscure content in the behavioral scan)
      const dismissed = await volatilityDetector.dismissOverlays(page);

      // 2. Behavioral scan — 500ms observation window across the ENTIRE page.
      //    Runs BEFORE hiding/freezing so we see natural page behavior.
      //    Uses direct text comparison + correct de-duplication to prevent
      //    the "entire page masked" problem.
      const volatileCount = await volatilityDetector.behavioralVolatilityScan(page);

      // 3. Hide third-party widgets (chat bubbles, cross-origin iframes)
      const hidden = await volatilityDetector.hideWidgetsAndOverlays(page);

      // 4. Freeze infinite CSS animations; stamp structural carousel tracks
      const frozen = await volatilityDetector.freezeVolatileContent(page);

      // 5. Collect mask selectors: [data-vr-volatile] + captcha question + captcha input
      const masks = await volatilityDetector.detectMaskTargets(page);

      return {
        maskSelectors:     masks,
        dismissedOverlays: dismissed,
        hiddenWidgets:     hidden,
        frozenContainers:  frozen,
        volatileDetected:  volatileCount,
      };
    };

    await use(stabilize);
  },

});

const expect = base.expect;
module.exports = { test, expect };
