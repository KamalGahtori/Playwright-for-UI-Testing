// tests/interaction/interaction.spec.js
// ─────────────────────────────────────────────────────────────────────
// Interaction Audit
//
// One test per endpoint. Each test:
//   1. Navigates to the page.
//   2. preparePage — full 3-pass load strategy (forces all lazy assets,
//                    waits for layout stability). No stabilizePage —
//                    overlays and widgets are intentionally left in place
//                    so they are checked as interactive elements.
//   3. runInteractionAudit — dynamic element scan + accessibility checks:
//        buttons visible & enabled | links reachable (HEAD) |
//        inputs visible & enabled (no text entry anywhere) |
//        selects enabled | nav dropdowns hover-accessible |
//        carousel nav buttons visible | accordions enabled
//
// WHAT IS CHECKED:
//   Every interactive element discovered at runtime. Zero hardcoded selectors.
//
// WHAT IS SKIPPED (never interacted with):
//   Email fields, captcha inputs, file inputs, hidden/password inputs.
//   No text is entered anywhere on any page.
//
// FAILURE POLICY:
//   Hard fail on: disabled buttons, inaccessible inputs, internal link errors (4xx/5xx).
//   Warn on: external link 4xx (server may block HEAD), carousel nav not visible.
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
      // Force-loads all lazy assets (WP Rocket data-lazy-src, IntersectionObserver,
      // content-visibility overrides). Ensures carousel JS has initialised
      // before the element scan runs.
      await test.step('Preparing Page (Load All Assets)', async () => {
        await preparePage();
      });

      // ── Phase 2: Interaction Audit ─────────────────────────────────
      let auditResult;
      await test.step('Running Interaction Audit', async () => {
        auditResult = await runInteractionAudit(page, endpoint.id);
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
          // Highlight every matching element; scroll the first one into view so
          // it appears in the viewport-level screenshot.
          const found = await page.evaluate((items) => {
            let scrolled = false;
            let foundCount = 0;
            for (const { category, label, href } of items) {
              const color = category === 'WARN' ? 'orange' : 'red';
              const matches = [];

              if (category.startsWith('link') && href) {
                const el = document.querySelector(`a[href="${href}"]`);
                if (el) matches.push(el);
              } else if (category === 'button') {
                for (const b of document.querySelectorAll('button, [role="button"]')) {
                  if ((b.textContent || b.value || b.getAttribute('aria-label') || '').trim().startsWith(label.slice(0, 25))) {
                    matches.push(b);
                    break; // highlight only the first DOM match per failure entry
                  }
                }
              } else if (category === 'input') {
                const el = document.querySelector(`input[placeholder="${label}"], input[name="${label}"], textarea[placeholder="${label}"]`);
                if (el) matches.push(el);
              } else if (category === 'select') {
                const el = document.querySelector(`select[name="${label}"]`);
                if (el) matches.push(el);
              }

              for (const el of matches) {
                el.style.outline = `4px solid ${color}`;
                el.style.outlineOffset = '3px';
                el.style.backgroundColor = color === 'red' ? 'rgba(255,0,0,0.15)' : 'rgba(255,165,0,0.15)';
                foundCount++;
                if (!scrolled) {
                  el.scrollIntoView({ behavior: 'instant', block: 'center' });
                  scrolled = true;
                }
              }
            }
            return foundCount;
          }, [...fails.map(f => ({ ...f, category: f.category })), ...warns.map(w => ({ ...w }))]);

          // Viewport screenshot — taken after scrollIntoView so the first
          // highlighted element is centred and clearly visible.
          const viewportShot = await page.screenshot();
          await test.info().attach('highlighted-failures-viewport.png', { body: viewportShot, contentType: 'image/png' });

          // Full-page screenshot for overall context.
          const fullShot = await page.screenshot({ fullPage: true });
          await test.info().attach('highlighted-failures-fullpage.png', { body: fullShot, contentType: 'image/png' });

          if (found === 0) {
            // Elements couldn't be located in the DOM at screenshot time (e.g. inside
            // a closed overlay). Attach a plain viewport capture so there is still
            // something to review.
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
          `Run 'npm run report' to review the highlighted screenshot.\n`
        );
      }

    });
  }

});
