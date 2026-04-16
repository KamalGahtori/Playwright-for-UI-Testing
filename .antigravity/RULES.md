# Architectural Laws of Visual Regression ⚖️

This document defines the strict, non-negotiable standards for this repository. All new code, endpoint registrations, and configuration changes must align with these laws.

## 1. The 9-Project Core Matrix
Testing is unified across 9 projects to balance speed and coverage:
- **3 Desktop**: Chromium, Firefox, and WebKit (Safari).
- **3 Mobile**: iPhone 8, iPhone 12 Pro, and Galaxy S20 Ultra (Chromium Emulation).
- **3 Tablet**: iPad Air, iPad Mini, and iPad Pro (Chromium Emulation).

> [!NOTE]
> WebKit/Safari is restricted to Desktop only. Mobile/Tablet rendering risks are sufficiently covered by Chromium emulation.

## 2. Strict Naming Conventions
To maintain a professional and searchable codebase, use these formats:
- **Files**: `kebab-case.js` (e.g., `visual.spec.js`).
- **Variables & Functions**: `camelCase` (e.g., `isUpdating`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DESKTOP_VIEWPORT`).
- **Test IDs**: Descriptive, lower-case, and wrapped in brackets for grep targeting (e.g., `[homepage]`).

## 3. Stability & Performance Protocol
Efficiency and reliability are favored over arbitrary timeouts.
- **Multi-Phase Wait**: Every test MUST use the `waitForPageStable` fixture which handles:
    - DOM Load State and warming delays (2s for WebKit).
    - **Eager Image Loading**: Force-converting all lazy images to eager.
    - Font Loading and Animation Tracking.
- **Environment Symmetry**: Baseline creation and Test runs MUST use identical workers (2) and sequential execution to ensure 100% reproducibility.
- **Prohibitions**:
    - **NO** `page.waitForTimeout(X)`. Use deterministic waits only.
    - **NO** `networkidle` (unless capped at 5s in the fixture layer).

## 4. Architectural Policy: Zero-Config Visual Regression
- **Minimalist Config**: [endpoints.config.js](file:///home/kamalks337/Documents/Learning/Playwright_for_UI_Testing/endpoints.config.js) is for `id` and `path` only.
- **Centralized Scrubbing**: All masking, hiding, and clicking logic MUST be centralized in [base-fixtures.js](file:///home/kamalks337/Documents/Learning/Playwright_for_UI_Testing/tests/fixtures/base-fixtures.js).
- **Hard Overrides**: Assertions in [visual.spec.js](file:///home/kamalks337/Documents/Learning/Playwright_for_UI_Testing/tests/visual-regression/visual.spec.js) use an explicit 30s timeout to bypass project-level defaults.

## 5. Handling Dynamic Content (Freeze, Don't Mask)
Prevent false-positive failures through a "Hierarchy of Defense" driven entirely by runtime heuristic detection in `volatility-detector.js`:
1.  **Dismiss** (Behavioral): Auto-clicks consent banners by detecting fixed elements containing privacy/cookie keywords.
2.  **Hide** (Structural): Stamps `display: none` on chat widgets, full-screen popup modals, and cross-origin iframes based on extreme z-indexes and position.
3.  **Freeze** (Observational): Pauses infinite CSS animations and freezes slider/carousel transforms (like Owl Carousel) in place to preserve layout while eliminating pixel variance.
4.  **Mask** (Residual): Only apply Playwright blackout masks to truly unpredictable pixels (like math captcha text).
5.  **Tolerance** (Pixel Buffer): Use global `maxDiffPixelRatio` (0.01-0.03) to ignore minor anti-aliasing or font-rendering variance.

**RULE: Zero Hardcoded Selectors.** The core framework must never use hardcoded, site-specific CSS selectors arrays (e.g. `GLOBAL_MASK_SELECTORS`). All volatility must be neutralized behaviorally or structurally to maintain multi-site portability.

## 6. Actionable Error Management
Every failure must provide a clear path to resolution via emoji-coded headers:
- 🚨 **BASELINE MISSING**: Run: `npm run update:baseline -- -g "[id]"`
- ⚠️ **CONNECTION ERROR**: Verify `BASE_URL` and internet connection.
- ❌ **VISUAL MISMATCH**: Run: `npm run report` to review the diff.
- ⏳ **STABILITY TIMEOUT**: Page failed to settle. Check for infinite animations.

---
*Failure to comply with these rules results in technical debt. Update this document only when the underlying architecture evolves.*
