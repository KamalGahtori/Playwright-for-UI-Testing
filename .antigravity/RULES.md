# RULES.md — Playwright Visual Regression, Design Compliance & Content Verification Framework

> **Purpose**: This document defines the coding standards, naming conventions, and best practices for a Playwright-based testing framework with **three missions**:
>
> | Mission | What It Does | Runs Where | When to Run |
> |---|---|---|---|
> | **Visual Regression** | Compares live pages against "Gold Standard" baseline screenshots across 3 desktop browsers and 6 mobile/tablet devices. Catches unintended UI distortions caused by new changes. | **Local + CI** (GitHub Actions, daily) | After every code change / on daily CI schedule |
> | **Design Compliance** | Validates specific UI properties (fonts, colors, spacing, alignment) against a **Figma design**. Like manual Figma inspection but automated — e.g., "Is this heading red at 18px weight 700?" | **Local ONLY** | After a page is updated, before PR — to verify changes match Figma |
> | **Content Verification** | Validates page text/content against a **content document** (Google Doc or shared file). Ensures copy, headings, labels, and CTAs match the approved content. | **Local ONLY** | After content changes — to verify text matches the content doc |
>
> **Local-first approach**: Everything is designed to work locally first. Visual regression will also be CI-ready (GitHub Actions) so it can run daily to catch regressions, but the primary focus is a smooth local developer experience.

---

## 1. Project Structure

