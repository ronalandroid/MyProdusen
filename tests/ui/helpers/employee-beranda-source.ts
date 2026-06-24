import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * EmployeeBeranda was split from one monolithic file into a thin shell
 * (`EmployeeBeranda.tsx`) plus child components, a hook, helpers, and types
 * under `src/components/dashboard/employee/`.
 *
 * Source-contract guardrail tests historically read the single file as a
 * string. To preserve those guarantees verbatim after the split, this helper
 * returns the concatenation of the shell plus every file in the `employee/`
 * folder, so any asserted snippet that moved into a child still resolves.
 */
const SHELL_PATH = 'src/components/dashboard/EmployeeBeranda.tsx';
const EMPLOYEE_DIR = 'src/components/dashboard/employee';

export function readEmployeeBerandaSource(): string {
  const shell = readFileSync(SHELL_PATH, 'utf8');
  const children = readdirSync(EMPLOYEE_DIR)
    .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
    .sort()
    .map((name) => readFileSync(join(EMPLOYEE_DIR, name), 'utf8'));
  return [shell, ...children].join('\n');
}
