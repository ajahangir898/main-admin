import React, { useEffect, useCallback, useRef } from 'react';
import type { FacebookPixelConfig, User, Order, Product, Category, SubCategory, ChildCategory, Brand, Tag, LandingPage } from '../types';
import { DataService, joinTenantRoom, leaveTenantRoom } from '../services/DataService';
import { useDataRefreshDebounced } from './useDataRefresh';
import { DEFAULT_CATEGORIES, DEFAULT_SUB_CATEGORIES, DEFAULT_BRANDS, DEFAULT_TAGS } from './useAppState';
import {
  isAdminRole,
  normalizeProductCollection,
  hasCachedData,
  sanitizeSubdomainSlug,
  setCachedTenantIdForSubdomain,
  SESSION_STORAGE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
} from '../utils/appHelpers';
import { isMainDomain, DEMO_PRODUCTS, DEMO_WEBSITE_CONFIG, DEMO_CATEGORIES, DEMO_BRANDS } from '../utils/demoData';

// Check if we're on the admin subdomain
const isAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'admin.systemnextit.com' || 
   window.location.hostname.startsWith('admin.'));

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'superadmin.systemnextit.com' || 
   window.location.hostname.startsWith('superadmin.'));

interface UseAppEffectsProps {
  // State
  activeTenantId: string;
  hostTenantSlug: string;
  currentView: string;
  user: User | null;
  products: Product[];
  categories: Category[];
  isAdminChatOpen: boolean;
  tenants: any[];
  
  // Setters
  setIsLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setCurrentView: (view: string) => void;
  setAdminSection: (section: string) => void;
  setActiveTenantId: (id: string) => void;
  setHostTenantId: (id: string) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: Order[]) => void;
  setLogo: (logo: string | null) => void;
  setThemeConfig: (config: any) => void;
  setWebsiteConfig: (config: any) => void;
  setDeliveryConfig: (config: any) => void;
  setCourierConfig: (config: any) => void;
  setFacebookPixelConfig: (config: FacebookPixelConfig) => void;
  setUsers: (users: User[]) => void;
  setRoles: (roles: any[]) => void;
  setCategories: (categories: Category[]) => void;
  setSubCategories: (subCategories: SubCategory[]) => void;
  setChildCategories: (childCategories: ChildCategory[]) => void;
  setBrands: (brands: Brand[]) => void;
  setTags: (tags: Tag[]) => void;
  setLandingPages: (pages: LandingPage[]) => void;
  setChatMessages: (messages: any[]) => void;
  setHasUnreadChat: (hasUnread: boolean) => void;

  // Callbacks
  loadChatMessages: (messages: any[], tenantId: string) => void;
  completeTenantSwitch: (error: Error | null) => void;
  applyTenantList: (tenants: any[]) => void;
  handleCloseAdminChat: () => void;

  // Refs
  refs: any;
  currentViewRef: React.RefObject<string>;
  activeTenantIdRef: React.RefObject<string>;
  skipNextChatSaveRef: React.RefObject<boolean>;
  chatMessagesRef: React.RefObject<any[]>;
  isAdminChatOpenRef: React.RefObject<boolean>;
}

// Helper to hide preload skeleton
const hidePreloadSkeleton = () => {
  if (typeof window !== 'undefined' && typeof (window as any).__hidePreloadSkeleton__ === 'function') {
    (window as any).__hidePreloadSkeleton__();
  }
};

/**
 * Hook for session restoration on app load
 */
