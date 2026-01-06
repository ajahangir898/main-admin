/**
 * useAppState.ts - Core data state management extracted from App.tsx
 */
import React, { useState, useRef, useEffect } from 'react';
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
  // Additional refs for data persistence
  ordersLoadedRef: React.MutableRefObject<boolean>;
  prevOrdersRef: React.MutableRefObject<Order[]>;
  initialDataLoadedRef: React.MutableRefObject<boolean>;
  productsLoadedFromServerRef: React.MutableRefObject<boolean>;
  prevProductsRef: React.MutableRefObject<Product[]>;
  isFirstProductUpdateRef: React.MutableRefObject<boolean>;
  prevLogoRef: React.MutableRefObject<string | null>;
  prevThemeConfigRef: React.MutableRefObject<ThemeConfig | null>;
  prevWebsiteConfigRef: React.MutableRefObject<WebsiteConfig | undefined>;
  prevDeliveryConfigRef: React.MutableRefObject<DeliveryConfig[]>;
  prevRolesRef: React.MutableRefObject<Role[]>;
  prevUsersRef: React.MutableRefObject<User[]>;
  prevCategoriesRef: React.MutableRefObject<Category[]>;
  prevSubCategoriesRef: React.MutableRefObject<SubCategory[]>;
  prevChildCategoriesRef: React.MutableRefObject<ChildCategory[]>;
  prevBrandsRef: React.MutableRefObject<Brand[]>;
  prevTagsRef: React.MutableRefObject<Tag[]>;
  prevLandingPagesRef: React.MutableRefObject<LandingPage[]>;
  catalogLoadedRef: React.MutableRefObject<boolean>;
  adminDataLoadedRef: React.MutableRefObject<boolean>;
  sessionRestoredRef: React.MutableRefObject<boolean>;
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
  const ordersRef = useRef<Order[]>(orders);
  const productsRef = useRef<Product[]>(products);
  const logoRef = useRef<string | null>(logo);
  const themeConfigRef = useRef<ThemeConfig | null>(themeConfig);
  const websiteConfigRef = useRef<WebsiteConfig | undefined>(websiteConfig);
  const deliveryConfigRef = useRef<DeliveryConfig[]>(deliveryConfig);
  const courierConfigRef = useRef<CourierConfig>(courierConfig);
  const facebookPixelConfigRef = useRef<FacebookPixelConfig>(facebookPixelConfig);
  const rolesRef = useRef<Role[]>(roles);
  const usersRef = useRef<User[]>(users);
  const categoriesRef = useRef<Category[]>(categories);
  const subCategoriesRef = useRef<SubCategory[]>(subCategories);
  const childCategoriesRef = useRef<ChildCategory[]>(childCategories);
  const brandsRef = useRef<Brand[]>(brands);
  const tagsRef = useRef<Tag[]>(tags);
  const landingPagesRef = useRef<LandingPage[]>(landingPages);
  const userRef = useRef<User | null>(user);
  
  // Additional refs for data persistence tracking
  const ordersLoadedRef = useRef<boolean>(false);
  const prevOrdersRef = useRef<Order[]>([]);
  const initialDataLoadedRef = useRef<boolean>(false);
  const productsLoadedFromServerRef = useRef<boolean>(false);
  const prevProductsRef = useRef<Product[]>([]);
  const isFirstProductUpdateRef = useRef<boolean>(false);
  const prevLogoRef = useRef<string | null>(null);
  const prevThemeConfigRef = useRef<ThemeConfig | null>(null);
  const prevWebsiteConfigRef = useRef<WebsiteConfig | undefined>(undefined);
  const prevDeliveryConfigRef = useRef<DeliveryConfig[]>([]);
  const prevRolesRef = useRef<Role[]>([]);
  const prevUsersRef = useRef<User[]>([]);
  const prevCategoriesRef = useRef<Category[]>([]);
  const prevSubCategoriesRef = useRef<SubCategory[]>([]);
  const prevChildCategoriesRef = useRef<ChildCategory[]>([]);
  const prevBrandsRef = useRef<Brand[]>([]);
  const prevTagsRef = useRef<Tag[]>([]);
  const prevLandingPagesRef = useRef<LandingPage[]>([]);
  const catalogLoadedRef = useRef<boolean>(false);
  const adminDataLoadedRef = useRef<boolean>(false);
  const sessionRestoredRef = useRef<boolean>(false);
  
  // Mobile menu handler ref
  const handleMobileMenuOpenRef = useRef<(() => void) | null>(null);
  
  // Keep refs in sync with state using useEffect
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { logoRef.current = logo; }, [logo]);
  useEffect(() => { themeConfigRef.current = themeConfig; }, [themeConfig]);
  useEffect(() => { websiteConfigRef.current = websiteConfig; }, [websiteConfig]);
  useEffect(() => { deliveryConfigRef.current = deliveryConfig; }, [deliveryConfig]);
  useEffect(() => { courierConfigRef.current = courierConfig; }, [courierConfig]);
  useEffect(() => { facebookPixelConfigRef.current = facebookPixelConfig; }, [facebookPixelConfig]);
  useEffect(() => { rolesRef.current = roles; }, [roles]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { categoriesRef.current = categories; }, [categories]);
  useEffect(() => { subCategoriesRef.current = subCategories; }, [subCategories]);
  useEffect(() => { childCategoriesRef.current = childCategories; }, [childCategories]);
  useEffect(() => { brandsRef.current = brands; }, [brands]);
  useEffect(() => { tagsRef.current = tags; }, [tags]);
  useEffect(() => { landingPagesRef.current = landingPages; }, [landingPages]);
  useEffect(() => { userRef.current = user; }, [user]);
  
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
    // Additional refs
    ordersLoadedRef,
    prevOrdersRef,
    initialDataLoadedRef,
    productsLoadedFromServerRef,
    prevProductsRef,
    isFirstProductUpdateRef,
    prevLogoRef,
    prevThemeConfigRef,
    prevWebsiteConfigRef,
    prevDeliveryConfigRef,
    prevRolesRef,
    prevUsersRef,
    prevCategoriesRef,
    prevSubCategoriesRef,
    prevChildCategoriesRef,
    prevBrandsRef,
    prevTagsRef,
    prevLandingPagesRef,
    catalogLoadedRef,
    adminDataLoadedRef,
    sessionRestoredRef,
  };
  
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
