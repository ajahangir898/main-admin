/**
 * useTenant - Tenant state and handlers extracted from App.tsx
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { Tenant, User, CreateTenantPayload } from '../types';
import { DataService } from '../services/DataService';
import { 
  sanitizeSubdomainSlug, 
  getHostTenantSlug, 
  getCachedTenantIdForSubdomain,
  SESSION_STORAGE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
  DEFAULT_TENANT_SLUG 
} from '../utils/appHelpers';

// Default tenant ID
const DEFAULT_TENANT_ID = 'opbd';

// Lazy load toast to avoid including in initial bundle
let toastModule: typeof import('react-hot-toast') | null = null;
const getToast = async () => {
  if (toastModule) return toastModule;
  toastModule = await import('react-hot-toast');
  return toastModule;
};
const showToast = {
  success: (msg: string) => getToast().then(m => m.toast.success(msg)),
  error: (msg: string) => getToast().then(m => m.toast.error(msg)),
};

export function useTenant() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isTenantSwitching, setIsTenantSwitching] = useState(false);
  const [isTenantSeeding, setIsTenantSeeding] = useState(false);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);

  // Capture the tenant slug (if any) once per session
  const initialHostTenantSlug = useMemo(() => getHostTenantSlug(), []);
  const [hostTenantSlug] = useState<string | null>(initialHostTenantSlug);
  const [hostTenantId, setHostTenantId] = useState<string | null>(null);
  
  // Initialize activeTenantId - try to use cached subdomain tenant ID for instant render
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    // If we have a subdomain, check if we have a cached tenant ID for it
    if (initialHostTenantSlug && initialHostTenantSlug !== DEFAULT_TENANT_SLUG) {
      const cachedTenantId = getCachedTenantIdForSubdomain(initialHostTenantSlug);
      if (cachedTenantId) {
        // Use cached tenant ID for instant render!
        return cachedTenantId;
      }
      return ''; // Defer bootstrap until tenant resolved from slug
    }
    
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sessionTenantId = parsed?.tenantId || parsed?.tenant?.id || parsed?.tenant?._id;
          if (sessionTenantId) return sessionTenantId as string;
        }

        const cachedTenantId = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
        if (cachedTenantId) {
          return cachedTenantId;
        }
      } catch {}
    }

    return DEFAULT_TENANT_ID;
  });

  // Refs
  const tenantSwitchTargetRef = useRef<string | null>(null);
  const tenantsRef = useRef<Tenant[]>([]);
  const hostTenantSlugRef = useRef<string | null>(hostTenantSlug);
  const hostTenantWarningRef = useRef(false);
  const activeTenantIdRef = useRef<string>(activeTenantId);

  useEffect(() => { tenantsRef.current = tenants; }, [tenants]);
  useEffect(() => { activeTenantIdRef.current = activeTenantId; }, [activeTenantId]);
  useEffect(() => { hostTenantSlugRef.current = hostTenantSlug; }, [hostTenantSlug]);

  // Persist active tenant - but NOT for subdomain-locked stores
  // Subdomains should always use their own tenant, not cached value
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't persist tenant ID when on a subdomain - each subdomain has its own tenant
    if (hostTenantSlug && hostTenantSlug !== DEFAULT_TENANT_SLUG) {
      return;
    }
    try {
      if (activeTenantId) {
        window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, activeTenantId);
      } else {
        window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
      }
    } catch {}
  }, [activeTenantId, hostTenantSlug]);

  const applyTenantList = useCallback((tenantList: Tenant[]) => {
    setTenants(tenantList);
    const desiredSlug = hostTenantSlugRef.current ? sanitizeSubdomainSlug(hostTenantSlugRef.current) : '';
    const matchedTenant = desiredSlug
      ? tenantList.find((tenant) => sanitizeSubdomainSlug(tenant.subdomain || '') === desiredSlug)
      : undefined;

    setHostTenantId(matchedTenant ? matchedTenant.id : null);

    if (desiredSlug && !matchedTenant && !hostTenantWarningRef.current) {
      showToast.error(`No storefront configured for ${desiredSlug}.`);
      hostTenantWarningRef.current = true;
    }

    const activeId = activeTenantIdRef.current;
    const activeExists = tenantList.some((tenant) => tenant.id === activeId);

    if (matchedTenant) {
      if (matchedTenant.id !== activeId) {
        setActiveTenantId(matchedTenant.id);
      }
      return;
    }

    if (!activeExists && tenantList.length) {
      setActiveTenantId(tenantList[0].id);
    }
  }, []);

  const refreshTenants = useCallback(async () => {
    // Force refresh - bypass cache to get latest from server
    const tenantList = await DataService.listTenants(true);
    applyTenantList(tenantList);
    return tenantList;
  }, [applyTenantList]);

  // Match tenant by slug
  useEffect(() => {
    if (!hostTenantSlug) return;
    if (hostTenantId) return;
    const desiredSlug = sanitizeSubdomainSlug(hostTenantSlug);
    if (!desiredSlug) return;
    const matchedTenant = tenants.find((tenant) => sanitizeSubdomainSlug(tenant.subdomain || '') === desiredSlug);
    if (matchedTenant) {
      setHostTenantId(matchedTenant.id);
      if (matchedTenant.id !== activeTenantIdRef.current) {
        setActiveTenantId(matchedTenant.id);
      }
    }
  }, [hostTenantSlug, hostTenantId, tenants]);

  const handleTenantChange = useCallback((
    tenantId: string,
    callbacks: {
      onResetChat?: () => void;
      setUser?: (fn: (u: User | null) => User | null) => void;
      setCurrentView?: (view: string) => void;
      setAdminSection?: (section: string) => void;
      setSelectedProduct?: (p: null) => void;
      setSelectedLandingPage?: (p: null) => void;
    } = {}
  ) => {
    if (!tenantId || tenantId === activeTenantId) return;
    if (hostTenantId && tenantId !== hostTenantId) {
      showToast.error('This subdomain is locked to its storefront. Use the primary admin domain to switch tenants.');
      return;
    }
    tenantSwitchTargetRef.current = tenantId;
    setIsTenantSwitching(true);
    callbacks.onResetChat?.();
    setActiveTenantId(tenantId);
    callbacks.setAdminSection?.('dashboard');
    callbacks.setSelectedProduct?.(null);
    callbacks.setSelectedLandingPage?.(null);
    if (callbacks.setUser) {
      callbacks.setUser((user) => user ? { ...user, tenantId } : null);
    }
  }, [activeTenantId, hostTenantId]);

  const handleCreateTenant = useCallback(async (
    payload: CreateTenantPayload,
    options: { activate?: boolean } = { activate: true },
    onTenantChange?: (id: string) => void
  ): Promise<Tenant> => {
    setIsTenantSeeding(true);
    try {
      const newTenant = await DataService.seedTenant(payload);
      let resolvedTenant = newTenant;
      try {
        const refreshed = await refreshTenants();
        const matched = refreshed?.find((tenant) => tenant.id === newTenant.id || tenant.subdomain === newTenant.subdomain);
        if (matched) {
          resolvedTenant = matched;
        }
      } catch (refreshError) {
        console.warn('Unable to refresh tenants after creation', refreshError);
        setTenants(prev => {
          const filtered = prev.filter(t => t.id !== newTenant.id);
          return [newTenant, ...filtered];
        });
      }

      if (options.activate && resolvedTenant?.id && onTenantChange) {
        onTenantChange(resolvedTenant.id);
      }

      showToast.success(`${resolvedTenant.name} is ready`);
      return resolvedTenant;
    } catch (error) {
      console.error('Failed to create tenant', error);
      const message = error instanceof Error ? error.message : 'Unable to create tenant';
      showToast.error(message);
      throw error;
    } finally {
      setIsTenantSeeding(false);
    }
  }, [refreshTenants]);

  const handleDeleteTenant = useCallback(async (
    tenantId: string,
    onTenantChange?: (id: string) => void
  ) => {
    if (!tenantId) return;
    setDeletingTenantId(tenantId);
    try {
      await DataService.deleteTenant(tenantId);
      let fallbackTenantId: string | null = null;
      try {
        const latest = await refreshTenants();
        fallbackTenantId = latest?.[0]?.id || null;
      } catch (refreshError) {
        console.warn('Unable to refresh tenants after deletion', refreshError);
        let candidateId: string | null = null;
        setTenants(prev => {
          const updated = prev.filter(tenant => tenant.id !== tenantId);
          candidateId = updated[0]?.id || null;
          return updated;
        });
        fallbackTenantId = candidateId;
      }

      if (tenantId === activeTenantId) {
        if (fallbackTenantId && onTenantChange) {
          onTenantChange(fallbackTenantId);
        } else {
          setActiveTenantId(DEFAULT_TENANT_ID);
        }
      }
      showToast.success('Tenant removed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete tenant';
      showToast.error(message);
      throw error;
    } finally {
      setDeletingTenantId(null);
    }
  }, [activeTenantId, refreshTenants]);

  // For completing tenant switch after data loads
  const completeTenantSwitch = useCallback((loadError: Error | null) => {
    // Only complete if we actually initiated a tenant switch
    if (tenantSwitchTargetRef.current && tenantSwitchTargetRef.current === activeTenantId) {
      setIsTenantSwitching(false);
      if (loadError) {
        showToast.error('Unable to switch tenants. Please try again.');
      } else {
        const switchedTenant = tenantsRef.current.find((tenant) => tenant.id === activeTenantId);
        showToast.success(`Now viewing ${switchedTenant?.name || 'selected tenant'}`);
      }
      tenantSwitchTargetRef.current = null;
    }
  }, [activeTenantId]);


  return {
    // State
    tenants,
    setTenants,
    activeTenantId,
    setActiveTenantId,
    hostTenantId,
    setHostTenantId,
    hostTenantSlug,
    isTenantSwitching,
    setIsTenantSwitching,
    isTenantSeeding,
    deletingTenantId,
    // Handlers
    applyTenantList,
    refreshTenants,
    handleTenantChange,
    handleCreateTenant,
    handleDeleteTenant,
    completeTenantSwitch,
    // Refs
    tenantsRef,
    activeTenantIdRef,
  };
}
