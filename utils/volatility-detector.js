// utils/volatility-detector.js
// ─────────────────────────────────────────────────────────────────────
// Intelligent Layout-Aware Volatility Detection Engine
//
// EXPORTED FUNCTIONS (called from base-fixtures.js):
//
//   ensureFullPageLoad(page)
//     Block until every <img> in the DOM has decoded.
//
//   scanViewportForVolatileContent(page)
//     350ms mini behavioral scan on elements CURRENTLY in viewport.
//     Called at each scroll position during Pass 2 so viewport-triggered
//     carousels and IntersectionObserver animations are caught while active.
//
//   waitForLayoutStability(page)
//     Snapshot-compare structural landmarks every 500ms until nothing moves.
//
//   fastForwardFiniteAnimations(page)
//     Set duration of finite CSS animations and transitions to 0.001ms so
//     entrance effects (slide-in, fade-in, counter) reach their final state
//     before the screenshot. Infinite animations are left untouched —
//     they are handled later by freezeVolatileContent.
//
//   dismissOverlays(page)
//     Click away cookie/consent banners.
//
//   behavioralVolatilityScan(page)
//     500ms full-page two-snapshot diff. Stamps [data-vr-volatile] on any
//     element whose direct text, CSS transform, or background-position changed.
//     Uses DIRECT text nodes (not inherited textContent) and KEEP-SPECIFIC
//     de-duplication to prevent the entire page from being masked.
//
//   hideWidgetsAndOverlays(page)
//     Hide chat widgets, popups, cross-origin iframes via [data-vr-hide].
//
//   freezeVolatileContent(page)
//     Pause infinite CSS animations. Stamp carousel tracks (named + generic).
//     Generic detection: overflow:hidden parent + translate-transformed child.
//
//   detectMaskTargets(page)
//     Return CSS selectors covering [data-vr-volatile] + captcha.
//
// DESIGN PRINCIPLE: Mask Content, Test Containers
//   The carousel CONTAINER (size, position, padding) stays in the diff.
//   Only the sliding TRACK is masked. Layout is always verified.
// ─────────────────────────────────────────────────────────────────────

/**
 * Block until every <img> in the document has fully decoded.
 * Call after the lazy-loader scroll so images have started loading.
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
    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]); }
    catch {}
  });
}

/**
 * Per-viewport mini behavioral scan — called at each scroll position during Pass 2.
 *
 * WHY THIS EXISTS:
 *   The full-page scan (behavioralVolatilityScan) runs from the top of the page
 *   after returning from scrolling. Carousels and counters that are triggered by
 *   IntersectionObserver only animate when they are inside the viewport. By the
 *   time we're back at the top, those below-fold elements have paused — so the
 *   full-page scan misses them.
 *
 *   This function runs at each section WHILE the user is scrolled to it, so
 *   those active animations are observed and stamped during this pass.
 *
 *   Uses the same DIRECT TEXT + KEEP-SPECIFIC de-duplication as the full scan.
 */
