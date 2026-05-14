import type { ApiResponse } from './utils/response';

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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProfile(): Promise<ClientUserProfile> {
  const response = await fetch('/api/auth/profile', {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = (await response.json()) as ApiResponse<ClientUserProfile>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || 'Sesi tidak valid');
  }

  return payload.data;
}

export function logout(): void {
  clearToken();
}
