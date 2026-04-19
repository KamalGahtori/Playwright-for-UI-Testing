# Playwright Visual Regression Framework

Structural and Aesthetic Integrity Audit for marketing landing pages. Validates layout, fonts, spacing, and colors across **9 browser/device combinations** while automatically ignoring volatile content — carousels, counters, chat widgets, and live data — with zero hardcoded selectors.

---

## Project structure

```
Playwright-for-UI-Testing/
├── playwright.config.js       # browser projects, viewports, thresholds
├── endpoints.config.js        # pages under test — only file you edit to add pages
├── .env                       # your BASE_URL (not committed)
├── .env.example               # template
│
├── tests/visual/
│   └── visual.spec.js         # the test — viewport-chunk loop, header to footer
│
├── utils/
│   ├── base-fixtures.js       # page warm-up + per-viewport stabilization fixtures
│   └── volatility-detector.js # 5-phase intelligent detection engine
│
├── page-objects/              # page-specific selectors (add as needed)
│
└── golden-baselines/          # reference screenshots committed to git
```

---

## Quick start

```bash
npm install
npx playwright install
cp .env.example .env          # then set BASE_URL=https://your-site.com
```

---

## Adding a page

Open `endpoints.config.js` and add one entry:

```js
{ id: 'services', path: '/services' }
```

Capture the baseline:

```bash
npm run update:baseline -- -g "[services]"
```

---

## Commands

### Run tests

| Command | Scope |
|---|---|
| `npm run test:visual` | All 9 browser/device projects |
| `npm run test:visual:chrome` | Chromium desktop + mobile + tablet |
| `npm run test:visual:firefox` | Firefox desktop |
| `npm run test:visual:safari` | WebKit desktop |
| `npm run test:visual:device -- chromium-desktop` | One specific project |
| `npm run test:visual:ui` | Playwright UI dashboard (local dev) |

### Capture / update baselines

| Command | Scope |
|---|---|
| `npm run update:baseline` | All 9 projects |
| `npm run update:baseline:chrome` | Chromium only |
| `npm run update:baseline:device -- chromium-desktop` | One project |

### Reports

```bash
npm run report      # open HTML report in browser
```

---

## How it works

Every test follows a two-phase approach:

**Phase A — Full page load** (once per page)
1. Wait for DOM, network idle, and fonts
2. Scroll the entire page to trigger all lazy loaders (WP Rocket, IntersectionObserver)
3. Wait for every `<img>` to fully decode
4. Return to top

**Phase B — Per-viewport stabilization** (once per viewport chunk)
1. Dismiss cookie/consent banners
2. **Behavioral scan** — observe the viewport for 450ms; anything that changes (carousel sliding, counter incrementing, ticker scrolling) is automatically stamped for masking
3. Hide third-party widgets (chat bubbles, cross-origin iframes)
4. Freeze infinite CSS animations in-place
5. Build mask list and take the screenshot

The carousel **container** stays fully visible in every screenshot — its size, padding, and position are tested. Only the inner **track** (the sliding part) is masked. Layout is always verified; volatile content is always ignored.

---

## Projects (9 total)

| ID | Browser | Viewport |
|---|---|---|
| `chromium-desktop` | Chromium | 1280×720 |
| `firefox-desktop` | Firefox | 1280×720 |
| `webkit-desktop` | WebKit | 1280×720 |
| `chromium-iphone-8` | Chromium | iPhone 8 |
| `chromium-iphone-12-pro` | Chromium | iPhone 12 Pro |
| `chromium-galaxy-s20-ultra` | Chromium | Galaxy S20 Ultra |
| `chromium-ipad-air` | Chromium | iPad (gen 7) |
| `chromium-ipad-mini` | Chromium | iPad Mini |
| `chromium-ipad-pro` | Chromium | iPad Pro 11 |
