// utils/interaction-engine.js
// ─────────────────────────────────────────────────────────────────────
// Crawlee-powered Full-Site Interaction Audit Engine
//
// Starts from BASE_URL and crawls every reachable internal page.
// External links are HEAD-checked but never crawled.
// Each unique URL is visited (crawled) only once — Crawlee deduplicates.
// HEAD check results are cached globally so the same external URL is
// only requested once over the network, but the result is reported in
// the context of every page that contains that link.
//
// CRAWLEE SETTINGS:
//   maxRequestsPerCrawl: MAX_PAGES (5 for testing, raise once stable)
//   maxConcurrency:      1  — one page at a time, no server load
//   maxRequestRetries:   1  — retry once, then mark failed
//   No depth limit       — follows links at any depth
//
// FAILURE POLICY:
//   FAIL — button disabled/unclickable · broken link 4xx/5xx (non-social)
//           broken image · disabled input · empty/disabled select
//           navigation failure · popup with disabled elements
//   WARN — missing alt/label/title · no accessible name · focusable-hidden
//           console errors · nav hover fail · sticky header gone
//           accordion aria stuck · back-to-top hidden · social media link
//           HTTP 429
//   SKIP — captcha elements · hidden elements · form submit buttons
//
// CONSTRAINT: No text is entered anywhere in the page.
//
// EXPORTED:
//   runInteractionAudit(startUrl, options)
//   Returns { pages, stats }
//     pages[]: { url, counts, fails, warns, screenshotBuffer }
//     stats:   { totalPages, totalFails, totalWarns, runtimeSecs, crawlerStats }
// ─────────────────────────────────────────────────────────────────────

'use strict';

process.env.APIFY_LOG_LEVEL = 'ERROR';

const { PlaywrightCrawler, Configuration, MemoryStorage } = require('crawlee');

const MAX_PAGES = 5; // raise to 300-500 once tests are stable; 20 for broader testing
const MAX_CONCURRENCY = 1;   // no server load — one page at a time
const LINK_CONCURRENCY = 5;   // concurrent HEAD requests within one page

const SOCIAL_MEDIA_DOMAINS = new Set([
  'linkedin.com', 'youtube.com', 'facebook.com', 'twitter.com',
  'x.com', 'instagram.com', 'pinterest.com', 'tiktok.com',
]);

