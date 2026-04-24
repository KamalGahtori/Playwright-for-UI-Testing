# Ksolves UI Testing Framework — Management Brief

**Project:** Automated UI Testing for ksolves.com  
**Date:** April 2026  
**Built by:** Kamal Gahtori, with AI (Claude by Anthropic)

---

## What We Built

Two fully automated test suites that run on-demand or on a schedule:

1. **Visual Regression** — Takes pixel-level full-page screenshots of every marketing page across 9 browser/device combinations and compares them to approved reference images. Any layout shift, broken image, font change, or spacing difference is flagged automatically.

2. **Interaction Audit** — Crawls the entire ksolves.com website from the homepage (all pages, all depths — blog, case studies, guides, landing pages), then checks every interactive element on every discovered page: buttons, links, inputs, dropdowns, navigation menus, images, and popups.

**One command triggers each suite. Results are readable by anyone — no technical knowledge needed.**

---

## The Problem Before Automation

ksolves.com has 67+ registered marketing pages plus unlisted blog posts, case studies, and guides — all running on WordPress with a performance plugin that aggressively delays loading. A single plugin update, CSS change, or content edit can silently break layouts or links across many pages.

| Manual task | Time required | Reality |
|---|---|---|
| Visual check of 67 pages on 1 device | ~5 hours | Skipped or partial |
| Visual check across 9 devices | ~45 hours | Never done |
| Link health check across full site | ~3 hours | Done inconsistently |
| Button/input clickability audit | ~4 hours | Rarely done |
| Navigation menu hover on all pages | ~2 hours | Skipped |
| **Total per release** | **~54 hours** | **In practice: ~0** |

**Broken elements were caught only after users reported them.**

---

## After Automation

| Activity | Time | Human involvement |
|---|---|---|
| Visual test — all pages, 1 device | ~25 minutes | Unattended |
| Interaction audit — 100 pages | ~60–90 minutes | Unattended |
| Reviewing visual report (failures only) | 10–20 minutes | Engineer decision |
| Reviewing interaction report | 15–30 minutes | Engineer decision |

**54 hours of manual work → 30–45 minutes of human review. Tests run while the team works on other things.**

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| **Playwright** | 1.59 | Browser automation, screenshot comparison, test runner |
| **Crawlee** | 3.16 | Full-site crawling (built on top of Playwright) |
| **Node.js** | v22 LTS | Runtime |
| **dotenv** | v17 | Environment config (`BASE_URL` only — no secrets) |

**Language:** JavaScript (CommonJS). No build step, no compilation — anyone can read and edit any file directly.

**3,040 lines of source code** across 8 core files.

---

## System Requirements

### To run locally
| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 2 GB | 4 GB |
| Disk (code + node_modules) | 250 MB | — |
| Disk (golden baselines, all 9 devices) | 1 GB | 2 GB (grows with pages) |
| Node.js | v22+ | v22 LTS |
| Internet | Required | Stable broadband |

### For CI/CD (GitHub Actions / Jenkins / GitLab CI)
- Runner with Node.js v22, 4–8 GB RAM
- Cache `node_modules/` and Playwright browser binaries between runs (~120 MB + ~300 MB)
- Golden baselines committed to git — checked out as part of the repo
- Visual and interaction jobs run separately (visual: ~30 min; interaction: 1–4 hours)
- Triggered on: every deploy to staging, or nightly schedule

---

## Performance Benchmarks

### Visual Suite
| Pages | Devices | Workers | Time |
|---|---|---|---|
| 67 pages | 1 device | 5 parallel | ~25 minutes |
| 67 pages | 9 devices | 5 parallel | ~3.5 hours |
| Per page (1 device) | — | — | ~18–22 seconds |

Memory peak: ~800 MB–1.2 GB (5 parallel Chromium browsers)  
Results size per run: ~2–5 MB (HTML report, diffs)

