import { routes } from '@/config/routes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_VERSION = 'v1';

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  turnstile_token?: string;
}

interface LoginResponse {
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * Helper function to get CSRF token from cookie
 * Laravel Sanctum stores the CSRF token in XSRF-TOKEN cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return decodeURIComponent(cookie.substring(name.length));
    }
  }

  return null;
}

/**
 * Fetch CSRF cookie from Laravel Sanctum
 * This must be called before making any authenticated requests
 */
export async function getCsrfCookie(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    throw new Error('Failed to initialize CSRF protection');
  }
}

/**
 * Ensure CSRF cookie exists, only fetch if not present
 */
async function ensureCsrfCookie(): Promise<void> {
  const existingToken = getCsrfTokenFromCookie();
  if (!existingToken) {
    await getCsrfCookie();
  }
}

/**
 * Login to Laravel Sanctum API
 * @param credentials - User email and password
 * @returns User data from the API
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    await getCsrfCookie();
    const csrfToken = getCsrfTokenFromCookie();

    const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': csrfToken || '',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (response.status === 422 && errorData.errors) {
        const firstError = Object.values(errorData.errors)[0];
        throw new Error(firstError?.[0] || 'Validation failed');
      }

      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json() as LoginResponse;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Logout from Laravel Sanctum API
 */
export async function logout(): Promise<void> {
  try {
    const csrfToken = getCsrfTokenFromCookie();

    await fetch(`${API_BASE_URL}/api/${API_VERSION}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': csrfToken || '',
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getAuthenticatedUser(): Promise<LoginResponse['data'] | null> {
  try {
    const csrfToken = getCsrfTokenFromCookie();

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': csrfToken || '',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as LoginResponse['data'];
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Make authenticated API request to Laravel backend
 * @param endpoint - API endpoint (relative to base URL)
 * @param options - Fetch options
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = getCsrfTokenFromCookie();

  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': csrfToken || '',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = routes.signIn;
      }
    }

    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function getOltList() {
  return apiRequest(`/api/${API_VERSION}/olt`, {
    method: 'GET',
  });
}

export async function getOltDetail(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}`, {
    method: 'GET',
  });
}

export async function createOlt(data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOlt(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteOlt(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${id}`, {
    method: 'DELETE',
  });
}

export async function getOltInformation(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/information`, {
    method: 'GET',
  });
}

export async function getOltCards(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/cards`, {
    method: 'GET',
  });
}

export async function getOltPonPorts(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/pon-ports`, {
    method: 'GET',
  });
}

export async function getOltUplinks(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/uplink-ports`, {
    method: 'GET',
  });
}

export async function getOltVlans(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/vlans`, {
    method: 'GET',
  });
}

// Get all VLANs
export async function getAllVlans() {
  return apiRequest(`/api/${API_VERSION}/vlans`, {
    method: 'GET',
  });
}