function isSocialMedia(url) {
  try {
    const host = new URL(url).hostname;
    return [...SOCIAL_MEDIA_DOMAINS].some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}


// ─────────────────────────────────────────────────────────────────────
// Phase 1 — Full DOM scan
// ─────────────────────────────────────────────────────────────────────
async function scanElements(page) {
  return page.evaluate(() => {
    const origin = window.location.origin;
    const out = {
      buttons: [], links: [], inputs: [], selects: [],
      accordions: [], carouselNavs: [], images: [], iframes: [], a11yIssues: [],
    };
    const seenLinks = new Set();

    const SKIP_INPUT_TYPES = new Set([
      'hidden', 'file', 'password', 'submit', 'button', 'reset', 'image', 'radio', 'checkbox',
    ]);

    // Captcha container detection
    const captchaContainers = new Set();
    for (const inp of document.querySelectorAll('input[placeholder]')) {
      if (/what\s+is\s+\d/i.test(inp.placeholder)) {
        let p = inp.parentElement;
        while (p && p !== document.body) { captchaContainers.add(p); p = p.parentElement; }
      }
    }

    // Buttons
    const buttonEls = document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]'
    );
    buttonEls.forEach((el, idx) => {
      const isCaptchaBtn = captchaContainers.size > 0 &&
        [...captchaContainers].some(c => c.contains(el));
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0
        && s.visibility !== 'hidden'
        && parseFloat(s.opacity) > 0;
      const label = (
        el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || ''
      ).trim().slice(0, 80);
      out.buttons.push({
        label, visible,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        skip: isCaptchaBtn,
        inForm: el.closest('form') !== null,
        idx,
      });
    });

    // Links
    for (const el of document.querySelectorAll('a[href]')) {
      const href = el.getAttribute('href') || '';
      if (!href || href === '#' || href.startsWith('javascript:')) continue;

      let abs = href;
      if (href.startsWith('//')) abs = window.location.protocol + href;
      else if (href.startsWith('/')) abs = origin + href;
      else if (!href.includes(':')) abs = origin + '/' + href;

      if (seenLinks.has(abs)) continue;
      seenLinks.add(abs);

      const type = href.startsWith('mailto:') ? 'mailto'
        : href.startsWith('tel:') ? 'tel'
          : href.startsWith('#') ? 'anchor'
            : abs.startsWith(origin) ? 'internal'
              : 'external';

      const r = el.getBoundingClientRect();
      out.links.push({ href, abs, type, visible: r.width > 0 && r.height > 0 });
    }

    // Inputs / textareas
    for (const el of document.querySelectorAll('input, textarea')) {
      const type = (el.type || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) continue;

      const isCaptcha = /what\s+is\s+\d/i.test(el.placeholder);
      const r = el.getBoundingClientRect();

      let hasLabel = false;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) hasLabel = true;
      if (!hasLabel && el.getAttribute('aria-label')) hasLabel = true;
      if (!hasLabel && el.getAttribute('aria-labelledby')) hasLabel = true;
      if (!hasLabel && el.closest('label')) hasLabel = true;

      out.inputs.push({
        label: el.placeholder || el.name || type,
        type,
        skip: isCaptcha,
        skipReason: isCaptcha ? 'captcha' : null,
        visible: r.width > 0 && r.height > 0,
        disabled: el.disabled || el.readOnly,
        hasLabel,
      });
    }

    // Selects
    for (const el of document.querySelectorAll('select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      out.selects.push({
        label: el.name || 'select',
        optionCount: el.options.length,
        disabled: el.disabled,
      });
    }

    // Accordion triggers
    for (const el of document.querySelectorAll(
      '[aria-expanded], .accordion-button, [data-toggle="collapse"], .faq-question'
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      out.accordions.push({
        label: el.textContent.trim().slice(0, 60) || '(accordion)',
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
      });
    }

    // Carousel nav buttons
    for (const el of document.querySelectorAll(
      '.owl-prev, .owl-next, .swiper-button-prev, .swiper-button-next, .slick-prev, .slick-next'
    )) {
      const r = el.getBoundingClientRect();
      out.carouselNavs.push({
        label: el.className.split(' ').find(c => /prev|next/i.test(c)) || el.className,
        visible: r.width > 0 && r.height > 0,
        disabled: el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true',
      });
    }

    // Images
    for (const el of document.querySelectorAll('img')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const src = el.getAttribute('src') || el.currentSrc || '';
      const alt = el.getAttribute('alt');
      const isSvg = src.includes('.svg') || src.startsWith('data:image/svg');
      const isBroken = !isSvg && el.complete && el.naturalHeight === 0 && el.naturalWidth === 0 && src.length > 0;
      out.images.push({ src: src.slice(0, 120), alt, isBroken });
    }

    // iFrames
    for (const el of document.querySelectorAll('iframe')) {
      const r = el.getBoundingClientRect();
      out.iframes.push({
        src: (el.getAttribute('src') || '').slice(0, 120),
        title: el.getAttribute('title') || '',
        visible: r.width > 0 && r.height > 0,
      });
    }

    // Accessibility issues
    for (const el of document.querySelectorAll('button, [role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = (el.textContent || '').trim()
        || el.getAttribute('aria-label')
        || el.getAttribute('title')
        || el.getAttribute('aria-labelledby');
      if (!name) out.a11yIssues.push({
        type: 'button-no-name',
        tag: el.tagName,
        cls: (el.className?.toString?.() || '').split(/\s+/).slice(0, 3).join(' '),
      });
    }

    for (const el of document.querySelectorAll('a[href]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = (el.textContent || '').trim()
        || el.getAttribute('aria-label')
        || el.getAttribute('title')
        || el.getAttribute('aria-labelledby');
      if (!name) out.a11yIssues.push({ type: 'link-no-name', href: (el.href || '').slice(0, 80) });
    }

    for (const el of document.querySelectorAll('[tabindex]:not([tabindex="-1"])')) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const tf = s.transform || '';
      if (tf && tf !== 'none') continue; // off-screen via transform — intentional (carousel tracks)
      const hidden = s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0;
      if (hidden) out.a11yIssues.push({
        type: 'focusable-hidden',
        tag: el.tagName,
        cls: (el.className?.toString?.() || '').split(/\s+/).slice(0, 3).join(' '),
      });
    }

    return out;
  });
}


// ─────────────────────────────────────────────────────────────────────
// Phase 2 — Sync checks
// ─────────────────────────────────────────────────────────────────────

