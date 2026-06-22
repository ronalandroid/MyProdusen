/**
 * Password Policy Module
 * Enforces strong password requirements for production security
 */

import { createHash } from 'crypto';

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
}

const DEFAULT_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
};

// Common weak passwords to block
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football', 'admin',
  'admin123', 'root', 'toor', 'pass', 'test', 'guest',
  'dimsum', 'produsen', 'myprodusen', 'medan'
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicyConfig = DEFAULT_POLICY
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`Password harus minimal ${policy.minLength} karakter`);
  }

  // Check uppercase requirement
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }

  // Check lowercase requirement
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }

  // Check numbers requirement
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }

  // Check special characters requirement
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter spesial (!@#$%^&* dll)');
  }

  // Check against common passwords
  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push('Password terlalu umum, gunakan password yang lebih unik');
    }

  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength score (0-4)
 * 0 = Very Weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  // Length bonus
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  // Penalize common patterns
  if (/^[0-9]+$/.test(password)) score = Math.max(0, score - 2);
  if (/^[a-zA-Z]+$/.test(password)) score = Math.max(0, score - 1);
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = 0;

  return Math.min(4, score);
}

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if a password has appeared in a known data breach.
 *
 * Uses the Have I Been Pwned "range" API with k-anonymity: only the first 5
 * characters of the password's SHA-1 hash ever leave this process — never the
 * password itself. The `Add-Padding` header obscures the response size.
 *
 * Best-effort and FAIL-OPEN: any network error, timeout, or non-200 response
 * resolves to `false`, so a slow or unreachable HIBP can never block a
 * legitimate registration or password change. A fast local check against the
 * embedded common-password list runs first.
 */
export async function checkPasswordCompromised(
  password: string,
  timeoutMs = 2500,
): Promise<boolean> {
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return true;

  // Keep the test suite hermetic: skip the external HIBP call under the test
  // runner (the local common-password check above still applies). The dedicated
  // unit test stubs VITEST off to exercise the network path against a mock.
  if (process.env.VITEST) return false;

  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let body: string;
    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: { 'Add-Padding': 'true' },
      });
      if (!res.ok) return false; // fail open on non-200
      body = await res.text();
    } finally {
      clearTimeout(timer);
    }

    for (const line of body.split('\n')) {
      const [hashSuffix, countRaw] = line.trim().split(':');
      if (hashSuffix === suffix) {
        const count = parseInt(countRaw, 10);
        return Number.isFinite(count) && count > 0;
      }
    }
    return false;
  } catch {
    return false; // network error / timeout / abort → fail open
  }
}
