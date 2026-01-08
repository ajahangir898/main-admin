// Auth Service - Connects frontend with backend authentication API
import type { User, Role, Permission } from '../types';

// Dynamic API URL - works for main domain and all subdomains
const getApiUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'https://systemnextit.com/api';
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // For localhost development (including subdomains like admin.localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return 'http://localhost:5001/api';
  }
  
  // For production - all requests go to main domain API
  // The API handles tenant context via subdomain header
  const parts = hostname.split('.');
  const mainDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  
  return `${protocol}//${mainDomain}/api`;
};

// Get current subdomain (if any)
const getCurrentSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // If we have a subdomain (e.g., amit.systemnextit.com)
  if (parts.length > 2) {
    const subdomain = parts[0];
    // Exclude www, admin, and superadmin as they're not tenant subdomains
    if (subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'superadmin') {
      return subdomain;
    }
    
    // On admin subdomain, check for tenant query parameter
    if (subdomain === 'admin') {
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get('tenant');
      if (tenantParam) {
        return tenantParam;
      }
    }
  }
  
  return null;
};

const API_URL = getApiUrl();

// Storage keys
const TOKEN_KEY = 'admin_auth_token';
const USER_KEY = 'admin_auth_user';
const PERMISSIONS_KEY = 'admin_auth_permissions';

// Helper to get auth header
export const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// Helper to handle API responses
const handleResponse = async (response: Response, clearAuthOn401 = false) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Handle 401 Unauthorized - only clear auth if explicitly requested
    // This prevents automatic logout on page reload when token validation fails
    if (response.status === 401 && clearAuthOn401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
    }
    
    // Handle validation errors (Zod errors)
    if (data.error && Array.isArray(data.error)) {
      const errorMessage = data.error.map((e: any) => e.message).join(', ');
      throw new Error(errorMessage);
    }
    
    // Handle string or object errors
    const errorMessage = typeof data.error === 'string' ? data.error : data.message || `HTTP Error ${response.status}`;
    throw new Error(errorMessage);
  }
  
  return data;
};

// ============== AUTH FUNCTIONS ==============

/**
 * Login user and get JWT token
 * If on a subdomain, includes subdomain in request for tenant verification
 */
export const login = async (email: string, password: string): Promise<{ user: User; token: string; permissions: Permission[] }> => {
  const subdomain = getCurrentSubdomain();
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      // Pass subdomain for tenant-scoped login
      ...(subdomain && { 'X-Tenant-Subdomain': subdomain })
    },
    body: JSON.stringify({ email, password, ...(subdomain && { subdomain }) }),
  });
  
  const data = await handleResponse(response);
  
  // Store in localStorage
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions || []));
  
  return data;
};

/**
 * Register new user
 */
export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: User['role'];
}): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const data = await handleResponse(response);
  
  // Store in localStorage
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  
  return data;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
};

/**
 * Get current user from token
 */
export const getCurrentUser = async (): Promise<{ user: User; permissions: Permission[] }> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeader(),
  });
  
  const data = await handleResponse(response);
  
  // Update localStorage
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions || []));
  
  return data;
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  
  const data = await handleResponse(response);
  localStorage.setItem(TOKEN_KEY, data.token);
  
  return data.token;
};

/**
 * Get current user's permissions
 */
export const getMyPermissions = async (): Promise<Permission[]> => {
  const response = await fetch(`${API_URL}/auth/permissions`, {
    headers: getAuthHeader(),
  });
  
  const data = await handleResponse(response);
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions || []));
  
  return data.permissions;
};

// ============== USER MANAGEMENT FUNCTIONS ==============

/**
 * Get all admin users (requires admin_control permission)
 */
export const getAdminUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/auth/admin/users`, {
    headers: getAuthHeader(),
  });
  
  const data = await handleResponse(response);
  return data.users;
};

/**
 * Create new user (requires admin_control write permission)
 */
export const createUser = async (userData: Omit<User, '_id' | 'id'>): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/admin/users`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(userData),
  });
  
  const data = await handleResponse(response);
  return data.user;
};

