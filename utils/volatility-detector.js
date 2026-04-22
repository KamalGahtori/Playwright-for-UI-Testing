// utils/volatility-detector.js
// ─────────────────────────────────────────────────────────────────────
// Intelligent volatility detection engine.
//
// Five exported functions, called in order by stabilizePage:
//
//   ensureFullPageLoad      — block until every <img> has decoded
//   waitForLayoutStability  — block until no element shifts position
//   dismissOverlays         — click away cookie/consent banners
//   behavioralVolatilityScan — 500ms two-snapshot diff; stamp volatile elements
//   hideWidgetsAndOverlays  — hide chat widgets and cross-origin iframes
//   freezeVolatileContent   — pause animations; stamp carousel tracks + videos
//   detectMaskTargets       — build the final Playwright mask selector list
//
// CORE DESIGN PRINCIPLES:
//
//   Mask content, test containers:
//     The carousel outer shell (size, position, padding) is always in
//     the diff. Only the inner sliding track is masked.
//
//   Direct text comparison, not cascaded textContent:
//     We compare only text nodes that are immediate children of each
//     element (nodeType === 3). Using el.textContent would cascade —
//     if a carousel slide changes "Slide 1" to "Slide 2", every ancestor
//     (section, main, body) would also appear to have changed text,
//     masking huge swaths of the page.
//
//   Keep specific, remove generic (de-duplication):
//     If element A contains volatile element B, we remove A and keep B.
//     This is the opposite of the naive approach. It prevents a single
//     volatile child from causing its entire ancestor chain to be masked.
//
//   Unconditional carousel class selectors:
//     WP Rocket lazy-loads carousel JS. Owl Carousel can initialise after
//     our stamp phase, replacing DOM nodes and losing [data-vr-volatile].
//     We add carousel class selectors (.owl-stage etc.) unconditionally
//     to the mask list — Playwright resolves them at screenshot time, not
//     at Phase 5 evaluation time, so late-initialising carousels are
//     always caught.
// ─────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────
// Phase 0a — ensureFullPageLoad
//
// Blocks until every <img> in the document has fully decoded (or errored).
// Must be called AFTER the lazy-loader scroll passes so images have had
// a chance to start loading.
// ─────────────────────────────────────────────────────────────────────
async function ensureFullPageLoad(page) {
  await page.evaluate(async () => {
    const waitForImg = img => {
      // img.complete is true when the browser has finished the load attempt.
      // naturalHeight > 0 distinguishes a successfully loaded image from a
      // broken one (broken images have complete=true but naturalHeight=0).
      if (img.complete && img.naturalHeight > 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load',  resolve, { once: true });
        img.addEventListener('error', resolve, { once: true }); // resolve even on failure — we just need the request to finish
        setTimeout(resolve, 8000); // 8s per-image ceiling so one slow CDN does not block everything
      });
    };
    await Promise.allSettled(Array.from(document.querySelectorAll('img')).map(waitForImg));

    // Wait for web fonts to finish loading so text renders at the correct
    // metrics in the screenshot.
    try {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]);
    } catch {}
  });
}


// ─────────────────────────────────────────────────────────────────────
// Phase 0b — waitForLayoutStability
//
// Polls structural landmarks every 500ms until two consecutive snapshots
// have identical offsetTop/offsetHeight/offsetLeft/offsetWidth values.
// Exits early when stable; ceiling is 3s (6 × 500ms).
//
// Structural landmarks are: img, h1–h3, nav, header, footer, section,
// and any element with a class containing "hero". We cap at 40 elements
// to keep the comparison fast.
// ─────────────────────────────────────────────────────────────────────
async function waitForLayoutStability(page) {
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // Snapshot: a string encoding the position and size of up to 40
    // structural landmarks. Two identical strings mean the layout is stable.
    const snapshot = () =>
      Array.from(document.querySelectorAll(
        'img, h1, h2, h3, nav, header, footer, section, [class*="hero"]'
      ))
        .slice(0, 40) // cap to keep the join cheap
        .map(el => `${el.offsetTop},${el.offsetHeight},${el.offsetLeft},${el.offsetWidth}`)
        .join('|');

    let prev = snapshot();
    for (let i = 0; i < 6; i++) {
      await delay(500);
      const curr = snapshot();
      if (curr === prev) return; // two consecutive samples matched — layout is stable
      prev = curr;
    }
    // If we exit the loop without matching, layout is still shifting but
    // we proceed anyway — the 1.5s buffer in Pass 3 provides extra settle time.
  });
}