function checkInputs(inputs) {
  return inputs.map(i => {
    if (i.skip) return { category: 'input', label: i.label, status: 'SKIP', detail: i.skipReason };
    if (!i.visible) return { category: 'input', label: i.label, status: 'SKIP', detail: 'not visible' };
    if (i.disabled) return { category: 'input', label: i.label, status: 'FAIL', detail: 'disabled/readonly' };
    if (!i.hasLabel) return { category: 'input', label: i.label, status: 'WARN', detail: 'no accessible label (missing <label for="">, aria-label, or aria-labelledby)' };
    return { category: 'input', label: i.label, status: 'PASS', detail: 'visible, enabled, labelled' };
  });
}

function checkSelects(selects) {
  return selects.map(s => ({
    category: 'select',
    label: s.label,
    status: s.disabled || s.optionCount === 0 ? 'FAIL' : 'PASS',
    detail: s.disabled ? 'disabled' : s.optionCount === 0 ? 'no options' : `${s.optionCount} options`,
  }));
}

function checkAccordions(accordions) {
  return accordions.map(a => ({
    category: 'accordion',
    label: a.label,
    status: a.disabled ? 'FAIL' : 'PASS',
    detail: a.disabled ? 'disabled' : 'visible & enabled',
  }));
}

function checkCarouselNavs(navs) {
  return navs.map(n => ({
    category: 'carousel',
    label: n.label,
    status: !n.visible ? 'WARN' : n.disabled ? 'WARN' : 'PASS',
    detail: !n.visible ? 'not visible' : n.disabled ? 'disabled' : 'visible & enabled',
  }));
}

function checkImages(images) {
  return images.map(img => {
    if (img.isBroken) return {
      category: 'image',
      label: img.src.slice(0, 70) || '(no src)',
      status: 'FAIL',
      detail: 'broken — img.complete is true but naturalHeight and naturalWidth are 0',
    };
    if (img.alt === null) return {
      category: 'image',
      label: img.src.slice(0, 70) || '(no src)',
      status: 'WARN',
      detail: 'missing alt attribute — add alt="" for decorative images, descriptive text for informative ones',
    };
    return {
      category: 'image',
      label: img.src.slice(0, 70) || '(no src)',
      status: 'PASS',
      detail: img.alt === '' ? 'decorative (alt="")' : `alt="${img.alt.slice(0, 50)}"`,
    };
  });
}

function checkIframes(iframes) {
  return iframes
    .filter(f => f.visible)
    .map(f => {
      if (!f.src) return { category: 'iframe', label: '(no src)', status: 'WARN', detail: 'iframe has no src attribute' };
      if (!f.title) return { category: 'iframe', label: f.src.slice(0, 70), status: 'WARN', detail: 'missing title attribute (required for screen readers)' };
      return { category: 'iframe', label: f.src.slice(0, 70), status: 'PASS', detail: `title="${f.title.slice(0, 50)}"` };
    });
}

function checkAccessibilityItems(issues) {
  return issues.map(issue => {
    if (issue.type === 'button-no-name') return {
      category: 'a11y',
      label: `<${issue.tag}> "${issue.cls}"`,
      status: 'WARN',
      detail: 'button has no accessible name — add aria-label, title, or visible text',
    };
    if (issue.type === 'link-no-name') return {
      category: 'a11y',
      label: issue.href.slice(0, 70),
      status: 'WARN',
      detail: 'link has no accessible name — add aria-label, title, or visible anchor text',
    };
    if (issue.type === 'focusable-hidden') return {
      category: 'a11y',
      label: `<${issue.tag}> "${issue.cls}"`,
      status: 'WARN',
      detail: 'element is in tab order but visually hidden (visibility:hidden / display:none / opacity:0)',
    };
    return { category: 'a11y', label: issue.type, status: 'WARN', detail: 'accessibility issue detected' };
  });
}

function checkConsoleErrors(errors) {
  if (!errors.length) return [];
  const BENIGN = /gtag|analytics|google|clarity|tidio|tidioChatApi|facebook|hotjar|_paq|wp-emoji|Content.Security.Policy|ERR_BLOCKED_BY_CLIENT/i;
  const relevant = errors.filter(e => !BENIGN.test(e));
  if (!relevant.length) return [];
  return [{
    category: 'health',
    label: 'Console errors',
    status: 'WARN',
    detail: `${relevant.length} JS error(s): ${relevant[0].slice(0, 120)}${relevant.length > 1 ? ` (+${relevant.length - 1} more)` : ''}`,
  }];
}


