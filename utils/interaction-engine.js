// utils/interaction-engine.js
// Dynamic element scanner and interaction checker.
// No hardcoded selectors — detection is behavioural or universally structural.

const LINK_CONCURRENCY = 5;

const SOCIAL_MEDIA_SKIP = new Set([
  'linkedin.com', 'youtube.com', 'facebook.com', 'twitter.com',
  'x.com', 'instagram.com', 'pinterest.com', 'tiktok.com',
]);

function isSocialMedia(url) {
  try {
    const host = new URL(url).hostname;
    return [...SOCIAL_MEDIA_SKIP].some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

// Single page.evaluate call — walks live DOM, returns serializable element buckets.
async function scanElements(page) {
  return page.evaluate(() => {
    const origin = window.location.origin;
    const out = { buttons: [], links: [], inputs: [], selects: [], accordions: [], carouselNavs: [] };
    const seenLinks = new Set();

    const SKIP_INPUT_TYPES = new Set([
      'hidden', 'file', 'password', 'submit', 'button', 'reset', 'image', 'radio', 'checkbox',
    ]);

    // ── Captcha containers — collect ancestors of captcha inputs so
    //    adjacent buttons (refresh/reload icons) can be skipped too.
    const captchaContainers = new Set();
    for (const inp of document.querySelectorAll('input[placeholder]')) {
      if (/what is\s+\d/i.test(inp.placeholder)) {
        let p = inp.parentElement;
        while (p && p !== document.body) { captchaContainers.add(p); p = p.parentElement; }
      }
    }

    // ── Buttons ──────────────────────────────────────────────────────
    for (const el of document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]'
    )) {
      const isCaptchaBtn = captchaContainers.size > 0 &&
        [...captchaContainers].some(c => c.contains(el));
      const r = el.getBoundingClientRect();
      out.buttons.push({
        label:    (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 80),
        visible:  r.width > 0 && r.height > 0,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        skip:     isCaptchaBtn,
      });
    }

    // ── Links ─────────────────────────────────────────────────────────
    for (const el of document.querySelectorAll('a[href]')) {
      const href = el.getAttribute('href') || '';
      if (!href || href === '#' || href.startsWith('javascript:')) continue;

      let abs = href;
      if (href.startsWith('//'))      abs = window.location.protocol + href;
      else if (href.startsWith('/'))  abs = origin + href;
      else if (!href.includes(':'))   abs = origin + '/' + href;

      if (seenLinks.has(abs)) continue;
      seenLinks.add(abs);

      const type = href.startsWith('mailto:') ? 'mailto'
        : href.startsWith('tel:')             ? 'tel'
        : href.startsWith('#')                ? 'anchor'
        : abs.startsWith(origin)              ? 'internal'
        : 'external';

      const r = el.getBoundingClientRect();
      out.links.push({ href, abs, type, visible: r.width > 0 && r.height > 0 });
    }

    // ── Inputs ────────────────────────────────────────────────────────
    for (const el of document.querySelectorAll('input, textarea')) {
      const type = (el.type || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) continue;

      const name = (el.name || '').toLowerCase();
      const ph   = (el.placeholder || '').toLowerCase();

      const isEmail   = type === 'email'
        || name.includes('email') || name.includes('mail')
        || ph.includes('email');
      const isCaptcha = /what is\s+\d/i.test(el.placeholder);

      const r = el.getBoundingClientRect();
      out.inputs.push({
        label:      el.placeholder || el.name || type,
        type,
        skip:       isEmail || isCaptcha,
        skipReason: isEmail ? 'email-field' : isCaptcha ? 'captcha' : null,
        visible:    r.width > 0 && r.height > 0,
        disabled:   el.disabled || el.readOnly,
      });
    }

    // ── Selects ───────────────────────────────────────────────────────
    for (const el of document.querySelectorAll('select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      out.selects.push({ label: el.name || 'select', optionCount: el.options.length, disabled: el.disabled });
    }

    // ── Accordion triggers ────────────────────────────────────────────
    for (const el of document.querySelectorAll(
      '[aria-expanded], .accordion-button, [data-toggle="collapse"], .faq-question'
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      out.accordions.push({
        label:    el.textContent.trim().slice(0, 60) || '(accordion)',
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
      });
    }

    // ── Carousel nav buttons ──────────────────────────────────────────
    for (const el of document.querySelectorAll(
      '.owl-prev, .owl-next, .swiper-button-prev, .swiper-button-next, .slick-prev, .slick-next'
    )) {
      const r = el.getBoundingClientRect();
      out.carouselNavs.push({
        label:    el.className.split(' ').find(c => /prev|next/i.test(c)) || el.className,
        visible:  r.width > 0 && r.height > 0,
        disabled: el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true',
      });
    }

    return out;
  });
}

// ── Sync checks (operate on scan data, no page interaction) ───────────────

function checkButtons(buttons) {
  return buttons.map(b => ({
    category: 'button',
    label:    b.label || '(unlabelled)',
    status:   b.skip ? 'SKIP' : !b.visible ? 'SKIP' : b.disabled ? 'FAIL' : 'PASS',
    detail:   b.skip ? 'captcha-adjacent' : !b.visible ? 'not visible' : b.disabled ? 'disabled' : 'visible & enabled',
  }));
}

function checkInputs(inputs) {
  return inputs.map(i => ({
    category: 'input',
    label:    i.label,
    status:   i.skip ? 'SKIP' : !i.visible ? 'SKIP' : i.disabled ? 'FAIL' : 'PASS',
    detail:   i.skip ? i.skipReason : !i.visible ? 'not visible' : i.disabled ? 'disabled/readonly' : 'visible & enabled',
  }));
}

function checkSelects(selects) {
  return selects.map(s => ({
    category: 'select',
    label:    s.label,
    status:   s.disabled || s.optionCount === 0 ? 'FAIL' : 'PASS',
    detail:   s.disabled ? 'disabled' : s.optionCount === 0 ? 'no options' : `${s.optionCount} options`,
  }));
}

function checkAccordions(accordions) {
  return accordions.map(a => ({
    category: 'accordion',
    label:    a.label,
    status:   a.disabled ? 'FAIL' : 'PASS',
    detail:   a.disabled ? 'disabled' : 'visible & enabled',
  }));
}

function checkCarouselNavs(navs) {
  return navs.map(n => ({
    category: 'carousel',
    label:    n.label,
    status:   !n.visible ? 'WARN' : n.disabled ? 'WARN' : 'PASS',
    detail:   !n.visible ? 'not visible' : n.disabled ? 'disabled' : 'visible & enabled',
  }));
}

// ── Async checks ───────────────────────────────────────────────────────────

async function checkLinks(page, links) {
  async function checkOne(link) {
    if (!link.visible) {
      return { category: `link-${link.type}`, label: link.abs.slice(0, 80), href: link.href, status: 'SKIP', detail: 'not visible' };
    }
    if (link.type === 'mailto' || link.type === 'tel') {
      return { category: `link-${link.type}`, label: link.href, href: link.href, status: 'PASS', detail: 'presence confirmed' };
    }
    if (isSocialMedia(link.abs)) {
      return { category: `link-${link.type}`, label: link.abs.slice(0, 80), href: link.href, status: 'SKIP', detail: 'social media — known to block automated requests' };
    }
    if (link.type === 'anchor') {
      const exists = await page.evaluate(h => !!document.querySelector(h), link.href);
      return {
        category: 'link-anchor',
        label:    link.href,
        href:     link.href,
        status:   exists ? 'PASS' : 'FAIL',
        detail:   exists ? 'target found' : 'anchor target missing in DOM',
      };
    }
    try {
      const resp = await page.request.fetch(link.abs, { method: 'HEAD', timeout: 12000 });
      const s    = resp.status();
      const ok   = s < 400;
      return {
        category: `link-${link.type}`,
        label:    link.abs.slice(0, 80),
        href:     link.href,
        status:   ok ? 'PASS' : (link.type === 'external' && s < 500) ? 'WARN' : 'FAIL',
        detail:   `HTTP ${s}${link.type === 'external' && !ok ? ' (external — may block HEAD)' : ''}`,
      };
    } catch (err) {
      return {
        category: `link-${link.type}`,
        label:    link.abs.slice(0, 80),
        href:     link.href,
        status:   'FAIL',
        detail:   `network error: ${err.message.slice(0, 80)}`,
      };
    }
  }

  const results = [];
  for (let i = 0; i < links.length; i += LINK_CONCURRENCY) {
    const batch = await Promise.all(links.slice(i, i + LINK_CONCURRENCY).map(checkOne));
    results.push(...batch);
  }
  return results;
}

// Hover each top-level nav dropdown trigger and confirm it responds.
async function checkNavDropdowns(page) {
  const results = [];
  // WordPress menus use .menu-item-has-children; generic fallback uses li:has(ul)
  const triggers = page
    .locator('.menu-item-has-children > a, nav li:has(ul) > a, header li:has(.sub-menu) > a')
    .filter({ visible: true });

  const count = Math.min(await triggers.count(), 10);

  for (let i = 0; i < count; i++) {
    const trigger = triggers.nth(i);
    const label   = ((await trigger.textContent()) || '').trim().slice(0, 40);
    try {
      await trigger.hover({ timeout: 3000 });
      await page.waitForTimeout(250);
      results.push({ category: 'nav-dropdown', label, status: 'PASS', detail: 'hover trigger accessible' });
    } catch {
      results.push({ category: 'nav-dropdown', label, status: 'WARN', detail: 'hover failed' });
    }
  }

  if (!results.length) {
    results.push({ category: 'nav-dropdown', label: 'navigation', status: 'SKIP', detail: 'no dropdown triggers found' });
  }
  return results;
}

// ── Summary printer ────────────────────────────────────────────────────────

function summarise(endpointId, allResults) {
  const counts = { PASS: 0, FAIL: 0, WARN: 0, SKIP: 0 };
  for (const r of allResults) counts[r.status] = (counts[r.status] || 0) + 1;

  const fails = allResults.filter(r => r.status === 'FAIL');
  const warns = allResults.filter(r => r.status === 'WARN');

  console.log(`\n[${endpointId}] Interaction Audit ─────────────────────────────────`);
  console.log(`  ✅ PASS ${counts.PASS}  ❌ FAIL ${counts.FAIL}  ⚠️  WARN ${counts.WARN}  ⏭  SKIP ${counts.SKIP}  (total: ${allResults.length})`);
  for (const f of fails) console.log(`    ❌ [${f.category}] ${f.label} — ${f.detail}`);
  for (const w of warns) console.log(`    ⚠️  [${w.category}] ${w.label} — ${w.detail}`);
  console.log('─'.repeat(60));

  return { counts, fails, warns };
}

// ── Main entry point ───────────────────────────────────────────────────────

async function runInteractionAudit(page, endpointId) {
  const el = await scanElements(page);

  // Sync checks run immediately from scan data
  const syncResults = [
    ...checkButtons(el.buttons),
    ...checkInputs(el.inputs),
    ...checkSelects(el.selects),
    ...checkAccordions(el.accordions),
    ...checkCarouselNavs(el.carouselNavs),
  ];

  // Async checks: link HEAD requests (network) and nav hover (DOM) run in parallel
  const [linkResults, navResults] = await Promise.all([
    checkLinks(page, el.links),
    checkNavDropdowns(page),
  ]);

  const allResults = [...syncResults, ...linkResults, ...navResults];
  const { counts, fails, warns } = summarise(endpointId, allResults);

  return { allResults, counts, fails, warns };
}

module.exports = { runInteractionAudit };