async function scanViewportForVolatileContent(page) {
  await page.evaluate(async () => {
    const delay    = ms => new Promise(r => setTimeout(r, ms));
    const SCAN_MS  = 350;
    const MIN_AREA = 400;
    const SKIP_TAGS = new Set([
      'html','head','body','script','style','meta','link','noscript','svg','path','g','defs',
    ]);

    const directText = el => {
      let t = '';
      for (const node of el.childNodes) if (node.nodeType === 3) t += node.nodeValue;
      return t.trim().substring(0, 200);
    };

    const vpH = window.innerHeight;
    const vpW = window.innerWidth;

    // Only elements currently visible in the browser window
    const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
      if (el.getAttribute('data-vr-volatile') || el.getAttribute('data-vr-frozen')) return false;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vpH) return false;
      if (rect.right < 0 || rect.left > vpW) return false;
      if (rect.width * rect.height < MIN_AREA) return false;
      return true;
    });

    const snap = candidates.map(el => {
      const cs = getComputedStyle(el);
      return {
        el,
        text:      directText(el),
        transform: cs.transform,
        bgPos:     cs.backgroundPosition,
        left:      cs.left,
        marginL:   cs.marginLeft,
      };
    });

    await delay(SCAN_MS);

    const volatile = new Map();
    for (const s of snap) {
      const { el } = s;
      if (!document.contains(el)) continue;
      const cs    = getComputedStyle(el);
      const text2 = directText(el);
      const tf2   = cs.transform;
      const bg2   = cs.backgroundPosition;
      const left2 = cs.left;
      const mL2   = cs.marginLeft;

      if (s.text !== text2 && (s.text.length > 0 || text2.length > 0)) {
        volatile.set(el, 'vp-content');
      } else if (s.transform !== tf2 && s.transform !== 'none' && tf2 !== 'none') {
        volatile.set(el, 'vp-transform');
      } else if (s.bgPos !== bg2) {
        volatile.set(el, 'vp-background');
      } else if (s.left !== left2 && s.left !== 'auto' && left2 !== 'auto') {
        volatile.set(el, 'vp-left');
      } else if (s.marginL !== mL2 && s.marginL !== '0px' && mL2 !== '0px') {
        volatile.set(el, 'vp-margin');
      }
    }

    // De-dup: keep specific, remove generic ancestors
    const toRemove = new Set();
    for (const [container] of volatile) {
      for (const [candidate] of volatile) {
        if (candidate !== container && container.contains(candidate)) {
          toRemove.add(container);
          break;
        }
      }
    }
    for (const el of toRemove) volatile.delete(el);

    for (const [el, reason] of volatile) {
      el.setAttribute('data-vr-volatile', reason);
    }
  });
}

/**
 * Snapshot-compare structural landmarks every 500ms.
 * Exits as soon as two consecutive samples match. Ceiling: 3s.
 * Catches: WP Rocket CLS, entrance animation layout shifts.
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
    for (let i = 0; i < 6; i++) {
      await delay(500);
      const curr = snapshot();
      if (curr === prev) return;
      prev = curr;
    }
  });
}

/**
 * Fast-forward all FINITE CSS animations and transitions to their end state.
 *
 * WHY:
 *   Entrance animations (slide-in, fade-in, counter increment) are finite —
 *   they run once and stop. If the screenshot is taken mid-animation, elements
 *   appear at wrong positions or opacities.
 *   Setting duration to 0.001ms forces them to complete instantly before the
 *   layout stability check runs.
 *
 *   INFINITE animations (carousels, pulsing dots) are intentionally LEFT ALONE
 *   here — they will be paused later by freezeVolatileContent.
 */
async function fastForwardFiniteAnimations(page) {
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      try {
        const cs = getComputedStyle(el);

        // Finite animation → fast-forward to end
        if (cs.animationName !== 'none' && cs.animationIterationCount !== 'infinite') {
          el.style.animationDuration   = '0.001ms';
          el.style.animationDelay      = '0ms';
          el.style.animationFillMode   = 'forwards';
        }

        // All CSS transitions → instant (eliminates hover/state transition uncertainty)
        if (cs.transitionDuration && cs.transitionDuration !== '0s') {
          el.style.transitionDuration = '0.001ms';
          el.style.transitionDelay    = '0ms';
        }
      } catch {}
    });
  });

  // Short pause to let instant animations fire their end keyframe
  await page.waitForTimeout(300);
}

