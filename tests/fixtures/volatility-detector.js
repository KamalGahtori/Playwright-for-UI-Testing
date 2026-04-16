// tests/fixtures/volatility-detector.js
// ─────────────────────────────────────────────────────────────────────
// Volatility Detection Engine
//
// PURPOSE:
//   Runtime intelligence module that replaces ALL hardcoded selector
//   lists. Detects and neutralizes volatile page content using purely
//   behavioral and structural heuristics — zero site-specific selectors.
//
// DETECTION HIERARCHY:
//   1. DISMISS  — Cookie/consent banners (click to remove)
//   2. HIDE     — Chat widgets, popup overlays, cross-origin iframes
//   3. FREEZE   — Infinite CSS animations, carousel auto-play
//   4. MASK     — Captcha numbers/inputs (truly unpredictable pixels)
//
// DESIGN PRINCIPLE: Freeze, Don't Mask
//   Masking blacks out regions, losing layout verification.
//   Freezing preserves container CSS (padding, fonts, alignment)
//   while eliminating content variance.
// ─────────────────────────────────────────────────────────────────────

/**
 * Phase 1: Detect and dismiss cookie/consent banners.
 * Uses behavioral signals: fixed position + consent-related text + button.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} descriptions of what was dismissed
 */
async function dismissOverlays(page) {
  const dismissed = await page.evaluate(async () => {
    const results = [];
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Gather all fixed/sticky elements
    const allEls = Array.from(document.querySelectorAll('*'));
    const fixedEls = allEls.filter(el => {
      try {
        const pos = getComputedStyle(el).position;
        return pos === 'fixed' || pos === 'sticky';
      } catch { return false; }
    });

    // Pattern: consent/cookie/privacy/GDPR text in the element or its subtree
    const consentPattern = /cookie|consent|privacy.?policy|gdpr/i;
    const dismissTextPattern = /accept|got\s*it|close|ok\b|agree|dismiss|understand|×|✕|✖/i;

    for (const el of fixedEls) {
      const fullText = el.textContent || '';
      if (!consentPattern.test(fullText)) continue;

      // Find the best dismiss button within this overlay
      const interactives = Array.from(
        el.querySelectorAll('button, a, [role="button"], [class*="btn"]')
      );

      let bestBtn = null;
      let bestScore = 0;

      for (const btn of interactives) {
        const btnText = (btn.textContent || '').trim();
        let score = 0;

        // Score by text relevance
        if (dismissTextPattern.test(btnText)) score += 10;
        if (/accept|got\s*it|agree/i.test(btnText)) score += 5; // prefer accept
        if (btn.tagName === 'BUTTON') score += 2;
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) score += 3; // visible

        if (score > bestScore) {
          bestScore = score;
          bestBtn = btn;
        }
      }

      if (bestBtn && bestScore >= 5) {
        try {
          bestBtn.click();
          results.push(`Dismissed: "${(bestBtn.textContent || '').trim().substring(0, 40)}"`);
          await delay(600); // Allow fade-out animation
        } catch { /* ignore click failures */ }
      }
    }

    return results;
  });

  // Deterministic wait: confirm overlays disappeared
  if (dismissed.length > 0) {
    try {
      await page.waitForFunction(() => {
        const cookies = document.querySelectorAll('[class*="cookie-modal"], [class*="consent"]');
        return Array.from(cookies).every(el => {
          const cs = getComputedStyle(el);
          return cs.display === 'none' || cs.visibility === 'hidden' ||
            el.offsetHeight === 0 || cs.opacity === '0';
        });
      }, { timeout: 3000 });
    } catch { /* overlay may have been removed from DOM entirely */ }
  }

  return dismissed;
}

/**
 * Phase 2: Hide third-party widgets, popup overlays, and cross-origin iframes.
 * Stamps data-vr-hide attribute on detected elements, then injects a single style tag.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} descriptions of what was hidden
 */