export const useSessionRestoration = ({
  setUser,
  setCurrentView,
  setActiveTenantId,
  refs,
}: Pick<UseAppEffectsProps, 'setUser' | 'setCurrentView' | 'setActiveTenantId' | 'refs'>) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      refs.sessionRestoredRef.current = true;
      return;
    }
    
    if (isSuperAdminSubdomain) {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.role === 'super_admin') {
            setUser(parsed);
            setCurrentView('super-admin');
            refs.sessionRestoredRef.current = true;
            hidePreloadSkeleton();
            return;
          }
        } catch (e) {
          console.error('Session restoration error:', e);
        }
      }
      setCurrentView('admin-login');
      refs.sessionRestoredRef.current = true;
      hidePreloadSkeleton();
      return;
    }
    
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      if (isAdminSubdomain) {
        setCurrentView('admin-login');
        hidePreloadSkeleton();
      }
      refs.sessionRestoredRef.current = true;
      return;
    }
    
    try {
      const parsed = JSON.parse(stored);
      if (parsed) {
        setUser(parsed);
        const tenantInfo = (parsed as any).tenant;
        const parsedTenantId = parsed.tenantId || tenantInfo?.id || tenantInfo?._id;
        if (parsedTenantId) setActiveTenantId(parsedTenantId);
        const isOnAdminPath = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
        if ((isAdminSubdomain || isOnAdminPath) && parsed.role && ['super_admin', 'admin', 'tenant_admin', 'staff'].includes(parsed.role)) {
          setCurrentView('admin');
        }
      }
    } catch (error) {
      console.error('Unable to restore session', error);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    } finally {
      refs.sessionRestoredRef.current = true;
    }
  }, []);
};

/**
 * Hook to persist user session to localStorage
 */
export const useSessionPersistence = ({
  user,
  refs,
}: Pick<UseAppEffectsProps, 'user' | 'refs'>) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!refs.sessionRestoredRef.current) return;
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    }
  }, [user, refs.sessionRestoredRef]);
};

/**
 * Hook to handle user role changes and view transitions
 */
