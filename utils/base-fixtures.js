// utils/base-fixtures.js
// ─────────────────────────────────────────────────────────────────────
// Custom Playwright fixtures used by visual.spec.js.
//
// Exports two fixtures that extend the base Playwright `test` object:
//
//   preparePage   — Phase 1: fully loads the page (3-pass strategy).
//                   Call once per test after page.goto().
//
//   stabilizePage — Phase 2: detects and neutralises all dynamic content
//                   (5-phase pipeline). Call immediately before the
//                   screenshot. Returns the mask selector list.
//
// THREE-PASS LOADING STRATEGY (preparePage):
//
//   Pass 1 — Trigger:
//     Scroll top→bottom at 250ms/viewport. Purpose: fire every lazy
//     loader (WP Rocket, IntersectionObserver, data-src, data-bg).
//     No image-decode waiting here — just start all network requests.
//
//   Pass 2 — Verify:
//     Scroll top→bottom again at 500ms/viewport. At each scroll position,
//     wait for every <img> currently in the viewport to report complete.
//     Purpose: guarantee no broken image or SVG placeholder reaches the
//     screenshot phase.
//
//   Pass 3 — Settle:
//     Return to top. Poll structural landmarks every 500ms until two
//     consecutive snapshots match (layout stable). Final 1.5s buffer
//     lets entrance animations and counters finish.
// ─────────────────────────────────────────────────────────────────────

const base = require('@playwright/test');
const volatilityDetector = require('./volatility-detector');