```
project-root/
│
│   ############################################################################
│   #  TESTS                                                                   #
│   #  All test files live here, categorized by mission type.                  #
│   #  No test files at the root of tests/.                                    #
│   #                                                                          #
│   #  IMPORTANT: Test files are NOT duplicated per browser or device.         #
│   #  ONE test file runs across ALL browsers/devices. Playwright's "projects" #
│   #  in the config handle the browser/device matrix automatically.           #
│   #  The same homepage.visual.spec.js runs on Chrome, Firefox, Safari,       #
│   #  iPhone, iPad, Galaxy — all via project configuration.                   #
│   ############################################################################
├── tests/
│   │
│   │   # ── Visual Regression Tests ──────────────────────────────────────
│   │   # Full-page & component screenshot comparisons.
│   │   # One file per ENDPOINT per DEVICE-CATEGORY.
│   │   # Each file covers ALL sections of that endpoint.
│   │   # Playwright projects decide which browser runs it.
│   ├── visual-regression/
│   │   ├── desktop/
│   │   │   ├── homepage.visual.spec.js       # All sections of homepage at desktop
│   │   │   ├── login.visual.spec.js
│   │   │   └── dashboard.visual.spec.js
│   │   ├── mobile/
│   │   │   ├── homepage.visual.spec.js       # Same endpoint, mobile layout
│   │   │   ├── login.visual.spec.js
│   │   │   └── dashboard.visual.spec.js
│   │   └── tablet/
│   │       ├── homepage.visual.spec.js       # Same endpoint, tablet layout
│   │       ├── login.visual.spec.js
│   │       └── dashboard.visual.spec.js
│   │
│   │   # ── Design Compliance Tests (LOCAL ONLY) ─────────────────────────
│   │   # Validates UI properties against Figma design tokens.
│   │   # One file per ENDPOINT — covers colors, fonts, spacing, alignment.
│   │   # These run LOCALLY ONLY after a page is updated to verify
│   │   # that changes match the Figma design.
│   ├── design-compliance/
│   │   ├── homepage.design.spec.js           # All design checks for /homepage
│   │   ├── login.design.spec.js
│   │   └── dashboard.design.spec.js
│   │
│   │   # ── Content Verification Tests (LOCAL ONLY) ──────────────────────
│   │   # Validates page text/content against the approved content document.
│   │   # One file per ENDPOINT — checks headings, body text, CTAs, labels.
│   │   # These run LOCALLY ONLY after content changes to verify text
│   │   # matches the Google Doc or shared content file.
│   ├── content-verification/
│   │   ├── homepage.content.spec.js          # All content checks for /homepage
│   │   ├── login.content.spec.js
│   │   └── dashboard.content.spec.js
│   │
│   │   # ── Shared Fixtures & Helpers ────────────────────────────────────
│   │   # Custom Playwright fixtures (e.g., waitForPageStable).
│   │   # Shared across all test types.
│   └── fixtures/
│       └── base-fixtures.js
│
│   ############################################################################
│   #  GOLDEN BASELINES                                                        #
│   #  Version-controlled reference screenshots (the "Gold Standard").         #
│   #                                                                          #
│   #  FOLDER HIERARCHY (not encoded in filename):                             #
│   #    browser → device → endpoint → section.png                             #
│   #                                                                          #
│   #  This keeps filenames SHORT and the structure NAVIGABLE.                 #
│   #  When a test runs under project "chromium-iphone-12-pro",               #
│   #  Playwright automatically looks in:                                      #
│   #    golden-baselines/chromium/iphone-12-pro/homepage/hero.png            #
│   ############################################################################
├── golden-baselines/
│   ├── chromium/
│   │   ├── desktop/
│   │   │   ├── homepage/
│   │   │   │   ├── hero.png                  # Just the section name — clean!
│   │   │   │   ├── navbar.png
│   │   │   │   └── footer.png
│   │   │   ├── login/
│   │   │   │   └── form.png
│   │   │   └── dashboard/
│   │   │       ├── widgets.png
│   │   │       └── sidebar.png
│   │   ├── iphone-6-7-8/
│   │   │   ├── homepage/
│   │   │   │   ├── hero.png
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── iphone-12-pro/
│   │   │   └── ...
│   │   ├── galaxy-s20-ultra/
│   │   │   └── ...
│   │   ├── ipad-air/
│   │   │   └── ...
│   │   ├── ipad-mini/
│   │   │   └── ...
│   │   └── ipad-pro/
│   │       └── ...
│   ├── firefox/
│   │   └── desktop/
│   │       ├── homepage/
│   │       │   ├── hero.png
│   │       │   └── ...
│   │       └── ...
│   └── webkit/
│       ├── desktop/
│       │   └── ...
│       ├── iphone-6-7-8/
│       │   └── ...
│       ├── iphone-12-pro/
│       │   └── ...
│       ├── galaxy-s20-ultra/
│       │   └── ...
│       ├── ipad-air/
│       │   └── ...
│       ├── ipad-mini/
│       │   └── ...
│       └── ipad-pro/
│           └── ...
│
│   ############################################################################
│   #  DESIGN SPECS                                                            #
│   #  Tokens extracted from Figma — the expected design values.               #
│   #  One file per ENDPOINT. Shared brand values in global.tokens.js.         #
│   #                                                                          #
│   #  HOW THIS WORKS:                                                         #
│   #  A QA engineer opens Figma, inspects a heading, and sees:               #
│   #    - Font: Inter, Weight: 700, Size: 48px, Color: #1A73E8               #
│   #  They record this in the endpoint's token file.                          #
│   #  The test then reads the LIVE page and compares against these values.   #
│   #  If they don't match, the test fails with a clear error message         #
│   #  showing EXPECTED vs ACTUAL — just like manual Figma inspection          #
│   #  but automated.                                                          #
│   ############################################################################
├── design-specs/
│   ├── tokens/
│   │   ├── global.tokens.js                  # Shared: brand colors, base fonts
│   │   ├── homepage.tokens.js                # Design tokens for /homepage
│   │   ├── login.tokens.js                   # Design tokens for /login
│   │   └── dashboard.tokens.js               # Design tokens for /dashboard
│   └── overrides/
│       └── homepage.mobile.tokens.js         # Mobile-specific overrides (if needed)
│
│   ############################################################################
│   #  CONTENT SPECS                                                           #
│   #  Expected text content for each endpoint — sourced from the approved     #
│   #  content document (Google Doc, shared file, etc.).                       #
│   #                                                                          #
│   #  HOW THIS WORKS:                                                         #
│   #  The content team provides approved copy in a Google Doc.               #
│   #  A QA engineer creates a content spec file with the expected text.      #
│   #  Tests read the LIVE page and verify every heading, paragraph,          #
│   #  CTA button label, and form label matches the approved content.         #
│   ############################################################################
├── content-specs/
│   ├── homepage.content.js                   # Expected text for /homepage
│   ├── login.content.js                      # Expected text for /login
│   └── dashboard.content.js                  # Expected text for /dashboard
│
│   ############################################################################
│   #  PAGE OBJECTS (created only when needed)                                 #
│   #  Encapsulate locators and reusable page actions.                        #
│   #  One per endpoint. Used by all three test types.                        #
│   #                                                                          #
│   #  CREATE a page object when:                                              #
│   #    - Multiple test files reference the same locators for one endpoint   #
│   #    - Complex navigation or setup is shared across tests                 #
│   #  DO NOT create one if:                                                   #
│   #    - Only one test file uses those locators                              #
│   #    - It would just be a thin wrapper adding no value                     #
│   ############################################################################
├── pages/
│   ├── BasePage.js                           # Shared: navigation, waitForStable
│   ├── HomePage.js                           # Locators & actions for /homepage
│   ├── LoginPage.js
│   └── DashboardPage.js
│
│   ############################################################################
│   #  UTILITIES                                                               #
│   #  Shared helper functions used across all test types.                    #
│   #  Each file has a single clear responsibility.                           #
│   #  All functions have JSDoc with @param, @returns, @example.             #
│   ############################################################################
├── utils/
│   ├── color-helpers.js                      # normalizeColor(), expectColorMatch()
│   ├── style-helpers.js                      # normalizeFontFamily(), parsePixelValue()
│   ├── alignment-helpers.js                  # horizontallyCentered(), verticallyAligned()
│   └── reporter-helpers.js                   # Timestamped report folder management
│
│   ############################################################################
│   #  REPORTS                                                                 #
│   #  HTML test reports, auto-generated per run.                             #
│   #  Each run creates a timestamped subfolder. Older runs are auto-deleted. #
│   #                                                                          #
│   #  HOW TO IDENTIFY BROWSER/DEVICE/ENDPOINT IN REPORTS:                    #
│   #  Playwright's HTML report groups results by PROJECT NAME.               #
│   #  Since projects are named "chromium-desktop", "webkit-iphone-12-pro",  #
│   #  etc., the report tree looks like:                                       #
│   #                                                                          #
│   #    ├── chromium-desktop                                                  #
│   #    │   ├── Visual Regression » Homepage » Desktop                       #
│   #    │   │   ├── ✅ hero section                                           #
│   #    │   │   └── ❌ footer section (diff: 2.3%)                            #
│   #    │   └── Visual Regression » Login » Desktop                          #
│   #    ├── webkit-iphone-12-pro                                              #
│   #    │   ├── Visual Regression » Homepage » Mobile                        #
│   #    │   │   └── ✅ hero section                                           #
│   #    │   └── ...                                                           #
│   #                                                                          #
│   #  You can FILTER by project in the HTML report's sidebar to see only     #
│   #  one browser/device at a time.                                           #
│   ############################################################################
├── reports/
│   └── 2026-04-09_13-30-00/                  # Auto-created: YYYY-MM-DD_HH-mm-ss
│       └── index.html
│
│   ############################################################################
│   #  CONFIGURATION & PROJECT FILES                                           #
│   ############################################################################
├── playwright.config.js                      # Fully commented — projects, viewports, thresholds
├── package.json                              # Scripts for every execution scenario
├── .env                                      # URLs, credentials, flags (NEVER committed)
├── .env.example                              # Template with placeholder values (committed)
├── .gitignore                                # Standard exclusions
├── README.md                                 # Complete setup & execution guide (see Section 13)
└── RULES.md                                  # This file — coding standards
```

### Rules