// ─────────────────────────────────────────────────────────────────────
// Phase 3 — Button clickability (trial-click)
// ─────────────────────────────────────────────────────────────────────
async function checkButtonsClickable(page, buttons) {
  const SEL = 'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]';
  const results = [];

  for (const b of buttons) {
    const label = b.label || '(unlabelled)';
    if (b.skip)     { results.push({ category: 'button', label, status: 'SKIP', detail: 'captcha-adjacent' }); continue; }
    if (!b.visible) { results.push({ category: 'button', label, status: 'SKIP', detail: 'not visible' }); continue; }
    if (b.disabled) { results.push({ category: 'button', label, status: 'FAIL', detail: 'disabled attribute set' }); continue; }
    if (b.inForm)   {
      results.push({ category: 'button', label, status: 'PASS', detail: 'visible & enabled (form button — not clicked)' });
      continue;
    }

    const locator = page.locator(SEL).nth(b.idx);
    try {
      // Scroll into view first so sticky headers don't obscure the element
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(150); // let any scroll-triggered animations settle
      await locator.click({ trial: true, timeout: 8000 });
      results.push({ category: 'button', label, status: 'PASS', detail: 'clickable' });
    } catch (err) {
      const msg = err.message || '';
      // Timeout on trial click means temporarily obscured or animated — not genuinely broken.
      // Disabled attribute is already caught above. Demote to WARN so false positives
      // (e.g. tab buttons, carousel nav with CSS transitions) don't fail the test.
      const isTimeout = msg.includes('Timeout') || msg.includes('timeout');
      results.push({
        category: 'button',
        label,
        status:  isTimeout ? 'WARN' : 'FAIL',
        detail:  isTimeout
          ? `click trial timed out — may be obscured by overlay or animation; verify manually`
          : `not clickable: ${msg.slice(0, 80)}`,
      });
    }
  }
  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 4 — Link reachability (HEAD requests, no navigation)
//
// headCache: Map shared across the entire crawl run. Each unique URL
// is HEAD-requested at most once over the network. The cached result
// is still returned in the context of every page containing that link,
// preserving per-page reporting.
// ─────────────────────────────────────────────────────────────────────
async function checkLinks(page, links, headCache) {
  async function checkOne(link) {
    if (!link.visible) return {
      category: `link-${link.type}`, label: link.abs.slice(0, 80),
      href: link.href, status: 'SKIP', detail: 'not visible',
    };

    if (link.type === 'mailto' || link.type === 'tel') return {
      category: `link-${link.type}`, label: link.href,
      href: link.href, status: 'PASS', detail: 'presence confirmed',
    };

    // Social media — known blocked on corporate networks → always WARN, no HTTP request
    if (isSocialMedia(link.abs)) return {
      category: `link-${link.type}`, label: link.abs.slice(0, 80),
      href: link.href, status: 'WARN',
      detail: 'social media — blocked on corporate networks, verify manually',
    };

    if (link.type === 'anchor') {
      const exists = await page.evaluate(h => !!document.querySelector(h), link.href);
      return {
        category: 'link-anchor', label: link.href, href: link.href,
        status: exists ? 'PASS' : 'FAIL',
        detail: exists ? 'target found' : 'anchor target missing in DOM',
      };
    }

    // Use cached HEAD result if available
    if (headCache.has(link.abs)) {
      const cached = headCache.get(link.abs);
      return { category: `link-${link.type}`, label: link.abs.slice(0, 80), href: link.href, ...cached };
    }

    // HEAD request
    try {
      const resp = await page.request.fetch(link.abs, { method: 'HEAD', timeout: 12000 });
      const s = resp.status();

      let status, detail;
      if (s === 429) {
        status = 'WARN';
        detail = 'HTTP 429 rate-limited — verify manually';
      } else if (s < 400) {
        status = 'PASS';
        detail = `HTTP ${s}`;
      } else {
        // All broken links FAIL — internal and external alike (social media handled above)
        status = 'FAIL';
        detail = `HTTP ${s}`;
      }

      const result = { status, detail };
      headCache.set(link.abs, result);
      return { category: `link-${link.type}`, label: link.abs.slice(0, 80), href: link.href, ...result };

    } catch (err) {
      const result = { status: 'FAIL', detail: `network error: ${err.message.slice(0, 80)}` };
      headCache.set(link.abs, result);
      return { category: `link-${link.type}`, label: link.abs.slice(0, 80), href: link.href, ...result };
    }
  }

  const results = [];
  for (let i = 0; i < links.length; i += LINK_CONCURRENCY) {
    const batch = await Promise.all(links.slice(i, i + LINK_CONCURRENCY).map(checkOne));
    results.push(...batch);
  }
  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 5 — Nav dropdown hover check
// ─────────────────────────────────────────────────────────────────────
async function checkNavDropdowns(page) {
  const results = [];
  const triggers = page
    .locator('.menu-item-has-children > a, nav li:has(ul) > a, header li:has(.sub-menu) > a')
    .filter({ visible: true });

  const count = Math.min(await triggers.count(), 10);

  for (let i = 0; i < count; i++) {
    const trigger = triggers.nth(i);
    const label = ((await trigger.textContent()) || '').trim().slice(0, 40);
    try {
      await trigger.hover({ timeout: 3000 });
      await page.waitForTimeout(250);
      results.push({ category: 'nav-dropdown', label, status: 'PASS', detail: 'hover trigger accessible' });
    } catch {
      results.push({ category: 'nav-dropdown', label, status: 'WARN', detail: 'hover failed' });
    }
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  if (!results.length) results.push({
    category: 'nav-dropdown', label: 'navigation', status: 'SKIP', detail: 'no dropdown triggers found',
  });
  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 6 — Scroll behaviour
// ─────────────────────────────────────────────────────────────────────
async function checkScrollBehavior(page) {
  const results = [];

  const stickyHeaderSel = await page.evaluate(() => {
    for (const el of document.querySelectorAll('header, nav, [class*="header"]')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.width > 200 && r.height > 0 && r.height < 200) {
        return el.id ? `#${el.id}` : el.tagName.toLowerCase();
      }
    }
    return null;
  });

  const backToTopExists = await page.evaluate(() => {
    const sel = '[id*="back-to-top"], [class*="back-to-top"], [class*="scroll-top"], [class*="backtotop"], [aria-label*="top" i]';
    return document.querySelectorAll(sel).length > 0;
  });

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight * 0.6, behavior: 'instant' })
  );
  await page.waitForTimeout(400);

  if (stickyHeaderSel) {
    const inViewport = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return null;
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0 && r.height > 0;
    }, stickyHeaderSel);

    if (inViewport === true) {
      results.push({ category: 'scroll', label: 'sticky header', status: 'PASS', detail: 'remains visible after scrolling 60% down' });
    } else if (inViewport === false) {
      results.push({ category: 'scroll', label: 'sticky header', status: 'WARN', detail: 'header not in viewport after scrolling' });
    }
  }

  if (backToTopExists) {
    const visible = await page.evaluate(() => {
      const sel = '[id*="back-to-top"], [class*="back-to-top"], [class*="scroll-top"], [class*="backtotop"], [aria-label*="top" i]';
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0) return true;
      }
      return false;
    });
    results.push({
      category: 'scroll', label: 'back-to-top button',
      status: visible ? 'PASS' : 'WARN',
      detail: visible ? 'visible after scrolling' : 'element exists but not visible at 60% scroll depth',
    });
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200);

  if (!stickyHeaderSel && !backToTopExists) results.push({
    category: 'scroll', label: 'scroll behaviour', status: 'SKIP', detail: 'no sticky elements or back-to-top button found',
  });
  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 7 — Accordion ARIA toggle verification
