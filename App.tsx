/// <reference types="vite/client" />
/**
 * App.tsx - Main Application Component (Refactored)
 * 
 * This file has been significantly reduced by extracting logic into:
 * - utils/appHelpers.ts - Utility functions
 * - hooks/useChat.ts - Chat state and handlers
 * - hooks/useCart.ts - Cart state and handlers  
 * - hooks/useAuth.ts - Authentication handlers
 * - hooks/useTenant.ts - Tenant state and handlers
 * - hooks/useThemeEffects.ts - Theme application
 * - hooks/useFacebookPixel.ts - Facebook Pixel
 * - hooks/useNavigation.ts - URL routing and navigation
 */
import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import type { 
  Product, Order, User, ThemeConfig, WebsiteConfig, DeliveryConfig, 
  ProductVariantSelection, LandingPage, FacebookPixelConfig, CourierConfig, 
  Role, Category, SubCategory, ChildCategory, Brand, Tag 
} from './types';
import type { LandingCheckoutPayload } from './components/LandingPageComponents';

// Core services - socket join/leave calls deferred via timers, but imports are static for proper bundling
import { DataService, isKeyFromSocket, clearSocketFlag, joinTenantRoom, leaveTenantRoom } from './services/DataService';
import { useDataRefreshDebounced } from './hooks/useDataRefresh';

import { ThemeProvider } from './context/ThemeContext';

// Defer Toaster import - not critical for initial render (loads ~20KB)
const Toaster = lazy(() => import('react-hot-toast').then(m => ({ default: m.Toaster })));

// Lazy load toast - cached after first use for instant subsequent calls
let toastModule: typeof import('react-hot-toast') | null = null;
const getToast = async () => {
  if (toastModule) return toastModule;
  toastModule = await import('react-hot-toast');
  return toastModule;
};
const toast = {
  success: (msg: string) => getToast().then(m => m.toast.success(msg)),
  error: (msg: string) => getToast().then(m => m.toast.error(msg)),
};

// Extracted utilities and hooks
import {
  isAdminRole,
  isPlatformOperator,
  normalizeProductCollection,
  ensureUniqueProductSlug,
  ensureVariantSelection,
  getInitialCachedData,
  hasCachedData,
  sanitizeSubdomainSlug,
  setCachedTenantIdForSubdomain,
  SESSION_STORAGE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
} from './utils/appHelpers';




// Default catalog data to prevent data loss during refresh
const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Phones', icon: '', status: 'Active' as const },
  { id: '2', name: 'Watches', icon: '', status: 'Active' as const }
];
const DEFAULT_SUB_CATEGORIES = [
  { id: '1', categoryId: '1', name: 'Smartphones', status: 'Active' as const },
  { id: '2', categoryId: '1', name: 'Feature Phones', status: 'Active' as const }
];
const DEFAULT_BRANDS = [
  { id: '1', name: 'Apple', logo: '', status: 'Active' as const },
  { id: '2', name: 'Samsung', logo: '', status: 'Active' as const }
];
const DEFAULT_TAGS = [
  { id: '1', name: 'Flash Deal', status: 'Active' as const },
  { id: '2', name: 'New Arrival', status: 'Active' as const }
];

// Check if we're on the admin subdomain
const isAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'admin.systemnextit.com' || 
   window.location.hostname.startsWith('admin.'));

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'superadmin.systemnextit.com' || 
   window.location.hostname.startsWith('superadmin.'));
import { useChat } from './hooks/useChat';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import { useThemeEffects } from './hooks/useThemeEffects';
import { useFacebookPixel } from './hooks/useFacebookPixel';
import { useNavigation } from './hooks/useNavigation';

// Store pages - lazy loaded with preload functions
const StoreHome = lazy(() => import('./pages/StoreHome'));
const StoreProductDetail = lazy(() => import('./pages/StoreProductDetail'));
const StoreCheckout = lazy(() => import('./pages/StoreCheckout'));
const StoreOrderSuccess = lazy(() => import('./pages/StoreOrderSuccess'));
const StoreProfile = lazy(() => import('./pages/StoreProfile'));
const LandingPagePreview = lazy(() => import('./pages/LandingPagePreview'));


// Preload functions - ONLY called on user interaction (hover/focus)
// NO automatic prefetching to improve initial load
export const preloadCheckout = () => import('./pages/StoreCheckout');
export const preloadProductDetail = () => import('./pages/StoreProductDetail');
export const preloadStoreProfile = () => import('./pages/StoreProfile');

// Admin pages - lazy loaded
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const AdminAppWithAuth = lazy(() => import('./pages/AdminAppWithAuth'));