export async function getOltUnconfigured(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${id}/unconfigured`, {
    method: 'GET',
  });
}

export async function getOltSelect(searchName?: string) {
  const params = searchName ? `?name=${encodeURIComponent(searchName)}` : '';
  return apiRequest(`/api/${API_VERSION}/olt/select${params}`, {
    method: 'GET',
  });
}

export async function openTerminal(oltId: number | string) {
  await ensureCsrfCookie();

  const payload = { olt_id: oltId };
  return apiRequest<{ id: string; channel: string }>(`/api/${API_VERSION}/terminal/open`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeTerminal(sessionId: string) {
  return apiRequest(`/api/${API_VERSION}/terminal/${sessionId}/close`, {
    method: 'POST',
  });
}

// Speed Profiles
export async function getSpeedProfiles(upDown?: 'download' | 'upload') {
  const params = upDown ? `?up_down=${upDown}` : '';
  return apiRequest(`/api/${API_VERSION}/speed-profiles${params}`, {
    method: 'GET',
  });
}

export async function createSpeedProfile(data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/speed-profiles`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSpeedProfile(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/speed-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSpeedProfile(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/speed-profiles/${id}`, {
    method: 'DELETE',
  });
}

// Zones
export async function getZones() {
  return apiRequest(`/api/${API_VERSION}/zones`, {
    method: 'GET',
  });
}

export async function createZone(data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/zones`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateZone(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteZone(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/zones/${id}`, {
    method: 'DELETE',
  });
}

// ODbs
export async function getOdbs(zoneId?: string | number) {
  const url = zoneId
    ? `/api/${API_VERSION}/odbs?zone_id=${zoneId}`
    : `/api/${API_VERSION}/odbs`;
  return apiRequest(url, {
    method: 'GET',
  });
}

export async function createOdb(data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/odbs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOdb(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/odbs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteOdb(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/odbs/${id}`, {
    method: 'DELETE',
  });
}

// ONU Types (with multipart form data support)
export async function getOnuTypes() {
  return apiRequest(`/api/${API_VERSION}/onu-types`, {
    method: 'GET',
  });
}

export async function createOnuType(formData: FormData) {
  await ensureCsrfCookie();
  const csrfToken = getCsrfTokenFromCookie();

  const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/onu-types`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': csrfToken || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

export async function updateOnuType(id: number | string, formData: FormData) {
  await ensureCsrfCookie();
  const csrfToken = getCsrfTokenFromCookie();

  // Laravel requires _method field for multipart PUT requests
  formData.append('_method', 'PUT');

  const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/onu-types/${id}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': csrfToken || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

export async function deleteOnuType(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu-types/${id}`, {
    method: 'DELETE',
  });
}

// Authorize ONU
export async function authorizeOnu(data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/authorize`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// VLANs
export async function createVlan(oltId: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/vlans`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVlan(oltId: number | string, vlanId: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/vlans/${vlanId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteVlan(oltId: number | string, vlanId: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/vlans/${vlanId}`, {
    method: 'DELETE',
  });
}

export async function createMultipleVlans(oltId: number | string, vlanRange: string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/multi-vlans`, {
    method: 'POST',
    body: JSON.stringify({ vlan: vlanRange }),
  });
}

export async function deleteMultipleVlans(oltId: number | string, vlanRange: string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/multi-vlans/${vlanRange}`, {
    method: 'DELETE',
  });
}

// Configured ONUs
export async function getConfiguredOnus(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  olt_id?: string;
  zone_id?: string;
  odb_id?: string;
  board?: string;
  port?: string;
  signal_filter?: string;
  pon_type?: string;
  sort_by?: string;
  sort_order?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.olt_id) queryParams.append('olt_id', params.olt_id);
  if (params?.zone_id) queryParams.append('zone_id', params.zone_id);
  if (params?.odb_id) queryParams.append('odb_id', params.odb_id);
  if (params?.board) queryParams.append('board', params.board);
  if (params?.port) queryParams.append('port', params.port);
  if (params?.signal_filter) queryParams.append('signal_filter', params.signal_filter);
  if (params?.pon_type) queryParams.append('pon_type', params.pon_type);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

  const queryString = queryParams.toString();
  const url = `/api/${API_VERSION}/onu/configured${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url, {
    method: 'GET',
  });
}

export async function getSystemInfo() {
  return apiRequest(`/api/${API_VERSION}/system-info`, {
    method: 'GET',
  });
}

// ONU Detail
export async function getOnuDetail(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}`, {
    method: 'GET',
  });
}

// ONU Status
export async function getOnuStatus(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/status`, {
    method: 'GET',
  });
}

// ONU Status and Signal
export async function getOnuStatusAndSignal(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/status-and-signal`, {
    method: 'GET',
  });
}

// ONU Show Running Config
export async function getOnuRunningConfig(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/show-run-config`, {
    method: 'GET',
  });
}

// ONU Hardware/Software Info
export async function getOnuHardwareSoftware(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/show-hw-sw`, {
    method: 'GET',
  });
}

// ONU Traffic (Live)
export async function getOnuTraffic(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/traffic`, {
    method: 'GET',
  });
}

// ONU Serial Number
export async function getOnuSerialNumbers(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/serial-number`, {
    method: 'GET',
  });
}

export async function updateOnuSerialNumber(id: number | string, data: { serial_number: string }) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/serial-number`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Update ONU External ID
export async function updateOnuExternalId(id: number | string, data: { onu_external_id: string }) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/onu-external-id`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ONU Speed Profiles
export async function getOnuSpeedProfiles(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/speed-profiles`, {
    method: 'GET',
  });
}

export async function updateOnuSpeedProfiles(id: number | string, data: { download_speed_id: number | string; upload_speed_id: number | string }) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/speed-profiles`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ONU Traffic Graph
export async function getOnuTrafficGraph(id: number | string, from: number, to: number, step: number) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/traffic-graph?from=${from}&to=${to}&step=${step}`, {
    method: 'GET',
  });
}

// ONU RX Power Graph
export async function getOnuRxPowerGraph(id: number | string, from: number, to: number, step: number) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/rxpower-graph?from=${from}&to=${to}&step=${step}`, {
    method: 'GET',
  });
}

// ONU Actions
export async function rebootOnu(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/reboot`, {
    method: 'POST',
  });
}

export async function updateOnuAdminState(id: number | string, data: { admin_state: string }) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/admin-state`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function resyncOnuConfig(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/resync-config`, {
    method: 'POST',
  });
}

export async function deleteOnu(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}`, {
    method: 'DELETE',
  });
}

// ONU Ethernet Ports
export async function getOnuEthernetPorts(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/ethernet-ports`, {
    method: 'GET',
  });
}