// ─────────────────────────────────────────────────────────────────────
const MAX_ACCORDIONS = 4;

async function auditAccordions(page) {
  const results = [];
  const triggers = page
    .locator('[aria-expanded]:not(select), .accordion-button')
    .filter({ visible: true });

  const count = Math.min(await triggers.count(), MAX_ACCORDIONS);

  for (let i = 0; i < count; i++) {
    const el = triggers.nth(i);
    const label = ((await el.textContent()) || '').trim().slice(0, 60) || '(accordion)';

    try {
      const before = await el.getAttribute('aria-expanded');
      await el.click({ timeout: 3000 });
      await page.waitForTimeout(400);
      const after = await el.getAttribute('aria-expanded');

      if (before === null) {
        results.push({ category: 'accordion-aria', label, status: 'WARN', detail: 'clicked but no aria-expanded — screen readers cannot announce the state change' });
      } else if (after === before) {
        results.push({ category: 'accordion-aria', label, status: 'WARN', detail: `aria-expanded stayed "${before}" after click — toggle may not be working` });
      } else {
        results.push({ category: 'accordion-aria', label, status: 'PASS', detail: `aria-expanded: ${before} → ${after}` });
      }

      await el.click({ timeout: 3000 }).catch(() => { });
      await page.waitForTimeout(300);
    } catch (err) {
      results.push({ category: 'accordion-aria', label, status: 'WARN', detail: `click failed: ${err.message.slice(0, 60)}` });
    }
  }

  if (!results.length) results.push({
    category: 'accordion-aria', label: 'accordions', status: 'SKIP', detail: 'no aria-expanded accordion triggers found',
  });
  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Phase 8 — CTA popup audit
// ─────────────────────────────────────────────────────────────────────
const POPUP_SEL = [
  '[role="dialog"]', '[role="alertdialog"]',
  '.modal', '.popup', '.lightbox',
  '[class*="-modal"]', '[class*="-popup"]', '[class*="-overlay"]',
].join(', ');

async function countVisiblePopups(page) {
  return page.evaluate((sel) => {
    let n = 0;
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width > 50 && r.height > 50 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0) n++;
    }
    return n;
  }, POPUP_SEL);
}

