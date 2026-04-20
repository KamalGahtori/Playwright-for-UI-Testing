# Project Overview: Data-Driven Visual Regression Testing Framework

This document provides a comprehensive, in-depth guide to the **Playwright-based Visual Regression Testing Framework** developed for the Ksolves website. It explains **what** we are doing, **why** we are doing it, and **how** each component works together to ensure 100% stable UI testing.

---

## 1. What Are We Doing?

We have built a **Zero-Config, Fully Automated Visual Regression Framework**. 

The goal is to capture "Golden Baselines" (reference screenshots) of various web pages across different devices and browsers, and then automatically compare them against the live site in future runs. If even a single pixel shifts, the framework detects it and reports a failure.

### Key Capabilities:
- **Cross-Browser & Multi-Device Testing:** Supports 9 combinations of Desktop (Chrome, Firefox, Safari), Mobile (iPhone, Galaxy), and Tablets (iPad).
- **Intelligent Stabilization:** Automatically handles lazy-loading, dynamic content (carousels, counters, captchas), and obstructive popups without manual script updates.
- **Full-Page Audits:** Captures the entire page from header to footer in a single high-resolution image.
- **Environment Symmetry:** Ensures that the environment used to *capture* a baseline is identical to the environment used to *test* it.

---

## 2. Why Are We Doing This?

Manual UI testing is slow, error-prone, and impossible to scale across dozens of devices. Common automated testing often misses visual bugs (layout shifts, font changes, broken images).

### Challenges Solved by This Framework:
1. **Lazy Loading:** Modern websites only load images/content when you scroll to them. A standard screenshot tool would see broken images.
2. **Dynamic Content:** Elements like carousels, auto-incrementing numbers, and "What is 5+2?" captchas change every time, causing "false failures."
3. **Popups/Banners:** Cookie consent forms and chat widgets "block" the content behind them, ruining the test.
4. **Layout Instability:** Elements that move slightly during page load can cause tests to fail even if the final design is correct.

---

## 3. How Are We Doing It? (The Tech Stack)

To run or understand this framework, you need the following:

- **Node.js:** The runtime environment for the framework.
- **Playwright:** The core engine that controls browsers (Chromium, Firefox, WebKit).
- **JavaScript:** The language used for all logic and configuration.
- **Dotenv:** For managing environment variables (like the Base URL).

---

## 4. Folder & File Structure in Detail

### 📁 Root Directory
| File | Purpose | How it Works |
| :--- | :--- | :--- |
| `package.json` | Project Manifest | Defines dependencies and "npm scripts" (shortcuts) to run tests. |
| `playwright.config.js` | Global Settings | Configures browser projects, viewport sizes, retry logic, and screenshot thresholds. |
| `endpoints.config.js` | Test Data | A simple list of URLs (paths) to be tested. Adding a new page is as simple as adding a line here. |
| `.env` | Environment Config | Contains sensitive or variable data like `BASE_URL`. |

---

### 📁 `tests/`
The heart of the test execution.
- **`tests/visual/visual.spec.js`**: The main test suite. It loops through the `endpoints.config.js` and runs a standardized test for every URL.
  - **Logic:** It calls `preparePage` to warm up the site, then `stabilizePage` to mask dynamic content, and finally `expect(...).toHaveScreenshot()` to do the comparison.

---

### 📁 `utils/`
The "Brain" of the framework. This is what makes the testing 100% stable.

- **`base-fixtures.js`**: Extends Playwright with custom "fixtures" (`preparePage` and `stabilizePage`).
  - **The Three-Pass Strategy:**
    1. **Pass 1 (Trigger):** Quickly scrolls top-to-bottom to trigger all lazy-loaders.
    2. **Pass 2 (Verify):** Scrolls again, but waits for every single image to report "complete" before moving on.
    3. **Pass 3 (Settle):** Returns to the top and waits for the layout to stop shifting (no more element movement).

- **`volatility-detector.js`**: Contains the complex algorithms for "Clean Shots."
  - **Behavioral Scan:** It watches the page for 500ms. If an element's text or position changes (like a counter or slider), it "stamps" it to be masked.
  - **Overlay Management:** Automatically clicks "Accept" on cookie banners and hides chat widgets.
  - **Captcha Logic:** Detects math patterns like "What is X + Y" and masks the entire captcha area.

---

### 📁 `golden-baselines/` (Automated)
This folder stores the "source of truth."
- **Internal Folders:** Organized by `browser/device/`.
- **`LAST_UPDATED.json`**: An auto-generated file that tracks exactly when each screenshot was last captured, so you know how "fresh" your test data is.

---

### 📁 Output Folders (Automated)
- **`playwright-report/`**: A beautiful HTML report showing side-by-side comparisons of any failures.
- **`test-results/`**: Raw logs, traces, and actual/diff images from the latest run.

---

## 5. How to Run (Step-by-Step)

### 1. Installation
Install all dependencies:
```bash
npm install
npx playwright install
```

### 2. Capture Initial Baselines
Before you can test, you must have reference images. Run this once:
```bash
npm run update:baseline
```

### 3. Run a Comparison Test
To verify the live site against your baselines:
```bash
npm run test:visual
```

### 4. Review Results
If a test fails, view the visual diff:
```bash
npm run report
```

---

## 6. Summary of Purpose
We created this framework to **automate aesthetic and structural integrity**. By using a **three-pass loading strategy** and an **intelligent volatility detector**, we have moved beyond simple "screenshots" to a system that understands how a page behaves, ensuring that we only catch real bugs and ignore the "noise" of dynamic web moderns.
