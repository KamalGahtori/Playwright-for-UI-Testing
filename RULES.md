# Architectural Laws of Visual Regression

Non-negotiable standards for this repository. All code, endpoint registrations, and configuration changes must comply.

---

## 1. The 9-Project Core Matrix

Testing is unified across 9 projects:

- **3 Desktop**: Chromium, Firefox, WebKit (Safari)
- **3 Mobile**: iPhone 8, iPhone 12 Pro, Galaxy S20 Ultra (Chromium emulation)
- **3 Tablet**: iPad Air, iPad Mini, iPad Pro (Chromium emulation)

WebKit/Safari is desktop-only. Mobile/Tablet coverage is handled by Chromium emulation.

---

## 2. Naming Conventions

| Type | Format | Example |
|---|---|---|
| Files | `kebab-case.js` | `visual.spec.js` |
| Variables & functions | `camelCase` | `isUpdating` |
| Constants | `UPPER_SNAKE_CASE` | `DESKTOP_VIEWPORT` |
| Test IDs | lowercase, bracket-wrapped | `[homepage]` |

---

## 3. Stability & Performance Protocol

- **Multi-phase warm-up**: Every test uses the `preparePage` fixture which handles DOM load state, WebKit warm-up, lazy image forcing, font loading, and full-page scroll.
- **Environment symmetry**: Baseline creation and test runs must use identical worker count (2) and sequential execution for reproducibility.

**Prohibitions:**
- No arbitrary `page.waitForTimeout()` outside of documented settle windows
- No `networkidle` without a timeout cap (fixture layer caps at 10s)

---

## 4. Zero-Config Visual Regression

- `endpoints.config.js` contains `id` and `path` only — nothing else
- All masking, hiding, and stabilization logic lives in `utils/base-fixtures.js` and `utils/volatility-detector.js`
- `tests/visual/visual.spec.js` contains only test orchestration — no selectors, no page-specific logic

---

## 5. Dynamic Content Hierarchy — Behavioral, Not Hardcoded

All volatile content must be neutralized at runtime via `utils/volatility-detector.js`:

1. **Dismiss** — auto-click consent banners (fixed + privacy/cookie keywords)
2. **Behavioral scan** — two-snapshot comparison (450ms); stamp anything that changed as `[data-vr-volatile]`
3. **Hide** — chat widgets, popup overlays, cross-origin iframes (z-index + position signals)
4. **Freeze** — pause infinite CSS animations in-place (element stays visible, layout is tested)
5. **Mask** — `[data-vr-volatile]` overlay + captcha inputs (truly unpredictable pixels)

**RULE: Zero hardcoded selectors.** The framework must never contain site-specific CSS selector arrays. All volatility is neutralized behaviorally or by universal structural patterns (e.g., `.owl-stage`, `.swiper-wrapper`).

**RULE: Mask content, test containers.** The carousel outer shell must always appear in the pixel diff. Only the inner sliding track is masked.

---

## 6. Tolerance

- Global `maxDiffPixelRatio: 0.03` in `playwright.config.js`
- Per-assertion override at `0.02` in `visual.spec.js`
- Tolerances absorb minor anti-aliasing and font-rendering variance — not design changes

---

## 7. Actionable Error Codes

| Emoji | Error | Resolution |
|---|---|---|
| 🚨 | BASELINE MISSING | `npm run update:baseline -- -g "[id]"` |
| ⚠️ | CONNECTION ERROR | Verify `BASE_URL` in `.env` |
| ❌ | VISUAL MISMATCH | `npm run report` to review diffs |

---

*Update this document only when the underlying architecture evolves.*
