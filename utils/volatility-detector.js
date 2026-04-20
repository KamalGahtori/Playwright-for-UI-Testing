// utils/volatility-detector.js
// ─────────────────────────────────────────────────────────────────────
// Intelligent Layout-Aware Volatility Detection Engine
//
// DETECTION PIPELINE (called once per page):
//   0a. ensureFullPageLoad     — block until every <img> has decoded
//   0b. waitForLayoutStability — block until no element shifts position
//   1.  dismissOverlays        — click away cookie/consent banners
//   2.  behavioralVolatilityScan — two-snapshot diff across the FULL page
//   3.  hideWidgetsAndOverlays — hide chat widgets, cross-origin iframes
//   4.  freezeVolatileContent  — pause infinite CSS animations; stamp carousel tracks
//   5.  detectMaskTargets      — collect [data-vr-volatile] + captcha selectors
//
// DESIGN PRINCIPLE: Mask Content, Test Containers
//   The carousel CONTAINER (size, padding, alignment) stays in the diff.
//   Only the sliding TRACK — the volatile inner content — is masked.
//
// KEY INVARIANTS IN THE BEHAVIORAL SCAN:
//   • Only DIRECT text nodes are compared (not inherited textContent).
//     This prevents the cascade where a carousel slide change causes
//     every ancestor (section, main, body) to appear volatile.
//   • De-duplication keeps the MOST SPECIFIC (deepest) volatile element.
//     If element A contains volatile element B, A is removed — only B
//     is masked. This prevents a section-level mask from blacking out
//     everything on the page.
// ─────────────────────────────────────────────────────────────────────

/**
 * Phase 0a: Block until every <img> in the document has fully decoded.
 * Must be called AFTER the lazy-loader scroll so images have started loading.
 *
 * @param {import('@playwright/test').Page} page
 */
async function ensureFullPageLoad(page) {
  await page.evaluate(async () => {
    const waitForImg = img => {
      if (img.complete && img.naturalHeight > 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load',  resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 8000);
      });
    };
    await Promise.allSettled(Array.from(document.querySelectorAll('img')).map(waitForImg));
    try {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]);
    } catch {}
  });
}

/**
 * Phase 0b: Wait until no significant element is changing position.
 * Snapshot-compares offsetTop/offsetHeight of structural landmarks every 500ms.
 * Exits as soon as two consecutive samples match (stable), ceiling: 3s.
 *
 * @param {import('@playwright/test').Page} page
 */
async function waitForLayoutStability(page) {
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const snapshot = () =>
      Array.from(document.querySelectorAll(
        'img, h1, h2, h3, nav, header, footer, section, [class*="hero"]'
      ))
        .slice(0, 40)
        .map(el => `${el.offsetTop},${el.offsetHeight},${el.offsetLeft},${el.offsetWidth}`)
        .join('|');

    let prev = snapshot();
    for (let i = 0; i < 6; i++) {   // max 6 × 500ms = 3s
      await delay(500);
      const curr = snapshot();
      if (curr === prev) return;     // stable — exit early
      prev = curr;
    }
  });
}

/**
 * Phase 1: Dismiss cookie/consent banners.
 * Behavioral detection: fixed/sticky + consent keywords + dismiss button.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function dismissOverlays(page) {
  const dismissed = await page.evaluate(async () => {
    const results = [];
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const fixedEls = Array.from(document.querySelectorAll('*')).filter(el => {
      try {
        const pos = getComputedStyle(el).position;
        return pos === 'fixed' || pos === 'sticky';
      } catch { return false; }
    });

    const consentPattern = /cookie|consent|privacy.?policy|gdpr/i;
    const dismissPattern = /accept|got\s*it|close|ok\b|agree|dismiss|understand|×|✕|✖/i;

    for (const el of fixedEls) {
      if (!consentPattern.test(el.textContent || '')) continue;
      const interactives = Array.from(
        el.querySelectorAll('button, a, [role="button"], [class*="btn"]')
      );
      let bestBtn = null, bestScore = 0;
      for (const btn of interactives) {
        const txt = (btn.textContent || '').trim();
        let score = 0;
        if (dismissPattern.test(txt)) score += 10;
        if (/accept|got\s*it|agree/i.test(txt)) score += 5;
        if (btn.tagName === 'BUTTON') score += 2;
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) score += 3;
        if (score > bestScore) { bestScore = score; bestBtn = btn; }
      }
      if (bestBtn && bestScore >= 5) {
        try {
          bestBtn.click();
          results.push(`Dismissed: "${(bestBtn.textContent || '').trim().substring(0, 40)}"`);
          await delay(600);
        } catch {}
      }
    }
    return results;
  });

  if (dismissed.length > 0) {
    try {
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('[class*="cookie-modal"],[class*="consent"]'))
          .every(el => {
            const cs = getComputedStyle(el);
            return cs.display === 'none' || cs.visibility === 'hidden' ||
              el.offsetHeight === 0 || cs.opacity === '0';
          })
      , { timeout: 3000 });
    } catch {}
  }
  return dismissed;
}

/**
 * Phase 2: Behavioral volatility scan — the core intelligence layer.
 *
 * Observes the ENTIRE page for 500ms and compares two DOM snapshots.
 * Stamps volatile elements with [data-vr-volatile] for Playwright masking.
 *
 * TWO CRITICAL DESIGN DECISIONS that prevent the "entire page masked" problem:
 *
 * A) DIRECT TEXT ONLY — we compare only the text nodes that are IMMEDIATE
 *    children of each element, not el.textContent (which cascades through
 *    all descendants). This means a carousel slide changing "Testimonial 1"
 *    to "Testimonial 2" marks ONLY that slide — not the section, not the
 *    main, not the body.
 *
 * B) KEEP SPECIFIC, REMOVE GENERIC — de-duplication removes any element that
 *    CONTAINS another volatile element. We keep the deepest/most-specific
 *    match and discard ancestors. This is the OPPOSITE of the naive approach
 *    of removing children when a parent is volatile.
 *
 * Detects (zero hardcoded selectors):
 *   - Carousel/slider tracks (CSS transform changes)
 *   - Number counters & tickers (direct text changes)
 *   - Auto-cycling testimonials (direct text changes)
 *   - CSS background sliders (background-position changes)
 *   - Any live-data widget whose own text node updates
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>} count of elements stamped volatile
 */
