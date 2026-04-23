# Ksolves UI Testing Framework

Automated testing for **ksolves.com** marketing pages.
Two suites: **Visual** (pixel-level screenshot comparison) and **Interaction** (full-site element health audit — buttons, links, inputs, dropdowns, images).

---

## Prerequisites

### Node.js v22+

```bash
node -v   # should print v22.x.x or higher
```

If not installed or version is too old:

```bash
# Install nvm (macOS / Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart your terminal, then:
nvm install 22
nvm use 22
```

> The `.nvmrc` file pins Node to v22 — running `nvm use` inside this folder selects it automatically.

---

## Installation

```bash
git clone <repo-url>
cd Playwright-for-UI-Testing

npm install                  # install Node dependencies
npx playwright install       # download Chromium, Firefox, WebKit browsers
```

---

## Environment Setup

```bash
cp .env.example .env
```

Open `.env` and set:

```
BASE_URL=https://www.ksolves.com/
```

That is the only required field. No login, no API keys.

---

## Running Tests

### Baseline — capture or update golden reference screenshots

```bash
npm run baseline                                  # all pages
npm run baseline -- --grep '\[services\]'         # one group
npm run baseline -- --grep 'About-Us'             # one page
```

Groups: `homepage` · `about-us` · `services` · `support-services` · `products` · `insights` · `footer`  
Page IDs are listed in `endpoints.config.js`.

### Visual — compare live pages against baselines

```bash
npm run visual                                    # all pages
npm run visual -- --grep '\[services\]'           # one group
npm run visual -- --grep 'About-Us'               # one page
```

Always run `npm run baseline` first when adding a new page or device.

### Interaction — full-site element health audit

```bash
npm run interaction    # crawls from BASE_URL, audits every page found
```

### Reports — open results in browser

```bash
npm run report:visual              # visual diff report
npm run report:interaction  # interaction audit report
```

---

## Selecting Devices

Active devices are controlled by `playwright.config.js`. Open the file and uncomment any device block to enable it:

```js
// Currently active:
{ name: 'chromium-desktop', ... }

// Uncomment to enable:
// { name: 'chromium-iphone-12-pro', ... }
// { name: 'firefox-desktop', ... }
```

After enabling a new device, capture its baselines before running visual tests:

```bash
npm run baseline
```

---

## Adding a New Page (Visual Tests)

1. Open [endpoints.config.js](endpoints.config.js) and add one entry in the right group:
   ```js
   { id: 'My-New-Page', path: '/my-new-page' }
   ```
2. Capture its baseline:
   ```bash
   npm run baseline
   ```
3. Verify it passes:
   ```bash
   npm run visual
   ```

The interaction suite discovers pages automatically by crawling — no config change needed.

---

## Repository Structure

```
├── playwright.config.js              # active devices, visual thresholds, reporter
├── playwright.interaction.config.js  # interaction suite config (4-hour timeout, Crawlee)
├── endpoints.config.js               # page registry for visual tests
├── .env.example                      # environment template — copy to .env
├── .nvmrc                            # pins Node to v22
│
├── tests/
│   ├── visual/visual.spec.js              # visual regression suite
│   └── interaction/interaction.spec.js    # interaction audit suite + HTML report builder
│
├── utils/
│   ├── base-fixtures.js              # page preparation and stabilisation
│   ├── volatility-detector.js        # dynamic content detection engine
│   └── interaction-engine.js         # DOM scanner and element health checker
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

## Troubleshooting

| Error | Fix |
|---|---|
| `🚨 BASELINE MISSING` | Run `npm run baseline` |
| `❌ VISUAL MISMATCH` | Run `npm run report` — decide if it's a bug or an approved change |
| `⚠️ NAVIGATION FAILURE` | Check `BASE_URL` in `.env`, verify the path in `endpoints.config.js` |
| `⚠️ CONNECTION ERROR` | Check internet / VPN |
| Node version error | Run `nvm use` in the project folder |
| Only a few pages crawled | Raise `MAX_PAGES` in `utils/interaction-engine.js` |
