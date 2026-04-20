// endpoints.config.js
// ─────────────────────────────────────────────────────────────────────
// Registry of pages under visual regression test.
//
// HOW TO ADD A PAGE:
//   1. Add a new object to the array: { id: 'Page-Id', path: '/url-path' }
//   2. Run: npm run update:baseline -- -g "[Page-Id]"
//   3. Run: npm run test:visual -- -g "[Page-Id]"   (verify it passes)
//
// FIELDS:
//   id   — Used as the screenshot filename and in test names.
//           Use Title Case with hyphens for spaces (e.g. 'About-Us').
//           Must be unique across all entries.
//   path — URL path relative to BASE_URL from .env.
//           Must start with '/'.
//
// NOTHING ELSE BELONGS HERE. No selectors, no masks, no timeouts.
// All detection and stabilisation is handled universally in utils/.
// ─────────────────────────────────────────────────────────────────────

module.exports = [
  { id: 'Homepage',       path: '/' },
  { id: 'About-Us',       path: '/about-us-ksolves' },
  { id: 'Life-at-Ksolves', path: '/life-at-ksolves' },
  { id: 'Legacy-Circle',  path: '/legacy-circle' },
  { id: 'Careers',        path: '/careers' },
  { id: 'Investors',      path: '/investors' },
  { id: 'AI-ML-Services', path: '/ai-ml-services' },
];
