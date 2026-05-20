#!/usr/bin/env node
/**
 * Sanity-check the design reference contract.
 *
 * - Fails when canonical reference screenshots, the README, or the design
 *   checklist are missing.
 * - Fails when the checklist no longer mentions every screen file by name
 *   (catches the "we replaced the file but forgot to update the checklist"
 *   regression).
 * - Fails when the email style guide goes missing.
 *
 * Pure file inspection. Wired into `npm run release:check` so any merge that
 * silently breaks the design contract is rejected before deploy.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const referencesDir = path.join(root, 'docs', 'references');
const screensDir = path.join(referencesDir, 'screens');
const checklistPath = path.join(referencesDir, 'design-checklist', 'README.md');
const readmePath = path.join(referencesDir, 'README.md');
const emailGuidePath = path.join(referencesDir, 'email-style-guide', 'README.md');
const logoPath = path.join(referencesDir, 'myprodusen-logo.png');

const REQUIRED_SCREENS = new Set([
  'employee-full-ui-ux-mobile.png',
  'super-admin-full-ui-ux-desktop.png',
  'super-admin-full-ui-ux-mobile.png',
  'full-ui-ux-emailing-system.png',
]);

const errors = [];
const warnings = [];

function requireFile(target, label) {
  if (!existsSync(target)) {
    errors.push(`${label} missing at ${path.relative(root, target)}`);
    return false;
  }
  if (!statSync(target).isFile()) {
    errors.push(`${label} is not a regular file at ${path.relative(root, target)}`);
    return false;
  }
  return true;
}

function requireDir(target, label) {
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    errors.push(`${label} missing at ${path.relative(root, target)}`);
    return false;
  }
  return true;
}

requireDir(referencesDir, 'docs/references directory');
requireDir(screensDir, 'docs/references/screens directory');
requireFile(readmePath, 'docs/references/README.md');
requireFile(checklistPath, 'docs/references/design-checklist/README.md');
requireFile(emailGuidePath, 'docs/references/email-style-guide/README.md');
requireFile(logoPath, 'docs/references/myprodusen-logo.png');

let actualScreens = [];
if (existsSync(screensDir) && statSync(screensDir).isDirectory()) {
  actualScreens = readdirSync(screensDir).filter((entry) => entry.endsWith('.png'));
}

for (const required of REQUIRED_SCREENS) {
  if (!actualScreens.includes(required)) {
    errors.push(`required screen ${required} missing under docs/references/screens/`);
  }
}

for (const extra of actualScreens) {
  if (!REQUIRED_SCREENS.has(extra)) {
    warnings.push(`docs/references/screens/${extra}: not part of the canonical set; remove or document.`);
  }
}

if (existsSync(checklistPath)) {
  const checklist = readFileSync(checklistPath, 'utf8');

  const referencedScreens = [
    'employee-full-ui-ux-mobile.png',
    'super-admin-full-ui-ux-desktop.png',
    'super-admin-full-ui-ux-mobile.png',
    'full-ui-ux-emailing-system.png',
  ];
  for (const screen of referencedScreens) {
    if (!checklist.includes(screen)) {
      errors.push(`design-checklist/README.md does not reference ${screen}`);
    }
  }

  if (!/EMPLOYEE APP SHELL/i.test(checklist)) {
    errors.push('design-checklist/README.md missing "EMPLOYEE APP SHELL" section');
  }
  if (!/SUPER ADMIN APP SHELL/i.test(checklist)) {
    errors.push('design-checklist/README.md missing "SUPER ADMIN APP SHELL" section');
  }
  if (!/EMAILING SYSTEM/i.test(checklist)) {
    errors.push('design-checklist/README.md missing "EMAILING SYSTEM" section');
  }
  if (!/Brand tokens/i.test(checklist)) {
    errors.push('design-checklist/README.md missing "Brand tokens" section');
  }
}

const print = (label, lines) => {
  if (!lines.length) return;
  console.log(`\n${label}:`);
  for (const line of lines) console.log(`  - ${line}`);
};

print('ERRORS', errors);
print('WARNINGS', warnings);

if (!errors.length && !warnings.length) {
  console.log(`Reference contract check passed (${actualScreens.length} screen(s) on disk).`);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s) found. Fix before deploying.`);
  process.exit(1);
}