### Interaction Suite
| Pages | Concurrency | Time |
|---|---|---|
| 100 pages | 1 (sequential) | ~60–90 minutes |
| 300 pages | 1 (sequential) | ~3–4 hours |
| Per page | — | ~30–60 seconds |

Memory peak: ~400–600 MB (single Chromium browser, sequential)  
Results size per run: ~50–150 MB (HTML report + screenshots)

---

## How AI Accelerated This Build

This framework was built with **Claude (Anthropic's AI)** as a coding collaborator. Here is the honest breakdown:

### What would have taken weeks manually

| Problem | Manual path | With AI |
|---|---|---|
| WP Rocket lazy-loading (images blank in screenshots) | Days of debugging, scattered forum research | Root cause identified + 3-pass loading strategy written in one session |
| Dynamic content detection (carousels, counters, chat widgets) | Hardcoded selector lists per page — brittle, breaks on every new page | Behavioral scan design (observe DOM over 500ms, compare changes) — zero hardcoded selectors, works on any page |
| Crawlee page count bug (`MAX_PAGES` only crawling 1 page) | Hours of adding logs, reading Crawlee source | Root cause traced in minutes: retries counted against the page budget |
| Playwright 1.49 breaking change (`--update-snapshots` behavior) | Hours reading changelogs, dead-end debugging | Diagnosed from symptoms in one conversation |
| Architecture decisions (no hardcoded selectors, mask content not containers, separated configs) | Would emerge through painful failures over months | Reasoned through upfront, encoded as rules — prevents future brittleness |

### What AI specifically cannot replace
The human engineer defined all requirements, made every architectural decision, tested every output on the real site, drove all debugging with real logs, and made every final call. Claude translated requirements into code and identified non-obvious root causes.

**The model:** human judgment + direction × AI speed and code quality = framework that would have taken 3–4 months solo built in weeks.

### Estimated time saved
| Activity | Manual estimate | With AI | Saved |
|---|---|---|---|
| WP Rocket compatibility research + implementation | 5–7 days | 1 day | ~5 days |
| Behavioral volatility detector design + implementation | 10+ days | 3 days | ~7 days |
| Interaction engine (Crawlee integration, all checks) | 15+ days | 5 days | ~10 days |
| Full documentation (README, CLAUDE.md, framework overview) | 3 days | 4 hours | ~2.5 days |
| Debugging and fixing subtle bugs | 5+ days | 1 day | ~4 days |
| **Total** | **~38+ days** | **~10 days** | **~28 days saved** |

---

## Limitations

| Limitation | Impact | Path forward |
|---|---|---|
| No authenticated pages tested | Login-gated content not covered | Add login flow to base fixtures |
| No form submission | Forms checked for presence/state only, not end-to-end | Intentional — avoids live test data |
| Social media links not HTTP-verified | LinkedIn/Twitter appear as WARN (manual check needed) | Corporate firewalls block HEAD requests to social — by design |
| Interaction crawl capped at 300 pages | Very large crawls may not cover all pages | `MAX_PAGES` is a single constant — raise as needed |
| No performance metrics | No Lighthouse, no Web Vitals | Add Lighthouse CI as a separate step |
| Visual tests are OS-sensitive | Different machines may have font rendering differences | 2% pixel tolerance absorbs most of this; re-capture baselines on new environments |

---

## What's Next

| Enhancement | Business value | Effort |
|---|---|---|
| GitHub Actions / Jenkins CI schedule | Tests run automatically on every deploy or nightly — zero manual triggering | Medium |
| Slack/email alerts on failure | Team notified immediately, no need to check reports manually | Low |
| Lighthouse performance scores | Core Web Vitals per page, automated | Medium |
| Mobile interaction audit | Currently interaction runs desktop only | Medium |
| Authenticated page coverage | Test logged-in user flows | Medium |

---

*Codebase: 3,040 lines · 8 source files · 392 KB (excluding baselines and dependencies)*  
*Framework version: 1.0.0 · Node.js v22 · Playwright 1.59 · Crawlee 3.16*
