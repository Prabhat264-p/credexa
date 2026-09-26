/**
 * Centralized API Client for Credexa Protocol Frontend
 * Ensures all HTTP responses are safely inspected and parsed, preventing
 * raw JSON syntax errors such as "Unexpected end of JSON input".
 * Includes AbortController timeouts to guarantee UI loading states complete.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Safely fetches a URL with a timeout and parses JSON response text if non-empty.
 */
export async function safeFetch<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 45000
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Automatically attach Content-Type header if sending JSON body
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Automatically attach Authorization JWT bearer token if stored
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('credexa_jwt_token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out while contacting the Credexa protocol service. Please try again.');
    }
    throw new Error(`Network error connecting to Credexa protocol service (${err.message || 'Connection refused'}).`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Read raw text first to handle empty or non-JSON responses safely
  const text = await response.text();

  if (!text || text.trim() === '') {
    if (!response.ok) {
      throw new Error(`Credexa protocol service returned error status (${response.status}) with an empty response.`);
    }
    return { ok: response.ok, status: response.status, data: {} as T };
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    throw new Error('Authentication service returned an invalid response.');
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Authenticates user with email and password via POST /api/auth/login.
 */
export async function apiLogin(email: string, password: string) {
  const res = await safeFetch<{ success?: boolean; user?: any; token?: string; error?: string; message?: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok || !res.data.success) {
    throw new Error(res.data.error || res.data.message || 'Authentication failed');
  }

  if (!res.data.user || !res.data.token) {
    throw new Error('Authentication service returned an incomplete response.');
  }

  return { user: res.data.user, token: res.data.token };
}

/**
 * Registers a new user account via POST /api/auth/register.
 */
export async function apiRegister(payload: Record<string, any>) {
  const res = await safeFetch<{ success?: boolean; user?: any; token?: string; error?: string; message?: string }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok || !res.data.success) {
    throw new Error(res.data.error || res.data.message || 'Registration failed');
  }

  if (!res.data.user || !res.data.token) {
    throw new Error('Registration service returned an incomplete response.');
  }

  return { user: res.data.user, token: res.data.token };
}