async function behavioralVolatilityScan(page) {
  const count = await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const SCAN_MS = 500;
    const MIN_AREA = 400;
    const SKIP_TAGS = new Set([
      'html','head','body','script','style','meta','link',
      'noscript','title','br','hr','svg','path','g','defs','use',
    ]);

    // ── Helper: direct text of an element (NOT inherited from children) ──
    // Comparing el.textContent would cascade — every ancestor of a changing
    // element would also appear to have changed text. Instead, we compare
    // only TEXT_NODE children (nodeType === 3). This makes the detection
    // surgical: only the element that DIRECTLY owns the changing text is flagged.
    const directText = el => {
      let t = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) t += node.nodeValue; // 3 = TEXT_NODE
      }
      return t.trim().substring(0, 300);
    };

    // ── Collect all rendered candidates across the full document ─────
    const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
      if (el.getAttribute('data-vr-volatile') ||
          el.getAttribute('data-vr-frozen') ||
          el.getAttribute('data-vr-hide')) return false;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width * rect.height < MIN_AREA) return false;
      return true;
    });

    // ── Snapshot 1 ───────────────────────────────────────────────────
    const snap = candidates.map(el => {
      const cs = getComputedStyle(el);
      return {
        el,
        text:      directText(el),       // DIRECT text only — no cascade
        transform: cs.transform,
        bgPos:     cs.backgroundPosition,
      };
    });

    await delay(SCAN_MS);

    // ── Snapshot 2 + comparison ──────────────────────────────────────
    const volatile = new Map(); // el → reason
    for (const s of snap) {
      const { el } = s;
      if (!document.contains(el)) continue;

      const cs     = getComputedStyle(el);
      const text2  = directText(el);
      const tf2    = cs.transform;
      const bgPos2 = cs.backgroundPosition;

      // Direct text changed (counter, ticker, auto-cycling text)
      if (s.text !== text2 && (s.text.length > 0 || text2.length > 0)) {
        volatile.set(el, 'content');
      // Transform changed AND was already non-identity (slider track)
      } else if (s.transform !== tf2 && s.transform !== 'none' && tf2 !== 'none') {
        volatile.set(el, 'transform');
      // Background position changed (CSS background slider)
      } else if (s.bgPos !== bgPos2) {
        volatile.set(el, 'background');
      }
    }

    // ── De-duplication: KEEP SPECIFIC, REMOVE GENERIC ───────────────
    // For each volatile element, check if it CONTAINS another volatile
    // element. If yes, it is a generic container — remove it and keep
    // only the more specific child.
    //
    // Example: page has volatile={slide-p, carousel-div, section, main}
    //   main contains section → remove main
    //   section contains carousel-div → remove section
    //   carousel-div contains slide-p → remove carousel-div
    //   slide-p contains nothing volatile → KEEP slide-p
    // Result: only slide-p is stamped and masked. ✓
    const toRemove = new Set();
    const volatileEls = [...volatile.keys()];

    for (const container of volatileEls) {
      for (const candidate of volatileEls) {
        if (candidate !== container && container.contains(candidate)) {
          // container wraps a more-specific volatile element → remove container
          toRemove.add(container);
          break;
        }
      }
    }
    for (const el of toRemove) volatile.delete(el);

    // ── Stamp survivors ──────────────────────────────────────────────
    for (const [el, reason] of volatile) {
      el.setAttribute('data-vr-volatile', reason);
    }

    return volatile.size;
  });

  return count;
}