export const useUserRoleEffect = ({
  user,
  activeTenantId,
  currentViewRef,
  refs,
  setActiveTenantId,
  setCurrentView,
  setAdminSection,
}: Pick<UseAppEffectsProps, 'user' | 'activeTenantId' | 'currentViewRef' | 'refs' | 'setActiveTenantId' | 'setCurrentView' | 'setAdminSection'>) => {
  useEffect(() => {
    if (!user) {
      const isOnAdminPath = typeof window !== 'undefined' && 
        (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
      if (refs.sessionRestoredRef.current && currentViewRef.current.startsWith('admin') && (isAdminSubdomain || isOnAdminPath)) {
        setCurrentView('admin-login');
        setAdminSection('dashboard');
      }
      return;
    }
    const resolvedTenantId = user.tenantId || activeTenantId;
    if (resolvedTenantId !== activeTenantId) setActiveTenantId(resolvedTenantId);
    const isOnAdminPath = typeof window !== 'undefined' && 
      (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
    if (isAdminRole(user.role) && !currentViewRef.current.startsWith('admin') && !currentViewRef.current.startsWith('super') && (isAdminSubdomain || isOnAdminPath)) {
      if (user.role === 'super_admin') {
        setCurrentView('super-admin');
      } else {
        setCurrentView('admin');
      }
      setAdminSection('dashboard');
    }
  }, [user, activeTenantId, setActiveTenantId, setCurrentView, setAdminSection, currentViewRef, refs.sessionRestoredRef]);
};

/**
 * Hook for socket room management
 */
export const useSocketRoom = (activeTenantId: string) => {
  useEffect(() => {
    if (!activeTenantId) return;
    const timer = setTimeout(() => joinTenantRoom(activeTenantId), 3500);
    return () => {
      clearTimeout(timer);
      leaveTenantRoom(activeTenantId);
    };
  }, [activeTenantId]);
};

/**
 * Hook for initial data loading
 */
export const useInitialDataLoad = ({
  activeTenantId,
  hostTenantSlug,
  loadChatMessages,
  completeTenantSwitch,
  setActiveTenantId,
  setHostTenantId,
  setIsLoading,
  setProducts,
  setOrders,
  setLogo,
  setThemeConfig,
  setWebsiteConfig,
  setDeliveryConfig,
  setLandingPages,
  setCategories,
  setSubCategories,
  setChildCategories,
  setBrands,
  setTags,
  refs,
}: Pick<UseAppEffectsProps, 
  'activeTenantId' | 'hostTenantSlug' | 'loadChatMessages' | 'completeTenantSwitch' | 
  'setActiveTenantId' | 'setHostTenantId' | 'setIsLoading' | 'setProducts' | 'setOrders' |
  'setLogo' | 'setThemeConfig' | 'setWebsiteConfig' | 'setDeliveryConfig' | 'setLandingPages' |
  'setCategories' | 'setSubCategories' | 'setChildCategories' | 'setBrands' | 'setTags' | 'refs'
>) => {
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      // Check if we're on main domain - show demo data
      if (isMainDomain()) {
        console.log('[App] Main domain detected - loading demo data');
        setProducts(DEMO_PRODUCTS as Product[]);
        setWebsiteConfig(DEMO_WEBSITE_CONFIG as any);
        setCategories(DEMO_CATEGORIES as Category[]);
        setBrands(DEMO_BRANDS as Brand[]);
        setTags([]);
        setOrders([]);
        setLogo('/icons/icon-192x192.png');
        setThemeConfig(null);
        setDeliveryConfig([]);
        setLandingPages([]);
        setSubCategories([]);
        setChildCategories([]);
        hidePreloadSkeleton();
        setIsLoading(false);
        return;
      }
      
      const hasCache = hasCachedData();
      if (!hasCache) setIsLoading(true);
      let loadError: Error | null = null;
      
      try {
        let resolvedTenantId = activeTenantId;
        
        if (hostTenantSlug && !isAdminSubdomain && !isSuperAdminSubdomain) {
          const sanitizedSlug = sanitizeSubdomainSlug(hostTenantSlug);
          const resolved = await DataService.resolveTenantBySubdomain(sanitizedSlug);
          if (!isMounted) return;
          
          if (resolved?.id) {
            if (resolvedTenantId && resolvedTenantId !== resolved.id) {
              try {
                ['products', 'theme_config', 'website_config', 'categories', 'brands', 'tags'].forEach(key => {
                  localStorage.removeItem(`ds_cache_${resolvedTenantId}::${key}`);
                });
              } catch {}
            }
            resolvedTenantId = resolved.id;
            setCachedTenantIdForSubdomain(sanitizedSlug, resolved.id);
            setActiveTenantId(resolvedTenantId);
            setHostTenantId(resolved.id);
          }
        }
        
        if (!resolvedTenantId) {
          hidePreloadSkeleton();
          setIsLoading(false);
          return;
        }
        
        const bootstrapData = await DataService.bootstrap(resolvedTenantId);
        if (!isMounted) return;
        
        const normalizedProducts = normalizeProductCollection(bootstrapData.products, resolvedTenantId);
        setProducts(normalizedProducts);
        
        refs.prevThemeConfigRef.current = bootstrapData.themeConfig;
        refs.prevWebsiteConfigRef.current = bootstrapData.websiteConfig;
        refs.prevProductsRef.current = normalizedProducts;
        
        setThemeConfig(bootstrapData.themeConfig);
        setWebsiteConfig(bootstrapData.websiteConfig);

        // Load secondary data immediately
        const loadSecondaryData = async () => {
          if (!isMounted) return;
          try {
            const data = await DataService.getSecondaryData(resolvedTenantId);
            if (!isMounted) return;
            refs.ordersLoadedRef.current = false;
            refs.prevOrdersRef.current = data.orders;
            setOrders(data.orders);
            refs.prevLogoRef.current = data.logo;
            setLogo(data.logo);
            refs.prevDeliveryConfigRef.current = data.deliveryConfig;
            setDeliveryConfig(data.deliveryConfig);
            loadChatMessages(data.chatMessages, activeTenantId);
            refs.prevLandingPagesRef.current = data.landingPages;
            setLandingPages(data.landingPages);
            refs.prevCategoriesRef.current = data.categories;
            setCategories(data.categories);
            refs.prevSubCategoriesRef.current = data.subcategories;
            setSubCategories(data.subcategories);
            refs.prevChildCategoriesRef.current = data.childcategories;
            setChildCategories(data.childcategories);
            refs.prevBrandsRef.current = data.brands;
            setBrands(data.brands);
            refs.prevTagsRef.current = data.tags;
            setTags(data.tags);
            refs.catalogLoadedRef.current = true;
          } catch (error) {
            console.warn('Failed to load secondary data', error);
          }
        };
        
        loadSecondaryData();
      } catch (error) {
        loadError = error as Error;
        console.error('Failed to load data', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          completeTenantSwitch(loadError);
          hidePreloadSkeleton();
        }
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [activeTenantId, hostTenantSlug, loadChatMessages, completeTenantSwitch, setActiveTenantId, setHostTenantId]);
};

/**
 * Hook for admin data loading
 */
export const useAdminDataLoad = ({
  activeTenantId,
  currentView,
  tenants,
  applyTenantList,
  setUsers,
  setRoles,
  setCourierConfig,
  setFacebookPixelConfig,
  setCategories,
  setSubCategories,
  setChildCategories,
  setBrands,
  setTags,
  refs,
}: Pick<UseAppEffectsProps, 
  'activeTenantId' | 'currentView' | 'tenants' | 'applyTenantList' |
  'setUsers' | 'setRoles' | 'setCourierConfig' | 'setFacebookPixelConfig' |
  'setCategories' | 'setSubCategories' | 'setChildCategories' | 'setBrands' | 'setTags' | 'refs'
>) => {
  const loadAdminData = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      if (tenants.length === 0) {
        const tenantList = await DataService.listTenants(true);
        applyTenantList(tenantList);
      }
      
      const [usersData, rolesData, courierData, facebookPixelData, categoriesData, subCategoriesData, childCategoriesData, brandsData, tagsData] = await Promise.all([
        DataService.getUsers(activeTenantId),
        DataService.getRoles(activeTenantId),
        DataService.get('courier', { apiKey: '', secretKey: '', instruction: '' }, activeTenantId),
        DataService.get<FacebookPixelConfig>('facebook_pixel', { pixelId: '', accessToken: '', enableTestEvent: false, isEnabled: false }, activeTenantId),
        DataService.getCatalog('categories', DEFAULT_CATEGORIES, activeTenantId),
        DataService.getCatalog('subcategories', DEFAULT_SUB_CATEGORIES, activeTenantId),
        DataService.getCatalog('childcategories', [], activeTenantId),
        DataService.getCatalog('brands', DEFAULT_BRANDS, activeTenantId),
        DataService.getCatalog('tags', DEFAULT_TAGS, activeTenantId)
      ]);
      
      refs.prevUsersRef.current = usersData;
      setUsers(usersData);
      refs.prevRolesRef.current = rolesData;
      setRoles(rolesData);
      setCourierConfig({ apiKey: courierData?.apiKey || '', secretKey: courierData?.secretKey || '', instruction: courierData?.instruction || '' });
      setFacebookPixelConfig(facebookPixelData);
      
      if (!refs.catalogLoadedRef.current) {
        refs.prevCategoriesRef.current = categoriesData;
        setCategories(categoriesData);
        refs.prevSubCategoriesRef.current = subCategoriesData;
        setSubCategories(subCategoriesData);
        refs.prevChildCategoriesRef.current = childCategoriesData;
        setChildCategories(childCategoriesData);
        refs.prevBrandsRef.current = brandsData;
        setBrands(brandsData);
        refs.prevTagsRef.current = tagsData;
        setTags(tagsData);
        refs.catalogLoadedRef.current = true;
      }
    } catch (error) {
      console.warn('Failed to load admin data', error);
    }
  }, [activeTenantId, tenants.length, applyTenantList, refs]);

  useEffect(() => {
    if (currentView === 'admin' && !refs.adminDataLoadedRef.current) {
      refs.adminDataLoadedRef.current = true;
      loadAdminData();
    }
  }, [currentView, loadAdminData, refs]);

  useEffect(() => {
    refs.adminDataLoadedRef.current = false;
    refs.prevLogoRef.current = null;
  }, [activeTenantId, refs]);

  return { loadAdminData };
};

