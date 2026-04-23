# Ksolves UI Testing Framework

Automated testing for **ksolves.com** marketing pages using Playwright.
Two test suites: **Visual** (pixel-level screenshot comparison) and **Interaction** (element health audit).

---

## What this does

| Suite | Purpose |
|---|---|
| **Visual** | Takes a full-page screenshot of every page and compares it pixel-by-pixel against a saved golden baseline. Catches layout shifts, broken images, font/colour changes, spacing regressions. |
| **Interaction** | Scans every interactive element (buttons, links, inputs, dropdowns, accordions) and checks it is reachable and not broken. No hardcoded selectors — everything is discovered from the live DOM. |

**80+ pages** are tested across **9 browser/device combinations**:

| Category | Projects |
|---|---|
| Desktop | Chromium · Firefox · WebKit (Safari engine) |
| Mobile | iPhone 8 · iPhone 12 Pro · Galaxy S20 Ultra |
| Tablet | iPad Air · iPad Mini · iPad Pro |

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js v24+ | Run `node -v` to check. Use `nvm use` — the `.nvmrc` file auto-selects v24. |
| Playwright browsers | Run once: `npx playwright install` |
| Internet access | Tests run against the live site |

---

## Setup

```bash
npm install
npx playwright install
cp .env.example .env
# Open .env and set: BASE_URL=https://www.ksolves.com/
```

No database, no login, no API keys needed.

---

## Running Tests

### Quick reference

```bash
npm run visual                    # visual tests — all 9 devices, all 80 pages
npm run interaction               # interaction audit — all devices, all pages
npm run baseline                  # capture/update golden baselines
npm run full                      # visual + interaction in one pass
npm run report                    # open visual report
npm run report:interaction        # open interaction report
```

### Filter by device and/or group

```bash
npm run visual -- chrome-desktop                   # one device, all pages
npm run visual -- chrome-desktop services          # one device, one group
npm run interaction -- iphone-12 about-us          # mobile, one group
npm run baseline -- chrome-desktop homepage        # re-capture one group
npm run full -- ipad-pro products                  # visual + interaction, filtered
```

Add `--headed` to watch the browser, `--debug` for the step-debugger, or run `npm run interaction:ui` for Playwright's live UI:

```bash
npm run interaction -- chrome-desktop homepage --headed
npm run interaction:ui -- chrome-desktop homepage
```

### Device aliases

| Alias | Maps to |
|---|---|
| `chrome-desktop` | chromium-desktop (1920×1080) |
| `chrome` | all Chromium projects |
| `firefox` | firefox-desktop |
| `safari` / `webkit` | webkit-desktop |
| `iphone-12` | chromium-iphone-12-pro |
| `iphone-8` | chromium-iphone-8 |
| `galaxy-s20` | chromium-galaxy-s20-ultra |
| `ipad-air` | chromium-ipad-air |
| `ipad-mini` | chromium-ipad-mini |
| `ipad-pro` | chromium-ipad-pro |

### Page groups

`homepage` · `about-us` · `services` · `support-services` · `products` · `insights` · `footer`

---

## Visual Tests — What's Covered

### What it catches
- Layout shifts (sections moved, collapsed, overlapping)
- Missing or broken images, logos
- Text changes (copy edits, missing content)
- Font size, weight, colour regressions
- Spacing and padding drift
- Header and footer changes
- Responsive layout issues on mobile/tablet

### What is automatically masked (never fails on these)

| Content | Why masked |
|---|---|
| Carousel/slider tracks | Slide position differs every run |
| Carousel dot indicators | Active dot changes with slide position |
| Auto-counting numbers | Value increments on every page load |
| Chat widgets (Tidio, Tawk.to) | Third-party, position and state unpredictable |
| Cookie/GDPR banners | Dismissed automatically; appearance varies |
| CAPTCHA input + question | Randomly generated |
| Videos | Frame changes every load |
| Any element whose text or CSS transform changed in 500ms | Detected automatically via behavioural scan |

> The carousel **container** (outer shell) is always in the pixel diff — only the inner sliding track is masked. A carousel that shifts position or loses its border will still fail.

### Pixel tolerance

2% of pixels may differ before a test fails. This absorbs font anti-aliasing and minor rendering variance between runs. It is not large enough to hide real design changes.

### What it cannot catch

- Text changes so small they fall within the 2% tolerance
- Functional bugs (a button that looks right but does nothing)
- Content inside modals or dropdowns that require interaction to open
- Anything behind a login

---

## Interaction Tests — What's Covered

### What it checks

| Element | What is verified |
|---|---|
| Buttons (outside forms) | Trial-clicked to confirm they accept pointer events — no event fires, no navigation |
| Buttons (inside forms) | Checked for visibility and enabled state — not clicked (form is never filled) |
| Internal links | HTTP HEAD returns 2xx/3xx — FAIL on 4xx/5xx |
| External links | HTTP HEAD returns 2xx/3xx — FAIL on 4xx/5xx (note in detail if external server may block HEAD) |
| Anchor links (`#id`) | Target element exists in the DOM |
| `tel:` / `mailto:` links | Present in DOM |
| All text inputs (text, email, number, tel, textarea) | Visible and not disabled — no text entered |
| Select dropdowns | Enabled, has at least one option |
| Accordion triggers | Not disabled |
| Carousel prev/next buttons | Visible |
| Nav dropdown menus | Hover trigger accessible |

