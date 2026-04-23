# Ksolves UI Testing Framework — Full Technical Overview

**Prepared for:** Internal Team Presentation  
**Framework:** Playwright Visual Regression + Interaction Audit  
**Target Site:** ksolves.com  
**Built with:** Playwright, Crawlee, Node.js, Claude (AI)

---

## 1. Executive Summary

We built an automated testing framework that does two things:

1. **Visual Regression** — takes pixel-level full-page screenshots of every marketing page across multiple browsers and devices, and compares them against a set of approved golden reference screenshots. Any unintended layout change, broken image, font shift, or spacing difference is flagged immediately.

2. **Interaction Audit** — crawls the entire ksolves.com website automatically (every page, all depths), and checks every interactive element on every page: buttons, links, inputs, dropdowns, accordions, images, iframes, navigation menus, and popups.

Both suites run with a single command. Both produce detailed HTML reports that any team member can open in a browser and read — no technical knowledge required to interpret results.

---

## 2. The Problem We Were Solving

### What the website is

ksolves.com is a large marketing site — 67+ registered pages plus blog posts, case studies, guides, and industry pages at unlimited depth. It runs on WordPress with WP Rocket as a performance plugin. The site has:

- Auto-playing carousels and sliders
- Animated number counters
- Chat widgets (floating elements above content)
- Lazy-loaded images (images that only load when scrolled into view)
- Cookie consent banners
- CAPTCHA fields on contact forms
- WhatsApp floating buttons
- Videos in hero sections
- Third-party scheduling embeds (TidyCal, Calendly)

### What was happening manually

Without automation, every time a developer makes a change — a CSS tweak, a plugin update, a new section added — someone has to manually open every page, scroll through it, and visually confirm nothing broke. On a 67+ page site with 9 browser/device combinations, that is **603+ manual checks per release**. Realistically, no one does all of them, which means visual regressions and broken links silently go live.

### The specific pain points

| Pain Point | Manual Effort | Impact |
|---|---|---|
| New plugin update | Re-check every page on every device | Skipped → regressions live |
| Link rot (URLs change over time) | Manually click every link | Never done completely |
| Broken images after CDN change | Scroll entire site visually | Missed until user reports |
| Navigation menu hover states | Manual hover on each nav item | Skipped on mobile |
| CTA buttons that stop working | Click every button manually | Caught late |
| Layout shifts on different screen sizes | Open browser dev tools per page | Done inconsistently |

---

## 3. What We Built and How It Solves These Problems

### Visual Regression Suite

- Captures a full-page screenshot of every registered page (67+ pages)
- Runs on any combination of 9 browser/device configurations
- Compares pixel-by-pixel against approved golden reference screenshots
- Automatically handles all the dynamic content (carousels, counters, chat widgets, videos, CAPTCHA) so they never cause false failures
- Flags only genuine layout changes

**Result:** A developer makes a CSS change → run one command → get a diff showing exactly which pixels changed on which page and which device. Decision: approve the change or revert it.

### Interaction Audit Suite

- Starts from the homepage and crawls the entire site automatically — discovers every internal page (blog posts, case studies, guides, all depths)
- On each discovered page, checks every interactive element
- Produces a single HTML report with pass/fail per URL, with screenshots highlighting failed elements

**Result:** A complete health check of every clickable, linkable, and fillable element on every page the site crawler can reach — in one automated run.

---

## 4. Tech Stack

### Core Tools

| Tool | Version | Role | Why It Fits |
|---|---|---|---|
| **Playwright** | `^1.59` | Browser automation, screenshot comparison, test runner | The only tool with built-in pixel-diff `toHaveScreenshot`, native multi-browser support (Chromium, Firefox, WebKit), and a fixture system that lets us cleanly separate page preparation from test logic. Its `mask` parameter lets us overlay opaque rectangles over volatile elements without modifying the page or the screenshot. |
| **Crawlee** | `^3.16` | Full-site crawling | Crawlee's `PlaywrightCrawler` integrates directly with Playwright pages, so we get a real browser for every crawled page (no HTTP-only scraping). It handles URL deduplication, request queuing, retry logic, and concurrency automatically. We get a fully crawled site with zero URL management code. |
| **Node.js** | `v22` | Runtime | LTS, required by Crawlee v3, and the native environment for Playwright's JS API. |
| **dotenv** | `v16` | Environment config | Keeps `BASE_URL` out of source code. Single field, no secrets. |

