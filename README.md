# Visual Regression Testing Framework

Pixel-level structural and aesthetic integrity audits for marketing landing pages.

Captures golden baseline screenshots across **9 browser and device combinations**, then compares the live site against them on every run. Any layout shift, font change, spacing drift, broken image, or color change is caught automatically — while dynamic content (carousels, counters, chat widgets, captchas) is silently ignored so tests never produce false failures.

---

## What problem does this solve?

Marketing sites break visually all the time: a CSS update shifts the footer by 4px, a plugin change breaks the hero image on mobile, a font fails to load on Safari. None of these are caught by unit or functional tests — they require a human eye looking at the actual rendered page.

This framework replaces that manual check. It knows what the page **should** look like (the golden baseline), compares it against what the live site **actually** looks like, and fails loudly the moment anything drifts.

The hard part is that modern marketing sites are full of moving parts: lazy-loaded images that only appear when you scroll, carousels that advance every few seconds, cookie banners that cover content, chat widgets floating over everything, and counters that tick up continuously. A naive screenshot tool would fail constantly on this noise. This framework detects and neutralises all of it automatically — no selectors to maintain, no per-page config to write.

---

## Prerequisites

| Requirement | Version | Why |
|---|---|---|
| **Node.js** | v18 or higher | The framework uses optional chaining (`??`) and modern JS. v12 will fail. |
| **npm** | v8 or higher | Comes with Node 18 |
| **Git** | any | Golden baselines are committed to the repo |
| **Internet access** | — | Tests run against the live site (configurable via `BASE_URL`) |

> **Node version managers**: If you have `nvm`, run `nvm use 22` before any command. The system Node on some machines is v12 which is too old.

---

## Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Install Playwright browser binaries (Chromium, Firefox, WebKit)
npx playwright install

# 3. Create your local environment file
cp .env.example .env
```

Open `.env` and set your target URL:

```
BASE_URL=https://www.ksolves.com/
```

That's it. No database, no test accounts, no API keys needed.

---

## Running tests

### Compare the live site against baselines

```bash
# All 9 browser/device combinations (takes ~30 minutes)
npm run test:visual

# Chromium only — desktop + all mobile + all tablet (fastest full check, ~8 min)
npm run test:visual:chrome

# One browser family
npm run test:visual:firefox
npm run test:visual:safari

# One specific project (fastest single check)
npm run test:visual:device -- chromium-desktop

# Interactive Playwright UI (great for local debugging)
npm run test:visual:ui
```

### View the results

```bash
npm run report
```

Opens a browser with a side-by-side visual diff report. Every failing test shows the expected screenshot, the actual screenshot, and a highlighted diff image showing exactly what changed.

---

## Capturing / updating baselines

Baselines must be captured before tests can run. They are committed to git so the whole team shares the same reference.

```bash
# Capture baselines for all 9 projects (run once after setup, or after an intentional design change)
npm run update:baseline

# Chromium only
npm run update:baseline:chrome

# One specific project
npm run update:baseline:device -- chromium-desktop

