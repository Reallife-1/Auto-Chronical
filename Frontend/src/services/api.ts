import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
).replace(/\/+$/, '');
const SESSION_KEY = 'sb-auth-token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseHasApiPrefix = /\/api$/i.test(API_BASE_URL);
  const pathHasApiPrefix = /^\/api(?:\/|$)/i.test(normalizedPath);
  const suffix =
    baseHasApiPrefix && pathHasApiPrefix
      ? normalizedPath.replace(/^\/api/i, '')
      : normalizedPath;

  return `${API_BASE_URL}${suffix}`;
}

export function storeAuthSession(session: AuthSession): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    }),
  );
}

export function getAccessToken(): string | null {
  const sessionValue = localStorage.getItem(SESSION_KEY);
  if (!sessionValue) return null;

  try {
    const session: { access_token?: string } = JSON.parse(sessionValue);
    return session.access_token ?? null;
  } catch (error) {
    console.error('Unable to read the saved authentication session', error);
    return null;
  }
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export async function apiRequest<T>(
  path: string,
  accessToken?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message =
      responseText || `Request failed with status ${response.status}`;

    try {
      const payload: { message?: string | string[] } = JSON.parse(responseText);
      if (Array.isArray(payload.message)) {
        message = payload.message.join(', ');
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // The backend may return a plain-text error response.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