### Playwright Functions Used

| Function | Where Used | Why |
|---|---|---|
| `page.goto()` | `visual.spec.js` | Navigate to each page |
| `page.waitForLoadState()` | `base-fixtures.js` | Wait for `domcontentloaded`, `networkidle`, `load` sequentially |
| `page.evaluate()` | `base-fixtures.js`, `volatility-detector.js` | Run arbitrary JavaScript inside the browser — this is how we force-load lazy images, take DOM snapshots, and stamp volatile elements |
| `page.addStyleTag()` | `base-fixtures.js`, `volatility-detector.js` | Inject CSS to override WP Rocket's `content-visibility:auto`, freeze animations, and hide overlays |
| `page.waitForTimeout()` | `base-fixtures.js` | Controlled pauses between scroll passes for IntersectionObserver callbacks to fire |
| `page.waitForFunction()` | `volatility-detector.js` | Block until the cookie banner has actually disappeared from the DOM |
| `expect(page).toHaveScreenshot()` | `visual.spec.js` | Pixel-diff comparison with mask, tolerance, and fullPage options |
| `test.extend()` | `base-fixtures.js` | Custom fixtures — wraps `preparePage` and `stabilizePage` so every test gets them automatically |
| `test.step()` | `visual.spec.js`, `base-fixtures.js` | Named sub-steps shown in the HTML report for debugging |
| `test.info().annotations.push()` | `visual.spec.js`, `interaction.spec.js` | Attach metadata (timestamps, stabilisation stats, per-URL results) to the HTML report |
| `test.info().attach()` | `interaction.spec.js` | Attach files (JSON summary, screenshots) to the Playwright report |
| `page.screenshot()` | `interaction-engine.js` | Capture a viewport screenshot of failing pages with highlighted elements |
| `enqueueLinks()` | `interaction-engine.js` | Crawlee method to add all internal links found on a page into the crawl queue |

### Programming Approach

The framework is pure **JavaScript (CommonJS)**. No TypeScript, no build step, no transpilation. This was a deliberate choice: the framework runs directly with Node.js, anyone can read and edit any file without a compilation step, and Playwright's JS API is first-class.

The code is split into three layers:

1. **Configuration** (`playwright.config.js`, `playwright.interaction.config.js`, `endpoints.config.js`) — what to test and how
2. **Utilities** (`utils/`) — the intelligence: how to load a page reliably, how to detect dynamic content, how to audit elements
3. **Specs** (`tests/`) — the actual tests: orchestrate the utilities and make assertions

---

## 5. How the Visual Suite Works — Step by Step

Every visual test runs this pipeline:

```
Navigate → preparePage → stabilizePage → toHaveScreenshot
```

### Step 1: preparePage (base-fixtures.js)

This is the page warm-up phase. The problem it solves: if you navigate to a WP Rocket site and take a screenshot immediately, you get a page full of grey placeholder boxes where images should be, because WP Rocket delays loading everything until the user scrolls.

**Phase 1.1 — Wait for DOM, network, fonts**
- Wait for `domcontentloaded`, then try `networkidle` (capped at 10 seconds because WP Rocket keeps connections open deliberately — waiting forever would hang the test)
- Wait for `load` event as a fallback
- Wait for web fonts (`document.fonts.ready`) so text renders at the correct size
- Inject CSS to override `content-visibility: auto` on all WP Rocket sections — this forces every section to render upfront even if it is off-screen

