/**
 * Guards a query-string enum param before it reaches a DB enum column.
 *
 * Passing an unexpected value (e.g. ?status=ALL) straight into a WHERE clause
 * on a Postgres enum throws "invalid input value for enum" and surfaces as a
 * 500. Use this to reject bad values with a clean 4xx instead.
 *
 * Returns true when the value is absent/empty (no filter) or is one of the
 * allowed members.
 */
export function isValidEnumParam<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): boolean {
  if (value === null || value === undefined || value === '') return true;
  return (allowed as readonly string[]).includes(value);
}