# One specific page on one project
npm run update:baseline:device -- chromium-desktop -- -g "[Homepage]"
```

> **When to re-capture**: Only when a visual change is **intentional** (new design, approved content update). If a test fails and the change was not intentional, that is a real bug — fix the site, do not re-capture.

---

## Adding a new page

1. Open [endpoints.config.js](endpoints.config.js) and add one entry:

```js
{ id: 'Services', path: '/services' }
```

- `id` — used as the screenshot filename and in test names. Use Title Case with hyphens for spaces (e.g. `About-Us`, `AI-ML-Services`).
- `path` — the URL path relative to `BASE_URL`.

2. Capture the baseline for the new page:

```bash
npm run update:baseline -- -g "[Services]"
```

3. Run the test to confirm it passes:

```bash
npm run test:visual -- -g "[Services]"
```

No other files need to change. All masking, stabilisation, and detection is handled automatically.

---

## What is tested vs what is masked

The framework validates the structural and aesthetic integrity of the page. Everything you can see in a stable screenshot is tested.

**Always tested (in the pixel diff):**
- Text content and copy
- Alignment, spacing, padding, margins
- Images and logos (fully loaded, correct size and position)
- Font sizes, weights, and colours
- Component layout from header to footer
- The outer shell of every carousel (size, position, padding)

**Automatically masked (excluded from the pixel diff):**

| Element | Why masked |
|---|---|
| Carousel / slider inner track | Slides advance automatically — content changes between runs |
| Carousel position indicators (dots) | Active dot changes with slide position |
| Number counters & tickers | Count up continuously — value differs each run |
| Chat widgets & popups | Third-party; unpredictable position and content |
| Cookie / consent banners | Dismissed automatically; appearance varies |
| Video elements | Frame differs on every load |
| CAPTCHA (question + input) | Math answer is randomly generated |
| Cross-origin iframes | Content outside our control |

The carousel **container** is always tested. Only the inner **track** (the part that slides) is masked. So if the carousel moves out of position, changes size, or loses its border — that is caught.

---

## How it works (technical overview)

Every test runs two phases:

### Phase 1 — preparePage (once per page)

Ensures the entire page is fully rendered before any screenshot is taken:

1. Wait for DOM ready, network settle, and fonts loaded
2. **Disable WP Rocket lazy-render** — injects CSS to override `content-visibility: auto` so all off-screen sections render immediately (without this, sections below the fold appear as blank white space)
3. **Force-load all lazy images** — converts `data-lazy-src`, `data-src`, `data-bg`, and `loading="lazy"` attributes so every image starts loading before we scroll
4. **Pass 1 (Trigger)** — scroll top to bottom at 250ms per viewport, firing all `IntersectionObserver` and WP Rocket callbacks
5. **Pass 2 (Verify)** — scroll again at 500ms per viewport, waiting for every visible `<img>` to fully decode at each position
6. **Pass 3 (Settle)** — return to top, wait for layout to stop shifting (two consecutive 500ms snapshots must match), then a final 1.5s buffer

### Phase 2 — stabilizePage (once per page, before screenshot)

Detects and neutralises all dynamic content:

1. **Dismiss overlays** — finds fixed/sticky elements with cookie/consent keywords and clicks the dismiss button
2. **Behavioural volatility scan** — observes the entire page for 500ms; anything whose own direct text, CSS transform, or background-position changed is stamped `[data-vr-volatile]` for masking
3. **Hide widgets** — hides fixed chat bubbles, WhatsApp buttons, and cross-origin iframes via CSS
4. **Freeze animations** — pauses infinite CSS animations in-place; structurally stamps `.owl-stage`, `.swiper-wrapper`, `.slick-track` as volatile
5. **Build mask list** — collects `[data-vr-volatile]`, carousel selectors (added unconditionally so late-initialising carousels are always caught), and captcha targets

### Screenshot

```
expect(page).toHaveScreenshot(name, {
  fullPage: true,          // captures header to footer in one image
  mask: maskSelectors,     // Playwright overlays an opaque rectangle on each masked element
  animations: 'disabled',  // extra CSS animation safety
  maxDiffPixelRatio: 0.02  // 2% pixel tolerance (absorbs anti-aliasing, not design changes)
})
```

---

## Browser and device matrix (9 projects)

| Project ID | Browser | Viewport |
|---|---|---|
| `chromium-desktop` | Chromium | 1920 × 1080 |
| `firefox-desktop` | Firefox | 1920 × 1080 |
| `webkit-desktop` | WebKit (Safari) | 1920 × 1080 |
| `chromium-iphone-8` | Chromium | iPhone 8 emulation |
| `chromium-iphone-12-pro` | Chromium | iPhone 12 Pro emulation |
| `chromium-galaxy-s20-ultra` | Chromium | Galaxy S20 Ultra emulation |
| `chromium-ipad-air` | Chromium | iPad (gen 7) emulation |
| `chromium-ipad-mini` | Chromium | iPad Mini emulation |
| `chromium-ipad-pro` | Chromium | iPad Pro 11 emulation |

WebKit is desktop-only. Mobile and tablet coverage uses Chromium device emulation.

---

## Troubleshooting

### 🚨 BASELINE MISSING
A golden baseline has not been captured for this page + project combination.
```bash
npm run update:baseline -- -g "[Page Id]"
```

### ❌ VISUAL MISMATCH DETECTED
The live page looks different from the baseline.
```bash
npm run report   # review the diff — is this an intentional change or a bug?
```
If intentional: `npm run update:baseline -- -g "[Page Id]"`
If a bug: fix the site.

### ⚠️ CONNECTION ERROR
The `BASE_URL` in `.env` is wrong or the site is unreachable. Check your `.env` file.

### Test takes too long / times out
Long pages on mobile emulation can take 30–60 seconds to screenshot. The timeout is intentionally set to 60s per page. This is normal.

### Node version error (`Unexpected token '?'`)
Your system Node is too old. Run `nvm use 22` or install Node 18+.

---

## Repository structure

```
├── playwright.config.js        # browser projects, viewports, thresholds, reporter
├── endpoints.config.js         # list of pages to test — the only file you edit to add pages
├── .env                        # your BASE_URL (git-ignored, not committed)
├── .env.example                # template — copy to .env
│
├── tests/visual/
│   └── visual.spec.js          # test suite — loops endpoints, runs prepare → stabilise → screenshot
│
├── utils/
│   ├── base-fixtures.js        # preparePage + stabilizePage Playwright fixtures
│   └── volatility-detector.js  # 5-phase detection engine (the intelligence layer)
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
    └── LAST_UPDATED.json       # auto-updated timestamp of last baseline capture per page/project