**Phase 1.2 — Force-load all lazy assets**
Runs `page.evaluate()` to directly manipulate the DOM:
- Converts `data-lazy-src` → `src` (WP Rocket's lazy image attribute)
- Converts `data-src` → `src` (generic lazy images)
- Converts `data-bg` → inline `background-image` CSS (WP Rocket background images)
- Sets `loading="lazy"` → `loading="eager"` on all `<img>` tags
- Adds `lazyloaded` CSS class so any CSS transitions depending on it fire

**Phase 1.3 — Pass 1: Trigger (scroll top→bottom at 250ms intervals)**
Scrolls the entire page programmatically, dispatching a `scroll` event at each position. This fires `IntersectionObserver` callbacks on every section so WP Rocket's lazy-loaders start fetching all remaining assets.

**Phase 1.4 — Pass 2: Verify (scroll again at 500ms intervals)**
Second scroll, slower. At each viewport position, waits for every visible `<img>` to report `complete` and `naturalHeight > 0` (a broken image has `complete = true` but `naturalHeight = 0`). This guarantees no image is still downloading when we proceed to the screenshot.

**Phase 1.5 — Global image decode wait**
After Pass 2, waits for every `<img>` in the entire document (not just visible ones) to finish loading, with an 8-second ceiling per image.

**Phase 1.6 — Pass 3: Layout stability gate**
Returns to the top of the page. Polls 40 structural landmarks (`img`, `h1`–`h3`, `nav`, `header`, `footer`, `section`) every 500ms. When two consecutive snapshots have identical `offsetTop`, `offsetHeight`, `offsetLeft`, `offsetWidth` values for all 40 elements, layout is stable. Then waits a final 1.5 seconds for entrance animations and counter increments to finish.

### Step 2: stabilizePage (volatility-detector.js)

This is the dynamic content neutralisation phase. The problem: even with a fully loaded page, elements like carousels, number counters, chat widgets, and cookie banners would cause a screenshot to differ between runs. We need to handle all of them without any hardcoded page-specific selectors.

**Phase 2.1 — dismissOverlays**
Finds all `position: fixed` or `sticky` elements whose text contains cookie/consent keywords (`cookie`, `consent`, `GDPR`, `privacy policy`). Scores the child buttons by text pattern (`accept`, `got it`, `close`, `OK`, `agree`, `dismiss`) and clicks the highest-scoring one if score ≥ 5. Waits for the banner to disappear from the DOM before proceeding. Must run first so a disappearing banner doesn't look like volatile content in Phase 2.2.

**Phase 2.2 — behavioralVolatilityScan (the core intelligence layer)**

This is the most important function in the framework. It detects volatile content without any hardcoded selectors by observing the live page for 500ms.

How it works:
1. Collects every rendered, visible element with area > 400px²
2. Takes Snapshot 1: for each element, records (a) direct text content of its own text nodes — `nodeType === 3`, not `textContent` which would cascade up the DOM tree, (b) CSS `transform` value, (c) `backgroundPosition`
3. Waits 500ms (lets the page behave naturally)
4. Takes Snapshot 2: compares the three values for each element
5. Anything that changed gets stamped `[data-vr-volatile]`
6. De-duplication: if element A contains volatile element B, remove A and keep B — so only the most specific volatile element is stamped, not its entire ancestor chain

**Why direct text instead of `textContent`:** If a carousel slide changes "Slide 1" to "Slide 2", `textContent` on every ancestor (`<div>`, `<section>`, `<main>`, `<body>`) would also appear to have changed — masking huge sections of the page. Direct text nodes (`nodeType === 3`) are surgical — only the element that actually owns the changing text is stamped.

**Phase 2.3 — hideWidgetsAndOverlays**
Hides elements that float above page content but aren't part of the layout being tested:
- `position: fixed`, z-index ≥ 10,000, area < 15% viewport → chat bubble or floating CTA
- z-index ≥ 100,000 → full chat container panel
- Cross-origin iframes (we can't screenshot their content, and their height varies)
- WhatsApp floating buttons and wrappers
- TidyCal / Calendly scheduling embeds (slot count varies, shifts page layout)

Hides by injecting CSS with `display: none !important` via `addStyleTag`.

**Phase 2.4 — freezeVolatileContent**
- Pauses all CSS animations where `animation-iteration-count: infinite` by setting `animation-play-state: paused`
- Stamps `.owl-stage`, `.swiper-wrapper`, `.slick-track`, Bootstrap and generic slider tracks as `[data-vr-volatile]`
- Stamps all `<video>` elements as `[data-vr-volatile]`
- Stops jQuery-based Owl Carousel autoplay via `jQuery('.owl-carousel').data('owl.carousel')`

**Phase 2.5 — detectMaskTargets**
Builds the final list of CSS selector strings. Three categories:
1. `[data-vr-volatile]` — everything stamped by Phases 2.2 and 2.4
2. CAPTCHA question containers and inputs (detected by math-pattern text `"what is 6 + 9?"`)
3. **Unconditional carousel class selectors** — `.owl-stage`, `.owl-dots`, `.swiper-wrapper`, `.swiper-pagination`, `.slick-track`, `.slick-dots` added unconditionally

The unconditional carousel selectors are critical: WP Rocket lazy-loads carousel JavaScript. The Owl Carousel instance can initialise **after** Phase 2.4 has stamped `.owl-stage` with `[data-vr-volatile]`, replacing the DOM node and losing the attribute. Since these are added as CSS selector strings (not live DOM references), Playwright resolves them at screenshot time — after the carousel has fully initialised. Zero-match selectors are silently skipped.

### Step 3: toHaveScreenshot

```js
await expect(page).toHaveScreenshot(snapshotName, {
  fullPage: true,
  mask: maskSelectors.map(s => page.locator(s)),
  animations: 'disabled',
  maxDiffPixelRatio: 0.02,
  timeout: 60_000,
});
```

- `fullPage: true` — captures the entire document height in one image
- `mask` — Playwright overlays opaque rectangles over each matched locator at screenshot time
- `animations: 'disabled'` — belt-and-braces: disables remaining CSS transitions during the capture
- `maxDiffPixelRatio: 0.02` — tolerates up to 2% pixel difference (absorbs anti-aliasing and sub-pixel font rendering variance between runs)

---

## 6. How the Interaction Suite Works — Step by Step

### The Crawlee crawler

The interaction suite starts from `BASE_URL` and crawls the entire site using `PlaywrightCrawler`. At every page, `enqueueLinks({ globs: ['${origin}/**'] })` adds all internal links to the queue. Crawlee deduplicates them automatically — each URL is visited exactly once.

Configuration:
- `maxRequestsPerCrawl: MAX_PAGES` — adjustable ceiling
- `maxConcurrency: 1` — one page at a time, no server load
- `maxRequestRetries: 0` — failed pages go immediately to `failedRequestHandler` without consuming crawl budget
- Viewport set to `1920 × 1080` inside `requestHandler` (Crawlee ignores Playwright config viewport)

### What is checked on each page (in order)

**1. Element scan** — DOM scan collects all buttons, links, inputs, selects, accordions, carousel navs, images, iframes, and accessibility items.

**2. Input checks** — disabled inputs → FAIL; inputs without labels → WARN; hidden inputs → SKIP.

**3. Select checks** — empty or disabled select elements → FAIL.

**4. Accordion checks** — up to 4 `aria-expanded` triggers are clicked; state toggle confirmed; stuck aria state → WARN.

**5. Navigation dropdown checks** — hovers each nav item; checks that sub-menus appear; hover fail → WARN.

**6. Button clickability** — trial-click (not a real event dispatch); if the click times out due to an animation or overlay → WARN; if the button has `disabled` attribute → FAIL.

**7. Link health** — HEAD request per unique URL, cached in a `Map` across the entire crawl (so `ksolves.com/about-us` is HEAD-requested once even if it appears on 50 pages). Social media links → WARN (never HEAD-requested, corporate firewalls block them). 4xx/5xx → FAIL. HTTP 429 → WARN.

**8. Image health** — `img.complete && img.naturalHeight === 0` → broken image → FAIL; missing `alt` → WARN.

**9. Iframe checks** — missing `title` attribute → WARN.

**10. Accessibility checks** — focusable elements hidden from screen readers; missing accessible names → WARN.

**11. Scroll behavior** — scrolls to 60% of page height; sticky header still visible → PASS; gone → WARN; back-to-top button appears → PASS; missing → WARN.

**12. CTA popup audit** — clicks non-form buttons; detects if a new modal/popup appears; checks popup's own buttons, inputs, and links; disabled elements inside popup → FAIL.

**13. Console error check** — records JavaScript errors thrown during the page session → WARN.

### FAIL / WARN / SKIP policy

| Status | What triggers it |
|---|---|
| **FAIL** | Disabled button · broken link (4xx/5xx, non-social) · broken image · disabled input · empty/disabled select · page navigation failure · popup with disabled elements |
| **WARN** | Click trial timeout · missing alt text · missing input label · missing iframe title · no accessible name · focusable-hidden · console errors · nav hover fail · sticky header gone · accordion aria stuck · back-to-top not visible · social media link · HTTP 429 |
| **SKIP** | CAPTCHA elements · hidden elements · form submit buttons |

---

## 7. How Tests Are Executed

### Setup (one time)
```bash
npm install                  # install Node dependencies and Crawlee
npx playwright install       # download browser binaries (Chromium, Firefox, WebKit)
cp .env.example .env         # set BASE_URL=https://www.ksolves.com/
```

### Visual tests
```bash
npm run baseline             # capture golden reference screenshots for all pages
npm run visual               # compare live site against golden references
```

### Filtering (for targeted runs)
```bash
npm run visual -- --grep '\[services\]'   # run only services group
npm run visual -- --grep 'About-Us'       # run only About-Us page
npm run baseline -- --grep 'About-Us'     # capture baseline for one page
```

### Interaction audit
```bash
npm run interaction          # crawl full site and audit all elements
```

### Device control
Open `playwright.config.js` and uncomment any device block. Then run `npm run baseline` before `npm run visual`.

---

## 8. Reports and How to Read Them

### Visual Report

```bash
npm run report
```

Opens the Playwright HTML report in the browser.

- **Pass** → green row. The page looks identical to the golden baseline within tolerance.
- **Fail** → red row. Click to see: the expected (golden) screenshot, the actual (live) screenshot, and a diff image where changed pixels are highlighted.
- **Annotations** tab per test shows: baseline freshness date, whether this was a capture or comparison run, page load time, stabilisation summary (how many volatile elements were detected, frozen, hidden, dismissed, and masked).

When a failure is genuinely a UI regression: investigate and fix. When a failure is an approved design change: run `npm run baseline -- --grep 'Page-Id'` to update only that page's reference.

### Interaction Report

```bash
npm run report:interaction
```

Opens the interaction audit HTML report.

- One test row: `Full Site Crawl`
- **Annotations** tab shows crawl stats (total pages, failures, warnings, runtime) then one line per crawled URL (✅/⚠️/❌ with PASS/FAIL/WARN/SKIP counts)
- **Failure annotations** show `[url] [category] element label: detail` for every FAIL
- **Attachments**: `crawl-summary.json` (full machine-readable results), `❌ slug.png` screenshots for each failing page with failing elements highlighted in red

Reading a failure:
```
[https://www.ksolves.com/contact] [link] Contact Us button: HTTP 404
```
This means the "Contact Us" button link on the /contact page returns a 404. The attached screenshot shows the button highlighted in red.

---

## 9. Manual Effort Reduction

### Before automation

| Activity | Manual time estimate |
|---|---|
| Visual check of 67 pages on 1 device | ~5 hours |
| Visual check across 9 devices | ~45 hours |
| Link health check across full site | ~3 hours |
| Button/input clickability check across full site | ~4 hours |
| Navigation dropdown check across all pages | ~2 hours |
| **Total per release cycle** | **~54 hours** |

### After automation

| Activity | Time |
|---|---|
| `npm run baseline` (first time per device) | ~2 hours unattended |
| `npm run visual` (each run, chromium desktop) | ~25 minutes unattended |
| `npm run interaction` (full-site crawl) | ~1-4 hours unattended |
| Reviewing visual report (failures only) | 10-20 minutes |
| Reviewing interaction report | 15-30 minutes |

The tests run entirely unattended. A developer triggers `npm run visual`, does other work, and comes back to a report. The 54 hours of manual effort becomes 30-45 minutes of human review time.

---

## 10. How AI (Claude) Accelerated This Build

This framework was built collaboratively with Claude, Anthropic's AI coding assistant. Here is an honest breakdown of what would have happened without AI, and what AI changed.

### What a human engineer would have approached manually

**Problem 1: WP Rocket lazy loading**  
A human engineer would spend days debugging why screenshots show blank sections. They would Google "Playwright WP Rocket lazy images", find scattered forum posts, and piece together partial solutions. The three-pass scroll strategy, the `content-visibility: auto` override, the `data-lazy-src` vs `data-src` vs `data-bg` attribute variants — these would take days to discover and test individually.

**With Claude:** The WP Rocket interaction pattern was identified and the complete force-load strategy was written in one session. The exact CSS property (`content-visibility`) and its interaction with `IntersectionObserver` timing was explained and coded together.

**Problem 2: Carousel / dynamic content masking**  
Without AI, the naive approach would be to hardcode selectors: `if page == 'homepage': mask(['#hero-slider'])`. This breaks immediately when new pages are added or when the carousel class changes.

**With Claude:** The behavioral scan approach — observing DOM changes over a 500ms window and comparing CSS transform deltas — was designed as a zero-hardcoded-selector solution. The architectural rule "mask content, test containers" was established as a constraint. The de-duplication logic (keep specific, remove generic) was reasoned through and implemented correctly.

**Problem 3: Why MAX_PAGES was always off by 2-3**  
A human debugging this would spend hours reading Crawlee documentation, adding console logs, and running test after test. The root cause (`maxRequestRetries: 1` counting retries against the page budget) is non-obvious and buried in Crawlee internals.

**With Claude:** The root cause was identified in one conversation by reasoning about how `maxRequestsPerCrawl` counts request attempts, not distinct URLs. Fixed with `maxRequestRetries: 0` in minutes.

**Problem 4: The `--update-snapshots` flag behavior change in Playwright 1.49**  
Playwright changed `--update-snapshots` (no value) from meaning `'all'` to meaning `'missing'` in v1.49. This caused baseline capture to silently fail. A human would spend significant time reading changelogs and debugging.

**With Claude:** Diagnosed from the symptom (test logs showed "TEST" mode instead of "CAPTURE" mode) in one conversation. The root cause in the Playwright changelog was identified and both the npm script (`--update-snapshots=all`) and the spec guard (`updateMode === 'all'`) were corrected.

**Problem 5: Architecture and maintainability decisions**  
Decisions like "endpoints.config.js should contain only id and path — no selectors", "carousel selectors in detectMaskTargets must be unconditional", "mask content, test containers" — these are non-trivial design rules that prevent the framework from becoming brittle. Without AI collaboration, these rules would likely emerge from painful breakage over time rather than being designed in upfront.

**With Claude:** These rules were reasoned through, encoded in `CLAUDE.md` as non-negotiable constraints, and enforced consistently across every code change.

### What AI specifically contributed

| Contribution | Impact |
|---|---|
| WP Rocket compatibility strategy (3-pass loading, content-visibility override) | Days of debugging → hours of implementation |
| Behavioral volatility scan design (zero hardcoded selectors, 500ms window, direct text vs textContent) | Novel solution, not findable by Googling |
| De-duplication logic (keep specific, remove generic) | Would have been wrong without explicit reasoning |
| Crawlee `maxRequestRetries: 0` fix | Non-obvious root cause, found in minutes |
| Playwright 1.49 `--update-snapshots` behavior change diagnosis | Obscure changelog change, identified from symptoms |
| Architectural rules and constraints in CLAUDE.md | Prevents future maintainability debt |
| Full framework documentation (README, CLAUDE.md, this document) | Hours of writing → minutes |
| Repo cleanup, gitignore correctness, git workflow | Clean handoff to team |

### The human + AI model

This framework was not "written by AI". The human engineer:
- Defined requirements and constraints
- Made all architectural decisions (two-suite structure, behavioral detection philosophy, no hardcoded selectors)
- Tested every output and identified failures
- Drove all debugging conversations with real symptoms and real logs
- Made the final call on every tradeoff

Claude:
- Translated requirements into working code
- Identified root causes from symptoms
- Reasoned through edge cases that would have been found only by breaking in production
- Maintained consistency across a large codebase

The total build time with AI collaboration was a fraction of what a solo engineer would have needed. The quality of the resulting code — particularly the volatility detection engine — is higher than typical because the design was reasoned through explicitly rather than evolved through breakage.

---

## 11. Best Practices Applied

### 1. Zero hardcoded selectors
No page-specific CSS arrays anywhere. All detection is behavioral (observed DOM change) or universally structural (known carousel library class names that are part of those libraries' public API). Adding a new page never requires touching the detection code.

### 2. Mask content, test containers
The outer carousel container (size, position, padding) is always in the visual diff. Only the inner sliding track is masked. This ensures layout regressions in the carousel are still caught.

### 3. Single source of truth for page registry
`endpoints.config.js` is the only file that lists pages. It contains only `id`, `group`, `folder`, and `path`. Nothing else belongs there. The interaction suite needs no updates — it discovers pages by crawling.

### 4. Separated test configurations
`playwright.config.js` for visual (multi-device, screenshot comparison) and `playwright.interaction.config.js` for interaction (single browser, 4-hour timeout, Crawlee). These have fundamentally different requirements and must not share configuration.

### 5. Actionable error messages
Every failure gives a specific action:
- `🚨 BASELINE MISSING` → `npm run baseline -- --grep "Page-Id"`
- `❌ VISUAL MISMATCH` → `npm run report`
- `⚠️ NAVIGATION FAILURE` → check `BASE_URL` in `.env`

### 6. HEAD cache across the full crawl
Link health checks across the full site use a shared `Map` so the same URL is HEAD-requested at most once, regardless of how many pages link to it. Significant time saving on large crawls.

### 7. Artifacts gitignored, baselines committed
Reports and crawler storage are gitignored — they are outputs, not inputs. Golden baselines are committed because they are the shared reference that makes visual tests reproducible for every team member.

---

## 12. Known Limitations

| Limitation | Detail | Workaround |
|---|---|---|
| **No authenticated pages** | The framework has no login flow. Pages behind authentication are not tested. | Add a `page.fill()` / `page.click()` login step in `base-fixtures.js` if needed. |
| **Interaction audit doesn't submit forms** | Inputs are checked for visibility and enabled state only. No values are typed, no forms submitted. | Intentional — avoids sending test data to the live site. |
| **Visual tests are pixel-level** | A font version update or OS-level anti-aliasing difference between two machines can cause failures. | The 2% tolerance band (`maxDiffPixelRatio: 0.02`) absorbs most of this. For larger differences, re-capture baselines. |
| **Crawlee crawl is depth-unlimited but count-limited** | `MAX_PAGES` in `interaction-engine.js` caps the crawl. Set to 5 during development. For production, raise to 300-500. | Edit `MAX_PAGES` in `utils/interaction-engine.js`. |
| **No performance testing** | The framework does not measure page load times, Core Web Vitals, or Lighthouse scores. | A separate tool (Lighthouse CI, WebPageTest) would be needed. |
| **Social media links are not HTTP-verified** | Links to LinkedIn, Twitter/X, Facebook etc. are flagged as WARN without making a network request, because corporate firewalls block these. | Manual spot-check of WARN items in the interaction report. |
| **Single-run baselines** | Golden baselines represent one point-in-time capture. If the site was in a bad state when baselines were captured, those bad states become the reference. | Always inspect baselines after capture with `npm run report`. |

---

## 13. What Could Be Added Next

| Enhancement | Value | Effort |
|---|---|---|
| **Slack/email notification** on failure | Team gets alerted without opening the report | Low |
| **Scheduled CI run** (GitHub Actions, Jenkins) | Runs automatically on every deploy or nightly | Medium |
| **Lighthouse integration** | Performance and accessibility scores per page | Medium |
| **Login flow** for authenticated pages | Extend coverage to dashboard / account pages | Medium |
| **Mobile interaction audit** | Currently interaction only runs on desktop viewport | Medium |
| **Diff threshold per page** | Some pages legitimately have more variance (e.g. blog listings) | Low |
| **Baseline age alert** | Warn if a baseline is older than 30 days | Low |

---

## 14. File Reference

| File | Purpose |
|---|---|
| `playwright.config.js` | Visual suite: browser/device projects, tolerances, reporter. Comment in/out devices here. |
| `playwright.interaction.config.js` | Interaction suite: 4-hour timeout, single chromium worker, Crawlee. |
| `endpoints.config.js` | Registry of all 67+ pages. Add pages here for visual tests. |
| `.env` | `BASE_URL` only. Not committed. |
| `tests/visual/visual.spec.js` | Visual test: for each endpoint, prepares page → stabilises → screenshots → diffs. |
| `tests/interaction/interaction.spec.js` | Interaction test: runs crawl, builds report with per-URL pass/fail and screenshots. |
| `utils/base-fixtures.js` | `preparePage` fixture (3-pass load) and `stabilizePage` fixture (5-phase volatility pipeline). |
| `utils/volatility-detector.js` | The 7 detection functions: `ensureFullPageLoad`, `waitForLayoutStability`, `dismissOverlays`, `behavioralVolatilityScan`, `hideWidgetsAndOverlays`, `freezeVolatileContent`, `detectMaskTargets`. |
| `utils/interaction-engine.js` | Full-site Crawlee crawler + all element health check functions + HEAD cache. |
| `golden-baselines/` | Reference screenshots committed to git. Organised by browser/device/folder/page. |
| `golden-baselines/LAST_UPDATED.json` | Tracks when each baseline was last captured, keyed by page ID and project name. |

---

*Document version: April 2026. Framework version: 1.0.0 on branch `uiAutomation`.*
