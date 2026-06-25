import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The settings page was split from one monolithic file into a thin shell
 * (`app/dashboard/settings/page.tsx`) plus per-tab child components and shared
 * types/utilities under `app/dashboard/settings/components/`.
 *
 * Source-contract guardrail tests historically read the single file as a
 * string. To preserve those guarantees verbatim after the split, this helper
 * returns the concatenation of the shell plus every file in the `components/`
 * folder, so any asserted snippet that moved into a child still resolves.
 */
const SHELL_PATH = 'app/dashboard/settings/page.tsx';
const COMPONENTS_DIR = 'app/dashboard/settings/components';

export function readSettingsSource(): string {
  const shell = readFileSync(SHELL_PATH, 'utf8');
  const children = readdirSync(COMPONENTS_DIR)
    .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
    .sort()
    .map((name) => readFileSync(join(COMPONENTS_DIR, name), 'utf8'));
  return [shell, ...children].join('\n');
}
