/**
 * useNavigation - URL routing and view navigation extracted from App.tsx
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Product, User } from '../types';
import { isAdminRole, SESSION_STORAGE_KEY } from '../utils/appHelpers';

export type ViewState = 'store' | 'detail' | 'checkout' | 'success' | 'profile' | 'admin' | 'landing_preview' | 'admin-login' | 'visual-search' | 'super-admin' | 'register';

// Parse order ID from URL for success page
export function getOrderIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('orderId');
}

// Check if we're on the admin subdomain
const isAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'admin.systemnextit.com' || 
   window.location.hostname.startsWith('admin.'));

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'superadmin.systemnextit.com' || 
   window.location.hostname.startsWith('superadmin.'));

// Check if URL path is /admin (for tenant subdomain admin access)
const isAdminPath = typeof window !== 'undefined' && 
  (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'));

// Check if URL path is /register (for tenant self-registration)
const isRegisterPath = typeof window !== 'undefined' && 
  (window.location.pathname === '/register' || window.location.pathname.startsWith('/register'));

// Get initial view based on stored session
function getInitialView(): ViewState {
  if (typeof window === 'undefined') return 'store';
  
  // Check if /register path on main domain
  if (isRegisterPath) {
    return 'register';
  }
  
  // Super admin subdomain - always show super-admin dashboard (requires login)
  if (isSuperAdminSubdomain) {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role === 'super_admin') {
          return 'super-admin';
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login'; // Show login for super admin
  }
  
  // Admin subdomain - show admin login/dashboard
  if (isAdminSubdomain) {
    // Check for stored user session
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          if (['super_admin', 'admin', 'tenant_admin', 'staff'].includes(user.role)) {
            return 'admin';
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login';
  }
  
  // Tenant subdomain with /admin path - show admin login/dashboard
  if (isAdminPath && !isAdminSubdomain && !isSuperAdminSubdomain) {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          if (['super_admin', 'admin', 'tenant_admin', 'staff'].includes(user.role)) {
            return 'admin';
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'admin-login';
  }
  
  return 'store';
}

export { isAdminSubdomain, isSuperAdminSubdomain };

interface UseNavigationOptions {
  products: Product[];
  user: User | null;
}

// Get initial admin section from sessionStorage to prevent flashing
const getInitialAdminSection = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const stored = window.sessionStorage.getItem('adminSection');
    if (stored) return stored;
  } catch (e) {
    // Ignore errors
  }
  return 'dashboard';
};

export function useNavigation({ products, user }: UseNavigationOptions) {
  // Start with correct view based on stored session
  const [currentView, setCurrentView] = useState<ViewState>(getInitialView);
  const [adminSection, setAdminSectionInternal] = useState(getInitialAdminSection);

  // Wrapper to persist adminSection to sessionStorage
  const setAdminSection = (section: string) => {
    setAdminSectionInternal(section);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('adminSection', section);
      } catch (e) {
        // Ignore storage errors
      }
    }
  };
  const [urlCategoryFilter, setUrlCategoryFilter] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const currentViewRef = useRef<ViewState>(currentView);
  const userRef = useRef<User | null>(user);

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { userRef.current = user; }, [user]);

  const handleStoreSearchChange = useCallback((value: string) => {
    setStoreSearchQuery(value);
    if (currentViewRef.current !== 'store') {
      setSelectedProduct(null);
      setCurrentView('store');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const syncViewWithLocation = useCallback((path?: string) => {
    const trimmedPath = (path ?? window.location.pathname).replace(/^\/+|\/+$/g, '');
    const activeView = currentViewRef.current;
    const activeUser = userRef.current;

    // Handle register route (public tenant registration)
    if (trimmedPath === 'register') {
      if (activeView !== 'register') {
        setCurrentView('register');
      }
      return;
    }

    // Handle admin login route FIRST
    if (trimmedPath === 'admin/login') {
      if (activeView !== 'admin-login') {
        setCurrentView('admin-login');
      }
      return;
    }

    // Handle checkout route
    if (trimmedPath === 'checkout') {
      if (activeView !== 'checkout') {
        setCurrentView('checkout');
      }
      return;
    }

    // Handle visual-search route
    if (trimmedPath === 'visual-search' || trimmedPath === 'search') {
      if (activeView !== 'visual-search') {
        setCurrentView('visual-search');
      }
      return;
    }

    // Handle success-order route
    if (trimmedPath === 'success-order') {
      if (activeView !== 'success') {
        setCurrentView('success');
      }
      return;
    }

    // Handle /all-products route
    if (trimmedPath === 'all-products') {
      const searchParams = new URLSearchParams(window.location.search);
      const categorySlug = searchParams.get('category');
      const brandSlug = searchParams.get('brand');
      if (categorySlug) {
        setUrlCategoryFilter(categorySlug);
      } else if (brandSlug) {
        setUrlCategoryFilter(`brand:${brandSlug}`);
      } else {
        setUrlCategoryFilter('all');
      }
      if (!activeView.startsWith('admin')) {
        setSelectedProduct(null);
        setCurrentView('store');
      }
      return;
    }

    // Handle /product-details/slug route
    if (trimmedPath.startsWith('product-details/')) {
      const slug = trimmedPath.replace('product-details/', '');
      const matchedProduct = products.find(p => p.slug === slug);
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setCurrentView('detail');
        return;
      }
    }

    // Handle /products route with optional category filter (legacy)
    if (trimmedPath === 'products') {
      const searchParams = new URLSearchParams(window.location.search);
      const categorySlug = searchParams.get('categories');
      if (categorySlug) {
        setUrlCategoryFilter(categorySlug);
        if (!activeView.startsWith('admin')) {
          setSelectedProduct(null);
          setCurrentView('store');
        }
        return;
      } else {
        window.history.replaceState({}, '', '/');
        setUrlCategoryFilter(null);
        if (!activeView.startsWith('admin')) {
          setSelectedProduct(null);
          setCurrentView('store');
        }
        return;
      }
    }

    if (!trimmedPath) {
      setUrlCategoryFilter(null);

      if (isSuperAdminSubdomain) {
        // Super admin subdomain should never show store content
        if (activeUser?.role === 'super_admin') {
          if (activeView !== 'super-admin') {
            setCurrentView('super-admin');
          }
        } else if (activeView !== 'admin-login') {
          setCurrentView('admin-login');
        }
        return;
      }

      // On admin subdomain, stay on admin-login if not logged in
      if (isAdminSubdomain) {
        if (!activeView.startsWith('admin') && activeView !== 'admin-login') {
          setCurrentView('admin-login');
        }
        return;
      }

      if (!activeView.startsWith('admin')) {
        setSelectedProduct(null);
        setCurrentView('store');
      }
      return;
    }

    if (trimmedPath === 'admin') {
      // Allow admin access on admin subdomain OR any tenant subdomain with /admin path
      if (isAdminRole(activeUser?.role)) {
        // User is logged in with admin role - show admin panel
        setCurrentView('admin');
      } else {
        // Not logged in or not admin - show login
        setCurrentView('admin-login');
      }
      return;
    }

    const matchedProduct = products.find(p => p.slug === trimmedPath);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setCurrentView('detail');
      return;
    }

    if (activeView === 'admin-login') {
      return;
    }

    if (isSuperAdminSubdomain) {
      // Keep super admin context even if URL is unexpected
      if (activeUser?.role === 'super_admin') {
        if (activeView !== 'super-admin') {
          setCurrentView('super-admin');
        }
      } else if (activeView !== 'admin-login') {
        setCurrentView('admin-login');
      }
      return;
    }

    window.history.replaceState({}, '', '/');
    if (!activeView.startsWith('admin')) {
      setSelectedProduct(null);
      setCurrentView('store');
    }
  }, [products]);

  // Listen for popstate
  useEffect(() => {
    const handlePopState = () => syncViewWithLocation();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncViewWithLocation]);

  // Initial sync
  useEffect(() => {
    syncViewWithLocation(window.location.pathname);
  }, [products, syncViewWithLocation]);

  // Ensure URL matches view
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (path === 'admin/login') return;
    if (path === 'visual-search' || path === 'search') return;
    
    if (currentView === 'store' && window.location.pathname !== '/' && !window.location.pathname.includes('checkout') && !window.location.pathname.includes('success-order')) {
      window.history.replaceState({}, '', '/');
    }
  }, [currentView]);

  // Handle notification navigation
  useEffect(() => {
    const handleNavigateToOrder = (event: CustomEvent<{ orderId: string; tenantId?: string }>) => {
      const { orderId } = event.detail;
      console.log('[App] Navigate to order:', orderId);
      setCurrentView('admin');
      setAdminSection('orders');
      window.sessionStorage.setItem('highlightOrderId', orderId);
    };
    
    window.addEventListener('navigate-to-order', handleNavigateToOrder as EventListener);
    return () => {
      window.removeEventListener('navigate-to-order', handleNavigateToOrder as EventListener);
    };
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    // Start transition immediately for smoother UX
    setCurrentView('detail');
    setSelectedProduct(product);
    
    if (product.slug) {
      window.history.pushState({ slug: product.slug }, '', `/product-details/${product.slug}`);
    }
    
    // Smooth scroll with slight delay for view transition
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, []);

  const handleCategoryFilterChange = useCallback((categorySlug: string | null) => {
    // Apply filter immediately for instant feedback
    setUrlCategoryFilter(categorySlug);
    
    requestAnimationFrame(() => {
      if (categorySlug) {
        if (categorySlug === 'all') {
          window.history.pushState({}, '', '/all-products');
        } else if (categorySlug.startsWith('brand:')) {
          window.history.pushState({}, '', `/all-products?brand=${categorySlug.replace('brand:', '')}`);
        } else {
          window.history.pushState({}, '', `/all-products?category=${categorySlug}`);
        }
      } else {
        window.history.pushState({}, '', '/');
      }
    });
  }, []);

  return {
    // State
    currentView,
    setCurrentView,
    adminSection,
    setAdminSection,
    urlCategoryFilter,
    setUrlCategoryFilter,
    selectedProduct,
    setSelectedProduct,
    storeSearchQuery,
    setStoreSearchQuery,
    // Handlers
    handleStoreSearchChange,
    syncViewWithLocation,
    handleProductClick,
    handleCategoryFilterChange,
    // Refs
    currentViewRef,
  };
}
