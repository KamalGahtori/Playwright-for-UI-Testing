// tests/interaction/interaction.spec.js
// ─────────────────────────────────────────────────────────────────────
// Crawler-based Interaction Audit
//
// One test per endpoint. Each test:
//   1. Sets up console-error collectors BEFORE navigation so JS errors
//      thrown during page load and preparePage are captured.
//   2. Navigates to the page.
//   3. preparePage — full 3-pass load strategy (forces lazy assets,
//                    waits for layout stability). stabilizePage is
//                    intentionally NOT called so overlays and widgets
//                    remain in place for the interaction audit.
//   4. runInteractionAudit — crawler-based element scan + checks:
//        · buttons  — visible, enabled, trial-click (non-form only)
//        · links    — HEAD reachability (internal FAIL, external WARN)
//        · inputs   — visible, enabled, has accessible label
//        · selects  — enabled, has options
//        · images   — no broken images, alt text present
//        · iframes  — src valid, title attribute present
//        · a11y     — accessible names on buttons/links, focusable-hidden
//        · health   — JS console errors (benign third-party noise filtered)
//        · nav-dropdown — hover-accessible
//        · scroll   — sticky header visible after scroll, back-to-top
//        · accordion-aria — aria-expanded toggles on click
//        · popup    — opens, has enabled contents, closes via Escape
//
// FAILURE POLICY:
//   Hard fail on: disabled buttons, disabled inputs, internal 4xx/5xx, broken images.
//   Warn on: external 4xx, missing alt/label/title, console errors, scroll issues.
// ─────────────────────────────────────────────────────────────────────

const { test, expect }       = require('../../utils/base-fixtures');
const endpoints               = require('../../endpoints.config');
const { runInteractionAudit } = require('../../utils/interaction-engine');