export async function getOnuEthernetPort(onuId: number | string, portId: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${onuId}/ethernet-ports/${portId}`, {
    method: 'GET',
  });
}

export async function updateOnuEthernetPort(onuId: number | string, portId: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${onuId}/ethernet-ports/${portId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ONU Attached VLANs
export async function getOnuAttachedVlans(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/attached-vlans`, {
    method: 'GET',
  });
}

export async function updateOnuAttachedVlans(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/attached-vlans`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ONU Management and VoIP
export async function getOnuMgmtAndVoip(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/mgmt-and-voip`, {
    method: 'GET',
  });
}

export async function updateOnuMgmtAndVoip(id: number | string, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/mgmt-and-voip`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ONU WAN IP Address
export async function getOnuWanIpAddress(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/wan-ip-address`, {
    method: 'GET',
  });
}

// ONU TR069 Info
export async function getOnuTr069Info(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/tr069/info`, {
    method: 'GET',
  });
}

// OLT PON Boards
export async function getOltBoards(oltId: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/boards`, {
    method: 'GET',
  });
}

// OLT PON Board Ports
export async function getOltBoardPorts(oltId: number | string, board: number | string) {
  return apiRequest(`/api/${API_VERSION}/olt/${oltId}/board-ports/${board}`, {
    method: 'GET',
  });
}

// ONU Mode
export async function getOnuMode(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/onu-mode`, {
    method: 'GET',
  });
}

// Fetch VLANs for Management
export async function getOltVlansMgmt(oltId: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/fetch-vlans-mgmt/${oltId}`, {
    method: 'GET',
  });
}

// ONU Location Detail
export async function getOnuLocationDetail(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/onu/${id}/location-detail`, {
    method: 'GET',
  });
}

export async function updateOnuLocationDetail(id: number | string, data: {
  zone_id?: number | string;
  odb_id?: number | string;
  odb_port?: number | string;
  location_name: string;
  description: string;
  contact: string;
  latitude?: string;
  longitude?: string;
}) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${id}/location-detail`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== USERS API ====================

/**
 * Get list of users with pagination, search, and filters
 */
export async function getUsers(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

  const queryString = queryParams.toString();
  const url = `/api/${API_VERSION}/users${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url, {
    method: 'GET',
  });
}

/**
 * Get single user by ID
 */
export async function getUser(id: number | string) {
  return apiRequest(`/api/${API_VERSION}/users/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new user
 */
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update existing user
 */
export async function updateUser(id: number | string, data: {
  name?: string;
  email?: string;
  password?: string;
}) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user
 */
export async function deleteUser(id: number | string) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/users/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Bulk delete users
 */
export async function bulkDeleteUsers(ids: (number | string)[]) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/users/bulk-destroy`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function changePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDashboardOltSummary() {
  return apiRequest(`/api/${API_VERSION}/dashboard/olt-summary`, {
    method: 'GET',
  });
}

// Boards
export async function getBoards(oltId?: string | number) {
  const params = oltId ? `?olt_id=${oltId}` : '';
  return apiRequest(`/api/${API_VERSION}/olt/select-board${params}`, {
    method: 'GET',
  });
}

// Ports
export async function getPorts(oltId?: string | number, board?: string) {
  const params = new URLSearchParams();
  if (oltId) params.append('olt_id', String(oltId));
  if (board) params.append('board', board);
  const queryString = params.toString();
  return apiRequest(`/api/${API_VERSION}/olt/select-port${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
  });
}

// WAN Settings
export async function getOnuWanSettings(onuId: string | number) {
  return apiRequest(`/api/${API_VERSION}/onu/${onuId}/wan-settings`, {
    method: 'GET',
  });
}

export async function updateOnuWanSettings(onuId: string | number, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${onuId}/wan-settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Update ONU Mode
export async function updateOnuMode(onuId: string | number, data: any) {
  await ensureCsrfCookie();
  return apiRequest(`/api/${API_VERSION}/onu/${onuId}/onu-mode`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Batch Actions
export async function submitBatchAction(data: {
  action: string;
  filters: {
    search?: string;
    status?: string;
    olt_id?: string;
    zone_id?: string;
    odb_id?: string;
    board?: string;
    port?: string;
    signal_filter?: string;
    pon_type?: string;
  };
  params?: any;
}) {
  await ensureCsrfCookie();

  // Transform filters to match backend expectations
  const requestData: any = {
    filters: {
      olt_id: data.filters.olt_id ? parseInt(data.filters.olt_id) : undefined,
    },
    ...data.params, // This will include 'actions' object
  };

  // Remove undefined values
  Object.keys(requestData.filters).forEach(key => {
    if (requestData.filters[key] === undefined) {
      delete requestData.filters[key];
    }
  });

  return apiRequest(`/api/${API_VERSION}/onu/batch-actions`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}
