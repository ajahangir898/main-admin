/// <reference types="vite/client" />
/**
 * App.tsx - Main Application Component (Refactored & Optimized)
 * 
 * This file orchestrates the application by composing extracted modules:
 * - hooks/useAppState.ts - Core data state management
 * - hooks/useAppHandlers.ts - All handler functions
 * - hooks/useDataPersistence.ts - Data persistence effects
 * - hooks/useChat.ts - Chat state and handlers
 * - hooks/useCart.ts - Cart state and handlers
 * - hooks/useAuth.ts - Authentication handlers
 * - hooks/useTenant.ts - Tenant state and handlers
 * - hooks/useThemeEffects.ts - Theme application
 * - hooks/useFacebookPixel.ts - Facebook Pixel
 * - hooks/useNavigation.ts - URL routing and navigation
 * - components/AppRoutes.tsx - All view rendering logic
 */
import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import type { FacebookPixelConfig } from './types';

// Core services
import { DataService, joinTenantRoom, leaveTenantRoom } from './services/DataService';
import { useDataRefreshDebounced } from './hooks/useDataRefresh';
import { ThemeProvider } from './context/ThemeContext';

// Extracted hooks
import { useAppState, DEFAULT_CATEGORIES, DEFAULT_SUB_CATEGORIES, DEFAULT_BRANDS, DEFAULT_TAGS } from './hooks/useAppState';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useDataPersistence } from './hooks/useDataPersistence';
import { useChat } from './hooks/useChat';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import { useThemeEffects } from './hooks/useThemeEffects';
import { useFacebookPixel } from './hooks/useFacebookPixel';
import { useNavigation } from './hooks/useNavigation';

// Extracted components
import { AppRoutes } from './components/AppRoutes';

// Utilities
import {
  isAdminRole,
  isPlatformOperator,
  normalizeProductCollection,
  hasCachedData,
  sanitizeSubdomainSlug,
  setCachedTenantIdForSubdomain,
  SESSION_STORAGE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
} from './utils/appHelpers';

// Defer Toaster import
const Toaster = lazy(() => import('react-hot-toast').then(m => ({ default: m.Toaster })));

// Check if we're on the admin subdomain
const isAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'admin.systemnextit.com' || 
   window.location.hostname.startsWith('admin.'));

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'superadmin.systemnextit.com' || 
   window.location.hostname.startsWith('superadmin.'));

// Preload functions - ONLY called on user interaction
export const preloadCheckout = () => import('./pages/StoreCheckout');
export const preloadProductDetail = () => import('./pages/StoreProductDetail');
export const preloadStoreProfile = () => import('./pages/StoreProfile');