// Store components - lazy loaded
const LoginModal = lazy(() => import('./components/store/LoginModal').then(m => ({ default: m.LoginModal })));
const MobileBottomNav = lazy(() => import('./components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));
const StoreChatModal = lazy(() => import('./components/store/StoreChatModal').then(m => ({ default: m.StoreChatModal })));

// Skeleton loaders for better UX
import { SuperAdminDashboardSkeleton, StorePageSkeleton, ProductDetailSkeleton } from './components/SkeletonLoaders';

const App = () => {
  // === ADMIN SUBDOMAIN HANDLING ===
  // If on admin subdomain, start with admin-login view
  // If on superadmin subdomain, start with admin-login (requires super_admin login)
  const initialView = isSuperAdminSubdomain ? 'admin-login' : (isAdminSubdomain ? 'admin-login' : 'store');
  
  // === LOADING STATE ===
  // Start with false if we have cached data to show content immediately
  const [isLoading, setIsLoading] = useState(false);

  // === TENANT MANAGEMENT (from useTenant hook) ===
  const tenant = useTenant();
  const {
    tenants,
    activeTenantId,
    setActiveTenantId,
    hostTenantId,
    setHostTenantId,
    hostTenantSlug,
    isTenantSwitching,
    isTenantSeeding,
    deletingTenantId,
    applyTenantList,
    refreshTenants,
    completeTenantSwitch,
    tenantsRef,
    activeTenantIdRef,
  } = tenant;

  // === CORE DATA STATE ===
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(() => getInitialCachedData('products', []));
  const [logo, setLogo] = useState<string | null>(() => getInitialCachedData('logo', null));
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(() => getInitialCachedData('theme_config', null));
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | undefined>(() => getInitialCachedData('website_config', undefined));
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig[]>([]);
  const [facebookPixelConfig, setFacebookPixelConfig] = useState<FacebookPixelConfig>({
    pixelId: '', accessToken: '', enableTestEvent: false, isEnabled: false
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Catalog State
  const [categories, setCategories] = useState<Category[]>(() => getInitialCachedData('categories', []));
  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => getInitialCachedData('subcategories', []));
  const [childCategories, setChildCategories] = useState<ChildCategory[]>(() => getInitialCachedData('childcategories', []));
  const [brands, setBrands] = useState<Brand[]>(() => getInitialCachedData('brands', []));
  const [tags, setTags] = useState<Tag[]>(() => getInitialCachedData('tags', []));
  const [courierConfig, setCourierConfig] = useState<CourierConfig>({ apiKey: '', secretKey: '', instruction: '' });

  // === AUTH & USER STATE ===
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantSelection | null>(null);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const mobileMenuOpenFnRef = useRef<(() => void) | null>(null);

  // === NAVIGATION (from useNavigation hook) ===
  const navigation = useNavigation({ products, user });
  const {
    currentView,
    setCurrentView,
    adminSection,
    setAdminSection,
    urlCategoryFilter,
    selectedProduct,
    setSelectedProduct,
    storeSearchQuery,
    handleStoreSearchChange,
    handleProductClick,
    handleCategoryFilterChange,
    currentViewRef,
  } = navigation;

  // === CHAT (from useChat hook) ===
  const chat = useChat({ activeTenantId, isLoading, user, websiteConfig, isTenantSwitching });
  const {
    isChatOpen,
    isAdminChatOpen,
    chatMessages,
    hasUnreadChat,
    handleCustomerSendChat,
    handleAdminSendChat,
    handleEditChatMessage,
    handleDeleteChatMessage,
    handleOpenChat,
    handleCloseChat,
    handleOpenAdminChat,
    handleCloseAdminChat,
    loadChatMessages,
    resetChatLoaded,
    setChatMessages,
    setHasUnreadChat,
    skipNextChatSaveRef,
    chatMessagesRef,
    isAdminChatOpenRef,
  } = chat;

  // === CART (from useCart hook) ===
  const cart = useCart({ user, products, tenantId: activeTenantId });
  const { cartItems, handleCartToggle, handleAddProductToCart } = cart;

  // === AUTH (from useAuth hook) ===
  const auth = useAuth({
    tenants,
    users,
    activeTenantId,
    setUser,
    setUsers,
    setActiveTenantId,
    setCurrentView: setCurrentView as (view: string) => void,
    setAdminSection,
    setSelectedVariant: () => setSelectedVariant(null),
  });
  const { handleLogin, handleRegister, handleGoogleLogin, handleLogout, handleUpdateProfile } = auth;

  // === THEME EFFECTS ===
  useThemeEffects({ themeConfig, websiteConfig, activeTenantId, isLoading, currentView, isTenantSwitching });
  
  // === FACEBOOK PIXEL ===
  useFacebookPixel(facebookPixelConfig);

  // === REFS FOR PERSISTENCE ===
  // These get updated when data loads (before setState) to prevent save triggers
  const prevLogoRef = useRef<string | null>(null);
  const prevThemeConfigRef = useRef<ThemeConfig | null>(null);
  const prevWebsiteConfigRef = useRef<WebsiteConfig | undefined>(undefined);
  const ordersLoadedRef = useRef(false);
  const prevOrdersRef = useRef<Order[]>([]);
  const prevDeliveryConfigRef = useRef<DeliveryConfig[]>([]);
  const prevLandingPagesRef = useRef<LandingPage[]>([]);
  const prevCategoriesRef = useRef<Category[]>([]);
  const prevSubCategoriesRef = useRef<SubCategory[]>([]);
  const prevChildCategoriesRef = useRef<ChildCategory[]>([]);
  const prevBrandsRef = useRef<Brand[]>([]);
  const prevTagsRef = useRef<Tag[]>([]);
  const prevRolesRef = useRef<Role[]>([]);
  const prevUsersRef = useRef<User[]>([]);
  const initialDataLoadedRef = useRef(false);
  const productsLoadedFromServerRef = useRef(false);
  const prevProductsRef = useRef<Product[]>([]);
  const isFirstProductUpdateRef = useRef(true);
  const catalogLoadedRef = useRef(false);
  const adminDataLoadedRef = useRef(false);
  const userRef = useRef<User | null>(user);
  const sessionRestoredRef = useRef(false); // Track if initial session restoration has completed

  useEffect(() => { userRef.current = user; }, [user]);

  // === SOCKET ROOM MANAGEMENT (heavily deferred - not critical for initial render) ===
  useEffect(() => {
    if (!activeTenantId) return;
    // Defer socket initialization 3.5s after initial render - prioritize content over real-time
    const timer = setTimeout(() => {
      joinTenantRoom(activeTenantId);
    }, 3500);
    return () => {
      clearTimeout(timer);
      leaveTenantRoom(activeTenantId);
    };
  }, [activeTenantId]);

  // === SESSION RESTORATION ===
  useEffect(() => {
    if (typeof window === 'undefined') {
      sessionRestoredRef.current = true;
      return;
    }
    
    // Check for superadmin subdomain - always show login if not logged in
    if (isSuperAdminSubdomain) {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          if (parsed && parsed.role === 'super_admin') {
            setUser(parsed);
            setCurrentView('super-admin');
            sessionRestoredRef.current = true;
            return;
          }
        } catch (e) {
          console.error('Session restoration error:', e);
        }
      }
      // Not logged in or not super_admin - show login
      setCurrentView('admin-login');
      sessionRestoredRef.current = true;
      return;
    }
    
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      // No stored session - on admin subdomain show login
      if (isAdminSubdomain) {
        setCurrentView('admin-login');
      }
      sessionRestoredRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed) {
        setUser(parsed);
        const tenantInfo = (parsed as unknown as { tenant?: { id?: string; _id?: string } }).tenant;
        const parsedTenantId = parsed.tenantId || tenantInfo?.id || tenantInfo?._id;
        if (parsedTenantId) {
          setActiveTenantId(parsedTenantId);
        }
        // Check if on /admin path (for tenant subdomain admin access)
        const isOnAdminPath = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
        // On admin subdomain OR /admin path, restore admin view for admin users
        if ((isAdminSubdomain || isOnAdminPath) && parsed.role && ['super_admin', 'admin', 'tenant_admin', 'staff'].includes(parsed.role)) {
          setCurrentView('admin');
        }
      }
    } catch (error) {
      console.error('Unable to restore session', error);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    } finally {
      // Mark session restoration as complete
      sessionRestoredRef.current = true;
    }
  }, []); // Empty deps - only run once on mount

  // Persist user session - only after session restoration is complete
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't clear storage during initial load before session restoration
    if (!sessionRestoredRef.current) return;
    
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    }
  }, [user]);

  // Handle user role changes
  useEffect(() => {
    if (!user) {
      // Check if on /admin path
      const isOnAdminPath = typeof window !== 'undefined' && 
        (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
      // Only redirect to login if:
      // 1. Session restoration has completed (not during initial load)
      // 2. We're on admin subdomain OR /admin path
      // 3. Currently in admin view
      if (sessionRestoredRef.current && currentViewRef.current.startsWith('admin') && (isAdminSubdomain || isOnAdminPath)) {
        setCurrentView('admin-login');
        setAdminSection('dashboard');
      }
      return;
    }

    const resolvedTenantId = user.tenantId || activeTenantId;
    if (resolvedTenantId !== activeTenantId) {
      setActiveTenantId(resolvedTenantId);
    }

    // Check if on /admin path
    const isOnAdminPath = typeof window !== 'undefined' && 
      (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));
    // Allow admin access on admin subdomain OR /admin path
    if (isAdminRole(user.role) && !currentViewRef.current.startsWith('admin') && !currentViewRef.current.startsWith('super') && (isAdminSubdomain || isOnAdminPath)) {
      // Set correct view based on role
      if (user.role === 'super_admin') {
        setCurrentView('super-admin');
      } else {
        setCurrentView('admin');
      }
      setAdminSection('dashboard');
    }
  }, [user, activeTenantId, setActiveTenantId, setCurrentView, setAdminSection, currentViewRef]);

  // === INITIAL DATA LOADING ===
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      // Don't block UI - only show loading if no cached data
      const hasCache = hasCachedData();
      if (!hasCache) {
        setIsLoading(true);
      }
      let loadError: Error | null = null;
      const startTime = performance.now();
      
      try {
        let resolvedTenantId = activeTenantId;
        
        // For subdomains: ALWAYS verify tenant matches the subdomain
        // This prevents wrong data being shown when visiting different stores
        // Skip tenant resolution for admin and superadmin subdomains
        if (hostTenantSlug && !isAdminSubdomain && !isSuperAdminSubdomain) {
          const sanitizedSlug = sanitizeSubdomainSlug(hostTenantSlug);
          const resolved = await DataService.resolveTenantBySubdomain(sanitizedSlug);
          if (!isMounted) return;
          
          if (resolved?.id) {
            console.log(`[Tenant] Resolved subdomain "${sanitizedSlug}" to tenant ID: ${resolved.id}`);
            // If cached tenant ID doesn't match resolved, clear old cache
            if (resolvedTenantId && resolvedTenantId !== resolved.id) {
              console.log(`[Tenant] Clearing stale cache. Expected: ${resolved.id}, Cached: ${resolvedTenantId}`);
              // Clear old tenant's cached data
              try {
                const keysToRemove = ['products', 'theme_config', 'website_config', 'categories', 'brands', 'tags'];
                keysToRemove.forEach(key => {
                  localStorage.removeItem(`ds_cache_${resolvedTenantId}::${key}`);
                });
              } catch {}
            }
            resolvedTenantId = resolved.id;
            // Cache tenant ID for this subdomain
            setCachedTenantIdForSubdomain(sanitizedSlug, resolved.id);
            setActiveTenantId(resolvedTenantId);
            setHostTenantId(resolved.id);
            console.log(`[Perf] Tenant resolved by subdomain in ${(performance.now() - startTime).toFixed(0)}ms`);
          } else {
            // // Tenant not found for this subdomain - show error or fallback
            // console.error(`[Tenant] No tenant found for subdomain: ${sanitizedSlug}`);
            // resolvedTenantId = DEFAULT_TENANT_ID;
            // setActiveTenantId(resolvedTenantId);
          }
        }
        
        if (!resolvedTenantId) return;
        
        // Load bootstrap data - tenant list loaded in background only for admin users
        const bootstrapData = await DataService.bootstrap(resolvedTenantId);
        
        console.log(`[Perf] Bootstrap data loaded in ${(performance.now() - startTime).toFixed(0)}ms`);
        console.log('[App] Bootstrap websiteConfig:', {
          carouselCount: bootstrapData.websiteConfig?.carouselItems?.length || 0,
          socialLinksCount: bootstrapData.websiteConfig?.socialLinks?.length || 0,
          addressesCount: bootstrapData.websiteConfig?.addresses?.length || 0,
          emailsCount: bootstrapData.websiteConfig?.emails?.length || 0,
          phonesCount: bootstrapData.websiteConfig?.phones?.length || 0,
          socialLinks: bootstrapData.websiteConfig?.socialLinks
        });

        if (!isMounted) return;
        
        const normalizedProducts = normalizeProductCollection(bootstrapData.products, resolvedTenantId);
        setProducts(normalizedProducts);
        
        // Update prev refs BEFORE setting state to prevent save triggers
        prevThemeConfigRef.current = bootstrapData.themeConfig;
        prevWebsiteConfigRef.current = bootstrapData.websiteConfig;
        prevProductsRef.current = normalizedProducts;
        
        setThemeConfig(bootstrapData.themeConfig);
        setWebsiteConfig(bootstrapData.websiteConfig);

        // Load secondary data
        const loadSecondaryData = () => {
          if (!isMounted) return;
          DataService.getSecondaryData(resolvedTenantId).then((data) => {
            if (!isMounted) return;
            
            ordersLoadedRef.current = false;
            prevOrdersRef.current = data.orders;
            setOrders(data.orders);
            
            prevLogoRef.current = data.logo;
            setLogo(data.logo);
            
            prevDeliveryConfigRef.current = data.deliveryConfig;
            setDeliveryConfig(data.deliveryConfig);
            
            loadChatMessages(data.chatMessages, activeTenantId);
            
            prevLandingPagesRef.current = data.landingPages;
            setLandingPages(data.landingPages);
            
            prevCategoriesRef.current = data.categories;
            setCategories(data.categories);
            prevSubCategoriesRef.current = data.subcategories;
            setSubCategories(data.subcategories);
            prevChildCategoriesRef.current = data.childcategories;
            setChildCategories(data.childcategories);
            prevBrandsRef.current = data.brands;
            setBrands(data.brands);
            prevTagsRef.current = data.tags;
            setTags(data.tags);
            catalogLoadedRef.current = true;
            console.log(`[Perf] Secondary data loaded in ${(performance.now() - startTime).toFixed(0)}ms`);
          }).catch(error => console.warn('Failed to load secondary data', error));
        };
        
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(loadSecondaryData, { timeout: 50 });
        } else {
          setTimeout(loadSecondaryData, 10);
        }
      } catch (error) {
        loadError = error as Error;
        console.error('Failed to load data', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          completeTenantSwitch(loadError);
        }
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [activeTenantId, hostTenantSlug, loadChatMessages, completeTenantSwitch, setActiveTenantId, setHostTenantId]);

  // === ADMIN DATA LOADING ===
  const loadAdminData = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      // Load tenant list for admin users (platform operators need this for tenant management)
      if (tenants.length === 0) {
        const tenantList = await DataService.listTenants(true); // Force refresh
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
      prevUsersRef.current = usersData;
      setUsers(usersData);
      prevRolesRef.current = rolesData;
      setRoles(rolesData);
      setCourierConfig({ apiKey: courierData?.apiKey || '', secretKey: courierData?.secretKey || '', instruction: courierData?.instruction || '' });
      setFacebookPixelConfig(facebookPixelData);
      if (!catalogLoadedRef.current) {
        prevCategoriesRef.current = categoriesData;
        setCategories(categoriesData);
        prevSubCategoriesRef.current = subCategoriesData;
        setSubCategories(subCategoriesData);
        prevChildCategoriesRef.current = childCategoriesData;
        setChildCategories(childCategoriesData);
        prevBrandsRef.current = brandsData;
        setBrands(brandsData);
        prevTagsRef.current = tagsData;
        setTags(tagsData);
        catalogLoadedRef.current = true;
      }
    } catch (error) {
      console.warn('Failed to load admin data', error);
    }
  }, [activeTenantId, tenants.length, applyTenantList]);

  useEffect(() => {
    if (currentView === 'admin' && !adminDataLoadedRef.current) {
      adminDataLoadedRef.current = true;
      loadAdminData();
    }
  }, [currentView, loadAdminData]);

  useEffect(() => {
    adminDataLoadedRef.current = false;
    prevLogoRef.current = null;
  }, [activeTenantId]);

  // === DATA REFRESH HANDLER ===
  const handleDataRefresh = useCallback(async (key: string, eventTenantId?: string, fromSocket = false) => {
    if (currentViewRef.current.startsWith('admin')) return;
    if (eventTenantId && eventTenantId !== activeTenantIdRef.current) return;

    const tenantId = eventTenantId || activeTenantIdRef.current;
    console.log(`[DataRefresh] Refreshing ${key} for tenant ${tenantId} (fromSocket: ${fromSocket})`);

    try {
      switch (key) {
        case 'products':
          const productsData = await DataService.getProducts(tenantId);
          // Only update if we have data or if current state is empty
          if (productsData.length > 0 || products.length === 0) {
            isFirstProductUpdateRef.current = true;
            setProducts(normalizeProductCollection(productsData, tenantId));
          } else {
            console.warn('[DataRefresh] Ignoring empty products refresh - preserving existing data');
          }
          break;
        case 'orders':
          const ordersData = await DataService.getOrders(tenantId);
          setOrders(ordersData);
          break;
        case 'logo':
          const logoData = await DataService.get<string | null>('logo', null, tenantId);
          setLogo(logoData);
          break;
        case 'theme':
          const themeData = await DataService.getThemeConfig(tenantId);
          setThemeConfig(themeData);
          break;
        case 'website':
          const websiteData = await DataService.getWebsiteConfig(tenantId);
          // Check if AdminCustomization has unsaved changes
          const hasUnsavedChanges = typeof window !== 'undefined' && 
            typeof (window as any).__getAdminCustomizationUnsavedChanges === 'function' && 
            (window as any).__getAdminCustomizationUnsavedChanges();
          if (hasUnsavedChanges) {
            console.warn('[DataRefresh] Skipping website config refresh - AdminCustomization has unsaved changes');
            break;
          }
          // Always update website config, but log if it's suspiciously empty
          if (!websiteData?.carouselItems && websiteConfig?.carouselItems?.length) {
            console.warn('[DataRefresh] New website config missing carousel items - this may be intentional or a data issue');
          }
          setWebsiteConfig(websiteData);
          break;
        case 'delivery':
          const deliveryData = await DataService.getDeliveryConfig(tenantId);
          setDeliveryConfig(deliveryData);
          break;
        case 'categories':
          const categoriesData = await DataService.getCatalog('categories', DEFAULT_CATEGORIES, tenantId);
          // Only update if we have data or if current state is empty
          if (categoriesData.length > 0 || categories.length === 0) {
            setCategories(categoriesData);
          }
          break;
        case 'landing_pages':
          const landingData = await DataService.getLandingPages(tenantId);
          setLandingPages(landingData);
          break;
        case 'chat_messages':
          const chatData = await DataService.getChatMessages(tenantId);
          const normalized = Array.isArray(chatData) ? [...chatData] : [];
          normalized.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
          skipNextChatSaveRef.current = true;
          setChatMessages(normalized);
          const localIds = new Set(chatMessagesRef.current.map(m => m.id));
          const newCustomerMessages = normalized.filter(m => !localIds.has(m.id) && m.sender === 'customer');
          if (newCustomerMessages.length > 0 && !isAdminChatOpenRef.current && isAdminRole(userRef.current?.role)) {
            setHasUnreadChat(true);
          }
          break;
      }
    } catch (error) {
      console.warn(`[DataRefresh] Failed to refresh ${key}:`, error);
    }
  }, [products.length, skipNextChatSaveRef, chatMessagesRef, isAdminChatOpenRef, setChatMessages, setHasUnreadChat, activeTenantIdRef, currentViewRef]);

  useDataRefreshDebounced(handleDataRefresh, 150);

  // === DATA PERSISTENCE ===
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId) {
      if (isKeyFromSocket('orders', activeTenantId)) {
        clearSocketFlag('orders', activeTenantId);
        prevOrdersRef.current = orders;
        return;
      }
      if (!ordersLoadedRef.current) {
        ordersLoadedRef.current = true;
        prevOrdersRef.current = orders;
        return;
      }
      if (orders.length === 0 && prevOrdersRef.current.length > 0) {
        return;
      }
      if (JSON.stringify(orders) !== JSON.stringify(prevOrdersRef.current)) {
        prevOrdersRef.current = orders;
        DataService.save('orders', orders, activeTenantId);
      }
    }
  }, [orders, isLoading, isTenantSwitching, activeTenantId]);

  useEffect(() => {
    if (!isLoading && activeTenantId) {
      initialDataLoadedRef.current = true;
    }
  }, [isLoading, activeTenantId]);

  useEffect(() => {
    productsLoadedFromServerRef.current = false;
    isFirstProductUpdateRef.current = true;
    ordersLoadedRef.current = false;
    catalogLoadedRef.current = false;
    prevProductsRef.current = [];
    prevOrdersRef.current = [];
    prevCategoriesRef.current = [];
    prevSubCategoriesRef.current = [];
    prevChildCategoriesRef.current = [];
    prevBrandsRef.current = [];
    prevTagsRef.current = [];
    prevRolesRef.current = [];
    prevUsersRef.current = [];
  }, [activeTenantId]);

  useEffect(() => { 
    if (isLoading || isTenantSwitching || !initialDataLoadedRef.current || !activeTenantId) return;
    
    if (isKeyFromSocket('products', activeTenantId)) {
      clearSocketFlag('products', activeTenantId);
      prevProductsRef.current = products;
      return;
    }
    
    if (isFirstProductUpdateRef.current) {
      isFirstProductUpdateRef.current = false;
      prevProductsRef.current = products;
      productsLoadedFromServerRef.current = true;
      return;
    }
    
    if (products.length === 0 && prevProductsRef.current.length > 0) {
      return;
    }
    
    if (JSON.stringify(products) === JSON.stringify(prevProductsRef.current)) return;
    
    prevProductsRef.current = products;
    DataService.saveImmediate('products', products, activeTenantId); 
  }, [products, activeTenantId, isLoading, isTenantSwitching]);

  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current && roles.length > 0) {
      if (JSON.stringify(roles) === JSON.stringify(prevRolesRef.current)) return;
      if (isKeyFromSocket('roles', activeTenantId)) {
        clearSocketFlag('roles', activeTenantId);
        prevRolesRef.current = roles;
        return;
      }
      prevRolesRef.current = roles;
      DataService.save('roles', roles, activeTenantId);
    }
  }, [roles, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current && users.length > 0) DataService.save('users', users, activeTenantId); }, [users, isLoading, isTenantSwitching, activeTenantId]);
  
  useEffect(() => {
    if (!activeTenantId || isLoading || isTenantSwitching || !initialDataLoadedRef.current) return;
    if (logo === prevLogoRef.current) return;
    if (isKeyFromSocket('logo', activeTenantId)) {
      clearSocketFlag('logo', activeTenantId);
      prevLogoRef.current = logo;
      return;
    }
    prevLogoRef.current = logo;
    DataService.save('logo', logo, activeTenantId);
  }, [logo, isLoading, isTenantSwitching, activeTenantId]);

  useEffect(() => {
    if (!activeTenantId || isLoading || isTenantSwitching || !initialDataLoadedRef.current) return;
    // Use JSON comparison - object references will differ even if values are the same
    if (JSON.stringify(themeConfig) === JSON.stringify(prevThemeConfigRef.current)) return;
    if (isKeyFromSocket('theme', activeTenantId)) {
      clearSocketFlag('theme', activeTenantId);
      prevThemeConfigRef.current = themeConfig;
      return;
    }
    prevThemeConfigRef.current = themeConfig;
    DataService.saveImmediate('theme_config', themeConfig, activeTenantId);
  }, [themeConfig, isLoading, isTenantSwitching, activeTenantId]);

  useEffect(() => {
    if (!activeTenantId || isLoading || isTenantSwitching || !initialDataLoadedRef.current) return;
    // Use JSON comparison - object references will differ even if values are the same
    if (JSON.stringify(websiteConfig) === JSON.stringify(prevWebsiteConfigRef.current)) return;
    if (isKeyFromSocket('website', activeTenantId)) {
      clearSocketFlag('website', activeTenantId);
      prevWebsiteConfigRef.current = websiteConfig;
      return;
    }
    prevWebsiteConfigRef.current = websiteConfig;
    if (websiteConfig) {
      DataService.saveImmediate('website_config', websiteConfig, activeTenantId);
    }
  }, [websiteConfig, isLoading, isTenantSwitching, activeTenantId]);
  
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId) {
      if (JSON.stringify(deliveryConfig) === JSON.stringify(prevDeliveryConfigRef.current)) return;
      if (isKeyFromSocket('delivery', activeTenantId)) {
        clearSocketFlag('delivery', activeTenantId);
        prevDeliveryConfigRef.current = deliveryConfig;
        return;
      }
      prevDeliveryConfigRef.current = deliveryConfig;
      DataService.save('delivery_config', deliveryConfig, activeTenantId);
    }
  }, [deliveryConfig, isLoading, isTenantSwitching, activeTenantId]);

  useEffect(() => { if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current) DataService.save('courier', courierConfig, activeTenantId); }, [courierConfig, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current) DataService.save('facebook_pixel', facebookPixelConfig, activeTenantId); }, [facebookPixelConfig, isLoading, isTenantSwitching, activeTenantId]);
  
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && catalogLoadedRef.current) {
      if (JSON.stringify(categories) === JSON.stringify(prevCategoriesRef.current)) return;
      if (isKeyFromSocket('categories', activeTenantId)) {
        clearSocketFlag('categories', activeTenantId);
        prevCategoriesRef.current = categories;
        return;
      }
      prevCategoriesRef.current = categories;
      DataService.save('categories', categories, activeTenantId);
    }
  }, [categories, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && catalogLoadedRef.current) {
      if (JSON.stringify(subCategories) === JSON.stringify(prevSubCategoriesRef.current)) return;
      if (isKeyFromSocket('subcategories', activeTenantId)) {
        clearSocketFlag('subcategories', activeTenantId);
        prevSubCategoriesRef.current = subCategories;
        return;
      }
      prevSubCategoriesRef.current = subCategories;
      DataService.save('subcategories', subCategories, activeTenantId);
    }
  }, [subCategories, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && catalogLoadedRef.current) {
      if (JSON.stringify(childCategories) === JSON.stringify(prevChildCategoriesRef.current)) return;
      if (isKeyFromSocket('childcategories', activeTenantId)) {
        clearSocketFlag('childcategories', activeTenantId);
        prevChildCategoriesRef.current = childCategories;
        return;
      }
      prevChildCategoriesRef.current = childCategories;
      DataService.save('childcategories', childCategories, activeTenantId);
    }
  }, [childCategories, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && catalogLoadedRef.current) {
      if (JSON.stringify(brands) === JSON.stringify(prevBrandsRef.current)) return;
      if (isKeyFromSocket('brands', activeTenantId)) {
        clearSocketFlag('brands', activeTenantId);
        prevBrandsRef.current = brands;
        return;
      }
      prevBrandsRef.current = brands;
      DataService.save('brands', brands, activeTenantId);
    }
  }, [brands, isLoading, isTenantSwitching, activeTenantId]);
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && catalogLoadedRef.current) {
      if (JSON.stringify(tags) === JSON.stringify(prevTagsRef.current)) return;
      if (isKeyFromSocket('tags', activeTenantId)) {
        clearSocketFlag('tags', activeTenantId);
        prevTagsRef.current = tags;
        return;
      }
      prevTagsRef.current = tags;
      DataService.save('tags', tags, activeTenantId);
    }
  }, [tags, isLoading, isTenantSwitching, activeTenantId]);

  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && initialDataLoadedRef.current && landingPages.length > 0) {
      if (JSON.stringify(landingPages) === JSON.stringify(prevLandingPagesRef.current)) return;
      if (isKeyFromSocket('landing_pages', activeTenantId)) {
        clearSocketFlag('landing_pages', activeTenantId);
        prevLandingPagesRef.current = landingPages;
        return;
      }
      prevLandingPagesRef.current = landingPages;
      DataService.save('landing_pages', landingPages, activeTenantId);
    }
  }, [landingPages, isLoading, isTenantSwitching, activeTenantId]);

  // === ADMIN CHAT VISIBILITY ===
  useEffect(() => {
    if (!currentView.startsWith('admin') && isAdminChatOpen) {
      handleCloseAdminChat();
    }
  }, [currentView, isAdminChatOpen, handleCloseAdminChat]);

  useEffect(() => {
    if (adminSection === 'tenants' && !isPlatformOperator(user?.role)) {
      setAdminSection('dashboard');
    }
  }, [adminSection, user, setAdminSection]);

  // === HANDLERS ===
  const handleAddRole = (newRole: Role) => {
    const scopedRole = { ...newRole, tenantId: newRole.tenantId || activeTenantId };
    setRoles([...roles, scopedRole]);
  };
  const handleUpdateRole = (updatedRole: Role) => {
    const scopedRole = { ...updatedRole, tenantId: updatedRole.tenantId || activeTenantId };
    setRoles(roles.map(r => r.id === scopedRole.id ? scopedRole : r));
  };
  const handleDeleteRole = (roleId: string) => setRoles(roles.filter(r => r.id !== roleId));

  const handleAddProduct = (newProduct: Product) => {
    const tenantId = newProduct.tenantId || activeTenantId;
    const slug = ensureUniqueProductSlug(newProduct.slug || newProduct.name || `product-${newProduct.id}`, products, tenantId, newProduct.id);
    setProducts([...products, { ...newProduct, slug, tenantId }]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const tenantId = updatedProduct.tenantId || activeTenantId;
    const slug = ensureUniqueProductSlug(updatedProduct.slug || updatedProduct.name || `product-${updatedProduct.id}`, products, tenantId, updatedProduct.id);
    setProducts(products.map(p => p.id === updatedProduct.id ? { ...updatedProduct, slug, tenantId } : p));
  };
  const handleDeleteProduct = (id: number) => setProducts(products.filter(p => p.id !== id));
  const handleBulkDeleteProducts = (ids: number[]) => setProducts(products.filter(p => !ids.includes(p.id)));
  const handleBulkUpdateProducts = (ids: number[], updates: Partial<Product>) => {
    const { slug, ...restUpdates } = updates;
    setProducts(products.map(p => ids.includes(p.id) ? { ...p, ...restUpdates } : p));
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates, tenantId: o.tenantId || activeTenantId } : o));
  };

  const addToWishlist = (id: number) => { if (!wishlist.includes(id)) setWishlist([...wishlist, id]); };
  const removeFromWishlist = (id: number) => { setWishlist(wishlist.filter(wId => wId !== id)); };
  const isInWishlist = (id: number) => wishlist.includes(id);

  const handleCheckoutStart = (product: Product, quantity: number = 1, variant?: ProductVariantSelection) => {
    setSelectedProduct(product);
    setCheckoutQuantity(quantity);
    setSelectedVariant(ensureVariantSelection(product, variant));
    setCurrentView('checkout');
    window.history.pushState({}, '', '/checkout');
    // Preload success page while user is filling checkout form
    import('./pages/StoreOrderSuccess').catch(() => {});
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCheckoutFromCart = useCallback((productId: number) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) {
      toast.error('Product unavailable for checkout');
      return;
    }
    handleCheckoutStart(targetProduct, 1, ensureVariantSelection(targetProduct));
  }, [products]);

  // Memoized callback for mobile menu ref to prevent infinite re-renders
  const handleMobileMenuOpenRef = useCallback((fn: () => void) => {
    mobileMenuOpenFnRef.current = fn;
  }, []);

  const handlePlaceOrder = async (formData: any) => {
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: formData.fullName,
      location: formData.address,
      amount: formData.amount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: formData.email,
      phone: formData.phone,
      division: formData.division,
      variant: ensureVariantSelection(selectedProduct, formData.variant || selectedVariant),
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      quantity: formData.quantity || checkoutQuantity,
      deliveryType: formData.deliveryType,
      deliveryCharge: formData.deliveryCharge
    };

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders([result.data || newOrder, ...orders]);
      } else {
        setOrders([newOrder, ...orders]);
      }
    } catch (error) {
      setOrders([newOrder, ...orders]);
    }

    setCurrentView('success');
    window.history.pushState({}, '', `/success-order?orderId=${encodeURIComponent(orderId)}`);
    window.scrollTo(0, 0);
  };

  const handleLandingOrderSubmit = async (payload: LandingCheckoutPayload & { pageId: string; productId: number }) => {
    const product = products.find(p => p.id === payload.productId);
    if (!product) return;
    const orderId = `LP-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderAmount = product.price * payload.quantity;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: payload.fullName,
      location: payload.address,
      phone: payload.phone,
      amount: orderAmount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: payload.email,
      variant: ensureVariantSelection(product),
      productId: product.id,
      productName: product.name,
      quantity: payload.quantity
    };

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders(prev => [result.data || newOrder, ...prev]);
      } else {
        setOrders(prev => [newOrder, ...prev]);
      }
    } catch (error) {
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const handleCloseLandingPreview = () => {
    setSelectedLandingPage(null);
    setCurrentView(isAdminRole(user?.role) ? 'admin' : 'store');
  };

  const handleUpdateLogo = (newLogo: string | null) => setLogo(newLogo);
  const handleUpdateTheme = async (newConfig: ThemeConfig) => {
    setThemeConfig(newConfig);
    if (activeTenantId) {
      await DataService.saveImmediate('theme_config', newConfig, activeTenantId);
    }
  };
  const handleUpdateWebsiteConfig = async (newConfig: WebsiteConfig) => {
    setWebsiteConfig(newConfig);
    if (activeTenantId) {
      await DataService.saveImmediate('website_config', newConfig, activeTenantId);
    }
  };
  const handleUpdateCourierConfig = (config: CourierConfig) => setCourierConfig(config);
  const handleUpdateDeliveryConfig = (configs: DeliveryConfig[]) => setDeliveryConfig(configs);

  const handleTenantChange = useCallback((tenantId: string) => {
    tenant.handleTenantChange(tenantId, {
      onResetChat: resetChatLoaded,
      setUser: (fn) => setUser(fn(user)),
      setCurrentView: setCurrentView as (view: string) => void,
      setAdminSection,
      setSelectedProduct: () => setSelectedProduct(null),
      setSelectedLandingPage: () => setSelectedLandingPage(null),
    });
  }, [tenant, resetChatLoaded, user, setCurrentView, setAdminSection, setSelectedProduct]);

  const handleCreateTenant = useCallback(async (payload: any, options?: { activate?: boolean }) => {
    return tenant.handleCreateTenant(payload, options, handleTenantChange);
  }, [tenant, handleTenantChange]);

  const handleDeleteTenant = useCallback(async (tenantId: string) => {
    return tenant.handleDeleteTenant(tenantId, handleTenantChange);
  }, [tenant, handleTenantChange]);

  // Catalog CRUD handlers
  const attachTenant = <T extends { tenantId?: string }>(item: T): T => ({ ...item, tenantId: item?.tenantId || activeTenantId });

  const createCrudHandler = (setter: React.Dispatch<React.SetStateAction<any[]>>, storageKey: string) => ({
    add: (item: any) => {
      setter(prev => {
        const updated = [...prev, attachTenant(item)];
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setter(prev => {
        const updated = prev.map(i => i.id === item.id ? attachTenant(item) : i);
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setter(prev => {
        const updated = prev.filter(i => i.id !== id);
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    }
  });

  const catHandlers = createCrudHandler(setCategories, 'categories');
  const subCatHandlers = createCrudHandler(setSubCategories, 'subcategories');
  const childCatHandlers = createCrudHandler(setChildCategories, 'childcategories');
  const brandHandlers = createCrudHandler(setBrands, 'brands');
  const tagHandlers = createCrudHandler(setTags, 'tags');

  // Computed values
  const platformOperator = isPlatformOperator(user?.role);
  const canAccessAdminChat = isAdminRole(user?.role);
  const selectedTenantRecord = tenants.find(t => t.id === activeTenantId) || tenantsRef.current.find(t => t.id === activeTenantId) || null;
  const isTenantLockedByHost = Boolean(hostTenantId);
  const scopedTenants = isTenantLockedByHost ? tenants.filter((t) => t.id === hostTenantId) : tenants;
  const headerTenants = platformOperator ? scopedTenants : (selectedTenantRecord ? [selectedTenantRecord] : []);

  // === RENDER ===
  return (
    <ThemeProvider themeConfig={themeConfig || undefined}>
      <Suspense fallback={null}>
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
        <div className={`relative ${themeConfig?.darkMode ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
          {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} />}

          {currentView === 'admin-login' ? (
            <Suspense fallback={null}>
              <AdminLogin onLoginSuccess={(loggedUser) => {
                setUser(loggedUser);
                // Route based on subdomain + role
                if (loggedUser.role === 'super_admin' && isSuperAdminSubdomain) {
                  setCurrentView('super-admin');
                } else {
                  setCurrentView('admin');
                }
              }} />
            </Suspense>
          ) : currentView === 'super-admin' ? (
            <Suspense fallback={<SuperAdminDashboardSkeleton />}>
              <SuperAdminDashboard />
            </Suspense>
          ) : currentView === 'admin' ? (
            <Suspense fallback={null}>
              <AdminAppWithAuth
                activeTenantId={activeTenantId}
                tenants={headerTenants}
                orders={orders}
                products={products}
                logo={logo}
                themeConfig={themeConfig}
                websiteConfig={websiteConfig}
                deliveryConfig={deliveryConfig}
                courierConfig={courierConfig}
                facebookPixelConfig={facebookPixelConfig}
                chatMessages={chatMessages}
                parentUser={user}
                onLogout={handleLogout}
                onUpdateOrder={handleUpdateOrder}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onBulkDeleteProducts={handleBulkDeleteProducts}
                onBulkUpdateProducts={handleBulkUpdateProducts}
                onUpdateLogo={handleUpdateLogo}
                onUpdateTheme={handleUpdateTheme}
                onUpdateWebsiteConfig={handleUpdateWebsiteConfig}
                onUpdateDeliveryConfig={handleUpdateDeliveryConfig}
                onUpdateCourierConfig={handleUpdateCourierConfig}
                onUpdateProfile={handleUpdateProfile}
                onTenantChange={handleTenantChange}
                isTenantSwitching={isTenantSwitching}
                onSwitchToStore={() => setCurrentView('store')}
                onOpenAdminChat={handleOpenAdminChat}
                hasUnreadChat={hasUnreadChat}
                onCreateTenant={handleCreateTenant}
                onDeleteTenant={handleDeleteTenant}
                onRefreshTenants={refreshTenants}
                isTenantCreating={isTenantSeeding}
                deletingTenantId={deletingTenantId}
              />
            </Suspense>
          ) : (
            <>
              {currentView === 'store' && (
                <Suspense fallback={<StorePageSkeleton />}>
                  <>
                    <StoreHome 
                      products={products} 
                      orders={orders}
                      tenantId={activeTenantId}
                      onProductClick={handleProductClick} 
                      onQuickCheckout={(product, quantity, variant) => handleCheckoutStart(product, quantity, variant)} 
                      wishlistCount={wishlist.length} 
                      wishlist={wishlist} 
                      onToggleWishlist={(id) => isInWishlist(id) ? removeFromWishlist(id) : addToWishlist(id)} 
                      user={user} 
                      onLoginClick={() => setIsLoginOpen(true)} 
                      onLogoutClick={handleLogout} 
                      onProfileClick={() => setCurrentView('profile')} 
                      logo={logo} 
                      websiteConfig={websiteConfig} 
                      searchValue={storeSearchQuery} 
                      onSearchChange={handleStoreSearchChange} 
                      onOpenChat={handleOpenChat}
                      cart={cartItems}
                      onToggleCart={handleCartToggle}
                      onCheckoutFromCart={handleCheckoutFromCart}
                      onAddToCart={(product, quantity, variant) => handleAddProductToCart(product, quantity, variant)}
                      categories={categories}
                      subCategories={subCategories}
                      childCategories={childCategories}
                      brands={brands}
                      tags={tags}
                      initialCategoryFilter={urlCategoryFilter}
                      onCategoryFilterChange={handleCategoryFilterChange}
                      onMobileMenuOpenRef={handleMobileMenuOpenRef}
                    />
                    <MobileBottomNav 
                      onHomeClick={() => { setCurrentView('store'); window.scrollTo(0,0); }}
                      onCartClick={() => {}}
                      onAccountClick={() => user ? setCurrentView('profile') : setIsLoginOpen(true)}
                      onMenuClick={() => mobileMenuOpenFnRef.current?.()}
                      cartCount={cartItems.length}
                      websiteConfig={websiteConfig}
                      onChatClick={handleOpenChat}
                      user={user}
                      onLogoutClick={handleLogout}
                    />
                  </>
                </Suspense>
              )}
              {currentView === 'detail' && selectedProduct && (
                <Suspense fallback={<ProductDetailSkeleton />}>
                  <StoreProductDetail 
                    product={selectedProduct} 
                    orders={orders}
                    tenantId={activeTenantId}
                    onBack={() => setCurrentView('store')} 
                    onProductClick={handleProductClick} 
                    wishlistCount={wishlist.length} 
                    isWishlisted={isInWishlist(selectedProduct.id)} 
                    onToggleWishlist={() => isInWishlist(selectedProduct.id) ? removeFromWishlist(selectedProduct.id) : addToWishlist(selectedProduct.id)} 
                    onCheckout={handleCheckoutStart} 
                    user={user} 
                    onLoginClick={() => setIsLoginOpen(true)} 
                    onLogoutClick={handleLogout} 
                    onProfileClick={() => setCurrentView('profile')} 
                    logo={logo} 
                    websiteConfig={websiteConfig} 
                    searchValue={storeSearchQuery} 
                    onSearchChange={handleStoreSearchChange} 
                    onOpenChat={handleOpenChat}
                    cart={cartItems}
                    onToggleCart={handleCartToggle}
                    onCheckoutFromCart={handleCheckoutFromCart}
                    onAddToCart={(product, quantity, variant) => handleAddProductToCart(product, quantity, variant, { silent: true })}
                    productCatalog={products}
                    categories={categories}
                    onCategoryClick={handleCategoryFilterChange}
                  />
                </Suspense>
              )}
              {currentView === 'checkout' && selectedProduct && (
                <Suspense fallback={null}>
                  <StoreCheckout 
                    product={selectedProduct}
                    quantity={checkoutQuantity}
                    variant={selectedVariant || ensureVariantSelection(selectedProduct)}
                    onBack={() => setCurrentView('detail')}
                    onConfirmOrder={handlePlaceOrder}
                    user={user}
                    onLoginClick={() => setIsLoginOpen(true)}
                    onLogoutClick={handleLogout}
                    onProfileClick={() => setCurrentView('profile')}
                    logo={logo}
                    websiteConfig={websiteConfig}
                    deliveryConfigs={deliveryConfig}
                    searchValue={storeSearchQuery}
                    onSearchChange={handleStoreSearchChange}
                    onOpenChat={handleOpenChat}
                    cart={cartItems}
                    onToggleCart={handleCartToggle}
                    onCheckoutFromCart={handleCheckoutFromCart}
                    productCatalog={products}
                    orders={orders}
                  />
                </Suspense>
              )}
              {currentView === 'success' && (
                <Suspense fallback={null}>
                  <StoreOrderSuccess 
                    onHome={() => setCurrentView('store')} 
                    user={user} 
                    onLoginClick={() => setIsLoginOpen(true)} 
                    onLogoutClick={handleLogout} 
                    onProfileClick={() => setCurrentView('profile')} 
                    logo={logo} 
                    websiteConfig={websiteConfig} 
                    searchValue={storeSearchQuery} 
                    onSearchChange={handleStoreSearchChange} 
                    onOpenChat={handleOpenChat}
                    cart={cartItems}
                    onToggleCart={handleCartToggle}
                    onCheckoutFromCart={handleCheckoutFromCart}
                    productCatalog={products}
                    orders={orders}
                  />
                </Suspense>
              )}
              {currentView === 'profile' && user && (
                <Suspense fallback={null}>
                  <>
                    <StoreProfile 
                      user={user} 
                      onUpdateProfile={handleUpdateProfile} 
                      orders={orders} 
                      onHome={() => setCurrentView('store')} 
                      onLoginClick={() => setIsLoginOpen(true)} 
                      onLogoutClick={handleLogout} 
                      logo={logo} 
                      websiteConfig={websiteConfig} 
                      searchValue={storeSearchQuery} 
                      onSearchChange={handleStoreSearchChange} 
                      onOpenChat={handleOpenChat}
                      cart={cartItems}
                      onToggleCart={handleCartToggle}
                      onCheckoutFromCart={handleCheckoutFromCart}
                      productCatalog={products}
                    />
                    <MobileBottomNav 
                      onHomeClick={() => { setCurrentView('store'); window.scrollTo(0,0); }}
                      onCartClick={() => {}}
                      onAccountClick={() => {}}
                      onMenuClick={() => mobileMenuOpenFnRef.current?.()}
                      cartCount={cartItems.length}
                      websiteConfig={websiteConfig}
                      onChatClick={handleOpenChat}
                      user={user}
                      onLogoutClick={handleLogout}
                      activeTab="account"
                    />
                  </>
                </Suspense>
              )}
              {currentView === 'landing_preview' && selectedLandingPage && (
                <Suspense fallback={null}>
                  <LandingPagePreview 
                    page={selectedLandingPage}
                    product={selectedLandingPage.productId ? products.find(p => p.id === selectedLandingPage.productId) : undefined}
                    onBack={handleCloseLandingPreview}
                    onSubmitLandingOrder={handleLandingOrderSubmit}
                  />
                </Suspense>
              )}
              <StoreChatModal
                isOpen={isChatOpen}
                onClose={handleCloseChat}
                websiteConfig={websiteConfig}
                themeConfig={themeConfig}
                user={user}
                messages={chatMessages}
                onSendMessage={handleCustomerSendChat}
                context="customer"
                onEditMessage={handleEditChatMessage}
                onDeleteMessage={handleDeleteChatMessage}
              />
            </>
          )}
        </div>
        {canAccessAdminChat && (
          <StoreChatModal
            isOpen={Boolean(isAdminChatOpen && currentView.startsWith('admin'))}
            onClose={handleCloseAdminChat}
            websiteConfig={websiteConfig}
            themeConfig={themeConfig}
            user={user}
            messages={chatMessages}
            onSendMessage={handleAdminSendChat}
            context="admin"
            onEditMessage={handleEditChatMessage}
            onDeleteMessage={handleDeleteChatMessage}
            canDeleteAll
          />
        )}
      </Suspense>
    </ThemeProvider>
  );
};

export default App;
