#!/usr/bin/env node
/**
 * Static release gate check for optional gamification and theme experiments.
 * Defaults must stay safe: experiments off unless explicit release approval exists.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ENV = process.env;
const errors = [];

function isTrue(name) {
  return String(ENV[name] || '').trim().toLowerCase() === 'true';
}

function requireDocContains(filePath, requiredText) {
  if (!existsSync(filePath)) {
    errors.push(`${filePath}: missing`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  if (!content.includes(requiredText)) {
    errors.push(`${filePath}: must document "${requiredText}"`);
  }
}

for (const flag of ['FEATURE_GAMIFICATION_ENABLED', 'NEXT_PUBLIC_FEATURE_GAMIFICATION_ENABLED']) {
  if (isTrue(flag) && !isTrue('GAMIFICATION_RELEASE_APPROVED')) {
    errors.push(`${flag}: requires GAMIFICATION_RELEASE_APPROVED=true before release`);
  }
}

for (const flag of ['THEME_EXPERIMENT_ENABLED', 'NEXT_PUBLIC_THEME_EXPERIMENT_ENABLED']) {
  if (isTrue(flag) && !isTrue('THEME_RELEASE_APPROVED')) {
    errors.push(`${flag}: requires THEME_RELEASE_APPROVED=true before release`);
  }
}

requireDocContains(path.join('docs', 'TESTING_QA.md'), 'Gamification/theme release gates');
requireDocContains(path.join('docs', 'SECURITY.md'), 'Gamification/theme release gates');

if (errors.length) {
  console.log('\nERRORS:');
  for (const error of errors) console.log(`  - ${error}`);
  console.error(`\n${errors.length} release gate error(s) found. Fix before deploying.`);
  process.exit(1);
}

console.log('Release gate check passed.');