async function auditCtaPopups(page) {
  const results = [];

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const BTN_SEL = 'button, [role="button"], input[type="submit"], input[type="button"]';
  const SKIP_INPUT_TYPES = new Set(['hidden', 'file', 'password', 'submit', 'button', 'reset', 'image', 'radio', 'checkbox']);

  const candidates = await page.evaluate((btnSel) => {
    const captchaContainers = new Set();
    for (const inp of document.querySelectorAll('input[placeholder]')) {
      if (/what\s+is\s+\d/i.test(inp.placeholder)) {
        let p = inp.parentElement;
        while (p && p !== document.body) { captchaContainers.add(p); p = p.parentElement; }
      }
    }
    return [...document.querySelectorAll(btnSel)].map((el, idx) => {
      const r = el.getBoundingClientRect();
      const label = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 80);
      const isCarousel = /owl-(prev|next)|swiper-button|slick-(prev|next)/i.test(el.className) ||
        /^(‹|›|←|→|prev|next)$/i.test(label);
      const isCaptcha = [...captchaContainers].some(c => c.contains(el));
      return {
        label, idx,
        visible: r.width > 0 && r.height > 0,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        inForm: el.closest('form') !== null,
        skip: isCaptcha || isCarousel,
      };
    }).filter(b => b.visible && !b.disabled && !b.skip && !b.inForm);
  }, BTN_SEL);

  for (const b of candidates) {
    const btnLabel = b.label || '(unlabelled)';
    const urlBefore = page.url();
    const popupBefore = await countVisiblePopups(page);

    try {
      await page.locator(BTN_SEL).nth(b.idx).click({ timeout: 3000 });
    } catch { continue; }

    await page.waitForTimeout(800);

    if (page.url() !== urlBefore) {
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      continue;
    }

    const popupAfter = await countVisiblePopups(page);
    if (popupAfter <= popupBefore) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      continue;
    }

    const popup = page.locator(POPUP_SEL).filter({ visible: true }).last();
    const popupBtns = popup.locator('button, [role="button"]').filter({ visible: true });

    for (let i = 0, n = await popupBtns.count(); i < n; i++) {
      const el = popupBtns.nth(i);
      const lbl = ((await el.textContent()) || (await el.getAttribute('aria-label')) || '').trim().slice(0, 80) || '(unlabelled)';
      const dis = await el.evaluate(e => e.disabled || e.getAttribute('aria-disabled') === 'true');
      results.push({
        category: 'popup-button',
        label: `[popup:"${btnLabel}"] ${lbl}`,
        status: dis ? 'FAIL' : 'PASS',
        detail: dis ? 'disabled' : 'visible & enabled',
      });
    }

    const popupInputs = popup.locator('input, textarea').filter({ visible: true });
    for (let i = 0, n = await popupInputs.count(); i < n; i++) {
      const el = popupInputs.nth(i);
      const type = ((await el.getAttribute('type')) || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) continue;
      const ph = (await el.getAttribute('placeholder')) || (await el.getAttribute('name')) || type;
      if (/what\s+is\s+\d/i.test(ph)) continue;
      const dis = await el.evaluate(e => e.disabled || e.readOnly);
      results.push({
        category: 'popup-input',
        label: `[popup:"${btnLabel}"] ${ph.slice(0, 60)}`,
        status: dis ? 'FAIL' : 'PASS',
        detail: dis ? 'disabled/readonly' : 'visible & enabled',
      });
    }

    const popupLinks = popup.locator('a[href]').filter({ visible: true });
    const origin = new URL(page.url()).origin;
    for (let i = 0, n = Math.min(await popupLinks.count(), 20); i < n; i++) {
      const el = popupLinks.nth(i);
      const href = (await el.getAttribute('href')) || '';
      if (!href || href === '#' || href.startsWith('javascript:')) continue;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        results.push({ category: 'popup-link', label: `[popup:"${btnLabel}"] ${href}`, href, status: 'PASS', detail: 'presence confirmed' });
        continue;
      }
      const abs = href.startsWith('//') ? `${new URL(page.url()).protocol}${href}`
        : href.startsWith('/') ? `${origin}${href}`
          : href.includes(':') ? href
            : `${origin}/${href}`;
      if (isSocialMedia(abs)) {
        results.push({ category: 'popup-link', label: `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`, href, status: 'WARN', detail: 'social media — blocked on corporate networks' });
        continue;
      }
      try {
        const resp = await page.request.fetch(abs, { method: 'HEAD', timeout: 8000 });
        const s = resp.status();
        results.push({ category: 'popup-link', label: `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`, href, status: s < 400 ? 'PASS' : 'FAIL', detail: `HTTP ${s}` });
      } catch (err) {
        results.push({ category: 'popup-link', label: `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`, href, status: 'FAIL', detail: `network error: ${err.message.slice(0, 60)}` });
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    if (await countVisiblePopups(page) > 0) {
      const closeBtn = popup.locator('button').filter({ hasText: /^(close|×|✕|✖|dismiss)$/i }).first();
      if (await closeBtn.count() > 0) await closeBtn.click({ timeout: 2000 }).catch(() => { });
      await page.waitForTimeout(300);
    }
  }

  return results;
}