// ─────────────────────────────────────────────────────────────────────
// Phase 1 — dismissOverlays
//
// Automatically clicks the dismiss button on cookie/consent banners.
// Must run BEFORE the behavioural scan so a disappearing banner does not
// make the entire page appear volatile.
//
// Detection strategy:
//   1. Find all fixed/sticky elements (they float above page content).
//   2. Filter to those whose text contains consent keywords.
//   3. Score all interactive children by dismiss-text patterns.
//   4. Click the highest-scoring button if score >= 5.
// ─────────────────────────────────────────────────────────────────────
async function dismissOverlays(page) {
  const dismissed = await page.evaluate(async () => {
    const results = [];
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // Consent banners are almost always fixed or sticky so they sit on
    // top of page content.
    const fixedEls = Array.from(document.querySelectorAll('*')).filter(el => {
      try {
        const pos = getComputedStyle(el).position;
        return pos === 'fixed' || pos === 'sticky';
      } catch { return false; }
    });

    // Keywords that indicate a consent/cookie banner.
    const consentPattern = /cookie|consent|privacy.?policy|gdpr/i;
    // Text patterns found on dismiss/accept buttons.
    const dismissPattern = /accept|got\s*it|close|ok\b|agree|dismiss|understand|×|✕|✖/i;

    for (const el of fixedEls) {
      if (!consentPattern.test(el.textContent || '')) continue;

      const interactives = Array.from(
        el.querySelectorAll('button, a, [role="button"], [class*="btn"]')
      );

      // Score each interactive child to find the most likely dismiss action.
      let bestBtn = null, bestScore = 0;
      for (const btn of interactives) {
        const txt = (btn.textContent || '').trim();
        let score = 0;
        if (dismissPattern.test(txt)) score += 10; // strong signal: dismiss-like text
        if (/accept|got\s*it|agree/i.test(txt)) score += 5; // bonus for affirmative wording
        if (btn.tagName === 'BUTTON') score += 2;  // native button elements are more reliable
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) score += 3; // must be visible
        if (score > bestScore) { bestScore = score; bestBtn = btn; }
      }

      // Score threshold of 5 prevents false positives (e.g. clicking
      // navigation links that happen to be inside a sticky header).
      if (bestBtn && bestScore >= 5) {
        try {
          bestBtn.click();
          results.push(`Dismissed: "${(bestBtn.textContent || '').trim().substring(0, 40)}"`);
          await delay(600); // give the banner time to animate out
        } catch {}
      }
    }
    return results;
  });

  // After clicking, wait for modal/cookie classes to actually disappear
  // from the DOM before proceeding to the behavioural scan.
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
    } catch {} // if it times out, the banner may still be there but we proceed
  }
  return dismissed;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 2 — behavioralVolatilityScan