/**
 * Phase 3: Hide third-party widgets, popups, and cross-origin iframes.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function hideWidgetsAndOverlays(page) {
  const hidden = await page.evaluate(() => {
    const results = [];
    const hostname = window.location.hostname;

    const stamp = (el, reason) => {
      if (el.getAttribute('data-vr-hide')) return false;
      el.setAttribute('data-vr-hide', 'true');
      results.push(reason);
      return true;
    };

    const all = Array.from(document.querySelectorAll('*'));
    const vpArea = window.innerWidth * window.innerHeight;

    // Fixed chat widgets & floating buttons
    for (const el of all) {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') continue;
        const z = parseInt(cs.zIndex, 10) || 0;
        const rect = el.getBoundingClientRect();
        const pct = (rect.width * rect.height / vpArea) * 100;
        if (z >= 10000 && pct > 0 && pct < 15) {
          stamp(el, `Chat/widget: ${el.tagName}#${el.id || ''}(z:${z})`); continue;
        }
        if (z >= 100000) {
          stamp(el, `Chat container: ${el.tagName}#${el.id || ''}(z:${z})`); continue;
        }
        const classText = (el.className?.toString?.() || '') + ' ' + (el.id || '');
        if (/popup|modal|auto-capture|overlay/i.test(classText) && z >= 10000) {
          stamp(el, `Popup overlay: ${el.tagName}#${el.id || ''}(z:${z})`);
        }
      } catch {}
    }

    // WhatsApp floating icons
    for (const el of document.querySelectorAll(
      'a[href*="whatsapp"],a[href*="whatsaap"],[class*="whatsapp"],[class*="whatsaap"]'
    )) {
      stamp(el, `WhatsApp: ${el.tagName}`);
      if (el.parentElement && el.parentElement.children.length <= 2)
        stamp(el.parentElement, 'WhatsApp wrapper');
    }

    // Cross-origin iframes
    for (const iframe of document.querySelectorAll('iframe')) {
      const src = iframe.src || '';
      if (!src || src === 'about:blank') {
        if (!iframe.closest('form')) stamp(iframe, 'Blank iframe');
        continue;
      }
      try {
        const iframeHost = new URL(src).hostname;
        if (iframeHost && !iframeHost.includes(hostname) && !hostname.includes(iframeHost))
          stamp(iframe, `Cross-origin iframe: ${iframeHost}`);
      } catch { stamp(iframe, `Iframe: ${src.substring(0, 60)}`); }
    }

    return results;
  });

  if (hidden.length > 0) {
    await page.addStyleTag({ content: `
      [data-vr-hide] {
        display: none !important; visibility: hidden !important;
        pointer-events: none !important; opacity: 0 !important;
        position: fixed !important; top: -9999px !important;
        left: -9999px !important; width: 0 !important;
        height: 0 !important; overflow: hidden !important;
      }`
    });
  }
  return hidden;
}

/**
 * Phase 4: Freeze infinite CSS animations; stamp carousel tracks + videos.
 *
 * FREEZE (element stays visible, animation paused at current frame):
 *   - Elements with animation-iteration-count: infinite
 *
 * STAMP as [data-vr-volatile] (content masked, container tested):
 *   - Known carousel track selectors (.owl-stage, .swiper-wrapper, etc.)
 *   - <video> elements
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function freezeVolatileContent(page) {
  const frozen = await page.evaluate(() => {
    const results = [];

    // Pause infinite CSS animations
    for (const el of document.querySelectorAll('*')) {
      try {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') {
          el.setAttribute('data-vr-frozen', 'animation');
          results.push(`Froze: "${cs.animationName}" on ${el.tagName}.${(el.className?.toString?.() || '').split(' ')[0]}`);
        }
      } catch {}
    }

    // Stamp carousel tracks — outer container stays visible, only track is masked
    const TRACKS = [
      '.owl-stage', '.swiper-wrapper', '.slick-track',
      '[class*="carousel-inner"]', '[class*="slider-track"]', '[class*="slide-track"]',
    ].join(',');
    for (const track of document.querySelectorAll(TRACKS)) {
      if (!track.getAttribute('data-vr-volatile')) {
        track.setAttribute('data-vr-volatile', 'carousel-track');
        results.push(`Stamped carousel track: ${track.className?.toString?.().split(' ')[0]}`);
      }
    }

    // Stamp video elements
    for (const video of document.querySelectorAll('video')) {
      if (!video.getAttribute('data-vr-volatile') && !video.getAttribute('data-vr-hide')) {
        video.setAttribute('data-vr-volatile', 'video');
        results.push(`Stamped video: ${video.id || 'unnamed'}`);
      }
    }

    return results;
  });

  await page.addStyleTag({ content: `
    [data-vr-frozen="animation"], [data-vr-frozen="animation"] * {
      animation-play-state: paused !important;
      animation-delay: -1s !important;
    }`
  });

  // Stop jQuery-based carousel autoplay
  await page.evaluate(() => {
    try {
      const jq = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
      if (!jq) return;
      jq('.owl-carousel').each(function () {
        try {
          const owl = jq(this).data('owl.carousel') || jq(this).data('owlCarousel');
          if (owl) {
            if (owl.settings) owl.settings.autoplay = false;
            if (owl.options)  owl.options.autoplay  = false;
          }
        } catch {}
      });
    } catch {}
  });

  return frozen;
}

/**
 * Phase 5: Build the Playwright mask selector list.
 *
 * Returns CSS selectors for:
 *   1. [data-vr-volatile] — covers everything stamped by behavioral scan + structural detection
 *   2. Captcha QUESTION text — detects "What is X + Y?" math patterns and stamps
 *      the closest captcha container so the full question row is masked (not just input)
 *   3. Captcha inputs — matched by name/id attributes
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function detectMaskTargets(page) {
  const selectors = await page.evaluate(() => {
    const set = new Set();

    // ── Captcha question text detection ─────────────────────────────
    // Finds elements whose DIRECT text contains a math question such as
    // "What is 6 + 9 ?" or "What is 14 - 3?" and stamps the closest
    // captcha container so the ENTIRE row (question + input) is masked.
    const MATH_CAPTCHA = /what\s+is\s+\d+\s*[+\-×÷*/]\s*\d+/i;
    for (const el of document.querySelectorAll('label,span,p,div,li,td')) {
      // Use direct text only — avoid matching parents that contain this via textContent
      let directText = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) directText += node.nodeValue;
      }
      if (!MATH_CAPTCHA.test(directText.trim())) continue;
      const container =
        el.closest('.ks-captcha-line,.form-group,.wpcf7-form-control-wrap,[class*="captcha"]')
        || el.parentElement
        || el;
      container.setAttribute('data-vr-volatile', 'captcha-question');
    }

    // ── Captcha containers by class ──────────────────────────────────
    for (const el of document.querySelectorAll(
      '.ks-captcha-line,.dscf7captcha,.ksolve_captcha,.dscf7_captcha_icon,[class*="captcha"]'
    )) {
      if (!el.className) continue;
      // Bug was /\\s+/ — the double-backslash made it literal \s, not whitespace.
      const selector = el.className.toString().trim().split(/\s+/)
        .filter(c => c.length > 0)
        .map(c => `.${CSS.escape(c)}`).join('');
      if (selector.length > 0) set.add(selector);
    }

    // ── Captcha inputs ───────────────────────────────────────────────
    for (const el of document.querySelectorAll('input[name*="captcha" i],input[id*="captcha" i]')) {
      if (el.id) {
        const m = el.id.match(/^(ks-captcha-[^-]*)/);
        set.add(m ? `[id^="${m[1]}"]` : `input[id="${CSS.escape(el.id)}"]`);
      } else {
        set.add('input[name*="captcha"]');
      }
    }

    // ── All behaviorally/structurally volatile elements ──────────────
    if (document.querySelector('[data-vr-volatile]')) {
      set.add('[data-vr-volatile]');
    }

    // ── Direct carousel/slider class selectors ───────────────────────
    // WP Rocket lazy-loads carousel JS (Owl, Swiper, Slick). The carousel
    // can initialise AFTER Phase 4 has run, so the [data-vr-volatile] stamp
    // on .owl-stage may be lost when the carousel rewrites the DOM node.
    // These selectors are added unconditionally — Playwright resolves them
    // at screenshot time (not here), so they mask correctly even when the
    // carousel initialises late. Playwright silently skips selectors that
    // match zero elements, so adding them unconditionally is safe.
    // .owl-dots / .swiper-pagination / .slick-dots are the active-slide
    // indicators that live OUTSIDE the track; masking them prevents
    // carousel position differences from causing diffs between runs.
    [
      '.owl-stage', '.owl-dots',
      '.swiper-wrapper', '.swiper-pagination',
      '.slick-track', '.slick-dots',
    ].forEach(sel => set.add(sel));

    return [...set];
  });

  return selectors;
}

module.exports = {
  ensureFullPageLoad,
  waitForLayoutStability,
  dismissOverlays,
  behavioralVolatilityScan,
  hideWidgetsAndOverlays,
  freezeVolatileContent,
  detectMaskTargets,
};