- **R-STRUCT-01**: Every test file MUST live under `tests/visual-regression/`, `tests/design-compliance/`, or `tests/content-verification/`. No test files at the root of `tests/`.
- **R-STRUCT-02**: Test files are **NOT duplicated per browser**. ONE test file runs across ALL browser/device combos via Playwright's project system. The same `homepage.visual.spec.js` runs on Chrome, Firefox, Safari, iPhone, Galaxy, iPad — the config handles the matrix.
- **R-STRUCT-03**: Golden baselines use a **folder hierarchy** `browser/device/endpoint/section.png` instead of encoding everything in the filename. Filenames stay short (e.g., `hero.png`), and the folder path provides the context.
- **R-STRUCT-04**: Design tokens are **manually extracted from Figma** — a QA engineer inspects the Figma design, records the expected values (font, color, size, weight, spacing), and saves them in the corresponding token file. Tests then compare the live page against these values.
- **R-STRUCT-05**: Content specs are **sourced from the approved content document** (Google Doc or shared file). A QA engineer copies the approved text into the content spec file. Tests verify the live page matches.
- **R-STRUCT-06**: Page Objects are created **only when they meaningfully reduce duplication**. If only one test file uses a set of locators, keep them in the test file. Don't create page objects just for the sake of having them.
- **R-STRUCT-07**: Every code file (config, utilities, fixtures, page objects, token files) MUST include **descriptive inline comments** explaining what each section does. A new team member should be able to read any file and understand it without external help.

---

## 2. Environment Configuration (.env)

### 2.1 The `.env` File

- **R-ENV-01**: All URLs, credentials, and environment-specific settings MUST be defined in `.env`. Tests and config reference these via `process.env`.

```bash
# .env — Environment Configuration
# ─────────────────────────────────────────────────────────────────────
# This file is NEVER committed to version control.
# Copy .env.example and fill in your values.
# ─────────────────────────────────────────────────────────────────────

# ── Base URL ──────────────────────────────────────────────────────────
# The root URL of the application under test.
BASE_URL=https://staging.example.com

# ── Authentication Credentials ────────────────────────────────────────
# Used by tests that require login before visual/design/content checks.
TEST_USERNAME=visual_tester@example.com
TEST_PASSWORD=s3cur3P@ssw0rd

# ── Endpoint Paths ────────────────────────────────────────────────────
# Defined here so tests NEVER hardcode URLs.
# Add new endpoints here as the app grows.
ENDPOINT_HOME=/
ENDPOINT_LOGIN=/login
ENDPOINT_DASHBOARD=/dashboard
ENDPOINT_SETTINGS=/settings

# ── Execution Control ────────────────────────────────────────────────
# Override which projects to run (comma-separated).
# Leave empty to run all projects in playwright.config.js.
# Examples: "chromium-desktop", "webkit-iphone-12-pro,firefox-desktop"
RUN_PROJECTS=

# ── Report Settings ──────────────────────────────────────────────────
# Directory where HTML reports are saved.
REPORT_DIR=./reports
```

- **R-ENV-02**: A `.env.example` MUST be committed showing all required variables with placeholder values and descriptive comments.
- **R-ENV-03**: `.env` MUST be in `.gitignore`. Credentials MUST never be committed.

---

## 3. Content Specs (Content Verification Source)

- **R-CONTENT-01**: Expected page content MUST be defined in `content-specs/` — one file per endpoint:

```js
// content-specs/homepage.content.js
// ─────────────────────────────────────────────────────────────────────
// Expected text content for the Homepage (/)
//
// SOURCE: Content approval document
//   → Google Doc: https://docs.google.com/document/d/xxxxx
//   → Last synced: 2026-04-09
//   → Approved by: Content Team
//
// HOW TO UPDATE:
//   1. Get the latest approved content from the Google Doc.
//   2. Update the values below to match.
//   3. Run: npm run test:content:homepage
//   4. Fix any mismatches in the live page or update this file.
// ─────────────────────────────────────────────────────────────────────

module.exports = {
  hero: {
    // ── Main Heading ─────────────────────────────────────────
    heading: 'Build Something Amazing Today',
    // ── Subtitle / Subheading ────────────────────────────────
    subtitle: 'The fastest way to ship modern web applications.',
    // ── Call-to-Action Button ────────────────────────────────
    ctaButtonText: 'Get Started Free',
    // ── Secondary Link ───────────────────────────────────────
    secondaryLinkText: 'View Documentation',
  },
  navbar: {
    // ── Navigation Links ─────────────────────────────────────
    // Order matters — tests verify sequence too.
    links: ['Products', 'Solutions', 'Pricing', 'Resources', 'Company'],
    // ── Logo Alt Text ────────────────────────────────────────
    logoAltText: 'Acme Corp Logo',
  },
  footer: {
    // ── Copyright ────────────────────────────────────────────
    copyright: '© 2026 Acme Corp. All rights reserved.',
    // ── Footer Links ─────────────────────────────────────────
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Settings'],
  },
};
```

- **R-CONTENT-02**: Each content spec file MUST include a comment linking to the **source document** (Google Doc URL, shared file path, etc.) and the date it was last synced.
- **R-CONTENT-03**: Content verification tests compare the live page text against these spec files. Any mismatch produces a clear error: `Expected heading text "Build Something Amazing Today" but found "Build Something Amazing"`.
- **R-CONTENT-04**: Tests MUST verify text **exactly** (case-sensitive) unless a `{ ignoreCase: true }` option is explicitly set with a comment explaining why.

---

## 4. Naming Conventions

### 4.1 Test Files

> **Key principle**: Test files are **NOT** duplicated per browser. ONE file runs across all browsers/devices via Playwright projects. Files are split only by **device category** (desktop/mobile/tablet) for visual regression because layouts differ, and by **endpoint** for design compliance and content verification.

| Test Type              | Pattern                                   | Example                           | Why Split This Way |
| ---------------------- | ----------------------------------------- | --------------------------------- | ---|
| Visual Regression      | `<endpoint>.visual.spec.js`               | `homepage.visual.spec.js`         | One per endpoint per device folder — layout differs by device category |
| Design Compliance      | `<endpoint>.design.spec.js`               | `homepage.design.spec.js`         | One per endpoint — same properties checked regardless of browser |
| Content Verification   | `<endpoint>.content.spec.js`              | `homepage.content.spec.js`        | One per endpoint — text is the same across browsers |

- **R-NAME-01**: File names MUST use `kebab-case`.
- **R-NAME-02**: Visual regression files live inside `desktop/`, `mobile/`, or `tablet/` folders — the folder provides the device category context, not the filename.
- **R-NAME-03**: Design compliance and content verification files are NOT split by device/browser. If a device-specific design override exists, the test reads the correct token file based on the active Playwright project at runtime.

### 4.2 Test Structure (`test.describe` / `test` / `test.step`)