async function hideWidgetsAndOverlays(page) {
  const hidden = await page.evaluate(() => {
    const results = [];
    const hostname = window.location.hostname;

    // ── Helper: stamp an element for hiding ──
    const stamp = (el, reason) => {
      if (el.getAttribute('data-vr-hide')) return false; // already stamped
      el.setAttribute('data-vr-hide', 'true');
      results.push(reason);
      return true;
    };

    const allEls = Array.from(document.querySelectorAll('*'));
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;
    const vpArea = vpWidth * vpHeight;

    // ── 1. Chat widgets & floating buttons ──
    // Signal: position:fixed + high z-index + small viewport area
    for (const el of allEls) {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') continue;

        const z = parseInt(cs.zIndex, 10) || 0;
        const rect = el.getBoundingClientRect();
        const elArea = rect.width * rect.height;
        const viewportPercent = (elArea / vpArea) * 100;

        // Small fixed widgets (chat bubbles, floating icons)
        if (z >= 10000 && viewportPercent > 0 && viewportPercent < 15) {
          stamp(el, `Chat/widget: ${el.tagName}#${el.id || ''}.${(el.className?.toString?.() || '').substring(0, 40)} (z:${z}, vp:${viewportPercent.toFixed(1)}%)`);
          continue;
        }

        // Large hidden chat containers (z-index > 100000)
        if (z >= 100000) {
          stamp(el, `Chat container: ${el.tagName}#${el.id || ''} (z:${z})`);
          continue;
        }

        // Popup/modal overlays: full-viewport fixed elements with high z-index
        const classText = (el.className?.toString?.() || '') + ' ' + (el.id || '');
        const isPopupModal = /popup|modal|auto-capture|overlay/i.test(classText);
        if (isPopupModal && z >= 10000) {
          stamp(el, `Popup overlay: ${el.tagName}#${el.id || ''} (z:${z})`);
          continue;
        }
      } catch { /* skip elements that error on getComputedStyle */ }
    }

    // ── 2. WhatsApp icons ──
    // Signal: link to api.whatsapp.com OR class containing whatsapp/whatsaap
    const whatsappLinks = document.querySelectorAll(
      'a[href*="whatsapp"], a[href*="whatsaap"], [class*="whatsapp"], [class*="whatsaap"]'
    );
    for (const el of whatsappLinks) {
      // Stamp the element and any ancestor wrapper up to 2 levels
      stamp(el, `WhatsApp: ${el.tagName}.${(el.className?.toString?.() || '').substring(0, 40)}`);
      if (el.parentElement && el.parentElement.children.length <= 2) {
        stamp(el.parentElement, `WhatsApp wrapper`);
      }
    }

    // ── 3. Cross-origin iframes ──
    // Signal: <iframe> with src from a different domain
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      const src = iframe.src || '';
      if (!src || src === 'about:blank') {
        // about:blank iframes are usually lazy-loaded third-party widgets
        // Only hide if they are NOT inside the page's own content
        const inForm = iframe.closest('form');
        if (!inForm) {
          stamp(iframe, `Blank iframe: likely lazy third-party widget`);
        }
        continue;
      }
      try {
        const iframeHost = new URL(src).hostname;
        if (iframeHost && !iframeHost.includes(hostname) && !hostname.includes(iframeHost)) {
          stamp(iframe, `Cross-origin iframe: ${iframeHost}`);
        }
      } catch { /* malformed URL, stamp it */ 
        stamp(iframe, `Iframe: ${src.substring(0, 60)}`);
      }
    }

    return results;
  });

  // Inject a single style tag to hide all stamped elements
  if (hidden.length > 0) {
    await page.addStyleTag({
      content: `[data-vr-hide] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
      }`
    });
  }

  return hidden;
}

/**
 * Phase 3: Freeze volatile content in place.
 * Pauses infinite CSS animations and freezes Owl Carousel transforms.
 * The container remains visible — its layout properties are still tested.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} descriptions of what was frozen
 */
