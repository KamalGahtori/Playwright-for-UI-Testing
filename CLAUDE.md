# Playwright UI Testing Framework — Project Context & Rules

This file is read automatically by Claude Code. It contains everything needed
to understand, maintain, and extend this framework.

---

## What this project does

Two automated test suites for **ksolves.com** marketing pages:

1. **Visual Regression** — pixel-level full-page screenshot comparison across 9 browser/device
   combinations. Catches layout shifts, broken images, font/colour/spacing changes.
   Automatically ignores volatile content (carousels, counters, chat widgets, videos, captchas).

2. **Interaction Audit** — Crawlee-powered full-site crawl starting from `BASE_URL`.
   Discovers every internal page automatically (all depths). Checks buttons, links, inputs,
   dropdowns, accordions, nav menus, images, iframes, popups. No text entered anywhere.
   Produces a self-contained HTML report with per-URL pass/fail detail and screenshots.

---

## Directory structure

```
Playwright-for-UI-Testing/
├── playwright.config.js              # 9 browser/device projects, thresholds, reporter
├── playwright.interaction.config.js  # interaction suite config (4hr timeout, 1 worker, Crawlee)
├── endpoints.config.js               # page registry for visual tests — only file to edit to add pages
├── .env / .env.example               # BASE_URL only (not committed)
├── .nvmrc                            # pins Node to v22
│
├── tests/
│   ├── visual/visual.spec.js              # one test per endpoint: prepare → stabilise → screenshot
│   └── interaction/interaction.spec.js    # one test: Crawlee full-site crawl + HTML report builder
│
├── utils/
│   ├── base-fixtures.js              # preparePage + stabilizePage Playwright fixtures
│   ├── volatility-detector.js        # 5-phase dynamic content detection/stabilisation engine
│   └── interaction-engine.js         # DOM scanner + Crawlee crawler + element health checker
│
└── golden-baselines/                 # reference screenshots committed to git
    ├── chromium/desktop/
    ├── chromium/iphone-8/
    ├── chromium/iphone-12-pro/
    ├── chromium/galaxy-s20-ultra/
    ├── chromium/ipad-air/
    ├── chromium/ipad-mini/
    ├── chromium/ipad-pro/
    ├── firefox/desktop/
    ├── webkit-desktop/
    └── LAST_UPDATED.json
```

---

## How visual tests work

### Phase 1 — preparePage (once per page)

1. Wait for DOM, network idle (10s cap — WP Rocket keeps connections open), fonts
2. Inject CSS `[data-wpr-lazyrender]{content-visibility:visible!important}` — WP Rocket applies `content-visibility:auto` to sections; this forces all sections to render upfront
3. Force-load all lazy images: `data-lazy-src`, `data-src`, `data-lazy`, `data-bg`, native `loading="lazy"` → `eager`
4. Pass 1 (Trigger): scroll top→bottom at 250ms/viewport — fires all IntersectionObserver/WP Rocket callbacks
5. Pass 2 (Verify): scroll again at 500ms/viewport — waits for every visible `<img>` to fully decode
6. Pass 3 (Settle): return to top, wait for layout stability (two consecutive 500ms snapshots must match), then 1.5s buffer
7. `ensureFullPageLoad` — waits for every `<img>` with 8s per-image timeout

### Phase 2 — stabilizePage (once per page, immediately before screenshot)

1. `dismissOverlays` — finds fixed/sticky elements matching cookie/consent keywords, clicks dismiss button
2. `behavioralVolatilityScan` — observes 500ms; compares direct text (nodeType 3), CSS transform, background-position; stamps changed elements `[data-vr-volatile]`
3. `hideWidgetsAndOverlays` — hides fixed chat widgets (z≥10000, <15% viewport), z≥100000 containers, WhatsApp buttons, cross-origin iframes
4. `freezeVolatileContent` — pauses infinite CSS animations; stamps `.owl-stage`, `.swiper-wrapper`, `.slick-track`, `<video>` elements
5. `detectMaskTargets` — collects `[data-vr-volatile]` + captcha selectors + unconditional carousel selectors

### Screenshot

