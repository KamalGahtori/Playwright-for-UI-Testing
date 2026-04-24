// tests/interaction/interaction.spec.js
// ─────────────────────────────────────────────────────────────────────
// Full-Site Interaction Audit — one test, Crawlee-powered crawl
//
// REPORT (open via: npm run report:interaction)
//   audit-report.html  — self-contained SPA:
//                        Index view → click URL → full-screen detail view
//                        with inline screenshot. Warnings collapsible.
//   crawl-summary.json — raw JSON
//
// Run:  npm run interaction
// View: npm run report:interaction → click test → Attachments → audit-report.html
// ─────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');
const { test }                = require('../../utils/base-fixtures');
const { runInteractionAudit } = require('../../utils/interaction-engine');

// Written incrementally during the crawl — survives Ctrl+C
const RESULTS_FILE  = path.resolve(__dirname, '../../interaction-results/partial-results.json');
// Written at the end of afterEach — opened directly by npm run report:interaction
const REPORT_FILE   = path.resolve(__dirname, '../../interaction-results/audit-report.html');

function buildHtmlReport(pages, stats) {
  // PASS = no errors (warnings are informational, not blocking)
  const passCount = pages.filter(p => p.fails.length === 0).length;
  const failCount = pages.filter(p => p.fails.length  >  0).length;

  // ── Index table rows ──────────────────────────────────────────────
  const indexRows = pages.map((p, i) => {
    const status = p.fails.length ? 'fail' : 'pass';
    const badge = p.fails.length
      ? `<span class="badge fail">FAIL</span>`
      : `<span class="badge pass">PASS</span>`;
    return `<tr class="idx-row" data-status="${status}" onclick="showDetail(${i})" title="Click to view details">
      <td>${badge}</td>
      <td class="url-cell">${p.url}</td>
      <td class="num ${p.fails.length ? 'red' : ''}">${p.fails.length || '—'}</td>
      <td class="num ${p.warns.length ? 'orange' : ''}">${p.warns.length || '—'}</td>
    </tr>`;
  }).join('');

  // ── Per-URL detail panels (pre-rendered, hidden — JS shows one at a time) ──
  const detailPanels = pages.map((p, i) => {
    const badge = p.fails.length
      ? `<span class="badge fail">FAIL</span>`
      : `<span class="badge pass">PASS</span>`;

    const errorBlock = p.fails.length
      ? `<div class="issue-block errors">
          <div class="issue-title">&#10060; Errors — ${p.fails.length} found</div>
          <ol class="issue-list">
            ${p.fails.map(f => `
            <li>
              <span class="cat">${f.category}</span>
              <strong>${escHtml(f.label)}</strong>
              <span class="issue-detail">${escHtml(f.detail)}</span>
              ${f.impact ? `<span class="impact">${escHtml(f.impact)}</span>` : ''}
            </li>`).join('')}
          </ol>
        </div>`
      : `<div class="issue-block ok">&#10003; No errors on this page</div>`;

    const warnBlock = p.warns.length
      ? `<details class="issue-block warnings">
          <summary class="issue-title warn-summary">
            &#9888; Warnings — ${p.warns.length} found
            <span class="expand-hint">(click to expand)</span>
          </summary>
          <ol class="issue-list">
            ${p.warns.map(w => `
            <li>
              <span class="cat">${w.category}</span>
              <strong>${escHtml(w.label)}</strong>
              <span class="issue-detail">${escHtml(w.detail)}</span>
              ${w.impact ? `<span class="impact">${escHtml(w.impact)}</span>` : ''}
            </li>`).join('')}
          </ol>
        </details>`
      : `<div class="issue-block ok">&#10003; No warnings on this page</div>`;

    const screenshot = p.screenshotBuffer
      ? `<div class="screenshot-block">
          <div class="screenshot-label">Full-page screenshot — failures highlighted in red, warnings in orange</div>
          <img class="screenshot-img" src="data:image/png;base64,${p.screenshotBuffer.toString('base64')}" alt="Screenshot" loading="lazy" />
        </div>`
      : '';

    const popupBlock = (p.popupScreenshots && p.popupScreenshots.length)
      ? p.popupScreenshots.map(ps => `
        <div class="screenshot-block">
          <div class="screenshot-label">Popup screenshot — "${escHtml(ps.label)}" — failures highlighted in red</div>
          <img class="screenshot-img" src="data:image/png;base64,${ps.buffer.toString('base64')}" alt="Popup screenshot" loading="lazy" />
        </div>`).join('')
      : '';

    return `
    <div id="panel-${i}" class="detail-panel" style="display:none">
      <div class="detail-meta">
        ${badge}
        <a href="${p.url}" target="_blank" rel="noopener" class="detail-url">${p.url}</a>
        <span class="check-counts">
          <span class="cc fail-c">&#10060; ${p.counts.FAIL} errors</span>
          <span class="cc warn-c">&#9888; ${p.counts.WARN} warnings</span>
          <span class="cc pass-c">&#10003; ${p.counts.PASS} passed</span>
          <span class="cc skip-c">&#8594; ${p.counts.SKIP} skipped</span>
        </span>
      </div>
      ${errorBlock}
      ${warnBlock}
      ${screenshot}
      ${popupBlock}
    </div>`;
  }).join('');

  // ── Full HTML ─────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interaction Audit Report</title>
<style>
/* ── Reset & base ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;font-size:14px}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;color:#1a1a1a;line-height:1.6}

/* ── Top bar ── */
.topbar{background:#1e293b;color:#e2e8f0;padding:0 28px;height:52px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.topbar-title{font-size:1rem;font-weight:700;color:#fff;white-space:nowrap}
.topbar-meta{font-size:0.75rem;color:#94a3b8;margin-left:auto;white-space:nowrap}
#nav-controls{display:none;gap:8px;align-items:center;margin-left:auto}
.btn{background:#334155;color:#e2e8f0;border:none;border-radius:5px;padding:5px 12px;font-size:0.78rem;cursor:pointer;white-space:nowrap}
.btn:hover{background:#475569}
.btn-back{background:#2563eb}
.btn-back:hover{background:#1d4ed8}
.nav-info{font-size:0.78rem;color:#94a3b8;white-space:nowrap}

/* ── Main container ── */
.container{max-width:1300px;margin:0 auto;padding:24px 20px}

/* ── Summary ── */
.summary-card{background:#fff;border-radius:10px;padding:22px 26px;margin-bottom:24px;box-shadow:0 1px 6px rgba(0,0,0,.08)}
.card-title{font-size:0.95rem;font-weight:700;color:#1e293b;margin-bottom:16px;border-bottom:2px solid #f1f5f9;padding-bottom:10px}
.stat-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:22px}
.stat-box{flex:1;min-width:100px;background:#f8fafc;border-radius:8px;padding:12px 16px;text-align:center;border:1px solid #e2e8f0}
.stat-box .n{font-size:1.8rem;font-weight:800;line-height:1}
.stat-box .l{font-size:0.68rem;text-transform:uppercase;letter-spacing:.7px;color:#64748b;margin-top:4px}
.s-total .n{color:#2563eb} .s-pass .n{color:#16a34a} .s-fail .n{color:#dc2626}
.s-efail .n{color:#dc2626} .s-ewarn .n{color:#d97706} .s-time .n{color:#6366f1}
.stat-box.filterable{cursor:pointer;user-select:none;transition:transform .12s,box-shadow .12s}
.stat-box.filterable:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.14)}
.s-total.active{outline:3px solid #2563eb;outline-offset:-1px}
.s-pass.active{outline:3px solid #16a34a;outline-offset:-1px}
.s-fail.active{outline:3px solid #dc2626;outline-offset:-1px}

/* ── Index table ── */
.index-label{font-size:0.82rem;color:#64748b;margin-bottom:8px}
table.url-index{width:100%;border-collapse:collapse}
table.url-index th{text-align:left;font-size:0.7rem;text-transform:uppercase;letter-spacing:.6px;color:#64748b;padding:8px 12px;border-bottom:2px solid #e2e8f0}
table.url-index td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.idx-row{cursor:pointer;transition:background .12s}
.idx-row:hover td{background:#eff6ff}
.url-cell{font-size:0.85rem;color:#1e40af;word-break:break-all}
.num{text-align:center;font-weight:700;font-size:0.85rem;color:#94a3b8}
.num.red{color:#dc2626} .num.orange{color:#d97706}

/* ── Badges ── */
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.68rem;font-weight:700;letter-spacing:.4px;white-space:nowrap}
.badge.fail{background:#fee2e2;color:#991b1b}
.badge.pass{background:#dcfce7;color:#166534}

/* ── Detail panel ── */
#detail-view{display:none}
.detail-panel{background:#fff;border-radius:10px;padding:22px 26px;box-shadow:0 1px 6px rgba(0,0,0,.08)}
.detail-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #f1f5f9}
.detail-url{color:#1e40af;text-decoration:none;font-size:0.9rem;font-weight:600;word-break:break-all;flex:1}
.detail-url:hover{text-decoration:underline}
.check-counts{display:flex;gap:14px;flex-wrap:wrap;font-size:0.78rem;font-weight:600;margin-left:auto}
.cc{white-space:nowrap}
.fail-c{color:#dc2626} .warn-c{color:#d97706} .pass-c{color:#16a34a} .skip-c{color:#64748b}

/* ── Issue blocks ── */
.issue-block{margin-bottom:14px;border-radius:7px;overflow:hidden}
.issue-block.ok{font-size:0.82rem;color:#16a34a;padding:8px 12px;background:#f0fdf4;border-radius:7px}
.issue-title{font-weight:700;font-size:0.88rem;padding:9px 14px;display:block}
.issue-block.errors .issue-title{background:#fee2e2;color:#991b1b}
.issue-block.warnings summary.issue-title{background:#fef3c7;color:#92400e;cursor:pointer;list-style:none}
.issue-block.warnings summary.issue-title::-webkit-details-marker{display:none}
.issue-block.warnings[open] .warn-summary::after{content:' ▲'}
.issue-block.warnings:not([open]) .warn-summary::after{content:' ▼'}
.expand-hint{font-size:0.72rem;font-weight:400;opacity:.7;margin-left:6px}
.issue-list{list-style:decimal;padding:10px 14px 10px 32px;background:#fafafa;display:flex;flex-direction:column;gap:8px}
.issue-list li{font-size:0.85rem;line-height:1.5}
.issue-block.errors .issue-list{background:#fff5f5}
.issue-block.warnings .issue-list{background:#fffbeb}
.cat{display:inline-block;background:#f1f5f9;color:#475569;border-radius:3px;padding:1px 5px;font-size:0.72rem;font-weight:700;margin-right:5px;vertical-align:middle}
.issue-detail{color:#64748b;font-size:0.8rem;margin-left:4px}
.impact{font-style:italic;font-size:0.74rem;color:#64748b;margin-left:6px}
.impact::before{content:'· ';color:#c0ccd8}

/* ── Screenshot ── */
.screenshot-block{margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9}
.screenshot-label{font-size:0.78rem;color:#64748b;font-weight:600;margin-bottom:10px}
.screenshot-img{max-width:100%;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.1);display:block}
</style>
</head>
<body>

<!-- ── Sticky top bar ───────────────────────────────────────────── -->
<div class="topbar">
  <span class="topbar-title" id="topbar-title">Interaction Audit Report</span>
  <span class="topbar-meta" id="topbar-meta">${new Date().toLocaleString()} &nbsp;&middot;&nbsp; ${stats.runtimeSecs}s &nbsp;&middot;&nbsp; 1920&times;1080</span>
  <div id="nav-controls">
    <button class="btn btn-back" onclick="showIndex()">&#8592; Back to index</button>
    <span class="nav-info" id="nav-info"></span>
    <button class="btn" id="btn-prev" onclick="navigate(-1)">&#8592; Prev</button>
    <button class="btn" id="btn-next" onclick="navigate(1)">Next &#8594;</button>
  </div>
</div>

<!-- ── Index view ───────────────────────────────────────────────── -->
<div id="index-view">
  <div class="container">

    <div class="summary-card">
      <div class="card-title">Summary</div>
      <div class="stat-row">
        <div class="stat-box s-total filterable" data-filter="all"  onclick="filterTable('all')"  title="Show all pages"><div class="n">${stats.totalPages}</div><div class="l">Pages Tested</div></div>
        <div class="stat-box s-pass  filterable" data-filter="pass" onclick="filterTable('pass')" title="Show passing pages only"><div class="n">${passCount}</div><div class="l">Pass</div></div>
        <div class="stat-box s-fail  filterable" data-filter="fail" onclick="filterTable('fail')" title="Show failing pages only"><div class="n">${failCount}</div><div class="l">Fail</div></div>
        <div class="stat-box s-efail"><div class="n">${stats.totalFails}</div><div class="l">Total Errors</div></div>
        <div class="stat-box s-ewarn"><div class="n">${stats.totalWarns}</div><div class="l">Total Warnings</div></div>
        <div class="stat-box s-time"><div class="n">${stats.runtimeSecs}s</div><div class="l">Runtime</div></div>
      </div>
      <div class="index-label">Click any row to view full details, errors, warnings and screenshot for that page</div>
      <table class="url-index">
        <thead><tr><th>Status</th><th>URL</th><th style="text-align:center;width:80px">Errors</th><th style="text-align:center;width:90px">Warnings</th></tr></thead>
        <tbody>${indexRows}</tbody>
      </table>
    </div>

  </div>
</div>

<!-- ── Detail view (shared shell — panels swap in/out) ─────────── -->
<div id="detail-view">
  <div class="container">
    ${detailPanels}
  </div>
</div>

<script>
var currentIdx = 0;
var total = ${pages.length};

function filterTable(type) {
  document.querySelectorAll('.idx-row').forEach(function(row) {
    var s = row.getAttribute('data-status');
    row.style.display = (type === 'all' || s === type) ? '' : 'none';
  });
  document.querySelectorAll('.stat-box.filterable').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-filter') === type);
  });
}

function showDetail(idx) {
  // Hide all panels
  document.querySelectorAll('.detail-panel').forEach(function(p){ p.style.display='none'; });
  // Show target panel
  document.getElementById('panel-' + idx).style.display = 'block';
  // Switch views
  document.getElementById('index-view').style.display = 'none';
  document.getElementById('detail-view').style.display = 'block';
  // Update topbar
  document.getElementById('nav-controls').style.display = 'flex';
  document.getElementById('topbar-meta').style.display = 'none';
  currentIdx = idx;
  updateNav();
  window.scrollTo(0, 0);
}

function showIndex() {
  filterTable('all');
  document.querySelectorAll('.detail-panel').forEach(function(p){ p.style.display='none'; });
  document.getElementById('index-view').style.display = 'block';
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('nav-controls').style.display = 'none';
  document.getElementById('topbar-meta').style.display = '';
  document.getElementById('topbar-title').textContent = 'Interaction Audit Report';
  window.scrollTo(0, 0);
}

function navigate(dir) {
  var next = currentIdx + dir;
  if (next >= 0 && next < total) showDetail(next);
}

function updateNav() {
  var pages = ${JSON.stringify(pages.map(p => ({ url: p.url, fail: p.fails.length })))};
  var p = pages[currentIdx];
  document.getElementById('nav-info').textContent = 'Page ' + (currentIdx + 1) + ' of ' + total;
  document.getElementById('btn-prev').disabled = currentIdx === 0;
  document.getElementById('btn-next').disabled = currentIdx === total - 1;
  document.getElementById('topbar-title').textContent = (p.fail ? '❌' : '✅') + ' ' + p.url;
}
</script>

</body>
</html>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

test.describe('Interaction Audit', () => {

  // Set by the test body on normal completion; null if interrupted mid-crawl
  let _crawlResult = null;

  // ── afterEach: attach the report regardless of how the test ended ──
  // Playwright runs afterEach even after Ctrl+C, so partial results written
  // to RESULTS_FILE by the engine are picked up here and still get a report.
  test.afterEach(async ({}, testInfo) => {
    let pages, stats;

    if (_crawlResult) {
      // Normal completion — use in-memory results (buffers already Buffer objects)
      ({ pages, stats } = _crawlResult);
    } else if (fs.existsSync(RESULTS_FILE)) {
      // Interrupted — deserialise partial results from disk
      try {
        const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
        pages = raw.map(p => ({
          ...p,
          screenshotBuffer: p.screenshotBuffer ? Buffer.from(p.screenshotBuffer, 'base64') : null,
          popupScreenshots: (p.popupScreenshots || []).map(ps => ({
            label:  ps.label,
            buffer: ps.buffer ? Buffer.from(ps.buffer, 'base64') : null,
          })),
        }));
        stats = {
          totalPages:   pages.length,
          totalFails:   pages.reduce((s, p) => s + p.fails.length, 0),
          totalWarns:   pages.reduce((s, p) => s + p.warns.length, 0),
          runtimeSecs:  '(interrupted)',
          crawlerStats: {},
        };
      } catch { return; }
    } else {
      return; // nothing crawled yet
    }

    if (pages.length === 0) return;

    // Write HTML report directly to disk — keeps Playwright report small and renderable
    fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    fs.writeFileSync(REPORT_FILE, buildHtmlReport(pages, stats));

    await testInfo.attach('crawl-summary.json', {
      body: JSON.stringify({
        stats,
        pages: pages.map(p => ({ url: p.url, counts: p.counts, fails: p.fails, warns: p.warns })),
      }, null, 2),
      contentType: 'application/json',
    });

    for (const p of pages) {
      for (const ps of (p.popupScreenshots || [])) {
        if (!ps.buffer) continue;
        const slug = p.url.replace(/https?:\/\/[^/]+/, '').replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/^-|-$/g, '') || 'home';
        const lbl  = ps.label.slice(0, 20).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '');
        await testInfo.attach(`popup-${slug}-${lbl}.png`, { body: ps.buffer, contentType: 'image/png' });
      }
    }

    // Remove the partial-results file — report is now in the Playwright artefact
    try { fs.unlinkSync(RESULTS_FILE); } catch { /* already gone or never written */ }

    _crawlResult = null;
  });

  test('Full Site Crawl', async () => {
    test.setTimeout(4 * 60 * 60 * 1000);
    _crawlResult = null;

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) throw new Error('BASE_URL not set in .env — cannot run interaction audit');

    // Crawl mode selection via CRAWL_ENDPOINTS env var:
    //   unset                 → full-site crawl from BASE_URL (default)
    //   CRAWL_ENDPOINTS=true  → visit every endpoint from endpoints.config.js
    //   CRAWL_ENDPOINTS=/a,/b → visit only those specific paths (comma-separated)
    const CRAWL_ENDPOINTS = process.env.CRAWL_ENDPOINTS;
    let startInput = baseUrl;
    let crawlMode  = true;

    if (CRAWL_ENDPOINTS) {
      const allEndpoints = require('../../endpoints.config.js');
      const base = baseUrl.replace(/\/$/, '');
      if (CRAWL_ENDPOINTS === 'true' || CRAWL_ENDPOINTS === 'all') {
        startInput = allEndpoints.map(e => e.path.startsWith('http') ? e.path : base + e.path);
      } else {
        startInput = CRAWL_ENDPOINTS.split(',').map(p => {
          p = p.trim();
          return p.startsWith('http') ? p : base + p;
        });
      }
      crawlMode = false;
    }

    const { pages, stats } = await runInteractionAudit(startInput, { crawl: crawlMode, resultsFile: RESULTS_FILE });

    // Store for afterEach (normal path)
    _crawlResult = { pages, stats };

    // ── Playwright annotations ────────────────────────────────────────
    const modeStr = crawlMode
      ? 'full-site crawl'
      : `${Array.isArray(startInput) ? startInput.length : 1} endpoint(s) from config`;
    test.info().annotations.push({
      type:        'Crawl Stats',
      description: `${stats.totalPages} pages | ${stats.totalFails} errors | ${stats.totalWarns} warnings | ${stats.runtimeSecs}s | ${modeStr}`,
    });
    test.info().annotations.push({
      type:        'Report',
      description: 'Open audit-report.html attachment below for the full interactive report (errors, warnings, screenshots per URL)',
    });

    for (const p of pages) {
      const icon = p.fails.length ? '❌' : p.warns.length ? '⚠️' : '✅';
      test.info().annotations.push({
        type:        `${icon} ${p.url}`,
        description: `PASS:${p.counts.PASS}  FAIL:${p.counts.FAIL}  WARN:${p.counts.WARN}  SKIP:${p.counts.SKIP}`,
      });
    }

    for (const p of pages.filter(p => p.fails.length)) {
      test.info().annotations.push({
        type:        'Failures',
        description: `[${p.url}] ` + p.fails.map(f => `[${f.category}] ${f.label}: ${f.detail}`).join(' | '),
      });
    }

    // ── Assert ───────────────────────────────────────────────────────
    if (stats.totalFails > 0) {
      const failList = pages
        .filter(p => p.fails.length)
        .map(p =>
          `  ${p.url}\n` +
          p.fails.map(f => `    ❌ [${f.category}] ${f.label} — ${f.detail}`).join('\n')
        )
        .join('\n');

      throw new Error(
        `\n\n❌ INTERACTION FAILURES — ${stats.totalFails} failure(s) across ` +
        `${pages.filter(p => p.fails.length).length} page(s)\n\n` +
        `${failList}\n\n` +
        `Open audit-report.html in Playwright report → Attachments to review.\n`
      );
    }
  });

});
