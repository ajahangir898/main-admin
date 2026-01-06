/**
 * useAppState.ts - Core application data state management
 * Extracted from App.tsx for better organization
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  ProductVariantSelection, LandingPage, FacebookPixelConfig, CourierConfig,
  Role, Category, SubCategory, ChildCategory, Brand, Tag, User
} from '../types';
import { getInitialCachedData } from '../utils/appHelpers';

// Default catalog data to prevent data loss during refresh
export const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Phones', icon: '', status: 'Active' as const },
  { id: '2', name: 'Watches', icon: '', status: 'Active' as const }
];
export const DEFAULT_SUB_CATEGORIES = [
  { id: '1', categoryId: '1', name: 'Smartphones', status: 'Active' as const },
  { id: '2', categoryId: '1', name: 'Feature Phones', status: 'Active' as const }
];
export const DEFAULT_BRANDS = [
  { id: '1', name: 'Apple', logo: '', status: 'Active' as const },
  { id: '2', name: 'Samsung', logo: '', status: 'Active' as const }
];
export const DEFAULT_TAGS = [
  { id: '1', name: 'Flash Deal', status: 'Active' as const },
  { id: '2', name: 'New Arrival', status: 'Active' as const }
];

export interface AppStateRefs {
  prevLogoRef: React.MutableRefObject<string | null>;
  prevThemeConfigRef: React.MutableRefObject<ThemeConfig | null>;
  prevWebsiteConfigRef: React.MutableRefObject<WebsiteConfig | undefined>;
  ordersLoadedRef: React.MutableRefObject<boolean>;
  prevOrdersRef: React.MutableRefObject<Order[]>;
  prevDeliveryConfigRef: React.MutableRefObject<DeliveryConfig[]>;
  prevLandingPagesRef: React.MutableRefObject<LandingPage[]>;
  prevCategoriesRef: React.MutableRefObject<Category[]>;
  prevSubCategoriesRef: React.MutableRefObject<SubCategory[]>;
  prevChildCategoriesRef: React.MutableRefObject<ChildCategory[]>;
  prevBrandsRef: React.MutableRefObject<Brand[]>;
  prevTagsRef: React.MutableRefObject<Tag[]>;
  prevRolesRef: React.MutableRefObject<Role[]>;
  prevUsersRef: React.MutableRefObject<User[]>;
  initialDataLoadedRef: React.MutableRefObject<boolean>;
  productsLoadedFromServerRef: React.MutableRefObject<boolean>;
  prevProductsRef: React.MutableRefObject<Product[]>;
  isFirstProductUpdateRef: React.MutableRefObject<boolean>;
  catalogLoadedRef: React.MutableRefObject<boolean>;
  adminDataLoadedRef: React.MutableRefObject<boolean>;
  userRef: React.MutableRefObject<User | null>;
  sessionRestoredRef: React.MutableRefObject<boolean>;
  mobileMenuOpenFnRef: React.MutableRefObject<(() => void) | null>;
}

export function useAppState() {
  // === LOADING STATE ===
  const [isLoading, setIsLoading] = useState(false);

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

  // === REFS FOR PERSISTENCE ===
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
  const sessionRestoredRef = useRef(false);
  const mobileMenuOpenFnRef = useRef<(() => void) | null>(null);

  // Memoized callback for mobile menu ref
  const handleMobileMenuOpenRef = useCallback((fn: () => void) => {
    mobileMenuOpenFnRef.current = fn;
  }, []);

  // Memoize refs object to prevent infinite re-renders
  const refs: AppStateRefs = useMemo(() => ({
    prevLogoRef,
    prevThemeConfigRef,
    prevWebsiteConfigRef,
    ordersLoadedRef,
    prevOrdersRef,
    prevDeliveryConfigRef,
    prevLandingPagesRef,
    prevCategoriesRef,
    prevSubCategoriesRef,
    prevChildCategoriesRef,
    prevBrandsRef,
    prevTagsRef,
    prevRolesRef,
    prevUsersRef,
    initialDataLoadedRef,
    productsLoadedFromServerRef,
    prevProductsRef,
    isFirstProductUpdateRef,
    catalogLoadedRef,
    adminDataLoadedRef,
    userRef,
    sessionRestoredRef,
    mobileMenuOpenFnRef,
  }), []);

  return {
    // Loading
    isLoading, setIsLoading,
    
    // Core data
    orders, setOrders,
    products, setProducts,
    logo, setLogo,
    themeConfig, setThemeConfig,
    websiteConfig, setWebsiteConfig,
    deliveryConfig, setDeliveryConfig,
    facebookPixelConfig, setFacebookPixelConfig,
    roles, setRoles,
    users, setUsers,
    
    // Catalog
    categories, setCategories,
    subCategories, setSubCategories,
    childCategories, setChildCategories,
    brands, setBrands,
    tags, setTags,
    courierConfig, setCourierConfig,
    
    // User & Auth
    user, setUser,
    isLoginOpen, setIsLoginOpen,
    wishlist, setWishlist,
    checkoutQuantity, setCheckoutQuantity,
    selectedVariant, setSelectedVariant,
    landingPages, setLandingPages,
    selectedLandingPage, setSelectedLandingPage,
    
    // Refs
    refs,
    handleMobileMenuOpenRef,
  };
}

export type AppState = ReturnType<typeof useAppState>;