```js
// ─────────────────────────────────────────────────────────────────────
// VISUAL REGRESSION — tests/visual-regression/desktop/homepage.visual.spec.js
// ─────────────────────────────────────────────────────────────────────
// The DESCRIBE block covers the ENTIRE ENDPOINT for a given category.
// Each TEST block covers ONE SECTION of that page.
// Each TEST.STEP within a test provides granular failure diagnosis.
// ─────────────────────────────────────────────────────────────────────

// Design Spec: https://figma.com/file/xxxx/Homepage
test.describe('Visual Regression » Homepage » Desktop', () => {

  // ── Section: Hero ────────────────────────────────────────────────
  test('should match Gold Standard for the hero section', async ({ page }) => {

    await test.step('Navigate to homepage', async () => {
      // Navigate using URL from .env — never hardcode.
      await page.goto(process.env.BASE_URL + process.env.ENDPOINT_HOME);
    });

    await test.step('Wait for page to fully stabilize', async () => {
      // Uses shared fixture to wait for network idle + animations complete.
      await homePage.waitForStable();
    });

    await test.step('Compare hero screenshot against golden baseline', async () => {
      // Playwright resolves the correct baseline based on the active project:
      // e.g., golden-baselines/chromium/desktop/homepage/hero.png
      await expect(page.getByRole('banner')).toHaveScreenshot('hero.png');
    });
  });

  // ── Section: Footer ──────────────────────────────────────────────
  test('should match Gold Standard for the footer section', async ({ page }) => {
    await test.step('Navigate to homepage', async () => { /* ... */ });
    await test.step('Scroll to footer', async () => { /* ... */ });
    await test.step('Compare footer screenshot against golden baseline', async () => {
      await expect(page.getByRole('contentinfo')).toHaveScreenshot('footer.png');
    });
  });

});

// ─────────────────────────────────────────────────────────────────────
// DESIGN COMPLIANCE — tests/design-compliance/homepage.design.spec.js
// (LOCAL ONLY — run after page updates to verify Figma match)
// ─────────────────────────────────────────────────────────────────────

// Design Spec: https://figma.com/file/xxxx/Homepage?node-id=12:345
// This test verifies that the LIVE UI matches the FIGMA design.
// Like manual Figma inspection, but automated.
test.describe('Design Compliance » Homepage', () => {

  // ── Section: Hero ────────────────────────────────────────────────
  test('Hero section should match Figma design', async ({ page }) => {

    await test.step('Verify heading font-family is Inter at 700 weight', async () => {
      // Expected from Figma: Inter, Bold (700), 48px, #1A73E8
      const styles = await headingEl.evaluate(/* getComputedStyle */);
      expect(normalizeFontFamily(styles.fontFamily)).toBe(tokens.hero.heading.fontFamily);
    });

    await test.step('Verify heading color matches Figma primary color', async () => {
      expect(normalizeColor(styles.color)).toBe(normalizeColor(tokens.hero.heading.color.hex));
    });

    await test.step('Verify hero section top padding is 64px', async () => {
      expect(parsePixelValue(styles.paddingTop)).toBeCloseTo(64, 0);
    });
  });

  // ── Section: Navbar ──────────────────────────────────────────────
  test('Navbar should match Figma design', async ({ page }) => {
    // ... steps for navbar typography, colors, spacing, alignment ...
  });

});

// ─────────────────────────────────────────────────────────────────────
// CONTENT VERIFICATION — tests/content-verification/homepage.content.spec.js
// (LOCAL ONLY — run after content changes to verify Google Doc match)
// ─────────────────────────────────────────────────────────────────────

// Content Source: https://docs.google.com/document/d/xxxxx
// This test verifies that the LIVE page text matches the APPROVED content.
test.describe('Content Verification » Homepage', () => {

  // ── Section: Hero ────────────────────────────────────────────────
  test('Hero section content should match approved content doc', async ({ page }) => {

    await test.step('Verify main heading text', async () => {
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toHaveText(contentSpec.hero.heading);
    });

    await test.step('Verify subtitle text', async () => {
      await expect(page.getByText(contentSpec.hero.subtitle)).toBeVisible();
    });

    await test.step('Verify CTA button label', async () => {
      const cta = page.getByRole('link', { name: contentSpec.hero.ctaButtonText });
      await expect(cta).toBeVisible();
    });
  });

  // ── Section: Navbar ──────────────────────────────────────────────
  test('Navbar content should match approved content doc', async ({ page }) => {
    await test.step('Verify all navigation links are present in correct order', async () => {
      // ... verify each link text matches contentSpec.navbar.links[] ...
    });
  });
});
```

- **R-NAME-04**: `test.describe` blocks use format: `<Category> » <Endpoint>` or `<Category> » <Endpoint> » <Device Category>` with ` » ` (guillemet) separator.
- **R-NAME-05**: Each `test` block covers **one section** of the endpoint (hero, navbar, footer, etc.) and begins with the section name.
- **R-NAME-06**: **`test.step()` is MANDATORY** inside every test. Steps make failure analysis easy — you instantly see which step failed in the HTML report without reading code.
- **R-NAME-07**: When steps are **dependent** (e.g., login → navigate → screenshot), use `test.describe.serial` so tests run in order and stop on first failure:

```js
// ── Use serial when later tests depend on earlier test state ────────
test.describe.serial('Visual Regression » Dashboard » Desktop (Authenticated)', () => {
  test('should login successfully', async ({ page }) => { /* ... */ });
  test('should match Gold Standard for the dashboard widgets', async ({ page }) => { /* ... */ });
});
```

### 4.3 Golden Baseline Files

- **R-NAME-08**: Baselines use **folder hierarchy** for context, keeping filenames short:

```
golden-baselines/<browser>/<device>/<endpoint>/<section>.png

Examples:
  golden-baselines/chromium/desktop/homepage/hero.png
  golden-baselines/webkit/iphone-12-pro/homepage/hero.png
  golden-baselines/firefox/desktop/login/form.png
```

- **R-NAME-09**: Section filenames MUST be concise and descriptive: `hero.png`, `navbar.png`, `footer.png`, `form.png`, `sidebar.png`.

---

## 5. Cross-Browser & Cross-Device Configuration

### 5.1 Supported Browsers & Devices

The framework defines **15 Playwright projects** — each a unique browser + device combination:

#### Desktop Browsers (all at 1280×720)