/**
 * Dismiss cookie/consent banners.
 * Detection: fixed/sticky position + consent keyword + dismiss button.
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

    const consentPat = /cookie|consent|privacy.?policy|gdpr/i;
    const dismissPat = /accept|got\s*it|close|ok\b|agree|dismiss|understand|×|✕|✖/i;

    for (const el of fixedEls) {
      if (!consentPat.test(el.textContent || '')) continue;
      const btns = Array.from(el.querySelectorAll('button,a,[role="button"],[class*="btn"]'));
      let best = null, bestScore = 0;
      for (const btn of btns) {
        const txt = (btn.textContent || '').trim();
        let s = 0;
        if (dismissPat.test(txt)) s += 10;
        if (/accept|got\s*it|agree/i.test(txt)) s += 5;
        if (btn.tagName === 'BUTTON') s += 2;
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) s += 3;
        if (s > bestScore) { bestScore = s; best = btn; }
      }
      if (best && bestScore >= 5) {
        try {
          best.click();
          results.push(`Dismissed: "${(best.textContent || '').trim().substring(0, 40)}"`);
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
 * Full-page behavioral volatility scan — called once after returning to top.
 *
 * Compares two DOM snapshots 500ms apart across the ENTIRE document.
 * Stamps elements whose DIRECT text, CSS transform, or background-position changed.
 *
 * DIRECT TEXT (not textContent):
 *   Comparing el.textContent causes a cascade — a carousel slide changing
 *   text marks every ancestor (section, main, body) as volatile, eventually
 *   masking the whole page. We compare only the text that the element OWNS
 *   directly (Text node children), so only the specific changing element is stamped.
 *
 * KEEP-SPECIFIC de-duplication:
 *   If element A CONTAINS volatile element B, we remove A and keep B.
 *   This ensures masking is surgical — only the specific volatile region
 *   is blacked out, not its entire parent container.
 */
async function behavioralVolatilityScan(page) {
  const count = await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const SCAN_MS  = 500;
    const MIN_AREA = 400;
    const SKIP_TAGS = new Set([
      'html','head','body','script','style','meta','link','noscript','svg','path','g','defs',
    ]);

    const directText = el => {
      let t = '';
      for (const node of el.childNodes) if (node.nodeType === 3) t += node.nodeValue;
      return t.trim().substring(0, 300);
    };

    const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
      if (el.getAttribute('data-vr-volatile') || el.getAttribute('data-vr-frozen') ||
          el.getAttribute('data-vr-hide')) return false;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width * rect.height < MIN_AREA) return false;
      return true;
    });

    const snap = candidates.map(el => {
      const cs = getComputedStyle(el);
      return {
        el,
        text:      directText(el),
        transform: cs.transform,
        bgPos:     cs.backgroundPosition,
        left:      cs.left,
        marginL:   cs.marginLeft,
      };
    });

    await delay(SCAN_MS);

    const volatile = new Map();
    for (const s of snap) {
      const { el } = s;
      if (!document.contains(el)) continue;
      const cs    = getComputedStyle(el);
      const text2 = directText(el);
      const tf2   = cs.transform;
      const bg2   = cs.backgroundPosition;
      const left2 = cs.left;
      const mL2   = cs.marginLeft;

      if (s.text !== text2 && (s.text.length > 0 || text2.length > 0)) {
        volatile.set(el, 'content');
      } else if (s.transform !== tf2 && s.transform !== 'none' && tf2 !== 'none') {
        volatile.set(el, 'transform');
      } else if (s.bgPos !== bg2) {
        volatile.set(el, 'background');
      } else if (s.left !== left2 && s.left !== 'auto' && left2 !== 'auto') {
        volatile.set(el, 'left');
      } else if (s.marginL !== mL2 && s.marginL !== '0px' && mL2 !== '0px') {
        volatile.set(el, 'margin');
      }
    }

    // Keep specific, remove generic ancestors
    const toRemove = new Set();
    const vEls = [...volatile.keys()];
    for (const container of vEls) {
      for (const candidate of vEls) {
        if (candidate !== container && container.contains(candidate)) {
          toRemove.add(container); break;
        }
      }
    }
    for (const el of toRemove) volatile.delete(el);

    for (const [el, reason] of volatile) el.setAttribute('data-vr-volatile', reason);

    return volatile.size;
  });

  return count;
}

