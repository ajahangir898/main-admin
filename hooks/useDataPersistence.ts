/**
 * useDataPersistence.ts - All data persistence effects extracted from App.tsx
 */
import { useEffect, useCallback } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  LandingPage, FacebookPixelConfig, CourierConfig, Role, Category,
  SubCategory, ChildCategory, Brand, Tag, User
} from '../types';
import { DataService, isKeyFromSocket, clearSocketFlag } from '../services/DataService';
import type { AppStateRefs } from './useAppState';

interface UseDataPersistenceProps {
  activeTenantId: string;
  isLoading: boolean;
  isTenantSwitching: boolean;
  
  // Data
  orders: Order[];
  products: Product[];
  logo: string | null;
  themeConfig: ThemeConfig | null;
  websiteConfig: WebsiteConfig | undefined;
  deliveryConfig: DeliveryConfig[];
  courierConfig: CourierConfig;
  facebookPixelConfig: FacebookPixelConfig;
  roles: Role[];
  users: User[];
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  landingPages: LandingPage[];
  
  // Refs
  refs: AppStateRefs;
}

export function useDataPersistence(props: UseDataPersistenceProps) {
  const {
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
  } = props;

  const {
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
    prevCategoriesRef,
    prevSubCategoriesRef,
    prevChildCategoriesRef,
    prevBrandsRef,
    prevTagsRef,
    prevLandingPagesRef,
    catalogLoadedRef,
    adminDataLoadedRef,
    userRef,
  } = refs;

  // Update userRef when user changes
  useEffect(() => { userRef.current = props.refs.userRef.current; }, [props.refs.userRef]);

  // === ORDERS PERSISTENCE ===
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
  }, [orders, isLoading, isTenantSwitching, activeTenantId, ordersLoadedRef, prevOrdersRef]);

  // === INITIAL DATA LOADED FLAG ===
  useEffect(() => {
    if (!isLoading && activeTenantId) {
      initialDataLoadedRef.current = true;
    }
  }, [isLoading, activeTenantId, initialDataLoadedRef]);

  // === RESET REFS ON TENANT CHANGE ===
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
  }, [activeTenantId]);

  // === PRODUCTS PERSISTENCE ===
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

  // === ROLES PERSISTENCE ===
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

  // === USERS PERSISTENCE ===
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current && users.length > 0) {
      DataService.save('users', users, activeTenantId);
    }
  }, [users, isLoading, isTenantSwitching, activeTenantId]);

  // === LOGO PERSISTENCE ===
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

  // === THEME CONFIG PERSISTENCE ===
  useEffect(() => {
    if (!activeTenantId || isLoading || isTenantSwitching || !initialDataLoadedRef.current) return;
    if (JSON.stringify(themeConfig) === JSON.stringify(prevThemeConfigRef.current)) return;
    if (isKeyFromSocket('theme', activeTenantId)) {
      clearSocketFlag('theme', activeTenantId);
      prevThemeConfigRef.current = themeConfig;
      return;
    }
    prevThemeConfigRef.current = themeConfig;
    DataService.saveImmediate('theme_config', themeConfig, activeTenantId);
  }, [themeConfig, isLoading, isTenantSwitching, activeTenantId]);

  // === WEBSITE CONFIG PERSISTENCE ===
  useEffect(() => {
    if (!activeTenantId || isLoading || isTenantSwitching || !initialDataLoadedRef.current) return;
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

  // === DELIVERY CONFIG PERSISTENCE ===
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

  // === COURIER CONFIG PERSISTENCE ===
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current) {
      DataService.save('courier', courierConfig, activeTenantId);
    }
  }, [courierConfig, isLoading, isTenantSwitching, activeTenantId]);

  // === FACEBOOK PIXEL CONFIG PERSISTENCE ===
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && activeTenantId && adminDataLoadedRef.current) {
      DataService.save('facebook_pixel', facebookPixelConfig, activeTenantId);
    }
  }, [facebookPixelConfig, isLoading, isTenantSwitching, activeTenantId]);

  // === CATEGORIES PERSISTENCE ===
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

  // === SUBCATEGORIES PERSISTENCE ===
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

  // === CHILD CATEGORIES PERSISTENCE ===
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

  // === BRANDS PERSISTENCE ===
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

  // === TAGS PERSISTENCE ===
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

  // === LANDING PAGES PERSISTENCE ===
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
}
