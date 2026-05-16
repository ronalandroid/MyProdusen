/**
 * Password Policy Module
 * Enforces strong password requirements for production security
 */

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
 * Check if password has been compromised (basic check)
 * In production, integrate with Have I Been Pwned API
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // For now, just check against common passwords
  // TODO: Integrate with Have I Been Pwned API in production
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