/**
 * Hide third-party widgets, popups, and cross-origin iframes via [data-vr-hide].
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

    for (const el of all) {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') continue;
        const z    = parseInt(cs.zIndex, 10) || 0;
        const rect = el.getBoundingClientRect();
        const pct  = (rect.width * rect.height / vpArea) * 100;
        if (z >= 10000 && pct > 0 && pct < 15) {
          stamp(el, `Chat/widget: ${el.tagName}#${el.id || ''}(z:${z})`); continue;
        }
        if (z >= 100000) {
          stamp(el, `Chat container: ${el.tagName}#${el.id || ''}(z:${z})`); continue;
        }
        const cls = (el.className?.toString?.() || '') + ' ' + (el.id || '');
        if (/popup|modal|auto-capture|overlay/i.test(cls) && z >= 10000)
          stamp(el, `Popup overlay: ${el.tagName}#${el.id || ''}(z:${z})`);
      } catch {}
    }

    for (const el of document.querySelectorAll(
      'a[href*="whatsapp"],a[href*="whatsaap"],[class*="whatsapp"],[class*="whatsaap"]'
    )) {
      stamp(el, `WhatsApp: ${el.tagName}`);
      if (el.parentElement && el.parentElement.children.length <= 2)
        stamp(el.parentElement, 'WhatsApp wrapper');
    }

    for (const iframe of document.querySelectorAll('iframe')) {
      const src = iframe.src || '';
      if (!src || src === 'about:blank') {
        if (!iframe.closest('form')) stamp(iframe, 'Blank iframe');
        continue;
      }
      try {
        const h = new URL(src).hostname;
        if (h && !h.includes(hostname) && !hostname.includes(h))
          stamp(iframe, `Cross-origin iframe: ${h}`);
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
      }` });
  }
  return hidden;
}

/**
 * Freeze infinite CSS animations and stamp volatile carousel tracks.
 *
 * THREE detection layers for carousels:
 *   A) Named structural — .owl-stage, .swiper-wrapper, .slick-track, etc.
 *   B) Generic structural — any element with a translate transform whose
 *      parent is overflow:hidden (catches ALL carousel libraries not in list A)
 *   C) Viewport behavioral — already stamped by scanViewportForVolatileContent
 *      during Pass 2 (vp-transform reason)
 *
 * The carousel CONTAINER is never stamped — its layout stays in the diff.
 * Only the TRACK (the part that translates) is masked.
 */
