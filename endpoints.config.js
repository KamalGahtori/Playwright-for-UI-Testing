// endpoints.config.js
// ─────────────────────────────────────────────────────────────────────
// Centralized Endpoints Configuration
//
// PURPOSE:
//   This file contains all the URLs you want to run visual regression
//   tests against. The dynamic test suite will loop through this array.
//
// HOW TO ADD AN ENDPOINT:
//   Just add a new object to the array below. 
//   Masking, Clicking, and Hiding are now handled GLOBALLY in base-fixtures.js.
// ─────────────────────────────────────────────────────────────────────

module.exports = [
  {
    id: 'Homepage',
    path: '/',
  },
  {
    id: 'About Us',
    path: '/about-us-ksolves',
  },
  {
    id: 'Life at Ksolves',
    path: '/life-at-ksolves',
  },
  {
    id: 'Legacy Circle',
    path: '/legacy-circle',
  },
  {
    id: 'Careers',
    path: '/careers',
  },
  {
    id: 'Investors',
    path: '/investors',
  }
];