Single `fullPage: true` screenshot per page. Mask applied via Playwright's built-in overlay. Tolerance `maxDiffPixelRatio: 0.02` per assertion.

---

## How interaction tests work

### Crawlee crawl

`PlaywrightCrawler` starts from `BASE_URL`, follows `enqueueLinks({ globs: [`${origin}/**`] })` at every page. Internal pages only. `maxRequestsPerCrawl: MAX_PAGES` (set in `interaction-engine.js`). `maxRequestRetries: 0` — retries would consume page budget.

### Check phases per page (in order)

1. **scanElements** — DOM scan: buttons, links, inputs, selects, accordions, carousel navs, images, iframes, a11y issues
2. **checkInputs / checkSelects / checkAccordions / checkCarouselNavs / checkImages / checkIframes / checkAccessibilityItems / checkConsoleErrors** — sync checks from scan data
3. **checkNavDropdowns** — hover nav triggers, check sub-menus appear
4. **checkButtonsClickable** — trial-click (no event dispatched); timeout → WARN, disabled attribute → FAIL
5. **checkLinks** — HEAD request per unique URL (cached in `headCache` Map across entire crawl); social media → WARN, 4xx/5xx → FAIL
6. **checkScrollBehavior** — sticky header + back-to-top visible after 60% scroll
7. **auditAccordions** — click up to 4 aria-expanded triggers, verify state toggles
8. **auditCtaPopups** — click non-form buttons, detect new popup, audit popup buttons/inputs/links

### Report

Self-contained HTML SPA (`audit-report.html`) attached to the Playwright test result. Index view → click URL → detail view with errors, collapsible warnings, inline screenshot. Also attaches `crawl-summary.json`.

### FAIL / WARN / SKIP policy

| Status | Conditions |
|---|---|
| **FAIL** | Button `disabled` attribute · broken link 4xx/5xx (non-social) · broken image · disabled input · empty/disabled select · navigation failure · popup with disabled elements |
| **WARN** | Click trial timeout (animation/overlay, not genuinely broken) · missing alt/label/title · no accessible name · focusable-hidden · console errors · nav hover fail · sticky header gone · accordion aria stuck · back-to-top not visible · social media link · HTTP 429 |
| **SKIP** | Captcha elements · hidden elements · form submit buttons |

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run visual` | Run visual tests for all pages and active devices |
| `npm run baseline` | Capture / update golden baselines for all active devices |
| `npm run interaction` | Full-site interaction audit (Crawlee crawl from `BASE_URL`) |
| `npm run report` | Open visual HTML report |
| `npm run report:interaction` | Open interaction HTML report |

**Filtering visual tests** — `--grep` passthrough works for both `visual` and `baseline`:

| Filter | Command |
|---|---|
| One group | `npm run visual -- --grep '\[services\]'` |
| One page  | `npm run visual -- --grep 'About-Us'` |

Groups: `homepage` · `about-us` · `services` · `support-services` · `products` · `insights` · `footer`

Active devices are controlled by commenting in/out project blocks in `playwright.config.js`.
After enabling a new device, always run `npm run baseline` before `npm run visual`.

---

## Adding a new page (visual)

Edit `endpoints.config.js`, add `{ id: 'Page-Id', path: '/url-path' }`, then run:

```bash
npm run baseline -- chrome-desktop -g "[Page-Id]"
npm run visual -- chrome-desktop -g "[Page-Id]"
```

The interaction suite discovers pages by crawling — no config change needed.

---

## Environment

```bash
cp .env.example .env
# Set BASE_URL=https://www.ksolves.com/
```

Requires Node.js v22+. Run `nvm use` if the system Node is older.

---

## Volatility detection reference

### What gets [data-vr-volatile]

| Signal | Detected by |
|---|---|
| Direct text changed in 500ms (counters, tickers) | behavioralVolatilityScan |
| CSS transform changed (carousel/slider track) | behavioralVolatilityScan |
| background-position changed (CSS background slider) | behavioralVolatilityScan |
| `.owl-stage`, `.swiper-wrapper`, `.slick-track` | freezeVolatileContent (structural) |
| `<video>` elements | freezeVolatileContent |
| Captcha containers and inputs | detectMaskTargets |

### What is added directly to the mask list (unconditional)

`.owl-stage`, `.owl-dots`, `.swiper-wrapper`, `.swiper-pagination`, `.slick-track`, `.slick-dots`

Added unconditionally because WP Rocket lazy-loads carousel JS — the carousel can initialise after Phase 4 runs, replacing DOM nodes and losing any `[data-vr-volatile]` stamps. Playwright resolves these selectors at screenshot time. Zero-match selectors are silently skipped.

### What gets [data-vr-hide]

- `position: fixed`, z-index ≥ 10000, area < 15% viewport (chat bubbles, floating CTAs)
- z-index ≥ 100000 (full chat containers)
- Classes matching popup/modal/auto-capture/overlay + z-index ≥ 10000
- WhatsApp floating links and wrappers
- Cross-origin iframes

---

## Architectural rules

These are non-negotiable. All code changes must comply.

### 1. endpoints.config.js contains id and path only

```js
// Correct
{ id: 'About-Us', path: '/about-us-ksolves' }

// Wrong — never add masks, selectors, or options here
{ id: 'About-Us', path: '/about-us-ksolves', mask: ['#hero'] }
```

### 2. Zero hardcoded selectors

No page-specific CSS selector arrays anywhere. All detection must be behavioural (two-snapshot comparison), universally structural (known carousel library class names), or universally positional (z-index + area thresholds).

### 3. Mask content, test containers

- ✅ `.owl-stage` masked — the sliding track (volatile)
- ✅ `.owl-dots` masked — active-slide indicators
- ❌ `.owl-carousel` NOT masked — outer container is layout under test

### 4. Carousel selectors in detectMaskTargets must be unconditional

Do NOT add `if (document.querySelector(sel))` guards. They must be added unconditionally so Playwright resolves them at screenshot time.

### 5. WP Rocket compatibility

- `[data-wpr-lazyrender]` → `content-visibility:visible` before scroll passes
- `data-lazy-src` is WP Rocket's lazy-load attribute — must be converted in force-load step

### 6. One fullPage:true screenshot per page

Never switch to viewport-chunk scrolling.

### 7. Sequential execution (visual)

`fullyParallel: false`, `workers: 2`. Parallel execution introduces timing differences.

### 8. Tolerance bands

| Level | Value | Location |
|---|---|---|
| Global | `maxDiffPixelRatio: 0.03` | `playwright.config.js` |
| Per-assertion | `maxDiffPixelRatio: 0.02` | `visual.spec.js` |

### 9. Naming conventions

| Thing | Format | Example |
|---|---|---|
| Page ID | Title Case with hyphens | `AI-ML-Services`, `About-Us` |
| Baseline filename | Same as page ID | `AI-ML-Services.png` |
| JS files | `kebab-case.js` | `visual.spec.js` |
| JS variables and functions | `camelCase` | `stabilizePage` |
| JS constants | `UPPER_SNAKE_CASE` | `MAX_PAGES` |

### 10. Actionable error messages (visual)

| Scenario | Prefix | Fix |
|---|---|---|
| No baseline | 🚨 BASELINE MISSING | `npm run baseline -- chrome-desktop -g "[id]"` |
| Navigation failed | ⚠️ NAVIGATION FAILURE | Check `BASE_URL` in `.env` |
| Site unreachable | ⚠️ CONNECTION ERROR | Verify network / `BASE_URL` |
| Pixels differ | ❌ VISUAL MISMATCH | `npm run report` to review diff |

### 11. Interaction engine constraints

- `maxRequestRetries: 0` — retries count against `maxRequestsPerCrawl` and reduce effective page count
- `maxConcurrency: 1` — no server load
- Viewport must be set via `page.setViewportSize({ width: 1920, height: 1080 })` inside `requestHandler` — Crawlee ignores Playwright config viewport
- No text entered in any field — inputs are checked for visibility/enabled state only
- Social media links → always WARN, never HEAD-requested (corporate firewalls block them)
- Button click timeout → WARN (not FAIL) — CSS transitions can temporarily obscure elements