// ─────────────────────────────────────────────────────────────────────
// Highlight failing elements on the live page, then screenshot
// ─────────────────────────────────────────────────────────────────────
async function highlightAndScreenshot(page, fails, warns) {
  const items = [...fails, ...warns];
  await page.evaluate((items) => {
    let scrolled = false;
    for (const { category, label, href } of items) {
      const isWarn = !['button', 'input', 'select', 'image', 'iframe', 'popup-button', 'popup-input', 'popup-link'].includes(category) ||
        ['a11y', 'health', 'scroll', 'nav-dropdown', 'accordion-aria', 'carousel'].includes(category);
      const c = isWarn ? 'orange' : 'red';
      const matches = [];

      if (category.startsWith('link') && href) {
        const el = document.querySelector(`a[href="${href}"]`);
        if (el) matches.push(el);
      } else if (category === 'button' || category === 'popup-button') {
        for (const b of document.querySelectorAll('button, [role="button"]')) {
          if ((b.textContent || b.value || b.getAttribute('aria-label') || '').trim().startsWith(label.slice(0, 25))) {
            matches.push(b); break;
          }
        }
      } else if (category === 'input' || category === 'popup-input') {
        const el = document.querySelector(
          `input[placeholder="${label}"], input[name="${label}"], textarea[placeholder="${label}"]`
        );
        if (el) matches.push(el);
      } else if (category === 'select') {
        const el = document.querySelector(`select[name="${label}"]`);
        if (el) matches.push(el);
      } else if (category === 'image') {
        for (const img of document.querySelectorAll('img')) {
          if ((img.getAttribute('src') || '').includes(label.slice(0, 30))) { matches.push(img); break; }
        }
      } else if (category === 'iframe') {
        for (const f of document.querySelectorAll('iframe')) {
          if ((f.getAttribute('src') || '').includes(label.slice(0, 30))) { matches.push(f); break; }
        }
      }

      for (const el of matches) {
        el.style.outline = `4px solid ${c}`;
        el.style.outlineOffset = '3px';
        el.style.backgroundColor = c === 'red' ? 'rgba(255,0,0,0.15)' : 'rgba(255,165,0,0.15)';
        if (!scrolled) { el.scrollIntoView({ behavior: 'instant', block: 'center' }); scrolled = true; }
      }
    }
  }, items);

  return page.screenshot({ fullPage: false });
}