/**
 * Update existing user (requires admin_control edit permission)
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(updates),
  });
  
  const data = await handleResponse(response);
  return data.user;
};

/**
 * Delete user (requires admin_control delete permission)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  
  await handleResponse(response);
};

/**
 * Update user's role assignment
 */
export const updateUserRole = async (userEmail: string, roleId: string): Promise<User> => {
  // First find user by email
  const users = await getAdminUsers();
  const user = users.find(u => u.email === userEmail);
  
  if (!user) {
    throw new Error(`User with email ${userEmail} not found`);
  }
  
  const response = await fetch(`${API_URL}/auth/admin/users/${user._id || user.id}/role`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify({ roleId }),
  });
  
  const result = await handleResponse(response);
  return result.data || result.user;
};

// ============== ROLE MANAGEMENT FUNCTIONS ==============

/**
 * Get all roles (requires admin_control read permission)
 */
export const getRoles = async (): Promise<Role[]> => {
  const response = await fetch(`${API_URL}/auth/admin/roles`, {
    headers: getAuthHeader(),
  });
  
  const data = await handleResponse(response);
  return data.data || data.roles || [];
};

/**
 * Create new role (requires admin_control write permission)
 */
export const createRole = async (roleData: Omit<Role, '_id' | 'id'>): Promise<Role> => {
  const response = await fetch(`${API_URL}/auth/admin/roles`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(roleData),
  });
  
  const result = await handleResponse(response);
  return result.data || result.role;
};

/**
 * Update existing role (requires admin_control edit permission)
 */
export const updateRole = async (roleId: string, updates: Partial<Role>): Promise<Role> => {
  const response = await fetch(`${API_URL}/auth/admin/roles/${roleId}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(updates),
  });
  
  const result = await handleResponse(response);
  return result.data || result.role;
};

/**
 * Delete role (requires admin_control delete permission)
 */
export const deleteRole = async (roleId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/admin/roles/${roleId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  
  await handleResponse(response);
};

/**
 * Get available resources for permissions
 */
export const getResources = async (): Promise<{ resources: string[]; actions: string[] }> => {
  const response = await fetch(`${API_URL}/auth/admin/resources`, {
    headers: getAuthHeader(),
  });
  
  return await handleResponse(response);
};

// ============== HELPER FUNCTIONS ==============

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  // Basic JWT expiry check
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Get stored token
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get stored permissions
 */
export const getStoredPermissions = (): Permission[] => {
  const permStr = localStorage.getItem(PERMISSIONS_KEY);
  return permStr ? JSON.parse(permStr) : [];
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (resource: string, action: string): boolean => {
  const user = getStoredUser();
  
  // Super admin has all permissions
  if (user?.role === 'super_admin') return true;
  
  // Admin has all permissions except tenant management
  if (user?.role === 'admin' && resource !== 'tenants') return true;
  
  // Check custom role permissions
  const permissions = getStoredPermissions();
  const perm = permissions.find(p => p.resource === resource);
  return perm?.actions.includes(action as any) ?? false;
};

/**
 * Check if user can read a resource
 */
export const canRead = (resource: string): boolean => hasPermission(resource, 'read');

/**
 * Check if user can write to a resource
 */
export const canWrite = (resource: string): boolean => hasPermission(resource, 'write');

/**
 * Check if user can edit a resource
 */
export const canEdit = (resource: string): boolean => hasPermission(resource, 'edit');

/**
 * Check if user can delete from a resource
 */
export const canDelete = (resource: string): boolean => hasPermission(resource, 'delete');

export default {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  getMyPermissions,
  // Users
  getAdminUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  // Roles
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getResources,
  // Helpers
  isAuthenticated,
  getStoredToken,
  getStoredUser,
  getStoredPermissions,
  hasPermission,
  canRead,
  canWrite,
  canEdit,
  canDelete,
};
