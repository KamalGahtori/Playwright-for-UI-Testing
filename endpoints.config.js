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
    id: 'homepage',
    path: '/',
  },
  {
    id: 'about-us',
    path: '/about-us-ksolves',
  }
];
