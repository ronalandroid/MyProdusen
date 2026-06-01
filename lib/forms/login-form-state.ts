export function isLoginSubmitDisabled(
  isSubmitting: boolean,
  identifier = '',
  password = '',
): boolean {
  return isSubmitting || identifier.trim().length === 0 || password.length === 0;
}
