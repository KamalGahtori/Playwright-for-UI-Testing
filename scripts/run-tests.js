#!/usr/bin/env node
// scripts/run-tests.js
// Thin CLI wrapper — maps friendly device/group names to Playwright flags.
//
// Usage: node scripts/run-tests.js <mode> [device] [group]
//   mode    — visual | interaction | baseline | full
//   device  — friendly name (see DEVICE_MAP). Omit for all devices.
//   group   — endpoint group name. Omit for all endpoints.
//
// Examples:
//   node scripts/run-tests.js visual
//   node scripts/run-tests.js visual chrome-desktop
//   node scripts/run-tests.js visual chrome-desktop services
//   node scripts/run-tests.js baseline chrome-desktop homepage
//   node scripts/run-tests.js interaction iphone-12 about-us
//   node scripts/run-tests.js full ipad-pro products

const { execSync } = require('child_process');

const DEVICE_MAP = {
  'chrome-desktop': 'chromium-desktop',
  'chrome':         'chromium-*',
  'firefox':        'firefox-desktop',
  'safari':         'webkit-desktop',
  'webkit':         'webkit-desktop',
  'iphone-12':      'chromium-iphone-12-pro',
  'iphone-8':       'chromium-iphone-8',
  'galaxy-s20':     'chromium-galaxy-s20-ultra',
  'ipad-air':       'chromium-ipad-air',
  'ipad-mini':      'chromium-ipad-mini',
  'ipad-pro':       'chromium-ipad-pro',
};

const [,, mode, device, group, ...extraArgs] = process.argv;
const extra = extraArgs.join(' ');

if (!mode || mode === '--help' || mode === '-h') {
  console.log([
    '',
    'Usage: npm run <visual|interaction|baseline|full> -- [device] [group] [playwright flags]',
    '',
    'Devices : chrome-desktop | chrome | firefox | safari',
    '          iphone-12 | iphone-8 | galaxy-s20 | ipad-air | ipad-mini | ipad-pro',
    'Groups  : homepage | about-us | services | support-services',
    '          products | insights | footer',
    '',
    'Examples:',
    '  npm run visual                                        # all devices, all endpoints',
    '  npm run visual -- chrome-desktop                     # one device',
    '  npm run visual -- chrome-desktop services            # one device, one group',
    '  npm run baseline -- chrome-desktop homepage          # update baseline',
    '  npm run interaction -- iphone-12 about-us            # mobile + group',
    '  npm run full -- ipad-pro products                    # visual + interaction',
    '  npm run interaction -- chrome-desktop homepage --headed   # headed browser',
    '  npm run interaction -- chrome-desktop homepage --debug    # step debugger',
    '',
  ].join('\n'));
  process.exit(0);
}

function buildFlags(device, group) {
  let flags = '';
  if (device) {
    const project = DEVICE_MAP[device];
    if (!project) {
      console.error(`\nUnknown device: "${device}". Run with --help to see available devices.\n`);
      process.exit(1);
    }
    flags += ` --project='${project}'`;
  }
  if (group) {
    // Escape brackets so Playwright's regex matches the literal [group] prefix in test names
    flags += ` --grep "\\[${group}\\]"`;
  }
  return flags;
}

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
}

const flags = buildFlags(device, group);

try {
  switch (mode) {
    case 'visual':
      run(`npx playwright test tests/visual/${flags} ${extra}`);
      break;

    case 'interaction':
      run(`npx playwright test tests/interaction/${flags} ${extra}`);
      break;

    case 'baseline':
      run(`VISUAL_UPDATE=true npx playwright test tests/visual/ --update-snapshots${flags} ${extra}`);
      break;

    case 'full':
      run(`npx playwright test tests/visual/${flags} ${extra}`);
      run(`npx playwright test tests/interaction/${flags} ${extra}`);
      break;

    case 'ui':
      run(`npx playwright test tests/interaction/${flags} --ui ${extra}`);
      break;

    default:
      console.error(`\nUnknown mode: "${mode}". Use: visual | interaction | baseline | full\n`);
      process.exit(1);
  }
} catch (err) {
  process.exit(err.status || 1);
}
