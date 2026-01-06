/**
 * useAppState.ts - Core data state management extracted from App.tsx
 */
import React, { useState, useRef, useCallback } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  LandingPage, FacebookPixelConfig, CourierConfig, Role, Category,
  SubCategory, ChildCategory, Brand, Tag, User, ProductVariantSelection
} from '../types';

// Default catalog values
export const DEFAULT_CATEGORIES: Category[] = [];
export const DEFAULT_SUB_CATEGORIES: SubCategory[] = [];
export const DEFAULT_BRANDS: Brand[] = [];
export const DEFAULT_TAGS: Tag[] = [];

// Refs type for data persistence
export interface AppStateRefs {
  ordersRef: React.MutableRefObject<Order[]>;
  productsRef: React.MutableRefObject<Product[]>;
  logoRef: React.MutableRefObject<string | null>;
  themeConfigRef: React.MutableRefObject<ThemeConfig | null>;
  websiteConfigRef: React.MutableRefObject<WebsiteConfig | undefined>;
  deliveryConfigRef: React.MutableRefObject<DeliveryConfig[]>;
  courierConfigRef: React.MutableRefObject<CourierConfig>;
  facebookPixelConfigRef: React.MutableRefObject<FacebookPixelConfig>;
  rolesRef: React.MutableRefObject<Role[]>;
  usersRef: React.MutableRefObject<User[]>;
  categoriesRef: React.MutableRefObject<Category[]>;
  subCategoriesRef: React.MutableRefObject<SubCategory[]>;
  childCategoriesRef: React.MutableRefObject<ChildCategory[]>;
  brandsRef: React.MutableRefObject<Brand[]>;
  tagsRef: React.MutableRefObject<Tag[]>;
  landingPagesRef: React.MutableRefObject<LandingPage[]>;
  userRef: React.MutableRefObject<User | null>;
}

export interface AppState {
  // Loading state
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  
  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  
  // Branding
  logo: string | null;
  setLogo: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Configs
  themeConfig: ThemeConfig | null;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig | null>>;
  websiteConfig: WebsiteConfig | undefined;
  setWebsiteConfig: React.Dispatch<React.SetStateAction<WebsiteConfig | undefined>>;
  deliveryConfig: DeliveryConfig[];
  setDeliveryConfig: React.Dispatch<React.SetStateAction<DeliveryConfig[]>>;
  facebookPixelConfig: FacebookPixelConfig;
  setFacebookPixelConfig: React.Dispatch<React.SetStateAction<FacebookPixelConfig>>;
  courierConfig: CourierConfig;
  setCourierConfig: React.Dispatch<React.SetStateAction<CourierConfig>>;
  
  // Roles & Users
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  
  // Catalog
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  subCategories: SubCategory[];
  setSubCategories: React.Dispatch<React.SetStateAction<SubCategory[]>>;
  childCategories: ChildCategory[];
  setChildCategories: React.Dispatch<React.SetStateAction<ChildCategory[]>>;
  brands: Brand[];
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  
  // User state
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoginOpen: boolean;
  setIsLoginOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Wishlist
  wishlist: number[];
  setWishlist: React.Dispatch<React.SetStateAction<number[]>>;
  
  // Checkout
  checkoutQuantity: number;
  setCheckoutQuantity: React.Dispatch<React.SetStateAction<number>>;
  selectedVariant: ProductVariantSelection | null;
  setSelectedVariant: React.Dispatch<React.SetStateAction<ProductVariantSelection | null>>;
  
  // Landing pages
  landingPages: LandingPage[];
  setLandingPages: React.Dispatch<React.SetStateAction<LandingPage[]>>;
  selectedLandingPage: LandingPage | null;
  setSelectedLandingPage: React.Dispatch<React.SetStateAction<LandingPage | null>>;
  
  // Refs for persistence
  refs: AppStateRefs;
  handleMobileMenuOpenRef: React.MutableRefObject<(() => void) | null>;
}