async function freezeVolatileContent(page) {
  const frozen = await page.evaluate(() => {
    const results = [];

    // ── A: Pause + mask infinite CSS animations ─────────────────────
    // Infinite animations produce different visual frames on every page load.
    // Pausing alone is non-deterministic: the element freezes wherever the
    // browser happens to be in the animation cycle at the moment our CSS
    // kicks in. We must ALSO mask them so pixel diffs are always clean.
    for (const el of document.querySelectorAll('*')) {
      try {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') {
          el.setAttribute('data-vr-frozen', 'animation');
          el.setAttribute('data-vr-volatile', 'animation-infinite');
          results.push(`Froze+masked anim: "${cs.animationName}" on ${el.tagName}.${(el.className?.toString?.() || '').split(' ')[0]}`);
        }
      } catch {}
    }

    // ── B: Named carousel tracks ─────────────────────────────────────
    const NAMED_TRACKS = [
      '.owl-stage', '.swiper-wrapper', '.slick-track',
      '[class*="carousel-inner"]', '[class*="slider-track"]', '[class*="slide-track"]',
    ].join(',');

    for (const track of document.querySelectorAll(NAMED_TRACKS)) {
      if (!track.getAttribute('data-vr-volatile')) {
        track.setAttribute('data-vr-volatile', 'carousel-named');
        results.push(`Named carousel track: ${track.className?.toString?.().split(' ')[0]}`);
      }
    }

    // ── C: Generic carousel tracks ───────────────────────────────────
    // Pattern: element with an active CSS transform whose parent has
    // overflow:hidden — this is how virtually every carousel library works.
    // We stamp the TRACK element, not the container, so the container layout
    // (size, position, padding) remains visible and tested.
    //
    // We check BOTH matrix() and matrix3d() because modern carousels use
    // translate3d for GPU acceleration, which computes to matrix3d in
    // getComputedStyle. Without matrix3d support, 3D-transformed carousels
    // (including circular/coverflow effects) slip through undetected.
    const IDENTITY_2D = 'matrix(1, 0, 0, 1, 0, 0)';
    const IDENTITY_3D = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
    for (const el of document.querySelectorAll('*')) {
      if (el.getAttribute('data-vr-volatile') || el.getAttribute('data-vr-frozen')) continue;
      try {
        const cs = getComputedStyle(el);
        const tf = cs.transform;
        if (!tf || tf === 'none' || tf === IDENTITY_2D || tf === IDENTITY_3D) continue;

        // Any non-identity matrix (2D or 3D) means the element has been transformed
        const isNonIdentityMatrix = tf.startsWith('matrix(') || tf.startsWith('matrix3d(');
        if (!isNonIdentityMatrix) continue;

        // Parent must clip overflow (carousel wrapper pattern)
        const parent = el.parentElement;
        if (!parent) continue;
        const pcs = getComputedStyle(parent);
        if (pcs.overflow !== 'hidden' && pcs.overflowX !== 'hidden' && pcs.overflowX !== 'clip') continue;

        // Must have at least one sibling (carousels have multiple slides)
        if (parent.children.length < 2) continue;

        el.setAttribute('data-vr-volatile', 'carousel-generic');
        results.push(`Generic carousel track: ${el.tagName}.${(el.className?.toString?.() || '').split(' ')[0]}`);
      } catch {}
    }

    // ── D: Video elements ────────────────────────────────────────────
    for (const video of document.querySelectorAll('video')) {
      if (!video.getAttribute('data-vr-volatile') && !video.getAttribute('data-vr-hide')) {
        video.setAttribute('data-vr-volatile', 'video');
        results.push(`Video: ${video.id || 'unnamed'}`);
      }
    }

    return results;
  });

  // CSS to pause infinite animations (keeps element visible, just stops motion)
  await page.addStyleTag({ content: `
    [data-vr-frozen="animation"], [data-vr-frozen="animation"] * {
      animation-play-state: paused !important;
      animation-delay: -1s !important;
    }` });

  // Stop jQuery-based autoplay (Owl Carousel, etc.)
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
 * Build the final Playwright mask selector list.
 *
 * Selectors returned:
 *   1. [data-vr-volatile] — covers everything stamped by viewport scan, full-page
 *      scan, and structural detection (carousel tracks, videos)
 *   2. Captcha question containers — detects "What is X + Y?" math patterns and
 *      stamps the entire captcha form row (question text + input field)
 *   3. Captcha inputs — matched by name/id attributes
 */
async function detectMaskTargets(page) {
  const selectors = await page.evaluate(() => {
    const set = new Set();

    // ── Captcha question detection ───────────────────────────────────
    // Match DIRECT text containing math question "What is 6 + 9?"
    const MATH = /what\s+is\s+\d+\s*[+\-×÷*/]\s*\d+/i;
    for (const el of document.querySelectorAll('label,span,p,div,li,td')) {
      let direct = '';
      for (const node of el.childNodes) if (node.nodeType === 3) direct += node.nodeValue;
      if (!MATH.test(direct.trim())) continue;
      const container =
        el.closest('.ks-captcha-line,.form-group,.wpcf7-form-control-wrap,[class*="captcha"]')
        || el.parentElement || el;
      container.setAttribute('data-vr-volatile', 'captcha-question');
    }

    // ── Captcha containers by class ──────────────────────────────────
    for (const el of document.querySelectorAll(
      '.ks-captcha-line,.dscf7captcha,.ksolve_captcha,.dscf7_captcha_icon,[class*="captcha"]'
    )) {
      if (!el.className) continue;
      const sel = el.className.toString().trim().split(/\s+/)
        .filter(c => c.length > 0).map(c => `.${CSS.escape(c)}`).join('');
      if (sel.length > 0) set.add(sel);
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

    // ── All volatile elements (behavioral + structural) ──────────────
    if (document.querySelector('[data-vr-volatile]')) set.add('[data-vr-volatile]');

    return [...set];
  });

  return selectors;
}

module.exports = {
  ensureFullPageLoad,
  scanViewportForVolatileContent,
  waitForLayoutStability,
  fastForwardFiniteAnimations,
  dismissOverlays,
  behavioralVolatilityScan,
  hideWidgetsAndOverlays,
  freezeVolatileContent,
  detectMaskTargets,
};