| Project Name          | Browser Engine | Viewport         |
| --------------------- | -------------- | ---------------- |
| `chromium-desktop`    | Chromium       | 1280 × 720       |
| `firefox-desktop`     | Firefox        | 1280 × 720       |
| `webkit-desktop`      | WebKit         | 1280 × 720       |

#### Mobile Devices

| Project Name                  | Browser Engine | Device Emulation           | Viewport       |
| ----------------------------- | -------------- | -------------------------- | -------------- |
| `chromium-iphone-6-7-8`      | Chromium       | iPhone 6/7/8               | 375 × 667      |
| `chromium-iphone-12-pro`     | Chromium       | iPhone 12 Pro              | 390 × 844      |
| `chromium-galaxy-s20-ultra`  | Chromium       | Samsung Galaxy S20 Ultra   | 412 × 915      |
| `webkit-iphone-6-7-8`        | WebKit         | iPhone 6/7/8               | 375 × 667      |
| `webkit-iphone-12-pro`       | WebKit         | iPhone 12 Pro              | 390 × 844      |
| `webkit-galaxy-s20-ultra`    | WebKit         | Samsung Galaxy S20 Ultra   | 412 × 915      |

#### Tablet Devices

| Project Name              | Browser Engine | Device Emulation | Viewport       |
| ------------------------- | -------------- | ---------------- | -------------- |
| `chromium-ipad-air`       | Chromium       | iPad Air         | 820 × 1180     |
| `chromium-ipad-mini`      | Chromium       | iPad Mini        | 768 × 1024     |
| `chromium-ipad-pro`       | Chromium       | iPad Pro 11"     | 834 × 1194     |
| `webkit-ipad-air`         | WebKit         | iPad Air         | 820 × 1180     |
| `webkit-ipad-mini`        | WebKit         | iPad Mini        | 768 × 1024     |
| `webkit-ipad-pro`         | WebKit         | iPad Pro 11"     | 834 × 1194     |

### 5.2 Configuration Rules

- **R-CROSS-01**: `playwright.config.js` MUST define a separate **project** for each of the 15 combinations above.
- **R-CROSS-02**: Viewport/device dimensions MUST use Playwright's built-in `devices` descriptors or named constants. Magic numbers in test files are **forbidden**.
- **R-CROSS-03**: Each project generates its **own** golden baselines in `golden-baselines/<browser>/<device>/`. The folder structure enforces separation automatically.
- **R-CROSS-04**: The **snapshot directory** per project MUST be configured so Playwright resolves the correct baseline folder based on the active project. This is set in `playwright.config.js`:

```js
// ── Each project gets its own snapshot subdirectory ─────────────────
// This ensures chromium-desktop uses golden-baselines/chromium/desktop/
// and webkit-iphone-12-pro uses golden-baselines/webkit/iphone-12-pro/
{
  name: 'chromium-desktop',
  use: {
    browserName: 'chromium',
    viewport: DESKTOP_VIEWPORT,
  },
  snapshotPathTemplate: '{snapshotDir}/chromium/desktop/{testFilePath}/{arg}{ext}',
},
```

### 5.3 Font Rendering Thresholds

- **R-CROSS-05**: `maxDiffPixelRatio` thresholds per device category:
  - Desktop: `0.01` (1%)
  - Mobile: `0.02` (2%)
  - Tablet: `0.015` (1.5%)
- **R-CROSS-06**: Thresholds set per-project in config. Inline overrides only with `// THRESHOLD-OVERRIDE: <reason>` comment.

### 5.4 Animation & Dynamic Content

- **R-CROSS-07**: Before screenshots, use the shared `waitForPageStable()` fixture (network idle + animations complete + fonts loaded).
- **R-CROSS-08**: Dynamic content MUST be masked:

```js
// ── Mask dynamic elements before screenshot ─────────────────────────
await expect(page).toHaveScreenshot('hero.png', {
  mask: [
    page.getByTestId('live-timestamp'),    // Dynamic clock
    page.getByRole('region', { name: 'Advertisements' }),  // Ad slots
  ],
});
```

---

## 6. Strict Use of User-Facing Locators

### 6.1 Locator Priority (Mandatory Order)

| Priority | Locator Type               | Example                                       | When to Use                    |
| -------- | -------------------------- | --------------------------------------------- | ------------------------------ |
| 1        | `getByRole()`              | `page.getByRole('button', { name: 'Submit' })`| Always prefer. Semantic & accessible. |
| 2        | `getByText()`              | `page.getByText('Welcome back')`              | Visible text with no semantic role.   |
| 3        | `getByLabel()`             | `page.getByLabel('Email address')`            | Form inputs with labels.              |
| 4        | `getByPlaceholder()`       | `page.getByPlaceholder('Search...')`          | Inputs without visible labels.        |
| 5        | `getByAltText()`           | `page.getByAltText('Company logo')`           | Images.                               |
| 6        | `getByTitle()`             | `page.getByTitle('Close dialog')`             | Elements with title attributes.       |
| 7        | `getByTestId()`            | `page.getByTestId('nav-menu')`                | **Last resort** for complex components.|

### 6.2 Forbidden Locators

- **R-LOC-01**: `page.locator('div.classname')`, `page.$()`, `page.$$()`, XPath, and CSS-class-based selectors are **FORBIDDEN** in tests. Brittle and not user-facing.
- **R-LOC-02**: `getByTestId()` requires the `data-testid` attribute to already exist in the application source. Advocate for semantic HTML.
- **R-LOC-03**: Every locator MUST survive cosmetic UI refactors. If renaming a CSS class breaks it, the locator is wrong.

### 6.3 Documentation

- **R-LOC-04**: When `getByTestId()` is used, include a comment explaining why higher-priority locators don't work:

```js
// getByTestId required: this wrapper div has no semantic role, text, or label.
const chartContainer = page.getByTestId('revenue-chart');
```

### 6.4 Page Object Encapsulation

- **R-LOC-05**: When a Page Object exists for an endpoint, locators MUST be defined there. Tests call Page Object methods — they don't construct locators inline.
- **R-LOC-06**: Design compliance tests needing `getComputedStyle()` MAY use scoped locators inside `element.evaluate()`. The top-level locator MUST still follow priority order.

---

## 7. Golden Baseline Image Management

### 7.1 Baseline Organization

