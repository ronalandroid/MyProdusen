import type { ApiResponse } from '../../utils/response';
import { parseJsonResponse } from '@/lib/api/safe-json';

// Deprecated: kept for backward compatibility with existing pages
const TOKEN_KEY = 'myprodusen_token';

export interface ClientUserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  employee?: {
    id: string;
    nip: string;
    fullName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    division?: string | null;
    position?: string | null;
    profilePhoto?: string | null;
    defaultShift?: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
    } | null;
    defaultLocation?: {
      id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      radius: number;
    } | null;
  } | null;
}

/**
 * @deprecated Token is now stored in httpOnly cookie. This function checks localStorage for backward compatibility.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // httpOnly cookies are not readable from JavaScript.
  // Existing guards should call fetchProfile() to validate the session server-side.
  return 'cookie-auth';
}

/**
 * @deprecated Token is now stored in httpOnly cookie. This function is kept for backward compatibility.
 */
export function setToken(token: string): void {
  // Token storage moved to httpOnly cookies. Do not store JWT in localStorage.
}

/**
 * @deprecated Token is now stored in httpOnly cookie. This function is kept for backward compatibility.
 */
export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * @deprecated Use credentials: 'include' instead. This function is kept for backward compatibility.
 */
export function getAuthHeaders(): HeadersInit {
  return {};
}

/**
 * Fetch user profile from API
 * Auth token is automatically sent via httpOnly cookie
 */
export async function fetchProfile(): Promise<ClientUserProfile> {
  const response = await fetch('/api/auth/profile', {
    credentials: 'include', // Important: include cookies in request
    cache: 'no-store',
  });

  const result = await parseJsonResponse<ApiResponse<ClientUserProfile>>(response);
  const payload = result.data;

  if (!result.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.error || 'Sesi tidak valid');
  }

  return payload.data;
}

/**
 * Logout user by calling logout API endpoint
 * Server will clear the httpOnly cookie
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Network failure during logout must not trap the user in the app.
  }

  // Clear localStorage token if exists (backward compatibility)
  clearToken();

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