const App = () => {
  // === CORE STATE ===
  const appState = useAppState();
  const {
    isLoading, setIsLoading,
    orders, setOrders,
    products, setProducts,
    logo, setLogo,
    themeConfig, setThemeConfig,
    websiteConfig, setWebsiteConfig,
    deliveryConfig, setDeliveryConfig,
    facebookPixelConfig, setFacebookPixelConfig,
    roles, setRoles,
    users, setUsers,
    categories, setCategories,
    subCategories, setSubCategories,
    childCategories, setChildCategories,
    brands, setBrands,
    tags, setTags,
    courierConfig, setCourierConfig,
    user, setUser,
    isLoginOpen, setIsLoginOpen,
    wishlist, setWishlist,
    checkoutQuantity, setCheckoutQuantity,
    selectedVariant, setSelectedVariant,
    landingPages, setLandingPages,
    selectedLandingPage, setSelectedLandingPage,
    refs,
    handleMobileMenuOpenRef,
  } = appState;

  // === TENANT MANAGEMENT ===
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

  // === NAVIGATION ===
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

  // === CHAT ===
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

  // === CART ===
  const cart = useCart({ user, products, tenantId: activeTenantId });
  const { cartItems, handleCartToggle, handleAddProductToCart } = cart;

  // === AUTH ===
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

  // === HANDLERS ===
  const handlers = useAppHandlers({
    activeTenantId,
    products,
    orders,
    roles,
    wishlist,
    checkoutQuantity,
    selectedProduct,
    selectedVariant,
    user,
    cartItems,
    setProducts,
    setOrders,
    setRoles,
    setWishlist,
    setCheckoutQuantity,
    setSelectedProduct,
    setSelectedVariant,
    setSelectedLandingPage,
    setCurrentView,
    setLogo,
    setThemeConfig,
    setWebsiteConfig,
    setDeliveryConfig,
    setCourierConfig,
    setCategories,
    setSubCategories,
    setChildCategories,
    setBrands,
    setTags,
    handleAddProductToCart,
  });

  // === THEME EFFECTS ===
  useThemeEffects({ themeConfig, websiteConfig, activeTenantId, isLoading, currentView, isTenantSwitching });
  
  // === FACEBOOK PIXEL ===
  useFacebookPixel(facebookPixelConfig);

  // === DATA PERSISTENCE ===
  useDataPersistence({
    activeTenantId,
    isLoading,
    isTenantSwitching,
    orders,
    products,
    logo,
    themeConfig,
    websiteConfig,
    deliveryConfig,
    courierConfig,
    facebookPixelConfig,
    roles,
    users,
    categories,
    subCategories,
    childCategories,
    brands,
    tags,
    landingPages,
    refs,
  });

  // Update userRef when user changes
  useEffect(() => { refs.userRef.current = user; }, [user, refs]);

  // === SOCKET ROOM MANAGEMENT ===
  useEffect(() => {
    if (!activeTenantId) return;
    const timer = setTimeout(() => joinTenantRoom(activeTenantId), 3500);
    return () => {
      clearTimeout(timer);
      leaveTenantRoom(activeTenantId);
    };
  }, [activeTenantId]);

  // === SESSION RESTORATION ===
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
            return;
          }
        } catch (e) {
          console.error('Session restoration error:', e);
        }
      }
      setCurrentView('admin-login');
      refs.sessionRestoredRef.current = true;
      return;
    }
    
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      if (isAdminSubdomain) setCurrentView('admin-login');
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

  // Persist user session
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

  // Handle user role changes
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

  // === INITIAL DATA LOADING ===
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      const hasCache = hasCachedData();
      if (!hasCache) setIsLoading(true);
      let loadError: Error | null = null;
      const startTime = performance.now();
      
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
        
        if (!resolvedTenantId) return;
        
        const bootstrapData = await DataService.bootstrap(resolvedTenantId);
        if (!isMounted) return;
        
        const normalizedProducts = normalizeProductCollection(bootstrapData.products, resolvedTenantId);
        setProducts(normalizedProducts);
        
        refs.prevThemeConfigRef.current = bootstrapData.themeConfig;
        refs.prevWebsiteConfigRef.current = bootstrapData.websiteConfig;
        refs.prevProductsRef.current = normalizedProducts;
        
        setThemeConfig(bootstrapData.themeConfig);
        setWebsiteConfig(bootstrapData.websiteConfig);

        const loadSecondaryData = () => {
          if (!isMounted) return;
          DataService.getSecondaryData(resolvedTenantId).then((data) => {
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

  // === DATA REFRESH HANDLER ===
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

  // === ADMIN CHAT VISIBILITY ===
  useEffect(() => {
    if (!currentView.startsWith('admin') && isAdminChatOpen) handleCloseAdminChat();
  }, [currentView, isAdminChatOpen, handleCloseAdminChat]);

  useEffect(() => {
    if (adminSection === 'tenants' && !isPlatformOperator(user?.role)) setAdminSection('dashboard');
  }, [adminSection, user, setAdminSection]);

  // === TENANT HANDLERS ===
  const handleTenantChange = useCallback((tenantId: string) => {
    tenant.handleTenantChange(tenantId, {
      onResetChat: resetChatLoaded,
      setUser: (fn) => setUser(fn(user)),
      setCurrentView: setCurrentView as (view: string) => void,
      setAdminSection,
      setSelectedProduct: () => setSelectedProduct(null),
      setSelectedLandingPage: () => setSelectedLandingPage(null),
    });
  }, [tenant, resetChatLoaded, user, setCurrentView, setAdminSection, setSelectedProduct, setSelectedLandingPage, setUser]);

  const handleCreateTenant = useCallback(async (payload: any, options?: { activate?: boolean }) => {
    return tenant.handleCreateTenant(payload, options, handleTenantChange);
  }, [tenant, handleTenantChange]);

  const handleDeleteTenant = useCallback(async (tenantId: string) => {
    return tenant.handleDeleteTenant(tenantId, handleTenantChange);
  }, [tenant, handleTenantChange]);

  // === COMPUTED VALUES ===
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
          <AppRoutes
            currentView={currentView}
            isSuperAdminSubdomain={isSuperAdminSubdomain}
            products={products}
            orders={orders}
            logo={logo}
            themeConfig={themeConfig}
            websiteConfig={websiteConfig}
            deliveryConfig={deliveryConfig}
            courierConfig={courierConfig}
            facebookPixelConfig={facebookPixelConfig}
            categories={categories}
            subCategories={subCategories}
            childCategories={childCategories}
            brands={brands}
            tags={tags}
            chatMessages={chatMessages}
            user={user}
            wishlist={wishlist}
            cartItems={cartItems}
            selectedProduct={selectedProduct}
            selectedLandingPage={selectedLandingPage}
            selectedVariant={selectedVariant}
            checkoutQuantity={checkoutQuantity}
            storeSearchQuery={storeSearchQuery}
            urlCategoryFilter={urlCategoryFilter}
            activeTenantId={activeTenantId}
            headerTenants={headerTenants}
            isTenantSwitching={isTenantSwitching}
            isTenantSeeding={isTenantSeeding}
            deletingTenantId={deletingTenantId}
            isChatOpen={isChatOpen}
            isAdminChatOpen={isAdminChatOpen}
            hasUnreadChat={hasUnreadChat}
            canAccessAdminChat={canAccessAdminChat}
            onProductClick={handleProductClick}
            onQuickCheckout={handlers.handleCheckoutStart}
            onToggleWishlist={(id) => handlers.isInWishlist(id) ? handlers.removeFromWishlist(id) : handlers.addToWishlist(id)}
            isInWishlist={handlers.isInWishlist}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onUpdateOrder={handlers.handleUpdateOrder}
            onAddProduct={handlers.handleAddProduct}
            onUpdateProduct={handlers.handleUpdateProduct}
            onDeleteProduct={handlers.handleDeleteProduct}
            onBulkDeleteProducts={handlers.handleBulkDeleteProducts}
            onBulkUpdateProducts={handlers.handleBulkUpdateProducts}
            onUpdateLogo={handlers.handleUpdateLogo}
            onUpdateTheme={handlers.handleUpdateTheme}
            onUpdateWebsiteConfig={handlers.handleUpdateWebsiteConfig}
            onUpdateDeliveryConfig={handlers.handleUpdateDeliveryConfig}
            onUpdateCourierConfig={handlers.handleUpdateCourierConfig}
            onPlaceOrder={handlers.handlePlaceOrder}
            onLandingOrderSubmit={handlers.handleLandingOrderSubmit}
            onCloseLandingPreview={handlers.handleCloseLandingPreview}
            onTenantChange={handleTenantChange}
            onCreateTenant={handleCreateTenant}
            onDeleteTenant={handleDeleteTenant}
            onRefreshTenants={refreshTenants}
            onSearchChange={handleStoreSearchChange}
            onCategoryFilterChange={handleCategoryFilterChange}
            onMobileMenuOpenRef={handleMobileMenuOpenRef}
            onToggleCart={handleCartToggle}
            onCheckoutFromCart={handlers.handleCheckoutFromCart}
            onAddToCart={handleAddProductToCart}
            onOpenChat={handleOpenChat}
            onCloseChat={handleCloseChat}
            onOpenAdminChat={handleOpenAdminChat}
            onCloseAdminChat={handleCloseAdminChat}
            onCustomerSendChat={handleCustomerSendChat}
            onAdminSendChat={handleAdminSendChat}
            onEditChatMessage={handleEditChatMessage}
            onDeleteChatMessage={handleDeleteChatMessage}
            setCurrentView={setCurrentView}
            setUser={setUser}
            setIsLoginOpen={setIsLoginOpen}
            isLoginOpen={isLoginOpen}
          />
        </div>
      </Suspense>
    </ThemeProvider>
  );
};

export default App;