- **R-GOLD-01**: Baselines use folder hierarchy: `golden-baselines/<browser>/<device>/<endpoint>/<section>.png`.
- **R-GOLD-02**: Each Playwright project resolves its own baseline directory automatically. A `chromium-desktop` test compares against `golden-baselines/chromium/desktop/...`. Cross-project baseline sharing is **forbidden**.

### 7.2 Creation & Approval Workflow (PR Guide)

- **R-GOLD-03**: Baselines are committed via a **dedicated PR**. Here is the step-by-step workflow:

> **How to Create/Update Golden Baselines**
>
> 1. **Branch**: Create `chore/baselines-<reason>` (e.g., `chore/baselines-homepage-redesign`).
> 2. **Generate**: Run `npm run update:baselines` to regenerate all baselines, or target a specific project: `npm run update:baselines:chrome:desktop`.
> 3. **Review locally**: Run `npm run report` to open the HTML report. Visually inspect every changed baseline.
> 4. **Commit**: Commit **only** files in `golden-baselines/`. Do NOT mix with feature code.
> 5. **PR Title**: `chore(baselines): update golden baselines for <reason>`
> 6. **PR Description MUST include**:
>    - **Why** baselines changed (e.g., "Homepage hero redesign per Figma v3.2")
>    - **Visual diff screenshots** — paste expected vs. actual vs. diff from the report
>    - **Which projects/devices** were affected
> 7. **Review**: At least one team member visually reviews diff images before approving.
> 8. **Merge**: Squash-merge into main.
>
> **Reviewing a baselines PR:**
> - Check that only `golden-baselines/` files are modified.
> - Verify the visual diffs look intentional (not accidental regressions).
> - Ensure the MANIFEST.md is updated.

- **R-GOLD-04**: Baselines MUST NOT be committed alongside feature code. Always a separate PR.

### 7.3 Version Control

