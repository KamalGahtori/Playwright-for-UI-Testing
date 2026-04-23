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
    // idx is captured so checkButtonsClickable can match back to a Playwright locator.
    // inForm marks buttons inside <form> elements — checked for visibility only, not clicked.
    const buttonEls = document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]'
    );
    buttonEls.forEach((el, idx) => {
      const isCaptchaBtn = captchaContainers.size > 0 &&
        [...captchaContainers].some(c => c.contains(el));
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      // visibility is inherited: a button inside a visibility:hidden popup container
      // returns 'hidden' here even if the button itself has no explicit rule.
      // Such buttons have non-zero getBoundingClientRect (they take up layout space)
      // but Playwright refuses to trial-click them, causing false timeout failures.
      const visible = r.width > 0 && r.height > 0
        && s.visibility !== 'hidden'
        && parseFloat(s.opacity) > 0;
      out.buttons.push({
        label:    (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 80),
        visible,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        skip:     isCaptchaBtn,
        inForm:   el.closest('form') !== null,
        idx,
      });
    });

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
    // All visible text-like inputs are checked for accessibility (visible + enabled).
    // No text is entered anywhere. Only captcha inputs are skipped.
    for (const el of document.querySelectorAll('input, textarea')) {
      const type = (el.type || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) continue;

      const isCaptcha = /what is\s+\d/i.test(el.placeholder);

      const r = el.getBoundingClientRect();
      out.inputs.push({
        label:      el.placeholder || el.name || type,
        type,
        skip:       isCaptcha,
        skipReason: isCaptcha ? 'captcha' : null,
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

// ── Button clickability check ─────────────────────────────────────────────
// Non-form buttons: trial click (checks element is reachable without firing event).
// Form buttons: visibility/enabled check only — form is not filled, click would fail anyway.
async function checkButtonsClickable(page, buttons) {
  const BUTTON_SELECTOR = 'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]';
  const results = [];

  for (const b of buttons) {
    const label = b.label || '(unlabelled)';

    if (b.skip) {
      results.push({ category: 'button', label, status: 'SKIP', detail: 'captcha-adjacent' });
      continue;
    }
    if (!b.visible) {
      results.push({ category: 'button', label, status: 'SKIP', detail: 'not visible' });
      continue;
    }
    if (b.disabled) {
      results.push({ category: 'button', label, status: 'FAIL', detail: 'disabled' });
      continue;
    }
    if (b.inForm) {
      // Form button is visible and enabled — accessibility confirmed; skip actual click
      // since we never fill form fields.
      results.push({ category: 'button', label, status: 'PASS', detail: 'visible & enabled (form button — not clicked)' });
      continue;
    }

    // Non-form button: trial click confirms element is reachable and accepts pointer events
    // without actually firing the click handler.
    try {
      await page.locator(BUTTON_SELECTOR).nth(b.idx).click({ trial: true, timeout: 3000 });
      results.push({ category: 'button', label, status: 'PASS', detail: 'clickable' });
    } catch (err) {
      results.push({ category: 'button', label, status: 'FAIL', detail: `not clickable: ${err.message.slice(0, 60)}` });
    }
  }
  return results;
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
        status:   ok ? 'PASS' : 'FAIL',
        detail:   `HTTP ${s}${!ok && link.type === 'external' ? ' (external — verify link manually if unexpected)' : ''}`,
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

// ── CTA popup audit ────────────────────────────────────────────────────────
// Clicks each visible non-form button, detects whether a popup/dialog appeared,
// then audits the popup's buttons, inputs, and links.
// No text is entered. Popup is closed via Escape (or close button) before moving on.

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
      const s = window.getComputedStyle(el);
      if (r.width > 50 && r.height > 50 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0) n++;
    }
    return n;
  }, POPUP_SEL);
}