/**
 * Hook for real-time data refresh
 */
export const useDataRefresh = ({
  products,
  categories,
  activeTenantIdRef,
  currentViewRef,
  skipNextChatSaveRef,
  chatMessagesRef,
  isAdminChatOpenRef,
  refs,
  setProducts,
  setOrders,
  setLogo,
  setThemeConfig,
  setWebsiteConfig,
  setDeliveryConfig,
  setCategories,
  setLandingPages,
  setChatMessages,
  setHasUnreadChat,
}: Pick<UseAppEffectsProps, 
  'products' | 'categories' | 'activeTenantIdRef' | 'currentViewRef' |
  'skipNextChatSaveRef' | 'chatMessagesRef' | 'isAdminChatOpenRef' | 'refs' |
  'setProducts' | 'setOrders' | 'setLogo' | 'setThemeConfig' | 'setWebsiteConfig' |
  'setDeliveryConfig' | 'setCategories' | 'setLandingPages' | 'setChatMessages' | 'setHasUnreadChat'
>) => {
  const handleDataRefresh = useCallback(async (key: string, eventTenantId?: string, fromSocket = false) => {
    if (currentViewRef.current.startsWith('admin')) return;
    if (eventTenantId && eventTenantId !== activeTenantIdRef.current) return;

    const tenantId = eventTenantId || activeTenantIdRef.current;
    try {
      switch (key) {
        case 'products':
          const productsData = await DataService.getProducts(tenantId);
          if (productsData.length > 0 || products.length === 0) {
            refs.isFirstProductUpdateRef.current = true;
            setProducts(normalizeProductCollection(productsData, tenantId));
          }
          break;
        case 'orders':
          setOrders(await DataService.getOrders(tenantId));
          break;
        case 'logo':
          setLogo(await DataService.get<string | null>('logo', null, tenantId));
          break;
        case 'theme':
          setThemeConfig(await DataService.getThemeConfig(tenantId));
          break;
        case 'website':
          const hasUnsavedChanges = typeof window !== 'undefined' && 
            typeof (window as any).__getAdminCustomizationUnsavedChanges === 'function' && 
            (window as any).__getAdminCustomizationUnsavedChanges();
          if (!hasUnsavedChanges) {
            setWebsiteConfig(await DataService.getWebsiteConfig(tenantId));
          }
          break;
        case 'delivery':
          setDeliveryConfig(await DataService.getDeliveryConfig(tenantId));
          break;
        case 'categories':
          const categoriesData = await DataService.getCatalog('categories', DEFAULT_CATEGORIES, tenantId);
          if (categoriesData.length > 0 || categories.length === 0) {
            setCategories(categoriesData);
          }
          break;
        case 'landing_pages':
          setLandingPages(await DataService.getLandingPages(tenantId));
          break;
        case 'chat_messages':
          const chatData = await DataService.getChatMessages(tenantId);
          const normalized = Array.isArray(chatData) ? [...chatData] : [];
          normalized.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
          skipNextChatSaveRef.current = true;
          setChatMessages(normalized);
          const localIds = new Set(chatMessagesRef.current.map(m => m.id));
          const newCustomerMessages = normalized.filter(m => !localIds.has(m.id) && m.sender === 'customer');
          if (newCustomerMessages.length > 0 && !isAdminChatOpenRef.current && isAdminRole(refs.userRef.current?.role)) {
            setHasUnreadChat(true);
          }
          break;
      }
    } catch (error) {
      console.warn(`[DataRefresh] Failed to refresh ${key}:`, error);
    }
  }, [products.length, categories.length, skipNextChatSaveRef, chatMessagesRef, isAdminChatOpenRef, setChatMessages, setHasUnreadChat, activeTenantIdRef, currentViewRef, refs]);

  useDataRefreshDebounced(handleDataRefresh, 150);
};

/**
 * Hook for admin chat visibility management
 */
export const useAdminChatVisibility = ({
  currentView,
  isAdminChatOpen,
  handleCloseAdminChat,
}: Pick<UseAppEffectsProps, 'currentView' | 'isAdminChatOpen' | 'handleCloseAdminChat'>) => {
  useEffect(() => {
    if (!currentView.startsWith('admin') && isAdminChatOpen) handleCloseAdminChat();
  }, [currentView, isAdminChatOpen, handleCloseAdminChat]);
};
