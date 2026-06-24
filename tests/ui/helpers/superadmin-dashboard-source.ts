import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * SuperadminDashboard was split from one monolithic file into a thin shell
 * (`SuperadminDashboard.tsx`) plus child widget components, helpers, and
 * module constants under `features/dashboard/superadmin/`.
 *
 * Source-contract guardrail tests historically read the single file as a
 * string. To preserve those guarantees verbatim after the split, this helper
 * returns the concatenation of the shell plus every file in the `superadmin/`
 * folder, so any asserted snippet that moved into a child still resolves.
 */
const SHELL_PATH = 'features/dashboard/SuperadminDashboard.tsx';
const SUPERADMIN_DIR = 'features/dashboard/superadmin';

export function readSuperadminDashboardSource(): string {
  const shell = readFileSync(SHELL_PATH, 'utf8');
  const children = readdirSync(SUPERADMIN_DIR)
    .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
    .sort()
    .map((name) => readFileSync(join(SUPERADMIN_DIR, name), 'utf8'));
  return [shell, ...children].join('\n');
}