// ─────────────────────────────────────────────────────────────────────
// Summarise counts
// ─────────────────────────────────────────────────────────────────────
function summarisePage(results) {
  const counts = { PASS: 0, FAIL: 0, WARN: 0, SKIP: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  return {
    counts,
    fails: results.filter(r => r.status === 'FAIL'),
    warns: results.filter(r => r.status === 'WARN'),
  };
}


// ─────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────
async function runInteractionAudit(startUrl, _options = {}) {
  const origin = (() => { try { return new URL(startUrl).origin; } catch { return ''; } })();

  // Shared HEAD cache — each unique URL HEAD-requested at most once across all pages
  const headCache = new Map();

  // Per-page results — accumulated by requestHandler via closure
  const pages = [];

  const crawleeConfig = new Configuration({ storageClient: new MemoryStorage() });

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: MAX_PAGES,
    maxConcurrency: MAX_CONCURRENCY,
    maxRequestRetries: 0,
    headless: true,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 300,

    async requestHandler({ page, request, enqueueLinks }) {
      // Enforce 1920×1080 — Crawlee's browser ignores the Playwright config viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      const pageConsoleErrors = [];
      page.on('console', msg => { if (msg.type() === 'error') pageConsoleErrors.push(msg.text()); });
      page.on('pageerror', err => pageConsoleErrors.push(err.message));

      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => { });
      await page.waitForTimeout(500);

      // ── All check phases ──────────────────────────────────────────
      const el = await scanElements(page);

      const syncResults = [
        ...checkInputs(el.inputs),
        ...checkSelects(el.selects),
        ...checkAccordions(el.accordions),
        ...checkCarouselNavs(el.carouselNavs),
        ...checkImages(el.images),
        ...checkIframes(el.iframes),
        ...checkAccessibilityItems(el.a11yIssues),
        ...checkConsoleErrors(pageConsoleErrors),
      ];

      const navResults = await checkNavDropdowns(page);

      const [buttonResults, linkResults] = await Promise.all([
        checkButtonsClickable(page, el.buttons),
        checkLinks(page, el.links, headCache),
      ]);

      const scrollResults = await checkScrollBehavior(page);
      const accordionResults = await auditAccordions(page);
      const popupResults = await auditCtaPopups(page);

      const allPageResults = [
        ...syncResults, ...navResults, ...buttonResults,
        ...linkResults, ...scrollResults, ...accordionResults, ...popupResults,
      ];

      const { counts, fails, warns } = summarisePage(allPageResults);

      // ── Screenshot only when there are failures ───────────────────
      let screenshotBuffer = null;
      if (fails.length > 0) {
        try {
          screenshotBuffer = await highlightAndScreenshot(page, fails, warns);
        } catch { /* non-fatal — audit results still stored */ }
      }

      pages.push({ url: request.url, counts, fails, warns, screenshotBuffer });

      // Console summary
      const icon = fails.length ? '❌' : warns.length ? '⚠️' : '✅';
      console.log(`${icon} [${fails.length}F/${warns.length}W] ${request.url}`);

      // Enqueue internal links only — Crawlee deduplicates automatically
      if (origin) {
        await enqueueLinks({ globs: [`${origin}/**`] }).catch(() => { });
      }
    },

    async failedRequestHandler({ request }, error) {
      pages.push({
        url: request.url,
        counts: { PASS: 0, FAIL: 1, WARN: 0, SKIP: 0 },
        fails: [{
          category: 'health',
          label: 'Page load failure',
          status: 'FAIL',
          detail: `Navigation failed: ${(error?.message || '').slice(0, 80)}`,
        }],
        warns: [],
        screenshotBuffer: null,
      });
      console.log(`❌ [nav-fail] ${request.url}`);
    },

  }, crawleeConfig);

  const t0 = Date.now();
  await crawler.run([startUrl]);
  const runtimeSecs = Math.round((Date.now() - t0) / 1000);
  const crawlerStats = crawler.stats.toJSON();

  const totalFails = pages.reduce((n, p) => n + p.fails.length, 0);
  const totalWarns = pages.reduce((n, p) => n + p.warns.length, 0);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Interaction Audit complete`);
  console.log(`  Pages:    ${pages.length}`);
  console.log(`  Failures: ${totalFails}`);
  console.log(`  Warnings: ${totalWarns}`);
  console.log(`  Runtime:  ${runtimeSecs}s`);
  console.log('─'.repeat(60));

  return {
    pages,
    stats: { totalPages: pages.length, totalFails, totalWarns, runtimeSecs, crawlerStats },
  };
}

module.exports = { runInteractionAudit };