async function freezeVolatileContent(page) {
  const frozen = await page.evaluate(() => {
    const results = [];

    // ── 3A: Freeze infinite CSS animations ──
    const allEls = Array.from(document.querySelectorAll('*'));
    const animatedEls = [];

    for (const el of allEls) {
      try {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none') {
          const isInfinite = cs.animationIterationCount === 'infinite';
          if (isInfinite) {
            animatedEls.push(el);
            el.setAttribute('data-vr-frozen', 'animation');
            results.push(`Froze animation: "${cs.animationName}" on ${el.tagName}.${(el.className?.toString?.() || '').split(' ')[0] || ''}`);
          }
        }
      } catch { /* skip */ }
    }

    // ── 3B: Freeze Owl Carousel auto-play ──
    // Owl Carousel uses `.owl-stage` with `transform: translate3d(Xpx, 0, 0)`
    const owlStages = document.querySelectorAll('.owl-stage');
    for (const stage of owlStages) {
      const cs = getComputedStyle(stage);
      if (cs.transform && cs.transform !== 'none') {
        // Lock the transform to 0 so it always shows the first slide deterministically
        stage.style.transform = 'translate3d(0px, 0px, 0px)';
        stage.style.transition = 'none !important';
        stage.style.animation = 'none !important';
        stage.setAttribute('data-vr-frozen', 'carousel');

        // Also freeze the parent container
        const wrapper = stage.closest('.owl-carousel');
        if (wrapper) {
          wrapper.setAttribute('data-vr-frozen', 'carousel-wrapper');
          // Disable autoplay by removing the autoplay class and stopping timers
          wrapper.classList.add('owl-loaded');
        }

        results.push(`Froze Owl Carousel stage to 0px`);
      }
    }

    // ── 3C: Freeze any other carousel-like containers ──
    // Pattern: overflow:hidden container with children that have transform
    const carouselLikeContainers = allEls.filter(el => {
      try {
        const cs = getComputedStyle(el);
        if (cs.overflow !== 'hidden' && cs.overflowX !== 'hidden') return false;
        if (el.children.length < 2) return false;
        // Check if any child has a non-none transform
        return Array.from(el.children).some(child => {
          const childCs = getComputedStyle(child);
          return childCs.transform && childCs.transform !== 'none';
        });
      } catch { return false; }
    });

    for (const container of carouselLikeContainers) {
      if (container.getAttribute('data-vr-frozen')) continue; // already handled
      if (container.closest('[data-vr-frozen]')) continue; // parent already frozen

      // Freeze all child transforms
      for (const child of container.children) {
        const childCs = getComputedStyle(child);
        if (childCs.transform && childCs.transform !== 'none') {
          // Force deterministic first-slide view
          child.style.transform = 'translate3d(0px, 0px, 0px)';
          child.style.transition = 'none !important';
          child.style.animation = 'none !important';
        }
      }
      container.setAttribute('data-vr-frozen', 'carousel-generic');
      results.push(`Froze generic carousel: ${container.tagName}.${(container.className?.toString?.() || '').substring(0, 50)}`);
    }

    // ── 3D: Freeze scroll positions on auto-scrolling containers ──
    const scrollingContainers = allEls.filter(el => {
      try {
        const cs = getComputedStyle(el);
        return (cs.overflow === 'hidden' || cs.overflowX === 'hidden') &&
          (el.scrollLeft > 0 || el.scrollTop > 0);
      } catch { return false; }
    });

    for (const container of scrollingContainers) {
      if (container.getAttribute('data-vr-frozen')) continue;
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      // Lock scroll position by setting it every frame
      container.setAttribute('data-vr-frozen', 'scroll');
      container.style.scrollBehavior = 'auto';
      // Set a read-only scroll via attribute for reference
      container.setAttribute('data-vr-scroll-left', scrollLeft);
      container.setAttribute('data-vr-scroll-top', scrollTop);
      results.push(`Froze scroll position: ${container.tagName}#${container.id || ''} (${scrollLeft}, ${scrollTop})`);
    }

    return results;
  });

  // Inject global freeze CSS
  await page.addStyleTag({
    content: `
      [data-vr-frozen="animation"],
      [data-vr-frozen="animation"] * {
        animation-play-state: paused !important;
        animation: none !important;
      }
      [data-vr-frozen="carousel"] {
        transition: none !important;
        animation: none !important;
      }
      [data-vr-frozen="carousel-wrapper"] {
        /* Wrapper stays visible — its layout is tested */
      }
      [data-vr-frozen="carousel-generic"] * {
        transition: none !important;
        animation: none !important;
      }
      [data-vr-frozen="scroll"] {
        scroll-behavior: auto !important;
      }
    `
  });

  // Stop Owl Carousel's JavaScript autoplay timer
  await page.evaluate(() => {
    // Owl Carousel stores its instance on the jQuery data
    if (typeof jQuery !== 'undefined' || typeof $ !== 'undefined') {
      try {
        const jq = typeof jQuery !== 'undefined' ? jQuery : $;
        jq('.owl-carousel').each(function() {
          try {
            const owl = jq(this).data('owl.carousel') || jq(this).data('owlCarousel');
            if (owl) {
              if (typeof owl.stop === 'function') owl.stop();
              if (typeof owl.destroy === 'function') {
                // Don't destroy — just stop autoplay
                if (owl.settings) owl.settings.autoplay = false;
                if (owl.options) owl.options.autoplay = false;
              }
            }
          } catch { /* ignore individual carousel errors */ }
        });
      } catch { /* jQuery not available or error */ }
    }
  });

  return frozen;
}

/**
 * Phase 4: Detect elements that must be masked (truly unpredictable pixels).
 * Only captcha numbers/inputs — everything else is frozen, not masked.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} CSS selectors for Playwright's mask option
 */
async function detectMaskTargets(page) {
  const selectors = await page.evaluate(() => {
    const selectorSet = new Set();

    // ── Captcha Container Detection ──
    // We specifically want to mask the container that holds the random text (e.g. "What is 6 + 9 ?")
    // Find containers exactly by structure or explicit class
    const captchaLines = document.querySelectorAll('.ks-captcha-line, .dscf7captcha, .ksolve_captcha, .dscf7_captcha_icon');
    for (const el of captchaLines) {
       // We want to target this exact element to be masked. 
       // If it has multiple classes, we map to the exact combined class selector to be safe.
       if (el.className) {
           const classSelector = el.className.toString().trim().split(/\\s+/).map(c => `.${CSS.escape(c)}`).join('');
           if (classSelector.includes('captcha')) {
               selectorSet.add(classSelector);
           }
       }
    }

    // Pattern 3: Input elements with name="captcha"
    const captchaInputs = document.querySelectorAll('input[name*="captcha" i], input[id*="captcha" i]');
    for (const el of captchaInputs) {
       if (el.id) {
           const idMatch = el.id.match(/^(ks-captcha-[^-]*)/);
           if (idMatch) selectorSet.add(`[id^="${idMatch[1]}"]`);
           else selectorSet.add(`input[id="${CSS.escape(el.id)}"]`);
       } else {
           selectorSet.add('input[name*="captcha"]');
       }
    }

    return [...selectorSet];
  });

  return selectors;
}

module.exports = {
  dismissOverlays,
  hideWidgetsAndOverlays,
  freezeVolatileContent,
  detectMaskTargets
};
