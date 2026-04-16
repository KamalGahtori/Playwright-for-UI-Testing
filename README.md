# Playwright Visual Regression Framework 🎭

A highly scalable, data-driven framework for automatic visual regression testing across **9** browser and device combinations.

<br>

---

## 🚀 1. Quick Start

### Step 1: Install Dependencies
```bash
npm install
npx playwright install
npx playwright install-deps webkit  # Required for Linux users
```

<br>

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env and set BASE_URL=https://your-site.com
```

<br>

---

## 📸 2. Generating Baseline Images

Golden Baselines are the "source of truth". The framework will compare future tests against these images.

### Capture Commands

| Scope | Command | Description |
| :--- | :--- | :--- |
| **All Platforms** | `npm run update:baseline` | Captures goldens for all 9 projects. |
| **By Browser** | `npm run update:baseline:chrome` | Captures all Chrome devices. |
| **By Device** | `npm run update:baseline:device "ID"` | Captures one specific ID (e.g., `chromium-desktop`). |
| **Update Desktop** | `npm run update:baseline:device -- chromium-desktop` |
| **Update iPhone 12** | `npm run update:baseline:device -- chromium-iphone-12-pro` |

<br>

---

## 🧪 3. Running Visual Tests

Run these anytime code changes to ensure the website hasn't broken visually.

### Run Commands

| Scope | Command | Description |
| :--- | :--- | :--- |
| **All Platforms** | `npm run test:visual` | Compares all 9 platforms against goldens. |
| **By Browser** | `npm run test:visual:chrome` | Checks all Chrome-based platforms. |
| **By Device** | `npm run test:visual:device "ID"` | Checks a specific ID (e.g., `chromium-iphone-12-pro`). |
| **Test Desktop** | `npm run test:visual:device -- chromium-desktop` |
| **Test iPhone 12** | `npm run test:visual:device -- chromium-iphone-12-pro` |
| **Interactive UI** | `npm run test:visual:ui` | 🖥️ **Opens the Playwright UI Dashboard.** |

<br>

---

## 📊 4. Reviewing Results

### Open Static Report
```bash
npm run report
```

### Static vs UI Mode
*   **Static Report (`npm run report`)**: Best for CI/CD or quick review of pixel differences in a browser tab.
*   **UI Mode (`npm run test:visual:ui`)**: Best for local development. It allows you to re-run individual tests, see live actions, and toggle between baseline and actual images.

<br>

---

## ⚙️ 5. Maintenance

### Adding a New Page
Simply add a new entry to `endpoints.config.js`:
```javascript
{ id: 'new-page', path: '/new-page-url' }
```
Then run the update command:
```bash
npm run update:baseline -- -g "[new-page]"
```