const test = base.test.extend({

  // ── preparePage ───────────────────────────────────────────────────
  // Provided as an async function so the test can await it and receive
  // the return value ({ isStable, stabilizationTime }).
  preparePage: async ({ page }, use) => {
    const prepare = async () => {
      const startTime = Date.now();

      // ── Step 1: Wait for DOM, network, and fonts ───────────────────
      await test.step('Waiting for DOM, Network & Fonts', async () => {
        await page.waitForLoadState('domcontentloaded');

        // WebKit (Safari engine) needs extra time to finish internal
        // setup before layout is reliable. Without this, the first
        // scroll pass can fire before element sizes are computed.
        if (page.context().browser().browserType().name() === 'webkit') {
          await page.waitForTimeout(2000);
        }

        // WP Rocket intentionally keeps connections open (prefetch, beacon).
        // Waiting for true networkidle would hang forever — cap at 10s.
        try {
          await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch { /* expected on WP Rocket sites — continue anyway */ }

        // Ensure the page's load event has fired (all synchronous resources
        // fetched) even if networkidle timed out above.
        await page.waitForLoadState('load');

        // Wait for all web fonts to finish loading so text renders at the
        // correct size and weight in the screenshot. Cap at 3s — if fonts
        // are not ready by then the page will use fallback fonts, which is
        // a valid state to capture.
        try {
          await page.evaluate(() => Promise.race([
            document.fonts.ready,
            new Promise(r => setTimeout(r, 3000)),
          ]));
        } catch {}

        // WP Rocket applies content-visibility:auto to sections via
        // [data-wpr-lazyrender]. This tells the browser to skip layout
        // and painting of off-screen sections entirely, which causes two
        // problems: (1) those sections appear as blank white space in the
        // screenshot; (2) getBoundingClientRect() returns {w:0,h:0} for
        // elements inside them, so the behavioural scan misses them.
        // Overriding to visible forces the browser to render every section
        // upfront before the scroll passes start.
        await page.addStyleTag({ content: `
          [data-wpr-lazyrender] {
            content-visibility: visible !important;
            contain-intrinsic-size: unset !important;
          }
        ` });
        // Give the browser time to reflow all newly-visible sections
        // before Pass 1 begins scrolling through them.
        await page.waitForTimeout(300);
      });

      // ── Step 2: Force-load all lazy assets ────────────────────────
      // Converts every lazy-load attribute variant to an actual src so
      // the browser starts fetching images before we scroll. Without
      // this, images that depend on JavaScript lazy-loaders (which WP
      // Rocket delays until user interaction) would stay as placeholders.
      await test.step('Force-Loading Lazy Assets', async () => {
        await page.evaluate(() => {

          // WP Rocket class-based lazy images (adds lazyloaded class to
          // trigger any CSS that depends on it, e.g. fade-in transitions).
          document.querySelectorAll('[class*="lazy"]').forEach(el => {
            el.classList.add('lazyloaded', 'entered');
            const src = el.getAttribute('data-src') || el.getAttribute('data-lazy');
            if (src) el.setAttribute('src', src);
          });

          // Native HTML lazy loading — converting to eager tells the
          // browser to load these images immediately regardless of position.
          document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.setAttribute('loading', 'eager');
          });

          // WP Rocket data-bg: background images stored as a data attribute
          // instead of a CSS background-image. Applying it as inline style
          // triggers the network request immediately.
          document.querySelectorAll('[data-bg]').forEach(el => {
            const bg = el.getAttribute('data-bg');
            if (bg) {
              el.style.backgroundImage = `url(${bg})`;
              el.removeAttribute('data-bg');
              el.classList.add('lazyloaded');
            }
          });

          // Generic data-src on non-img elements (e.g. video poster images,
          // source elements inside <picture>).
          document.querySelectorAll('[data-src]:not(img)').forEach(el => {
            const src = el.getAttribute('data-src');
            if (src) el.setAttribute('src', src);
          });

          // WP Rocket's primary lazy-load attribute for images is data-lazy-src
          // (different from the generic data-src above). Also handles
          // data-lazy-srcset for responsive image sets.
          // Skip SVG placeholder values (start with 'data:') — those are
          // the placeholder itself, not the real image URL.
          document.querySelectorAll('[data-lazy-src]').forEach(el => {
            const src = el.getAttribute('data-lazy-src');
            if (!src || src.startsWith('data:')) return;
            if (el.tagName === 'IMG') {
              el.setAttribute('src', src);
              const srcset = el.getAttribute('data-lazy-srcset');
              if (srcset) el.setAttribute('srcset', srcset);
            } else {
              // Non-img element with data-lazy-src — treat as background.
              el.style.backgroundImage = `url(${src})`;
            }
            el.removeAttribute('data-lazy-src');
            el.removeAttribute('data-lazy-srcset');
            el.classList.add('lazyloaded');
          });
        });
      });

      // ── Pass 1: Trigger ────────────────────────────────────────────
      // Fast scroll from top to bottom. Goal: fire IntersectionObserver
      // callbacks and WP Rocket lazy-load triggers for every section.
      // We don't wait for images here — just starting network requests.
      await test.step('Pass 1 — Triggering All Section Loads', async () => {
        const vpH = await page.evaluate(() => window.innerHeight);
        let y = 0;

        while (y < await page.evaluate(() => document.body.scrollHeight)) {
          await page.evaluate(scrollY => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            // Dispatch scroll event manually because some lazy-loaders
            // listen to the scroll event rather than IntersectionObserver.
            window.dispatchEvent(new Event('scroll'));
          }, y);
          await page.waitForTimeout(250); // short pause so IO callbacks fire
          y += vpH;
        }

        // Hard bottom-out ensures the footer and any bottom-anchored
        // elements get an IntersectionObserver trigger.
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(400);
      });

      // ── Pass 2: Verify ─────────────────────────────────────────────
      // Slower second scroll. At each viewport position, block until
      // every visible <img> reports complete. This guarantees no image
      // is still downloading when we take the screenshot.
      await test.step('Pass 2 — Verifying All Images & Logos Are Loaded', async () => {
        const vpH = await page.evaluate(() => window.innerHeight);
        let y = 0;

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);

        while (y < await page.evaluate(() => document.body.scrollHeight)) {
          await page.evaluate(scrollY => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          }, y);

          // For each <img> currently visible in this viewport band,
          // wait until it is fully loaded or has errored.
          // rect.bottom >= 0 && rect.top <= vpH — element overlaps current view.
          await page.evaluate(async () => {
            const vpH = window.innerHeight;
            const waitForImg = img => {
              // naturalHeight > 0 distinguishes a loaded image from a broken
              // one — broken images have complete=true but naturalHeight=0.
              if (img.complete && img.naturalHeight > 0) return Promise.resolve();
              return new Promise(resolve => {
                img.addEventListener('load',  resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 4000); // give up after 4s per image
              });
            };
            const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
              const rect = img.getBoundingClientRect();
              return rect.bottom >= 0 && rect.top <= vpH;
            });
            await Promise.allSettled(imgs.map(waitForImg));
          });

          await page.waitForTimeout(500);
          y += vpH;
        }

        // Bottom-out again so footer images get a final decode window.
        await page.evaluate(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(600);
      });

      // ── Global image decode wait ───────────────────────────────────
      // Pass 2 waited for images per viewport. This step waits for
      // every <img> across the entire document — catches any that loaded
      // late due to CDN variance or slow network.
      await test.step('Waiting for All Images to Fully Decode', async () => {
        await volatilityDetector.ensureFullPageLoad(page);
      });

      // ── Pass 3: Settle ─────────────────────────────────────────────
      // Return to top, wait for layout to stop shifting, then give
      // entrance animations and counters time to complete.
      await test.step('Pass 3 — Layout Stability Gate', async () => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);

        // Polls structural landmarks (h1–h3, nav, header, footer, section)
        // every 500ms. Returns as soon as two consecutive snapshots match.
        await volatilityDetector.waitForLayoutStability(page);

        // Scroll back to top one more time in case waitForLayoutStability
        // left the page mid-way through, then wait for animations to finish.
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
  // Runs the 5-phase volatility detection pipeline across the full page
  // immediately before the screenshot. Returns the mask selector list
  // and a summary of what was detected.
  stabilizePage: async ({ page }, use) => {
    const stabilize = async () => {

      // Phase 1: Dismiss banners before the behavioural scan so they do
      // not interfere with the observation window (a banner disappearing
      // would make the entire page appear volatile).
      const dismissed = await volatilityDetector.dismissOverlays(page);

      // Phase 2: Observe the full page for 500ms. Anything whose own
      // direct text, CSS transform, or background-position changes is
      // stamped [data-vr-volatile]. De-duplication keeps only the most
      // specific (deepest) volatile element to avoid section-level masking.
      const volatileCount = await volatilityDetector.behavioralVolatilityScan(page);

      // Phase 3: Hide third-party overlays that would obscure content
      // but are not part of the page's own layout.
      const hidden = await volatilityDetector.hideWidgetsAndOverlays(page);

      // Phase 4: Pause infinite CSS animations in-place (element stays
      // visible, layout is tested). Structurally stamp carousel tracks
      // and video elements as volatile.
      const frozen = await volatilityDetector.freezeVolatileContent(page);

      // Phase 5: Build the final mask selector array for Playwright.
      // Includes [data-vr-volatile], unconditional carousel class selectors,
      // and captcha targets.
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

// Re-export Playwright's expect unchanged so visual.spec.js can import
// both test and expect from a single file.
const expect = base.expect;
module.exports = { test, expect };