const DEFAULT_COURIER_CONFIG: CourierConfig = {
  apiKey: '',
  secretKey: '',
  instruction: '',
};

const DEFAULT_FACEBOOK_PIXEL_CONFIG: FacebookPixelConfig = {
  pixelId: '',
  accessToken: '',
  enableTestEvent: false,
  isEnabled: false,
};

export function useAppState(): AppState {
  // === LOADING STATE ===
  const [isLoading, setIsLoading] = useState(true);
  
  // === ORDERS ===
  const [orders, setOrders] = useState<Order[]>([]);
  
  // === PRODUCTS ===
  const [products, setProducts] = useState<Product[]>([]);
  
  // === BRANDING ===
  const [logo, setLogo] = useState<string | null>(null);
  
  // === CONFIGS ===
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | undefined>(undefined);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig[]>([]);
  const [facebookPixelConfig, setFacebookPixelConfig] = useState<FacebookPixelConfig>(DEFAULT_FACEBOOK_PIXEL_CONFIG);
  const [courierConfig, setCourierConfig] = useState<CourierConfig>(DEFAULT_COURIER_CONFIG);
  
  // === ROLES & USERS ===
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // === CATALOG ===
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [subCategories, setSubCategories] = useState<SubCategory[]>(DEFAULT_SUB_CATEGORIES);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  
  // === USER STATE ===
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // === WISHLIST ===
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  // === CHECKOUT ===
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantSelection | null>(null);
  
  // === LANDING PAGES ===
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  
  // === REFS FOR DATA PERSISTENCE ===
  const ordersRef = useRef<Order[]>([]);
  const productsRef = useRef<Product[]>([]);
  const logoRef = useRef<string | null>(null);
  const themeConfigRef = useRef<ThemeConfig | null>(null);
  const websiteConfigRef = useRef<WebsiteConfig | undefined>(undefined);
  const deliveryConfigRef = useRef<DeliveryConfig[]>([]);
  const courierConfigRef = useRef<CourierConfig>(DEFAULT_COURIER_CONFIG);
  const facebookPixelConfigRef = useRef<FacebookPixelConfig>(DEFAULT_FACEBOOK_PIXEL_CONFIG);
  const rolesRef = useRef<Role[]>([]);
  const usersRef = useRef<User[]>([]);
  const categoriesRef = useRef<Category[]>([]);
  const subCategoriesRef = useRef<SubCategory[]>([]);
  const childCategoriesRef = useRef<ChildCategory[]>([]);
  const brandsRef = useRef<Brand[]>([]);
  const tagsRef = useRef<Tag[]>([]);
  const landingPagesRef = useRef<LandingPage[]>([]);
  const userRef = useRef<User | null>(null);
  
  // Keep refs in sync with state
  ordersRef.current = orders;
  productsRef.current = products;
  logoRef.current = logo;
  themeConfigRef.current = themeConfig;
  websiteConfigRef.current = websiteConfig;
  deliveryConfigRef.current = deliveryConfig;
  courierConfigRef.current = courierConfig;
  facebookPixelConfigRef.current = facebookPixelConfig;
  rolesRef.current = roles;
  usersRef.current = users;
  categoriesRef.current = categories;
  subCategoriesRef.current = subCategories;
  childCategoriesRef.current = childCategories;
  brandsRef.current = brands;
  tagsRef.current = tags;
  landingPagesRef.current = landingPages;
  
  const refs: AppStateRefs = {
    ordersRef,
    productsRef,
    logoRef,
    themeConfigRef,
    websiteConfigRef,
    deliveryConfigRef,
    courierConfigRef,
    facebookPixelConfigRef,
    rolesRef,
    usersRef,
    categoriesRef,
    subCategoriesRef,
    childCategoriesRef,
    brandsRef,
    tagsRef,
    landingPagesRef,
    userRef,
  };
  
  // Mobile menu handler ref
  const handleMobileMenuOpenRef = useRef<(() => void) | null>(null);
  
  return {
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
  };
}
