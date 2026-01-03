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
  }
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
async function refreshAccessToken(): Promise<string | null> {
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

      const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { accessToken, refreshToken: newRefreshToken } = data.data;
        setTokens(accessToken, newRefreshToken);
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

  // Get access token
  const token = getAccessToken();

  // Set headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchConfig.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make request
  let response = await fetch(url, {
    ...fetchConfig,
    headers,
  });

  // Handle 401 - Token expired
  if (response.status === 401 && token) {
    // Try to refresh token
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry request with new token
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...fetchConfig,
        headers,
      });
    }
  }

  // Parse response
  const data = await response.json();

  if (!response.ok) {
    throw {
      response: {
        status: response.status,
        data,
      },
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
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
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

// Auth API endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<ApiResponse>('/auth/login', credentials),

  register: (data: { email: string; username: string; password: string }) =>
    apiClient.post<ApiResponse>('/auth/register', data),

  logout: () => apiClient.post<ApiResponse>('/auth/logout'),

  me: () => apiClient.get<ApiResponse>('/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse>('/auth/refresh-token', { refreshToken }),
};

// Users API endpoints
export const usersApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/users', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/users/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/users', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/users/${id}`),
};

// Roles API endpoints
export const rolesApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/roles', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/roles/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/roles', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/roles/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/roles/${id}`),

  assignPermissions: (id: string, permissionIds: string[]) =>
    apiClient.post<ApiResponse>(`/roles/${id}/permissions`, { permissionIds }),

  assignMenus: (id: string, menuIds: string[]) =>
    apiClient.post<ApiResponse>(`/roles/${id}/menus`, { menuIds }),
};

// Permissions API endpoints
export const permissionsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/permissions', { params }),

  getGrouped: () => apiClient.get<ApiResponse>('/permissions/grouped'),

  getById: (id: string) => apiClient.get<ApiResponse>(`/permissions/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/permissions', data),

  createCrud: (data: any) => apiClient.post<ApiResponse>('/permissions/crud', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/permissions/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/permissions/${id}`),
};

// Upload API endpoints
export const uploadApi = {
  uploadFile: (file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiClient.post<ApiResponse>('/upload/file', formData);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse>('/upload/avatar', formData);
  },
};

export default apiClient;
