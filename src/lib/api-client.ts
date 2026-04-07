/**
 * API Client with JWT Authentication
 * Using native fetch API (no axios dependency)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

// Token management
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Also set cookies for middleware authentication
    const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict${isSecure}`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${isSecure}`;
  }
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `accessToken=; path=/; max-age=0; SameSite=Strict${isSecure}`;
    document.cookie = `refreshToken=; path=/; max-age=0; SameSite=Strict${isSecure}`;
  }
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: any[];
}

// Request configuration
interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
}

// Token refresh state
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return null;
      }

      const response = await fetch(
        `${API_URL}${API_PREFIX}/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: any = await response.json();

      if (data.success && data.data) {
        const { accessToken } = data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict${isSecure}`;
        }
        return accessToken;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make API request with automatic token refresh
 */
async function apiRequest<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchConfig } = config;

  // Build URL with query params
  let url = `${API_URL}${API_PREFIX}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = getAccessToken();
  const isFormData = fetchConfig.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchConfig.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...fetchConfig, headers });

  // Handle 401 - Token expired
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...fetchConfig, headers });
    }
  }

  const data: any = await response.json();

  if (!response.ok) {
    throw {
      response: { status: response.status, data },
      message: data.message || 'Request failed',
    };
  }

  return data;
}

/**
 * API client methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers:
        body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    }),

  put: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

export const authApi = {
  login: (credentials: {
    email: string;
    password: string;
    turnstileToken?: string;
  }) => {
    const { turnstileToken, ...rest } = credentials;
    return apiClient.post<any>('/auth/login', {
      ...rest,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    });
  },

  logout: () => apiClient.post<any>('/auth/logout'),

  me: () => apiClient.get<any>('/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<any>('/auth/refresh-token', { refreshToken }),
};

// Upload API endpoints
export const uploadApi = {
  uploadFile: (file: File, folder?: string, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiClient.post<any>('/upload/file', formData);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any>('/upload/avatar', formData);
  },
};

export default apiClient;
