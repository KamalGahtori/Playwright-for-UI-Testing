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
//   Pass 2 — Verify + Per-Viewport Scan:
//     Scroll top→bottom again, 500ms per viewport. At each section we wait
//     for every visible <img> to decode AND run a 350ms per-viewport
//     behavioral mini-scan to catch IntersectionObserver-triggered carousels
//     that only animate when they are actually in the viewport.
//
//   Footer Stabilisation:
//     Slow-crawl from 65% of page height to the absolute bottom in waves.
//     Monitors document.body.scrollHeight for growth (WP Rocket defers
//     footer injection until it enters the viewport). Waits at the bottom
//     for all footer images to decode before continuing.
//
//   Pass 3 — Settle + Screenshot:
//     Fast-forward finite entrance animations to their final state.
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
//   that changed its own direct text or CSS transform during the scan.
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

      // ── PASS 2: Verify + Per-Viewport Behavioral Scan ─────────────
      // Scroll top→bottom again at 500ms per viewport.
      // At each section: wait for every visible <img> to decode AND run
      // a 350ms per-viewport mini-scan to catch carousel animations that
      // only activate when the carousel is actually in the viewport.
      await test.step('Pass 2 — Verifying Images & Scanning for Dynamic Content', async () => {
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
            const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
              const rect = img.getBoundingClientRect();
              return rect.bottom >= 0 && rect.top <= vpH;
            });
            await Promise.allSettled(imgs.map(waitForImg));
          });

          // Per-viewport behavioral mini-scan: catches IntersectionObserver-triggered
          // carousels that only animate while they are actually in the viewport.
          await volatilityDetector.scanViewportForVolatileContent(page);

          await page.waitForTimeout(500);
          y += vpH;
        }

        // Bottom-out again after the full scroll pass
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(600);
      });

      // ── Footer Stabilisation ───────────────────────────────────────
      // WP Rocket defers footer content via IntersectionObserver and uses
      // CSS background-image (not <img> tags) for footer logos and icons.
      // Our ensureFullPageLoad() only waits for <img> tags, so background
      // images can still be mid-load when we return to the top.
      //
      // Strategy:
      //   1. Slow-crawl the bottom half of the page in small steps.
      //      Repeat until document.body.scrollHeight stops growing
      //      (WP Rocket no longer injecting new content).
      //   2. Hold at the absolute bottom for 3 s so CSS background-image
      //      URLs have enough time to be fetched and painted.
      //   3. Force-load any remaining data-bg / data-src elements that
      //      are currently in or near the viewport.
      //   4. Nudge one viewport up then back to the absolute bottom to
      //      re-fire IntersectionObserver for any deferred blocks.
      //   5. Final 2 s hold before returning to the top.
      await test.step('Footer Stabilisation — Ensuring Footer Is Fully Rendered', async () => {
        const MAX_WAVES  = 8;
        const STEP_DELAY = 700; // ms per scroll step (slower = more time for IO)

        for (let wave = 0; wave < MAX_WAVES; wave++) {
          const { vpH, totalH } = await page.evaluate(() => ({
            vpH:    window.innerHeight,
            totalH: document.body.scrollHeight,
          }));
          const heightBefore = totalH;

          // Crawl from 40 % of page to the absolute bottom in 20 %-viewport steps
          const startY = Math.floor(totalH * 0.40);
          const step   = Math.floor(vpH * 0.20);
          let y = startY;

          while (y < await page.evaluate(() => document.body.scrollHeight)) {
            await page.evaluate(scrollY => {
              window.scrollTo({ top: scrollY, behavior: 'instant' });
              window.dispatchEvent(new Event('scroll'));
            }, y);
            await page.waitForTimeout(STEP_DELAY);
            y += step;
          }

          // Hard bottom-out
          await page.evaluate(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          });
          await page.waitForTimeout(800);

          const heightAfter = await page.evaluate(() => document.body.scrollHeight);
          if (heightAfter <= heightBefore) break; // page height stabilised
        }

        // Hold at the very bottom for 3 s so CSS background-image resources
        // (footer logos, icons) have time to be fetched and painted.
        await page.waitForTimeout(3000);

        // Force-inject any remaining lazy assets visible near the bottom
        await page.evaluate(() => {
          document.querySelectorAll('[data-bg]').forEach(el => {
            const bg = el.getAttribute('data-bg');
            if (bg) {
              el.style.backgroundImage = `url(${bg})`;
              el.removeAttribute('data-bg');
              el.classList.add('lazyloaded');
            }
          });
          document.querySelectorAll('[data-src]').forEach(el => {
            const src = el.getAttribute('data-src');
            if (src) { el.setAttribute('src', src); el.removeAttribute('data-src'); }
          });
          document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.setAttribute('loading', 'eager');
          });
        });

        // Nudge: one viewport up, then back to the bottom — re-fires any
        // IntersectionObserver callbacks that fire on viewport entry
        const nudgeY = await page.evaluate(() =>
          Math.max(0, document.body.scrollHeight - window.innerHeight * 2)
        );
        await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), nudgeY);
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });

        // Final 2 s hold — CSS background images finish loading
        await page.waitForTimeout(2000);

        // Wait for all <img> tags in the bottom 40 % of the page
        await page.evaluate(async () => {
          const footerTop = document.body.scrollHeight * 0.60;
          const waitForImg = img => {
            if (img.complete && img.naturalHeight > 0) return Promise.resolve();
            return new Promise(resolve => {
              img.addEventListener('load',  resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 5000);
            });
          };
          const footerImgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const absTop = img.getBoundingClientRect().top + window.scrollY;
            return absTop >= footerTop;
          });
          await Promise.allSettled(footerImgs.map(waitForImg));
        });
      });

      // ── Wait for every image across the entire page ────────────────
      await test.step('Waiting for All Images to Fully Decode', async () => {
        await volatilityDetector.ensureFullPageLoad(page);
      });

      // ── PASS 3: Settle at top ──────────────────────────────────────
      // Fast-forward finite entrance animations so they snap to their final
      // state before the layout stability gate runs. Then return to top,
      // wait for layout to stop shifting, final buffer before screenshot.
      await test.step('Pass 3 — Layout Stability Gate', async () => {
        // Snap entrance animations to final state (does not touch infinite animations)
        await volatilityDetector.fastForwardFiniteAnimations(page);

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