- **R-GOLD-05**: Use [Git LFS](https://git-lfs.github.com/) if total baseline images exceed 50 MB:

```gitattributes
golden-baselines/**/*.png filter=lfs diff=lfs merge=lfs -text
```

- **R-GOLD-06**: `test-results/`, `reports/`, `node_modules/` are in `.gitignore`. Only `golden-baselines/` is committed.

### 7.4 Staleness & Manifest

- **R-GOLD-07**: Track baselines in `golden-baselines/MANIFEST.md`:

```markdown
# Golden Baselines Manifest

| Endpoint   | Section | Browser  | Device         | Captured On | App Version |
| ---------- | ------- | -------- | -------------- | ----------- | ----------- |
| homepage   | hero    | chromium | desktop        | 2026-04-09  | v2.4.1      |
| homepage   | hero    | webkit   | iphone-12-pro  | 2026-04-09  | v2.4.1      |
| login      | form    | firefox  | desktop        | 2026-04-09  | v2.4.1      |
```

- **R-GOLD-08**: Baselines older than **90 days** MUST be flagged for review.

---

## 8. Design Compliance: Style Assertion Standards

> **Reminder**: Design compliance tests run **LOCAL ONLY**. They automate what a QA engineer does manually when comparing the live page to Figma.

### 8.1 Design Tokens from Figma

- **R-STYLE-01**: Design tokens are **manually extracted from Figma** by the QA engineer:
  1. Open the Figma design for the endpoint.
  2. Inspect each element's properties (font, color, size, weight, spacing, alignment).
  3. Record these values in `design-specs/tokens/<endpoint>.tokens.js`.
  4. Shared/brand values go in `global.tokens.js`.

- **R-STYLE-02**: Tests import from the endpoint's token file. Hardcoded values in test files are **non-compliant**.
- **R-STYLE-03**: If an endpoint renders differently on mobile (e.g., heading is 32px instead of 48px), create a device override in `design-specs/overrides/`. The test fixture loads the correct tokens based on the active Playwright project at runtime.

### 8.2 Color Comparison: Hex vs. RGB

Browsers return `rgb()` or `rgba()`, never hex — this is the **#1 source of false failures**.

- **R-STYLE-04**: `normalizeColor()` in `utils/color-helpers.js` converts any format (hex, rgb, rgba, hsl) to canonical `rgb(r, g, b)`.
- **R-STYLE-05**: All color assertions MUST use `normalizeColor()`:

```js
// ── WRONG — hex vs rgb comparison will ALWAYS fail ──────────────────
expect(computedColor).toBe('#1A73E8');

// ── CORRECT — normalize both sides ──────────────────────────────────
expect(normalizeColor(computedColor)).toBe(normalizeColor(tokens.hero.heading.color.hex));
```

- **R-STYLE-06**: Optional tolerance for anti-aliasing (document with comment when used):

```js
// Tolerance of 2: sub-pixel blending shifts blue channel by ±1 on retina.
expectColorMatch(computedColor, tokens.hero.heading.color.hex, { tolerance: 2 });
```

### 8.3 Computed Style Extraction

- **R-STYLE-07**: Styles MUST be extracted via `element.evaluate()` + `getComputedStyle()`:

```js
// ── Extract computed styles from a LIVE DOM element ─────────────────
const styles = await element.evaluate((el) => {
  const cs = window.getComputedStyle(el);
  return {
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    color: cs.color,
    marginTop: cs.marginTop,
    paddingLeft: cs.paddingLeft,
  };
});
```

- **R-STYLE-08**: Use `normalizeFontFamily()` for font assertions — browsers quote font names inconsistently.

### 8.4 Spacing & Alignment

- **R-STYLE-09**: Compare computed pixel values as **numbers** (`'16px'` → `16`).
- **R-STYLE-10**: Alignment checks use `element.boundingBox()` for position-based verification.
- **R-STYLE-11**: `assertAlignment()` utility supports: `horizontallyCentered()`, `verticallyAligned()`, `evenlySpaced()`.
- **R-STYLE-12**: All spacing/alignment assertions accept `tolerancePx` (default: `2`).

### 8.5 Failure Messages

- **R-STYLE-13**: On failure, messages MUST show expected vs. actual with context:

```
✗ Design Compliance » Homepage » Hero section
  Step: "Verify heading font-family is Inter at 700 weight"
  Expected font-family "Inter, sans-serif" for [role="heading"][name="Build Something Amazing"]
  but found "Roboto, sans-serif".

✗ Design Compliance » Homepage » Hero section
  Step: "Verify heading color matches Figma primary color"
  Expected color rgb(26, 115, 232) for [role="heading"][name="Build Something Amazing"]
  but found rgb(32, 33, 36).
```

---

## 9. Content Verification Standards

> **Reminder**: Content verification tests run **LOCAL ONLY**. They verify page text matches the approved content document.

- **R-CONTENT-05**: Content tests use `toHaveText()`, `toContainText()`, and `toBeVisible()` with text from `content-specs/`.
- **R-CONTENT-06**: Test exact text by default. Use `{ ignoreCase: true }` or `toContainText()` only with an explaining comment.
- **R-CONTENT-07**: Verify content **order** when sequence matters (e.g., navigation links).
- **R-CONTENT-08**: On failure, show expected vs. actual text:

```
✗ Content Verification » Homepage » Hero section
  Step: "Verify main heading text"
  Expected text: "Build Something Amazing Today"
  Actual text:   "Build Something Amazing"
  Element: [role="heading"][level=1]
```

---

## 10. Test Isolation & Reliability

- **R-REL-01**: Each test is fully independent unless wrapped in `test.describe.serial`.
- **R-REL-02**: No `page.waitForTimeout()` with arbitrary durations. Use `waitForLoadState()`, `expect().toBeVisible()`, or `waitForPageStable()`.
- **R-REL-03**: Flaky tests (>5% failure rate) go in `tests/quarantine/` with a linked issue.

---

## 11. Reporting

### 11.1 HTML Reporter with Timestamped Results

- **R-REPORT-01**: Use Playwright's **HTML reporter**. Reports save to `reports/<YYYY-MM-DD_HH-mm-ss>/`.
- **R-REPORT-02**: **Before each run**, the `pretest` script deletes all previous report folders. Only the latest run is kept.
- **R-REPORT-03**: The HTML report groups results by **project name** (`chromium-desktop`, `webkit-iphone-12-pro`, etc.), then by test describe block, then by test. This answers "which browser/device/endpoint?" at a glance.

```
HTML Report Tree:
├── chromium-desktop
│   ├── Visual Regression » Homepage » Desktop
│   │   ├── ✅ hero section (3 steps)
│   │   └── ❌ footer section — diff: 2.3% (3 steps)
│   └── Visual Regression » Login » Desktop
│       └── ✅ form section
├── webkit-iphone-12-pro
│   ├── Visual Regression » Homepage » Mobile
│   │   └── ✅ hero section
│   └── ...
├── Design Compliance » Homepage (local only)
│   ├── ✅ Hero section should match Figma design (4 steps)
│   └── ❌ Navbar should match Figma design — font mismatch (3 steps)
└── Content Verification » Homepage (local only)
    ├── ✅ Hero section content (3 steps)
    └── ✅ Navbar content (1 step)
```

- **R-REPORT-04**: On visual regression failure, three artifacts are produced: **expected** (golden), **actual** (current), and **diff** images.
- **R-REPORT-05**: `npm run report` opens the latest HTML report.

---

## 12. Package.json Scripts

- **R-SCRIPT-01**: `package.json` MUST provide comprehensive scripts for every scenario:

```jsonc
{
  "scripts": {
    // ── CLEAN ────────────────────────────────────────────────────────
    // Deletes ALL previous report folders before a new run.
    "pretest": "node utils/reporter-helpers.js clean",

    // ── RUN ALL ──────────────────────────────────────────────────────
    // Run ALL tests (visual + design + content) across ALL projects.
    "test": "npx playwright test",

    // ── RUN BY TEST TYPE ─────────────────────────────────────────────
    "test:visual": "npx playwright test tests/visual-regression/",
    "test:design": "npx playwright test tests/design-compliance/",
    "test:content": "npx playwright test tests/content-verification/",

    // ── RUN BY BROWSER (visual regression only) ──────────────────────
    "test:chrome": "npx playwright test --project='chromium-*'",
    "test:firefox": "npx playwright test --project='firefox-*'",
    "test:safari": "npx playwright test --project='webkit-*'",

    // ── RUN BY DEVICE CATEGORY ───────────────────────────────────────
    "test:desktop": "npx playwright test --project='*-desktop'",
    "test:mobile": "npx playwright test --project='*-iphone-*' --project='*-galaxy-*'",
    "test:tablet": "npx playwright test --project='*-ipad-*'",

    // ── RUN BY SPECIFIC DEVICE ───────────────────────────────────────
    "test:iphone678": "npx playwright test --project='*-iphone-6-7-8'",
    "test:iphone12": "npx playwright test --project='*-iphone-12-pro'",
    "test:galaxy": "npx playwright test --project='*-galaxy-s20-ultra'",
    "test:ipad-air": "npx playwright test --project='*-ipad-air'",
    "test:ipad-mini": "npx playwright test --project='*-ipad-mini'",
    "test:ipad-pro": "npx playwright test --project='*-ipad-pro'",

    // ── RUN BY ENDPOINT ──────────────────────────────────────────────
    // Targets a specific page across all types and projects.
    "test:homepage": "npx playwright test --grep 'Homepage'",
    "test:login": "npx playwright test --grep 'Login'",
    "test:dashboard": "npx playwright test --grep 'Dashboard'",

    // ── COMBINED FILTERS ─────────────────────────────────────────────
    "test:visual:chrome:desktop": "npx playwright test tests/visual-regression/ --project='chromium-desktop'",
    "test:design:homepage": "npx playwright test tests/design-compliance/homepage.design.spec.js",
    "test:content:homepage": "npx playwright test tests/content-verification/homepage.content.spec.js",

    // ── GOLDEN BASELINES ─────────────────────────────────────────────
    "update:baselines": "npx playwright test tests/visual-regression/ --update-snapshots",
    "update:baselines:chrome:desktop": "npx playwright test tests/visual-regression/ --update-snapshots --project='chromium-desktop'",
    "update:baselines:safari:mobile": "npx playwright test tests/visual-regression/ --update-snapshots --project='webkit-iphone-*'",

    // ── REPORTS ──────────────────────────────────────────────────────
    "report": "npx playwright show-report reports/$(ls -t reports | head -1)",

    // ── DEBUGGING ────────────────────────────────────────────────────
    "test:ui": "npx playwright test --ui",
    "test:headed": "npx playwright test --headed",
    "test:debug": "npx playwright test --debug"
  }
}
```

- **R-SCRIPT-02**: All URLs come from `process.env`. Scripts never hardcode URLs.

---

## 13. Configuration Standards (playwright.config.js)

- **R-CFG-01**: `playwright.config.js` MUST be **fully commented**. Key settings:

```js
// playwright.config.js
// ─────────────────────────────────────────────────────────────────────
// Playwright Configuration
// Visual Regression, Design Compliance & Content Verification Framework
//
// This file defines:
//   1. All 15 browser-device project combinations
//   2. Viewport sizes and device emulations
//   3. Screenshot comparison thresholds per device category
//   4. Report output (HTML, timestamped folders)
//   5. Retry, parallelism, and trace settings
//   6. Environment variable loading from .env
// ─────────────────────────────────────────────────────────────────────

require('dotenv').config(); // Load .env variables into process.env

const { defineConfig, devices } = require('@playwright/test');

// ── Viewport Constants ──────────────────────────────────────────────
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

module.exports = defineConfig({
  testDir: './tests',
  snapshotDir: './golden-baselines',
  retries: 0,             // 0 locally, set to 1+ in CI via env var
  workers: 2,
  timeout: 30000,

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  // ... 15 projects (see Section 5.1) ...
});
```

- **R-CFG-02**: Browser versions pinned via `@playwright/test` version in `package.json`.
- **R-CFG-03**: `dotenv` loads `.env` at config time.
- **R-CFG-04**: CI overrides (retries, workers) MUST use environment variables, not separate config files.

---

## 14. .gitignore

- **R-GIT-01**: The project MUST include:

```gitignore
# ── Dependencies ──────────────────────────────────────────────────────
node_modules/

# ── Playwright Artifacts (generated per run) ──────────────────────────
test-results/

# ── Reports (generated per run, only latest kept locally) ─────────────
reports/

# ── Environment Secrets ───────────────────────────────────────────────
.env

# ── OS / Editor Files ────────────────────────────────────────────────
.DS_Store
Thumbs.db
.vscode/
.idea/

# ── Playwright Browser Cache ─────────────────────────────────────────
playwright/.cache/

# ── Temporary / Log Files ────────────────────────────────────────────
*.tmp
*.log
```

---

## 15. README.md Requirements

- **R-README-01**: `README.md` MUST enable any developer to set up, understand, and run the framework locally without external help. **Required sections**:

1. **Project Overview** — What this framework does (3 missions: visual regression, design compliance, content verification).
2. **Prerequisites** — Node.js version, npm, Git, Git LFS (if applicable).
3. **Quick Start** — Clone, install, copy `.env.example` → `.env`, install Playwright browsers, run first test. Copy-paste commands.
4. **Environment Setup** — Every `.env` variable explained with examples.
5. **Project Architecture** — Annotated directory tree (reference RULES.md Section 1).
6. **Supported Browsers & Devices** — Full 15-project matrix table.
7. **How to Run Tests** — Every `npm run` command with description and sample output.
8. **How to Read Reports** — Where reports are saved, how to open, how to filter by browser/device, how to interpret visual diffs.
9. **Golden Baseline Workflow** — Step-by-step PR guide (reference Section 7.2).
10. **Design Tokens from Figma** — How to extract values from Figma and add to token files.
11. **Content Specs from Content Docs** — How to sync content from Google Docs to content spec files.
12. **Adding a New Endpoint** — Checklist: create token file, content spec, visual tests, design tests, content tests, page object (if needed).
13. **Troubleshooting** — Common issues (font rendering diffs, timeout, hex vs. rgb, flaky tests) with solutions.
14. **Coding Standards** — Link to RULES.md.

---

## 16. Code Quality & Review Standards

- **R-QUAL-01**: All utility functions MUST have JSDoc with `@param`, `@returns`, `@example`.
- **R-QUAL-02**: Every `test.describe` MUST start with a comment linking to the Figma design or content doc:

```js
// Design Spec: https://figma.com/file/xxxx/Homepage?node-id=12:345
// Content Doc: https://docs.google.com/document/d/xxxxx
// Covers: Hero section — typography, colors, spacing, alignment, and content
test.describe('Design Compliance » Homepage', () => { /* ... */ });
```

- **R-QUAL-03**: PR reviews MUST verify:
  1. Locators follow priority order (Section 6).
  2. No hardcoded design values or text strings (Sections 8, 9).
  3. Color comparisons use `normalizeColor()`.
  4. `test.step()` is used in every test.
  5. Baseline changes have visual diff evidence.
  6. All code has descriptive comments.

---

## Quick Reference: Rule Index

| Rule ID          | Summary                                                         |
| ---------------- | --------------------------------------------------------------- |
| R-STRUCT-01–07   | Project structure, file organization, comments                  |
| R-ENV-01–03      | .env for URLs/credentials, .env.example committed               |
| R-CONTENT-01–08  | Content specs from Google Docs, exact text matching              |
| R-NAME-01–09     | File naming, test.step, serial, baseline folder hierarchy       |
| R-CROSS-01–08    | 15 browser-device projects, thresholds, stability, masking      |
| R-LOC-01–06      | User-facing locator priority, page objects, forbidden selectors |
| R-GOLD-01–08     | Baseline folders, PR workflow, LFS, manifest, staleness         |
| R-STYLE-01–13    | Figma tokens, normalizeColor, spacing, failure messages         |
| R-REL-01–03      | Test isolation, no arbitrary waits, flaky quarantine            |
| R-REPORT-01–05   | HTML reporter, timestamped folders, project-grouped results     |
| R-SCRIPT-01–02   | Comprehensive npm scripts for every scenario                    |
| R-CFG-01–04      | Fully commented config, dotenv, pinned versions, CI overrides   |
| R-GIT-01         | .gitignore for reports, .env, node_modules                      |
| R-README-01      | README with 14 mandatory sections for complete onboarding       |
| R-QUAL-01–03     | JSDoc, Figma/content doc links, PR review checklist             |

---

*Last updated: 2026-04-09*
*Framework: Playwright + JavaScript*
*Maintainer: Lead Architect*