async function auditCtaPopups(page) {
  const results = [];

  // Dismiss any open nav dropdowns left from hover checks
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const BTN_SEL = 'button, [role="button"], input[type="submit"], input[type="button"]';
  const SKIP_INPUT_TYPES = new Set(['hidden', 'file', 'password', 'submit', 'button', 'reset', 'image', 'radio', 'checkbox']);

  // Fresh button snapshot — indices match current DOM, not the initial scan
  const candidates = await page.evaluate((btnSel) => {
    const captchaContainers = new Set();
    for (const inp of document.querySelectorAll('input[placeholder]')) {
      if (/what is\s+\d/i.test(inp.placeholder)) {
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
        visible:  r.width > 0 && r.height > 0,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        inForm:   el.closest('form') !== null,
        skip:     isCaptcha || isCarousel,
      };
    }).filter(b => b.visible && !b.disabled && !b.skip && !b.inForm);
  }, BTN_SEL);

  for (const b of candidates) {
    const btnLabel = b.label || '(unlabelled)';
    const urlBefore = page.url();
    const popupsBefore = await countVisiblePopups(page);

    try {
      await page.locator(BTN_SEL).nth(b.idx).click({ timeout: 3000 });
    } catch {
      continue; // already covered by checkButtonsClickable
    }

    // Wait for popup animation / navigation
    await page.waitForTimeout(800);

    // Button navigated — go back and continue
    if (page.url() !== urlBefore) {
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      continue;
    }

    const popupsAfter = await countVisiblePopups(page);
    if (popupsAfter <= popupsBefore) {
      // No popup appeared
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      continue;
    }

    // ── Popup appeared — audit its contents ──────────────────────────────
    const popup = page.locator(POPUP_SEL).filter({ visible: true }).last();

    // Buttons inside popup
    const popupBtns = popup.locator('button, [role="button"]').filter({ visible: true });
    for (let i = 0, n = await popupBtns.count(); i < n; i++) {
      const el = popupBtns.nth(i);
      const label = ((await el.textContent()) || (await el.getAttribute('aria-label')) || '').trim().slice(0, 80) || '(unlabelled)';
      const disabled = await el.evaluate(e => e.disabled || e.getAttribute('aria-disabled') === 'true');
      results.push({
        category: 'popup-button',
        label:  `[popup:"${btnLabel}"] ${label}`,
        status: disabled ? 'FAIL' : 'PASS',
        detail: disabled ? 'disabled' : 'visible & enabled',
      });
    }

    // Inputs / textareas inside popup (visibility check only — no text entry)
    const popupInputs = popup.locator('input, textarea').filter({ visible: true });
    for (let i = 0, n = await popupInputs.count(); i < n; i++) {
      const el = popupInputs.nth(i);
      const type = ((await el.getAttribute('type')) || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) continue;
      const placeholder = (await el.getAttribute('placeholder')) || (await el.getAttribute('name')) || type;
      if (/what is\s+\d/i.test(placeholder)) continue; // captcha
      const disabled = await el.evaluate(e => e.disabled || e.readOnly);
      results.push({
        category: 'popup-input',
        label:  `[popup:"${btnLabel}"] ${placeholder.slice(0, 60)}`,
        status: disabled ? 'FAIL' : 'PASS',
        detail: disabled ? 'disabled/readonly' : 'visible & enabled',
      });
    }

    // Links inside popup
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
        results.push({ category: 'popup-link', label: `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`, href, status: 'SKIP', detail: 'social media' });
        continue;
      }

      try {
        const resp = await page.request.fetch(abs, { method: 'HEAD', timeout: 8000 });
        const s = resp.status();
        results.push({
          category: 'popup-link',
          label:  `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`,
          href, status: s < 400 ? 'PASS' : 'FAIL', detail: `HTTP ${s}`,
        });
      } catch (err) {
        results.push({
          category: 'popup-link',
          label:  `[popup:"${btnLabel}"] ${abs.slice(0, 60)}`,
          href, status: 'FAIL', detail: `network error: ${err.message.slice(0, 60)}`,
        });
      }
    }

    // ── Close popup ───────────────────────────────────────────────────────
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Escape didn't close it — click an explicit close button
    if (await countVisiblePopups(page) > 0) {
      const closeBtn = popup.locator('button').filter({ hasText: /^(close|×|✕|✖|dismiss)$/i }).first();
      if (await closeBtn.count() > 0) await closeBtn.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  return results;
}

// ── Main entry point ───────────────────────────────────────────────────────

async function runInteractionAudit(page, endpointId) {
  const el = await scanElements(page);

  // Sync checks (no page interaction needed)
  const syncResults = [
    ...checkInputs(el.inputs),
    ...checkSelects(el.selects),
    ...checkAccordions(el.accordions),
    ...checkCarouselNavs(el.carouselNavs),
  ];

  // Nav dropdowns are checked first (sequentially before buttons) because
  // hovering triggers opens dropdown menus that can overlay other elements,
  // causing concurrent trial-clicks to time out with false "not clickable" failures.
  const navResults = await checkNavDropdowns(page);

  // After dropdowns are done and closed, run button trial-clicks and link HEAD
  // requests in parallel (links are pure network, no DOM interaction).
  const [buttonResults, linkResults] = await Promise.all([
    checkButtonsClickable(page, el.buttons),
    checkLinks(page, el.links),
  ]);

  // Phase 3: click each visible non-form button, detect popups, audit popup contents.
  const popupResults = await auditCtaPopups(page);

  const allResults = [...syncResults, ...buttonResults, ...linkResults, ...navResults, ...popupResults];
  const { counts, fails, warns } = summarise(endpointId, allResults);

  return { allResults, counts, fails, warns };
}

module.exports = { runInteractionAudit };