```

---

## Usage — All Scenarios

### Quick reference

| Command | What it does |
|---|---|
| `npm run visual` | Visual regression — all devices, all endpoints |
| `npm run interaction` | Interaction audit — all devices, all endpoints |
| `npm run baseline` | Capture new golden baselines — all devices, all endpoints |
| `npm run full` | Visual + interaction — all devices, all endpoints |
| `npm run report` | Open visual diff HTML report |
| `npm run report:interaction` | Open interaction audit HTML report |
| `npm run test:ui` | Playwright UI dashboard (visual tests) |

---

### Filter by device

```bash
npm run visual -- chrome-desktop
npm run visual -- chrome            # all Chromium projects (desktop + mobile + tablet)
npm run visual -- firefox
npm run visual -- safari
npm run visual -- iphone-12
npm run visual -- iphone-8
npm run visual -- galaxy-s20
npm run visual -- ipad-air
npm run visual -- ipad-mini
npm run visual -- ipad-pro
```

Same flags work for `interaction`, `baseline`, and `full`.

---

### Filter by endpoint group

```bash
npm run visual -- chrome-desktop homepage
npm run visual -- chrome-desktop about-us
npm run visual -- chrome-desktop services
npm run visual -- chrome-desktop support-services
npm run visual -- chrome-desktop products
npm run visual -- chrome-desktop insights
npm run visual -- chrome-desktop footer
```

---

### Combined examples (device + group)

```bash
# Visual regression
npm run visual -- chrome-desktop services
npm run visual -- iphone-12 about-us
npm run visual -- ipad-pro insights

# Interaction audit
npm run interaction -- chrome-desktop homepage
npm run interaction -- iphone-12 about-us
npm run interaction -- ipad-pro products

# Update baseline
npm run baseline -- chrome-desktop homepage
npm run baseline -- chrome-desktop services
npm run baseline -- iphone-12 about-us

# Visual + interaction in one pass
npm run full -- chrome-desktop
npm run full -- chrome-desktop services
npm run full -- iphone-12 about-us
npm run full -- ipad-pro products
```

---

### Available devices

| Alias | Playwright project |
|---|---|
| `chrome-desktop` | chromium-desktop |
| `chrome` | chromium-* (all Chromium) |
| `firefox` | firefox-desktop |
| `safari` / `webkit` | webkit-desktop |
| `iphone-12` | chromium-iphone-12-pro |
| `iphone-8` | chromium-iphone-8 |
| `galaxy-s20` | chromium-galaxy-s20-ultra |
| `ipad-air` | chromium-ipad-air |
| `ipad-mini` | chromium-ipad-mini |
| `ipad-pro` | chromium-ipad-pro |

### Available groups

`homepage` · `about-us` · `services` · `support-services` · `products` · `insights` · `footer`

---

### What the interaction audit checks

| Element | Check performed |
|---|---|
| Buttons | Visible and not disabled |
| Internal links | HTTP HEAD request — fail on 4xx/5xx |
| External links | HTTP HEAD request — warn on 4xx (server may block HEAD), fail on 5xx/network error |
| Anchor links | Target element exists in DOM |
| `tel:` / `mailto:` links | Presence confirmed |
| Text / textarea / number / tel inputs | Visible and not disabled. No text entered anywhere. |
| Email inputs | **Skipped** — strict rule, no interaction |
| CAPTCHA inputs | **Skipped** |
| File inputs | Visible and not disabled. No file uploaded. |
| Select dropdowns | Visible, enabled, has options |
| Nav dropdowns | Hover trigger accessible, sub-links appear |
| Carousel nav arrows | Visible and enabled |
| Accordion triggers | Visible and not disabled |