### What is permanently skipped

| Skipped | Why |
|---|---|
| Social media links (LinkedIn, YouTube, Facebook, Instagram, Twitter/X, Pinterest, TikTok) | Intentionally block automated requests — always return errors |
| `javascript:void(0)` links | No URL to check |
| CAPTCHA inputs and adjacent buttons | Dynamic by design |
| Hidden / invisible elements | Not visible to the user |

### What interaction tests do NOT do

- No text is entered in any field — inputs are only checked for visibility and enabled state
- Form buttons are not clicked — form would fail validation since fields are empty
- Does not test what happens after interaction (JavaScript behaviour, page transitions)
- Not a WCAG accessibility audit

### What needs manual follow-up after interaction tests

- **External link 4xx FAILs** — confirm the link is genuinely broken vs the server blocking HEAD requests. Open in a browser to verify.
- **3xx redirects on internal links** — test passes but confirm the destination is the intended page.

---

## Baselines

Baselines are golden reference screenshots committed to git. The visual suite compares the live site against them.

```bash
npm run baseline                              # all pages, all devices (first-time setup)
npm run baseline -- chrome-desktop           # one device
npm run baseline -- chrome-desktop services  # one device, one group
```

**When to re-capture:** Only when a visual change is **intentional** (approved redesign, content update). If a test fails and the change was not intentional — that is a real bug. Fix the site, do not re-capture.

Baselines are stored in `golden-baselines/` and organised by `{browser}/{device}/{page-id}.png`. `LAST_UPDATED.json` tracks when each page's baseline was last captured.

---

## Reading the HTML Report

Visual and interaction reports are kept in separate folders so running one never overwrites the other.

```bash
npm run report                # visual report  → opens playwright-report/
npm run report:interaction    # interaction report → opens interaction-report/
```

**Visual test — on failure:**
- Click the failed test → see **Expected / Actual / Diff** images side by side
- Red pixels in the diff = what changed
- Annotations panel shows: last baseline date, page load time, masked elements count

**Interaction test — on failure:**
- Click the failed test → expand the annotations:
  - **Interaction Summary** — total PASS / FAIL / WARN / SKIP count
  - **Failures** — which element failed and why
  - **Warnings** — external links to manually verify
- Open the **highlighted-failures.png** attachment — the page screenshot with failing elements outlined in red, warnings in orange
- Open the **audit-results.json** attachment — full machine-readable results

---

## Adding a New Page

1. Open [endpoints.config.js](endpoints.config.js) and add one line in the right group:

```js
{ id: 'My-New-Page', group: 'services', folder: 'services', path: '/my-new-page' }
```

2. Capture its baseline:

```bash
npm run baseline -- chrome-desktop -- -g "[My-New-Page]"
```

3. Verify it passes:

```bash
npm run visual -- chrome-desktop -- -g "[My-New-Page]"
```

**Rules:** `endpoints.config.js` contains `id`, `group`, `folder`, `path` only. No selectors, masks, or page-specific logic ever goes here.

---

## What Needs Manual Testing

This framework does not replace manual QA for:

| Area | Why automated testing can't cover it |
|---|---|
| Form submissions | No data is sent — forms are never submitted |
| Login / authenticated flows | Tests run without credentials |
| JavaScript behaviour after a click | No clicks performed in interaction tests |
| Content inside modals and popups | Require interaction to open |
| Actual link destination content | Only HTTP status is checked, not the page content at the destination |
| Real mobile devices | Tests use Chromium device emulation, not physical hardware |
| Performance / load time | Not measured here |

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `🚨 BASELINE MISSING` | No baseline captured for this page/device | `npm run baseline -- chrome-desktop -g "[Page-Id]"` |
| `❌ VISUAL MISMATCH` | Page looks different from baseline | `npm run report` — decide if it's a bug or intentional change |
| `⚠️ NAVIGATION FAILURE` | Page returned 4xx/5xx | Check `BASE_URL` in `.env`, verify the path in `endpoints.config.js` |
| `⚠️ CONNECTION ERROR` | Site unreachable | Check internet / VPN / `BASE_URL` |
| Test timeout | Large page on mobile — normal | Timeout is 5 min per test. Let it finish. |
| `SyntaxError: Unexpected token '?'` | Node.js too old | Run `nvm use` |

---

## Repository Structure

```
├── playwright.config.js        # 9 browser/device projects, thresholds, reporter
├── endpoints.config.js         # page registry — only file edited to add pages
├── .env                        # BASE_URL (git-ignored)
├── .env.example                # template
├── .nvmrc                      # pins Node to v24
│
├── tests/
│   ├── visual/visual.spec.js        # visual suite
│   └── interaction/interaction.spec.js  # interaction suite
│
├── scripts/
│   └── run-tests.js            # CLI wrapper — maps device/group shortcuts to Playwright flags
│
├── utils/
│   ├── base-fixtures.js        # preparePage + stabilizePage Playwright fixtures
│   ├── volatility-detector.js  # 5-phase dynamic content detection engine
│   └── interaction-engine.js   # DOM scanner + element health checker
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
