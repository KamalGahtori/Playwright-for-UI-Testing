# Playwright Visual Regression Framework — Project Context & Rules

This file is read automatically by Claude Code. It contains everything needed
to understand, maintain, and extend this framework — both for AI assistance
and for human developers making changes.

---

## What this project does

Pixel-level visual regression testing for ksolves.com marketing landing pages.
Validates structural and aesthetic integrity (layout, fonts, colours, spacing,
images) while automatically ignoring volatile content (carousels, counters,
live data, videos, chat widgets, captchas). Zero hardcoded selectors — all
detection is behavioural or universally structural.

---

## Directory structure

```
Playwright-for-UI-Testing/
├── playwright.config.js        # 9 browser/device projects, thresholds, reporter
├── endpoints.config.js         # registry of pages under test — only file edited to add pages
├── .env / .env.example         # BASE_URL (not committed)
│
├── tests/visual/
│   └── visual.spec.js          # one test per endpoint: prepare → stabilise → toHaveScreenshot
│
├── utils/
│   ├── base-fixtures.js        # preparePage + stabilizePage Playwright fixtures
│   └── volatility-detector.js  # 5-phase detection/stabilisation engine
│
└── golden-baselines/           # reference screenshots committed to git
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

## How tests work

### Phase 1 — preparePage (once per page)

1. Wait for DOM, network idle (10s cap — WP Rocket keeps connections open), fonts
2. Inject CSS `[data-wpr-lazyrender]{content-visibility:visible!important}` — WP Rocket applies `content-visibility:auto` to sections and the footer, which causes off-screen content to skip rendering entirely. This override forces all sections to render upfront before scroll passes start.
3. Force-load all lazy images: `data-lazy-src` (WP Rocket primary attribute), `data-src`, `data-lazy`, `data-bg`, native `loading="lazy"` → `eager`
4. Pass 1 (Trigger): scroll top→bottom at 250ms/viewport — fires all IntersectionObserver/WP Rocket callbacks
5. Pass 2 (Verify): scroll again at 500ms/viewport — waits for every visible `<img>` to fully decode at each position
6. Pass 3 (Settle): return to top, wait for layout stability (two consecutive 500ms snapshots of structural landmarks must match), then 1.5s buffer
7. `ensureFullPageLoad` — waits for every `<img>` across the full page with 8s per-image timeout

### Phase 2 — stabilizePage (once per page, immediately before screenshot)

1. `dismissOverlays` — finds fixed/sticky elements matching cookie/consent keywords, clicks the best dismiss button
2. `behavioralVolatilityScan` — observes 500ms; compares **direct text only** (nodeType 3, not cascaded textContent), CSS transform, and background-position; stamps changed elements `[data-vr-volatile]`; de-duplicates by keeping the most-specific (deepest) volatile element only
3. `hideWidgetsAndOverlays` — hides fixed chat widgets (z≥10000, <15% viewport area), z≥100000 containers, WhatsApp buttons, cross-origin iframes via `[data-vr-hide]` CSS
4. `freezeVolatileContent` — pauses infinite CSS animations; stamps `.owl-stage`, `.swiper-wrapper`, `.slick-track` structurally; stamps `<video>` elements; stops jQuery Owl Carousel autoplay
5. `detectMaskTargets` — collects `[data-vr-volatile]` + captcha selectors + **unconditional** carousel class selectors (`.owl-stage`, `.owl-dots`, `.swiper-wrapper`, `.swiper-pagination`, `.slick-track`, `.slick-dots`) added directly to the mask list so late-initialising carousels are always masked at screenshot time

### Screenshot

Single `fullPage: true` screenshot per page. Playwright scrolls internally, capturing header to footer in one image. Mask applied via Playwright's built-in overlay. Tolerance `maxDiffPixelRatio: 0.02` per assertion.

---

## Adding a new page

Edit `endpoints.config.js`, add `{ id: 'Page-Id', path: '/url-path' }`, then run:
```bash
npm run update:baseline -- -g "[Page-Id]"
```

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run test:visual` | Run all 9 projects |
| `npm run test:visual:chrome` | Chromium desktop + mobile + tablet |
| `npm run test:visual:device -- chromium-desktop` | One specific project |
| `npm run test:visual:ui` | Playwright UI dashboard |
| `npm run update:baseline` | Capture new golden baselines for all 9 projects |
| `npm run update:baseline:device -- chromium-desktop` | Update one project |
| `npm run report` | Open HTML diff report |

---

## Environment

```bash
cp .env.example .env
# Set BASE_URL=https://www.ksolves.com/
```

