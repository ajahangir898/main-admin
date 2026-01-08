/**
 * useAuth - Authentication handlers extracted from App.tsx
 */

import { useCallback, Dispatch, SetStateAction } from 'react';
import type { User, Tenant } from '../types';
import { isAdminRole, getAuthErrorMessage } from '../utils/appHelpers';

// Default tenant ID
const DEFAULT_TENANT_ID = 'opbd';

// API Base URL
const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : 'https://systemnextit.com';

// Get tenant subdomain from URL for multi-tenant support
const getTenantSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  // Match subdomain.systemnextit.com or subdomain.cartnget.shop
  const match = hostname.match(/^([a-z0-9-]+)\.(systemnextit\.com|cartnget\.shop)$/i);
  return match ? match[1] : null;
};

interface UseAuthOptions {
  tenants: Tenant[];
  users: User[];
  activeTenantId: string;
  setUser: (user: User | null) => void;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setActiveTenantId: (id: string) => void;
  setCurrentView: (view: string) => void;
  setAdminSection: (section: string) => void;
  setSelectedVariant: (variant: null) => void;
}

export function useAuth({
  tenants,
  users,
  activeTenantId,
  setUser,
  setUsers,
  setActiveTenantId,
  setCurrentView,
  setAdminSection,
  setSelectedVariant,
}: UseAuthOptions) {
  
  const tryLegacyLogin = useCallback((email: string, pass: string): boolean => {
    const formattedEmail = email.trim();
    const formattedPass = pass.trim();
    const formattedEmailLower = formattedEmail.toLowerCase();

    const tenantAdmin = tenants.find(
      (tenant) => tenant.adminEmail?.toLowerCase() === formattedEmailLower && tenant.adminPassword === formattedPass
    );
    if (tenantAdmin) {
      // Check if this tenant_admin exists in users array (with saved profile data)
      const existingUser = users.find(u => u.email?.toLowerCase() === formattedEmailLower);
      const adminUser: User = existingUser ? {
        ...existingUser,
        tenantId: tenantAdmin.id
      } : {
        name: `${tenantAdmin.name} Admin`,
        email: formattedEmail,
        role: 'tenant_admin',
        tenantId: tenantAdmin.id
      };
      setUser(adminUser);
      setActiveTenantId(tenantAdmin.id);
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    if (formattedEmailLower === 'admin@admin.com' && formattedPass === 'admin121') {
      const admin: User = {
        name: 'Super Admin',
        email: 'admin@admin.com',
        role: 'super_admin',
        tenantId: activeTenantId || DEFAULT_TENANT_ID
      };
      setUser(admin);
      setActiveTenantId(admin.tenantId || activeTenantId || DEFAULT_TENANT_ID);
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    if (formattedEmailLower === 'admin@super.com' && formattedPass === 'admin121') {
      const admin: User = {
        name: 'Super Admin',
        email: 'admin@super.com',
        role: 'super_admin',
        tenantId: activeTenantId || DEFAULT_TENANT_ID
      };
      setUser(admin);
      setActiveTenantId(admin.tenantId || activeTenantId || DEFAULT_TENANT_ID);
      setAdminSection('dashboard');
      setCurrentView('admin');
      return true;
    }

    const foundUser = users.find(
      (u) => u.email?.toLowerCase() === formattedEmailLower && u.password === formattedPass
    );
    if (foundUser) {
      const userWithTenant = {
        ...foundUser,
        tenantId: foundUser.tenantId || activeTenantId || DEFAULT_TENANT_ID,
      };
      setUser(userWithTenant);
      setActiveTenantId(userWithTenant.tenantId || activeTenantId || DEFAULT_TENANT_ID);
      if (!foundUser.tenantId) {
        setUsers((prev) => prev.map((u) => (u.email === foundUser.email ? userWithTenant : u)));
      }
      if (isAdminRole(userWithTenant.role)) {
        setCurrentView('admin');
        setAdminSection('dashboard');
      }
      return true;
    }

    return false;
  }, [tenants, users, activeTenantId, setUser, setActiveTenantId, setAdminSection, setCurrentView, setUsers]);

  const handleLogin = useCallback(async (email: string, pass: string): Promise<boolean> => {
    const normalizedEmail = email.trim();
    const normalizedPass = pass.trim();
    
    const subdomain = getTenantSubdomain();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (subdomain) {
      headers['x-tenant-subdomain'] = subdomain;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPass }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid email or password.');
    }
    
    const data = await response.json();
    
    // Block admin login from store - redirect to /admin/login
    if (isAdminRole(data.user.role)) {
      throw new Error('Admin users must login at /admin/login');
    }
    
    // Store JWT token for RBAC API calls (customers only)
    localStorage.setItem('admin_auth_token', data.token);
    localStorage.setItem('admin_auth_user', JSON.stringify(data.user));
    localStorage.setItem('admin_auth_permissions', JSON.stringify(data.permissions || []));
    
    const loggedInUser: User = {
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      tenantId: data.user.tenantId || activeTenantId || DEFAULT_TENANT_ID
    };
    setUser(loggedInUser);
    setActiveTenantId(loggedInUser.tenantId || activeTenantId || DEFAULT_TENANT_ID);
    
    return true;
  }, [activeTenantId, setUser, setActiveTenantId]);

  const handleRegister = useCallback(async (newUser: User): Promise<boolean> => {
    if (!newUser.email || !newUser.password) {
      throw new Error('Email and password are required');
    }
    const normalizedEmail = newUser.email.trim().toLowerCase();
    if (users.some((u) => u.email?.toLowerCase() === normalizedEmail)) {
      throw new Error('Email already registered. Try logging in instead.');
    }
    try {
      const scopedUser: User = {
        ...newUser,
        email: normalizedEmail,
        tenantId: newUser.tenantId || activeTenantId,
        role: newUser.role || 'customer'
      };
      setUsers((prev) => [...prev.filter((u) => u.email !== scopedUser.email), scopedUser]);
      setUser(scopedUser);
      if (scopedUser.tenantId) {
        setActiveTenantId(scopedUser.tenantId);
      }
      return true;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, [users, activeTenantId, setUsers, setUser, setActiveTenantId]);

  const handleGoogleLogin = useCallback(async (): Promise<never> => {
    throw new Error('Google login is not available in this environment.');
  }, []);

  const handleLogout = useCallback(async () => {
    // Clear JWT tokens
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_user');
    localStorage.removeItem('admin_auth_permissions');
    
    setUser(null);
    setSelectedVariant(null);
    setAdminSection('dashboard');
    
    // Check if on /admin path (tenant subdomain admin access)
    const isOnAdminPath = typeof window !== 'undefined' && 
      (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
    
    // Check if on admin.* or superadmin.* subdomain
    const isAdminSubdomain = typeof window !== 'undefined' && 
      (window.location.hostname === 'admin.systemnextit.com' || 
       window.location.hostname.startsWith('admin.'));
    const isSuperAdminSubdomain = typeof window !== 'undefined' && 
      (window.location.hostname === 'superadmin.systemnextit.com' || 
       window.location.hostname.startsWith('superadmin.'));
    
    if (isAdminSubdomain || isSuperAdminSubdomain) {
      // On admin/superadmin subdomain, show login page
      setCurrentView('admin-login');
    } else if (isOnAdminPath) {
      // On tenant subdomain with /admin path, redirect to store home
      setCurrentView('store');
      window.history.pushState({}, '', '/');
    } else {
      setCurrentView('store');
    }
  }, [setUser, setCurrentView, setSelectedVariant, setAdminSection]);

  const handleUpdateProfile = useCallback((updatedUser: User) => {
    const userWithTenant = { ...updatedUser, tenantId: updatedUser.tenantId || activeTenantId };
    setUser(userWithTenant);
    setUsers(prev => {
      // Check if user exists in array
      const exists = prev.some(u => u.email === updatedUser.email);
      if (exists) {
        // Update existing user
        return prev.map(u => u.email === updatedUser.email ? userWithTenant : u);
      } else {
        // Add user if they don't exist (e.g., tenant_admin created from tenant credentials)
        return [...prev, userWithTenant];
      }
    });
  }, [activeTenantId, setUser, setUsers]);

  return {
    tryLegacyLogin,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    handleUpdateProfile,
  };
}