test.describe('Interaction Audit', () => {

  for (const endpoint of endpoints) {

    test(`[${endpoint.group}][${endpoint.id}] Interaction Audit`, async ({ page, preparePage }) => {

      const projectName = test.info().project.name;

      // ── Navigate ───────────────────────────────────────────────────
      await test.step(`Navigating to ${endpoint.path}`, async () => {
        try {
          const response = await page.goto(endpoint.path);
          if (!response || response.status() >= 400) {
            throw new Error(
              `\n\n⚠️ NAVIGATION FAILURE ⚠️\n` +
              `Could not reach: ${endpoint.path} (HTTP ${response?.status() ?? 'N/A'})\n`
            );
          }
        } catch (err) {
          if (err.message.includes('NAVIGATION FAILURE')) throw err;
          throw new Error(
            `\n\n⚠️ CONNECTION ERROR ⚠️\n` +
            `Failed to connect to: ${endpoint.path}\n` +
            `Error: ${err.message}\n`
          );
        }
      });

      // ── Phase 1: Full page warm-up ─────────────────────────────────
      // Force-loads all lazy assets (WP Rocket data-lazy-src, IntersectionObserver).
      // Ensures the spec's page is fully loaded for the highlighted-failure screenshot.
      // stabilizePage is NOT called — overlays and widgets must stay in place.
      await test.step('Preparing Page (Load All Assets)', async () => {
        await preparePage();
      });

      // Capture the fully resolved URL after Playwright has applied baseURL
      const fullUrl = page.url();

      // ── Phase 2: Interaction Audit ─────────────────────────────────
      // The Crawlee-powered engine navigates to fullUrl in its own browser context,
      // collects console errors internally, and returns aggregated results.
      // The spec's page remains at fullUrl for the highlighted-failure screenshot.
      let auditResult;
      await test.step('Running Interaction Audit', async () => {
        auditResult = await runInteractionAudit(fullUrl, endpoint.id, {});
      });

      const { allResults, counts, fails, warns } = auditResult;

      // ── Annotations (visible in HTML report) ──────────────────────
      test.info().annotations.push({
        type: 'Interaction Summary',
        description: `PASS:${counts.PASS} FAIL:${counts.FAIL} WARN:${counts.WARN} SKIP:${counts.SKIP} | Project:${projectName}`,
      });

      if (warns.length) {
        test.info().annotations.push({
          type: 'Warnings',
          description: warns.map(w => `[${w.category}] ${w.label}: ${w.detail}`).join(' | '),
        });
      }

      if (fails.length) {
        test.info().annotations.push({
          type: 'Failures',
          description: fails.map(f => `[${f.category}] ${f.label}: ${f.detail}`).join(' | '),
        });
      }

      // ── Attach full audit results as JSON ──────────────────────────
      await test.info().attach('audit-results.json', {
        body: JSON.stringify({ summary: counts, fails, warns }, null, 2),
        contentType: 'application/json',
      });

      // ── Highlight failing elements and capture screenshot ──────────
      if (fails.length || warns.length) {
        await test.step('Capturing Highlighted Failures Screenshot', async () => {
          const found = await page.evaluate((items) => {
            let scrolled = false;
            let foundCount = 0;

            for (const { category, label, href } of items) {
              const color   = category === 'WARN' ? 'orange' : 'red';
              const matches = [];

              if (category.startsWith('link') && href) {
                const el = document.querySelector(`a[href="${href}"]`);
                if (el) matches.push(el);
              } else if (category === 'button') {
                for (const b of document.querySelectorAll('button, [role="button"]')) {
                  if ((b.textContent || b.value || b.getAttribute('aria-label') || '').trim().startsWith(label.slice(0, 25))) {
                    matches.push(b);
                    break;
                  }
                }
              } else if (category === 'input') {
                const el = document.querySelector(
                  `input[placeholder="${label}"], input[name="${label}"], textarea[placeholder="${label}"]`
                );
                if (el) matches.push(el);
              } else if (category === 'select') {
                const el = document.querySelector(`select[name="${label}"]`);
                if (el) matches.push(el);
              } else if (category === 'image') {
                for (const img of document.querySelectorAll('img')) {
                  if ((img.getAttribute('src') || '').includes(label.slice(0, 30))) {
                    matches.push(img);
                    break;
                  }
                }
              } else if (category === 'iframe') {
                for (const f of document.querySelectorAll('iframe')) {
                  if ((f.getAttribute('src') || '').includes(label.slice(0, 30))) {
                    matches.push(f);
                    break;
                  }
                }
              }

              for (const el of matches) {
                el.style.outline          = `4px solid ${color}`;
                el.style.outlineOffset    = '3px';
                el.style.backgroundColor  = color === 'red' ? 'rgba(255,0,0,0.15)' : 'rgba(255,165,0,0.15)';
                foundCount++;
                if (!scrolled) {
                  el.scrollIntoView({ behavior: 'instant', block: 'center' });
                  scrolled = true;
                }
              }
            }
            return foundCount;
          }, [...fails.map(f => ({ ...f })), ...warns.map(w => ({ ...w }))]);

          const viewportShot = await page.screenshot();
          await test.info().attach('highlighted-failures-viewport.png', { body: viewportShot, contentType: 'image/png' });

          const fullShot = await page.screenshot({ fullPage: true });
          await test.info().attach('highlighted-failures-fullpage.png', { body: fullShot, contentType: 'image/png' });

          if (found === 0) {
            test.info().annotations.push({
              type: 'Screenshot note',
              description: 'Failing elements could not be located in the DOM at screenshot time — they may be inside a closed overlay or cross-origin iframe.',
            });
          }
        });
      }

      // ── Assert ─────────────────────────────────────────────────────
      if (fails.length) {
        const failList = fails.map(f => `  ❌ [${f.category}] ${f.label} — ${f.detail}`).join('\n');
        throw new Error(
          `\n\n❌ INTERACTION FAILURES on [${endpoint.id}] (${projectName}) ❌\n` +
          `${fails.length} failure(s) detected:\n${failList}\n\n` +
          `Run 'npm run report:interaction' to review the highlighted screenshot.\n`
        );
      }

    });
  }

});