Requires Node.js v18+. Run `nvm use 22` if the system Node is v12.

---

## Volatility detection reference

### What gets [data-vr-volatile]

| Signal | Detected by |
|---|---|
| Direct text changed in 500ms (counters, tickers) | behavioralVolatilityScan |
| CSS transform changed (carousel/slider track sliding) | behavioralVolatilityScan |
| background-position changed (CSS background slider) | behavioralVolatilityScan |
| `.owl-stage`, `.swiper-wrapper`, `.slick-track` | freezeVolatileContent (structural) |
| `<video>` elements | freezeVolatileContent |
| Captcha containers and inputs | detectMaskTargets |

### What is added directly to the mask list (unconditional)

`.owl-stage`, `.owl-dots`, `.swiper-wrapper`, `.swiper-pagination`, `.slick-track`, `.slick-dots`

Added unconditionally because WP Rocket lazy-loads carousel JS — the carousel can initialise after Phase 4 runs, replacing DOM nodes and losing any `[data-vr-volatile]` stamps. These selectors are resolved by Playwright at screenshot time, not at Phase 5 evaluation time. Zero-match selectors are silently skipped, so adding them unconditionally is safe.

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

No selectors, no masks, no page-specific logic belongs here.
```js
// Correct
{ id: 'About-Us', path: '/about-us-ksolves' }

// Wrong — never add masks, selectors, or options here
{ id: 'About-Us', path: '/about-us-ksolves', mask: ['#hero'] }
```

### 2. Zero hardcoded selectors

No page-specific CSS selector arrays anywhere in the codebase. All detection must be:
- **Behavioural** — two-snapshot comparison (direct text, CSS transform, background-position)
- **Universally structural** — known carousel library class names
- **Universally positional** — z-index + area thresholds

If you find yourself writing `'#homepage-hero-slider'`, it is wrong.

### 3. Mask content, test containers

The outer shell of every dynamic component stays in the pixel diff. Only the volatile inner content is masked.
- ✅ `.owl-stage` masked — the sliding track (volatile content)
- ✅ `.owl-dots` masked — active-slide position indicators change with slide position
- ❌ `.owl-carousel` NOT masked — the outer container is layout under test

### 4. Carousel selectors in detectMaskTargets must be unconditional

Do NOT add `if (document.querySelector(sel))` guards around the carousel selectors in `detectMaskTargets`. They must be added unconditionally so Playwright resolves them at screenshot time and catches late-initialising carousels.

### 5. WP Rocket compatibility

The target site runs WP Rocket v3.20. Two features need explicit handling:
- `[data-wpr-lazyrender]` elements get `content-visibility:auto` — override to `visible` before any scroll passes or sections render as blank white space
- `data-lazy-src` is WP Rocket's lazy-load attribute (not `data-src`) — must be explicitly converted in the force-load step

### 6. One fullPage:true screenshot per page

Never switch to viewport-chunk scrolling. Playwright's `fullPage: true` handles the internal scroll.

### 7. Sequential execution

`fullyParallel: false`, `workers: 2`. Parallel execution introduces timing differences that produce non-deterministic diffs between baseline capture and test runs.

### 8. Tolerance bands

| Level | Value | Location |
|---|---|---|
| Global | `maxDiffPixelRatio: 0.03` | `playwright.config.js` |
| Per-assertion | `maxDiffPixelRatio: 0.02` | `visual.spec.js` |

These absorb anti-aliasing variance. They are not a way to hide real regressions.

### 9. Naming conventions

| Thing | Format | Example |
|---|---|---|
| Page ID | Title Case with hyphens | `AI-ML-Services`, `About-Us` |
| Baseline filename | Same as page ID | `AI-ML-Services.png` |
| JS files | `kebab-case.js` | `visual.spec.js` |
| JS variables and functions | `camelCase` | `stabilizePage` |
| JS constants | `UPPER_SNAKE_CASE` | `DESKTOP_VIEWPORT` |

### 10. Actionable error messages

Every caught error must name the problem, the affected page/project, and the exact fix command.

| Scenario | Prefix | Fix |
|---|---|---|
| No baseline | 🚨 BASELINE MISSING | `npm run update:baseline -- -g "[id]"` |
| Navigation failed | ⚠️ NAVIGATION FAILURE | Check `BASE_URL` in `.env` |
| Site unreachable | ⚠️ CONNECTION ERROR | Verify network / `BASE_URL` |
| Pixels differ | ❌ VISUAL MISMATCH | `npm run report` to review diff |