//
// The core intelligence layer. Observes the ENTIRE page for 500ms and
// compares two DOM snapshots. Anything that changed is stamped
// [data-vr-volatile] for masking.
//
// What is detected (zero hardcoded selectors):
//   - Carousel/slider tracks (CSS transform changes while sliding)
//   - Number counters and tickers (direct text changes)
//   - Auto-cycling testimonials (direct text changes)
//   - CSS background sliders (background-position changes)
//   - Any live-data widget whose own text node updates
//
// Returns the count of elements stamped volatile.
// ─────────────────────────────────────────────────────────────────────
async function behavioralVolatilityScan(page) {
  const count = await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const SCAN_MS  = 500;  // observation window length in milliseconds
    const MIN_AREA = 400;  // minimum px² to be worth scanning (filters out 1px spacers, SVG paths, etc.)

    // Tags we never need to scan — they either have no visual content or
    // are structural wrappers that would only produce false positives.
    const SKIP_TAGS = new Set([
      'html','head','body','script','style','meta','link',
      'noscript','title','br','hr','svg','path','g','defs','use',
    ]);

    // ── Helper: direct text of an element (NOT inherited from children) ──
    //
    // WHY NOT el.textContent?
    //   textContent returns the concatenated text of ALL descendants.
    //   If a carousel slide changes its own text, el.textContent on every
    //   ancestor (div, section, main, body) would also appear to change.
    //   That would mark the entire page as volatile.
    //
    // WHY nodeType === 3?
    //   nodeType 3 = TEXT_NODE. These are the actual text nodes that are
    //   direct children of the element — not inherited from sub-elements.
    //   Comparing only these makes the detection surgical.
    const directText = el => {
      let t = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) t += node.nodeValue;
      }
      return t.trim().substring(0, 300); // cap at 300 chars to keep snapshot small
    };

    // ── Collect all rendered candidates across the full document ─────
    // We observe every element that is visible and large enough to matter.
    const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
      // Skip already-stamped elements — they were handled in a previous phase.
      if (el.getAttribute('data-vr-volatile') ||
          el.getAttribute('data-vr-frozen') ||
          el.getAttribute('data-vr-hide')) return false;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return false;

      const cs = getComputedStyle(el);
      // Skip elements that are not rendered.
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;

      // Skip elements that have no meaningful visual area.
      // getBoundingClientRect().width * height works for both in-viewport
      // and off-screen elements (as long as content-visibility:auto has
      // been overridden to visible — done in base-fixtures.js Step 1).
      const rect = el.getBoundingClientRect();
      if (rect.width * rect.height < MIN_AREA) return false;
      return true;
    });

    // ── Snapshot 1 ───────────────────────────────────────────────────
    const snap = candidates.map(el => {
      const cs = getComputedStyle(el);
      return {
        el,
        text:      directText(el),       // direct text only — no cascade
        transform: cs.transform,         // catches carousel track sliding
        bgPos:     cs.backgroundPosition, // catches CSS background sliders
      };
    });

    await delay(SCAN_MS); // observation window — let the page behave naturally

    // ── Snapshot 2 + comparison ──────────────────────────────────────
    const volatile = new Map(); // Map<element, reason string>
    for (const s of snap) {
      const { el } = s;
      // Element may have been removed from DOM during the observation window.
      if (!document.contains(el)) continue;

      const cs     = getComputedStyle(el);
      const text2  = directText(el);
      const tf2    = cs.transform;
      const bgPos2 = cs.backgroundPosition;

      if (s.text !== text2 && (s.text.length > 0 || text2.length > 0)) {
        // Own text changed — counter, ticker, or auto-cycling text.
        volatile.set(el, 'content');
      } else if (s.transform !== tf2 && s.transform !== 'none' && tf2 !== 'none') {
        // Transform changed AND was already non-identity in snapshot 1.
        // The 'non-identity in snapshot 1' guard prevents flagging elements
        // that animate from transform:none to a value on first load (entrance
        // animations) — we only want to catch continuously-cycling transforms.
        volatile.set(el, 'transform');
      } else if (s.bgPos !== bgPos2) {
        // Background position changed — CSS background slider.
        volatile.set(el, 'background');
      }
    }

    // ── De-duplication: KEEP SPECIFIC, REMOVE GENERIC ───────────────
    //
    // Problem without de-duplication:
    //   A carousel slide changes its text. Both the <p> inside the slide
    //   AND the <div class="carousel"> that contains it appear volatile
    //   (because the <p>'s transform is inherited by the <div> in some
    //   layouts, or both have transforms). Masking the <div> would black
    //   out the entire carousel container — violating "test containers".
    //
    // Solution:
    //   For each volatile element, check if it CONTAINS another volatile
    //   element. If yes, it is a generic ancestor — remove it and keep
    //   only the more-specific child.
    //
    // Result: only the deepest/most-specific volatile elements are stamped.
    const toRemove = new Set();
    const volatileEls = [...volatile.keys()];

    for (const container of volatileEls) {
      for (const candidate of volatileEls) {
        if (candidate !== container && container.contains(candidate)) {
          // container wraps a more-specific volatile element — discard container
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


// ─────────────────────────────────────────────────────────────────────
// Phase 3 — hideWidgetsAndOverlays
//
// Hides third-party floating elements that sit on top of page content
// but are not part of the page's own layout. These are removed from
// view entirely (not masked) because they would block content behind them.
//
// Detection uses z-index thresholds and element area:
//   z >= 10000 AND area < 15% viewport → chat bubble / floating button
//   z >= 100000                        → full chat container
//   class matches popup/modal + z >= 10000 → auto-capture / exit-intent
//
// Cross-origin iframes are hidden because we cannot screenshot their
// content and they can overlap page layout.
// ─────────────────────────────────────────────────────────────────────
async function hideWidgetsAndOverlays(page) {
  const hidden = await page.evaluate(() => {
    const results = [];
    const hostname = window.location.hostname;

    // Stamp helper — sets data-vr-hide and records a description.
    // Returns false if the element was already stamped (prevents duplication).
    const stamp = (el, reason) => {
      if (el.getAttribute('data-vr-hide')) return false;
      el.setAttribute('data-vr-hide', 'true');
      results.push(reason);
      return true;
    };

    const all    = Array.from(document.querySelectorAll('*'));
    const vpArea = window.innerWidth * window.innerHeight; // total viewport area in px²

    // ── Fixed elements (chat widgets, floating CTAs) ──────────────────
    for (const el of all) {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') continue; // only fixed elements float over content

        const z    = parseInt(cs.zIndex, 10) || 0;
        const rect = el.getBoundingClientRect();
        // pct = what fraction of the viewport this element covers (0–100%).
        const pct  = (rect.width * rect.height / vpArea) * 100;

        if (z >= 10000 && pct > 0 && pct < 15) {
          // High z-index, small area → chat bubble or floating CTA button.
          // The < 15% area guard prevents hiding legitimate modals that happen
          // to have high z-index (they would cover too much of the page).
          stamp(el, `Chat/widget: ${el.tagName}#${el.id || ''}(z:${z})`);
          continue;
        }
        if (z >= 100000) {
          // Extremely high z-index → full chat panel / live agent container.
          stamp(el, `Chat container: ${el.tagName}#${el.id || ''}(z:${z})`);
          continue;
        }
        const classText = (el.className?.toString?.() || '') + ' ' + (el.id || '');
        if (/popup|modal|auto-capture|overlay/i.test(classText) && z >= 10000) {
          // Exit-intent or auto-capture popups — class name confirms it is
          // an overlay, not a regular component that happens to have z-index.
          stamp(el, `Popup overlay: ${el.tagName}#${el.id || ''}(z:${z})`);
        }
      } catch {}
    }

    // ── External scheduling embeds (TidyCal, Calendly) ──────────────
    // These widgets fetch available time slots from an external API and
    // render a calendar whose height varies with the number of slots returned.
    // A different slot count between baseline and test run shifts everything
    // below the widget, causing a full-page cascade diff.
    // Hiding them collapses the container to 0px in both runs → stable layout.
    for (const el of document.querySelectorAll(
      'tidycal-embed, .tidycal-embed, [data-path*="tidycal"], ' +
      '.calendly-inline-widget, .calendly-badge-widget, [data-url*="calendly"]'
    )) {
      stamp(el, `Scheduling embed: ${el.tagName}`);
      // Also hide the nearest section/div wrapper if it only wraps this widget,
      // so the collapsed empty container does not leave an unexpected gap.
      const wrapper = el.closest('section, .section, [class*="booking"], [class*="schedule"]');
      if (wrapper && wrapper !== document.body && wrapper.children.length <= 3) {
        stamp(wrapper, `Scheduling embed wrapper: ${wrapper.tagName}.${(wrapper.className?.toString?.() || '').split(' ')[0]}`);
      }
    }

    // ── WhatsApp floating icons ───────────────────────────────────────
    // WhatsApp buttons are a common fixture on marketing sites. They float
    // in a corner and would fail tests if their position shifts between runs.
    for (const el of document.querySelectorAll(
      'a[href*="whatsapp"],a[href*="whatsaap"],[class*="whatsapp"],[class*="whatsaap"]'
    )) {
      stamp(el, `WhatsApp: ${el.tagName}`);
      // Also hide the wrapper if it only contains the WhatsApp element
      // (parent with <= 2 children), so no stub div is left behind.
      if (el.parentElement && el.parentElement.children.length <= 2)
        stamp(el.parentElement, 'WhatsApp wrapper');
    }

    // ── Cross-origin iframes ──────────────────────────────────────────
    // We cannot screenshot the content of cross-origin iframes, and their
    // rendered dimensions can vary between runs (e.g. live chat widgets,
    // Google Maps, embedded social posts).
    for (const iframe of document.querySelectorAll('iframe')) {
      const src = iframe.src || '';
      if (!src || src === 'about:blank') {
        // Blank iframes that are not inside a form are likely residual
        // script containers — hide them to avoid false positives.
        if (!iframe.closest('form')) stamp(iframe, 'Blank iframe');
        continue;
      }
      try {
        const iframeHost = new URL(src).hostname;
        // Cross-origin: iframe host differs from page host in both directions.
        if (iframeHost && !iframeHost.includes(hostname) && !hostname.includes(iframeHost))
          stamp(iframe, `Cross-origin iframe: ${iframeHost}`);
      } catch { stamp(iframe, `Iframe: ${src.substring(0, 60)}`); }
    }

    return results;
  });

  // Apply a single CSS rule that hides all [data-vr-hide] elements.
  // Using addStyleTag applies it globally — more reliable than setting
  // inline styles, which can be overridden by specificity.
  if (hidden.length > 0) {
    await page.addStyleTag({ content: `
      [data-vr-hide] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }`
    });
  }
  return hidden;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 4 — freezeVolatileContent
//
// FREEZE (element stays visible, animation paused at current frame):
//   Elements with animation-iteration-count: infinite.
//   The element continues to occupy its layout space and is tested.
//   Only the motion is stopped.
//
// STAMP as [data-vr-volatile] (content masked, container tested):
//   Known carousel track selectors — structural detection that catches
//   carousels even when they are not auto-playing during the scan window.
//   <video> elements — frame differs on every load.
// ─────────────────────────────────────────────────────────────────────
async function freezeVolatileContent(page) {
  const frozen = await page.evaluate(() => {
    const results = [];

    // ── Pause infinite CSS animations ────────────────────────────────
    for (const el of document.querySelectorAll('*')) {
      try {
        const cs = getComputedStyle(el);
        // animationName !== 'none' confirms an animation is defined.
        // animationIterationCount === 'infinite' means it cycles forever.
        if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') {
          el.setAttribute('data-vr-frozen', 'animation');
          results.push(`Froze: "${cs.animationName}" on ${el.tagName}.${(el.className?.toString?.() || '').split(' ')[0]}`);
        }
      } catch {}
    }

    // ── Stamp carousel tracks (structural detection) ──────────────────
    // These class names are part of the public API of each carousel library
    // and are stable across versions. Using them here is intentional —
    // they are universal structural patterns, not site-specific selectors.
    const TRACKS = [
      '.owl-stage',             // Owl Carousel 2 — the sliding track
      '.swiper-wrapper',        // Swiper — the sliding track
      '.slick-track',           // Slick — the sliding track
      '[class*="carousel-inner"]', // Bootstrap carousel inner
      '[class*="slider-track"]',   // generic slider track pattern
      '[class*="slide-track"]',    // generic slide track pattern
    ].join(',');

    for (const track of document.querySelectorAll(TRACKS)) {
      if (!track.getAttribute('data-vr-volatile')) {
        track.setAttribute('data-vr-volatile', 'carousel-track');
        results.push(`Stamped carousel track: ${track.className?.toString?.().split(' ')[0]}`);
      }
    }

    // ── Stamp video elements ──────────────────────────────────────────
    // Videos are autoplay/loop on this site (hero background video).
    // The frame captured depends on exact timing — always mask them.
    for (const video of document.querySelectorAll('video')) {
      if (!video.getAttribute('data-vr-volatile') && !video.getAttribute('data-vr-hide')) {
        video.setAttribute('data-vr-volatile', 'video');
        results.push(`Stamped video: ${video.id || 'unnamed'}`);
      }
    }

    return results;
  });

  // Apply CSS to freeze all stamped animations.
  // animation-delay: -1s forces the animation to its 1-second mark so
  // the element is visible at a meaningful position rather than the
  // start-of-animation state (which may be invisible or offscreen).
  await page.addStyleTag({ content: `
    [data-vr-frozen="animation"], [data-vr-frozen="animation"] * {
      animation-play-state: paused !important;
      animation-delay: -1s !important;
    }`
  });

  // Stop jQuery-based Owl Carousel autoplay.
  // This prevents carousels from advancing further after we have
  // already stamped them — reduces the window for position drift.
  await page.evaluate(() => {
    try {
      const jq = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
      if (!jq) return;
      jq('.owl-carousel').each(function () {
        try {
          // Owl Carousel stores its instance on the element's data object.
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


// ─────────────────────────────────────────────────────────────────────
// Phase 5 — detectMaskTargets
//
// Builds the final array of CSS selector strings that Playwright will
// use to overlay opaque rectangles over volatile areas in the screenshot.
//
// Three categories of mask targets:
//   1. [data-vr-volatile] — everything stamped by Phases 2 and 4.
//   2. Carousel class selectors — added UNCONDITIONALLY (see note below).
//   3. CAPTCHA question text and input fields.
//
// NOTE on unconditional carousel selectors:
//   WP Rocket lazy-loads carousel JS (Owl, Swiper, Slick). The carousel
//   can initialise AFTER Phase 4 has stamped .owl-stage with [data-vr-volatile],
//   causing Owl to replace the DOM node and lose the attribute. Adding the
//   class selectors here (inside page.evaluate, returned as strings) means
//   Playwright receives them as mask locators and resolves them against the
//   DOM at screenshot time — not at the time this function runs. So even a
//   carousel that initialises 2 seconds after stabilizePage() completes will
//   still be masked. Playwright silently skips selectors that match zero
//   elements, so adding them unconditionally is safe.
// ─────────────────────────────────────────────────────────────────────
async function detectMaskTargets(page) {
  const selectors = await page.evaluate(() => {
    const set = new Set();

    // ── CAPTCHA question text ────────────────────────────────────────
    // Detect "What is 6 + 9?" math-question patterns in direct text.
    // We stamp the closest captcha container (not just the label) so the
    // entire question row — label + input — is covered by the mask.
    const MATH_CAPTCHA = /what\s+is\s+\d+\s*[+\-×÷*/]\s*\d+/i;
    for (const el of document.querySelectorAll('label,span,p,div,li,td')) {
      let directText = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) directText += node.nodeValue; // direct text only
      }
      if (!MATH_CAPTCHA.test(directText.trim())) continue;

      // Walk up to the nearest captcha container. Fall back to the parent,
      // then to the element itself if nothing matches.
      const container =
        el.closest('.ks-captcha-line,.form-group,.wpcf7-form-control-wrap,[class*="captcha"]')
        || el.parentElement
        || el;
      container.setAttribute('data-vr-volatile', 'captcha-question');
    }

    // ── CAPTCHA containers by class ───────────────────────────────────
    // Build a compound CSS selector from the element's class list so the
    // mask covers the entire captcha widget even if the math-question
    // pattern was not detected above.
    for (const el of document.querySelectorAll(
      '.ks-captcha-line,.dscf7captcha,.ksolve_captcha,.dscf7_captcha_icon,[class*="captcha"]'
    )) {
      if (!el.className) continue;
      // CSS.escape handles any special characters in class names that
      // would otherwise break the selector string.
      const selector = el.className.toString().trim().split(/\s+/)
        .filter(c => c.length > 0)
        .map(c => `.${CSS.escape(c)}`).join('');
      if (selector.length > 0) set.add(selector);
    }

    // ── CAPTCHA inputs ────────────────────────────────────────────────
    // Mask the input itself so the randomly-generated answer does not
    // cause a diff (the field may pre-fill with "?" or a hint value).
    for (const el of document.querySelectorAll('input[name*="captcha" i],input[id*="captcha" i]')) {
      if (el.id) {
        // Use an id-prefix selector (e.g. [id^="ks-captcha-"]) so that
        // dynamically-suffixed IDs like "ks-captcha-field-42" are covered.
        const m = el.id.match(/^(ks-captcha-[^-]*)/);
        set.add(m ? `[id^="${m[1]}"]` : `input[id="${CSS.escape(el.id)}"]`);
      } else {
        set.add('input[name*="captcha"]');
      }
    }

    // ── All behaviorally/structurally stamped volatile elements ───────
    if (document.querySelector('[data-vr-volatile]')) {
      set.add('[data-vr-volatile]');
    }

    // ── Unconditional carousel / slider class selectors ───────────────
    // See the module-level note above for WHY these are unconditional.
    //
    // Track selectors (.owl-stage etc.) mask the sliding content.
    // Indicator selectors (.owl-dots etc.) mask the active-slide dots,
    // which change position between runs and would cause false failures.
    [
      '.owl-stage',          // Owl Carousel — sliding track
      '.owl-dots',           // Owl Carousel — active-slide indicator dots
      '.swiper-wrapper',     // Swiper — sliding track
      '.swiper-pagination',  // Swiper — active-slide indicator
      '.slick-track',        // Slick — sliding track
      '.slick-dots',         // Slick — active-slide indicator dots
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
