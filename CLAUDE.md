# Playwright Visual Regression Framework — Project Context

## What this project does
Structural and Aesthetic Integrity Audit of marketing landing pages via pixel-level visual regression testing. The goal is to validate stable UI infrastructure (layout, fonts, colors, alignment) while automatically ignoring volatile content (carousels, counters, live data, videos, chat widgets).

## Directory structure
```
Playwright-for-UI-Testing/
├── playwright.config.js       # 9 browser/device projects, thresholds, reporter
├── endpoints.config.js        # registry of pages under test — add new pages here
├── .env / .env.example        # BASE_URL and other secrets
│
├── tests/visual/
│   └── visual.spec.js         # the only test file — viewport-by-viewport loop
│
├── utils/
│   ├── base-fixtures.js       # preparePage + stabilizeViewport fixtures
│   └── volatility-detector.js # 5-phase detection/stabilization engine
│
├── page-objects/              # future page-specific selectors and helpers
│
└── golden-baselines/          # reference screenshots (committed to git)
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

## How tests work

### Phase A — preparePage (once per page)
1. Wait for DOM + network idle + fonts
2. Scroll the full page to trigger all WP Rocket / IntersectionObserver lazy loaders
3. Wait for every `<img>` to fully decode (`ensureFullPageLoad`)
4. Return to top, settle 1s

### Phase B — stabilizeViewport (once per viewport chunk)
1. `dismissOverlays` — click away cookie/consent banners
2. `behavioralVolatilityScan` — observe 450ms; stamp elements that changed with `[data-vr-volatile]`
3. `hideWidgetsAndOverlays` — hide chat widgets, cross-origin iframes via `[data-vr-hide]`
4. `freezeVolatileContent` — pause infinite CSS animations; stamp carousel tracks as volatile
5. `detectMaskTargets` — collect `[data-vr-volatile]` + captcha selectors for Playwright mask

### Screenshot strategy
- `fullPage: false` — one viewport-height chunk at a time
- Scroll loop + footer pass ensures every pixel from header to footer is captured
- `maxDiffPixelRatio: 0.02` per chunk

## Key design principles
- **Mask content, test containers** — the carousel outer shell is always in the diff; only the sliding track is masked
- **Zero hardcoding** — all volatile detection is behavioral (two-snapshot comparison) or structural (known carousel track class patterns)
- **No third-party dependencies** — pure Playwright + Node.js
- **Universal** — works on any marketing page without page-specific config

## Adding a new page
Edit `endpoints.config.js`, add `{ id: 'page-id', path: '/url-path' }`, then run:
```bash
npm run update:baseline -- -g "[page-id]"
```

## npm scripts
| Command | What it does |
|---|---|
| `npm run test:visual` | Run all 9 projects |
| `npm run test:visual:chrome` | Chromium only |
| `npm run test:visual:device -- chromium-desktop` | One specific project |
| `npm run test:visual:ui` | Playwright UI dashboard |
| `npm run update:baseline` | Capture new golden baselines for all |
| `npm run update:baseline:device -- chromium-desktop` | Update one project |
| `npm run report` | Open HTML report |

## Environment
```bash
cp .env.example .env
# Set BASE_URL=https://your-site.com
```

## Volatility detection — what gets stamped [data-vr-volatile]
| Signal | Type | Detected by |
|---|---|---|
| Text content changed in 450ms | counters, tickers, live data | behavioral scan |
| CSS transform changed | carousel/slider track | behavioral scan |
| background-position changed | CSS background slider | behavioral scan |
| `.owl-stage`, `.swiper-wrapper`, `.slick-track` | carousel track (structural) | freezeVolatileContent |
| `<video>` elements | unpredictable frames | freezeVolatileContent |
| Captcha containers/inputs | truly random pixels | detectMaskTargets |

## Volatility detection — what gets [data-vr-hide]
- Fixed/sticky elements with z-index ≥ 10000 and < 15% viewport area (chat bubbles)
- Elements with z-index ≥ 100000 (chat containers)
- Elements matching popup/modal class + high z-index
- WhatsApp floating links and wrappers
- Cross-origin iframes

## Constraints
- No third-party libraries for detection logic
- No hardcoded selectors for specific pages
- No manual mask lists
- All detection is runtime-behavioral or universally structural
