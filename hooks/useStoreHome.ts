import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Product, Popup, Category } from '../types';
import type { SortOption } from '../components/ProductFilter';
import { getInitialCachedData } from '../utils/appHelpers';
import { getViewportWidth } from '../utils/viewportHelpers';
import { DataService } from '../services/DataService';

// Lazy load utilities - only import when needed
const getTrackPageView = () => import('./useVisitorStats').then(m => m.trackPageView);

// Flash sale helpers
export const getNextFlashSaleReset = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  return reset.getTime();
};

export const getTimeSegments = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
};

export const formatSegment = (value: number) => String(value).padStart(2, '0');

// Inline slugify for critical path
export const slugify = (text: string) => text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

interface UseStoreHomeProps {
  products?: Product[];
  tenantId?: string;
  categories?: Category[];
  websiteConfig?: any;
  initialCategoryFilter?: string | null;
  onCategoryFilterChange?: (categorySlug: string | null) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const useStoreHome = ({
  products,
  tenantId,
  categories,
  websiteConfig,
  initialCategoryFilter,
  onCategoryFilterChange,
  searchValue,
  onSearchChange
}: UseStoreHomeProps) => {
  // === LOCAL STATE ===
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [popups, setPopups] = useState<Popup[]>([]);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [popupIndex, setPopupIndex] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // === REFS ===
  const showPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPopupShownRef = useRef(false);
  const categoriesSectionRef = useRef<HTMLElement | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const flashSaleEndRef = useRef<number>(0);

  // === SEARCH TERM ===
  const searchTerm = typeof searchValue === 'string' ? searchValue : internalSearchTerm;
  const updateSearchTerm = useCallback((value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  }, [onSearchChange]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasSearchQuery = Boolean(normalizedSearch);

  // === SCROLL TO TOP ===
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // === PAGE VIEW TRACKING ===
  useEffect(() => {
    if (!tenantId) return;
    const trackVisit = async () => {
      try {
        const trackPageView = await getTrackPageView();
        const page = selectedCategoryView 
          ? `/category/${selectedCategoryView}` 
          : window.location.pathname || '/';
        trackPageView(tenantId, page);
      } catch (err) {
        console.warn('Failed to track page view:', err);
      }
    };
    trackVisit();
  }, [tenantId, selectedCategoryView]);

  // === CATEGORY VIEW SYNC ===
  useEffect(() => {
    if (initialCategoryFilter) {
      if (initialCategoryFilter === 'all') {
        setSelectedCategoryView('__all__');
        return;
      }
      if (initialCategoryFilter.startsWith('brand:')) {
        setSelectedCategoryView(initialCategoryFilter);
        return;
      }
      const category = categories?.find(c => slugify(c.name) === initialCategoryFilter);
      if (category) {
        setSelectedCategoryView(category.name);
      }
    } else {
      setSelectedCategoryView(null);
    }
  }, [initialCategoryFilter, categories]);

  // === POPUP LOGIC ===
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadAndShowPopups = async () => {
      if (!isMounted) return;
      
      let popupList: Popup[] = [];
      try {
        const cachedPopups = getInitialCachedData<Popup[]>('popups', []);
        if (cachedPopups.length > 0) {
          popupList = cachedPopups.filter((p: Popup) => p.status?.toLowerCase() === 'publish');
        }
      } catch {}

      try {
        const allPopups = await DataService.get<Popup[]>('popups', []);
        popupList = allPopups.filter(p => p.status?.toLowerCase() === 'publish');
      } catch {}

      if (!isMounted || popupList.length === 0) return;
      
      popupList.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      setPopups(popupList);
      
      timeoutId = setTimeout(() => {
        if (isMounted && !initialPopupShownRef.current) {
          initialPopupShownRef.current = true;
          setActivePopup(popupList[0]);
        }
      }, 2000);
    };

    const idleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback
      : (fn: () => void) => setTimeout(fn, 100);
    
    const idleId = idleCallback(loadAndShowPopups, { timeout: 3000 });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (showPopupTimerRef.current) clearTimeout(showPopupTimerRef.current);
      if (nextPopupTimerRef.current) clearTimeout(nextPopupTimerRef.current);
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, []);

  const handleClosePopup = useCallback(() => {
    setActivePopup(null);
    if (nextPopupTimerRef.current) {
      clearTimeout(nextPopupTimerRef.current);
      nextPopupTimerRef.current = null;
    }
    const nextIndex = popupIndex + 1;
    if (nextIndex < popups.length) {
      nextPopupTimerRef.current = setTimeout(() => {
        setActivePopup(popups[nextIndex]);
        setPopupIndex(nextIndex);
        nextPopupTimerRef.current = null;
      }, 30000);
    }
  }, [popupIndex, popups]);

  const handlePopupNavigate = useCallback((url: string) => {
    updateSearchTerm(url.replace('/', ''));
  }, [updateSearchTerm]);

  // === PRODUCTS ===
  const displayProducts = useMemo(() => {
    const allProducts = products || [];
    return allProducts.filter(p => !p.status || p.status === 'Active');
  }, [products]);

  const initialProductSlice = useMemo(() => {
    const total = displayProducts.length;
    if (total <= 12) return displayProducts;
    if (typeof window === 'undefined') {
      return displayProducts.slice(0, Math.min(16, total));
    }
    const width = getViewportWidth();
    const sliceTarget = width >= 1536 ? 28 : width >= 1280 ? 22 : width >= 768 ? 16 : 12;
    return displayProducts.slice(0, Math.min(sliceTarget, total));
  }, [displayProducts]);

  const [activeProducts, setActiveProducts] = useState<Product[]>(initialProductSlice);

  useEffect(() => {
    setActiveProducts(initialProductSlice);
    if (displayProducts.length <= initialProductSlice.length) return;

    let cancelled = false;
    const hydrate = () => { if (!cancelled) setActiveProducts(displayProducts); };

    if (typeof window === 'undefined') {
      const fallbackTimer = setTimeout(hydrate, 320);
      return () => { cancelled = true; clearTimeout(fallbackTimer); };
    }

    const idleCallback = (window as any).requestIdleCallback;
    if (typeof idleCallback === 'function') {
      const idleId = idleCallback(hydrate, { timeout: 900 });
      return () => {
        cancelled = true;
        const cancelIdle = (window as any).cancelIdleCallback;
        if (typeof cancelIdle === 'function') cancelIdle(idleId);
      };
    }

    const timer = window.setTimeout(hydrate, 320);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [displayProducts, initialProductSlice]);

  // === TAG MATCHING ===
  const normalizeTagValue = (value?: string) => value?.trim().toLowerCase() || '';
  
  const productMatchesAnyTag = useCallback((product: Product, accepted: string[]) => {
    const acceptedSet = new Set(accepted.map(t => normalizeTagValue(t)).filter(Boolean));
    const primary = normalizeTagValue(product.tag);
    if (primary && acceptedSet.has(primary)) return true;
    if (product.tags?.length) {
      return product.tags.some(t => acceptedSet.has(normalizeTagValue(t)));
    }
    return false;
  }, []);

  // === PRODUCT FILTERS ===
  const flashSalesProducts = useMemo(
    () => activeProducts.filter(p => productMatchesAnyTag(p, ['flash', 'flash sale', 'flash sales', 'flash-sale', 'flashsales', 'flash deal', 'flashdeal', 'deal of the day', 'deal-of-the-day', 'dealoftheday'])),
    [activeProducts, productMatchesAnyTag]
  );

  const bestSaleProducts = useMemo(
    () => activeProducts.filter(p => productMatchesAnyTag(p, ['best', 'best sale', 'best sale products', 'best-sale', 'bestsale'])),
    [activeProducts, productMatchesAnyTag]
  );

  const popularProducts = useMemo(
    () => activeProducts.filter(p => productMatchesAnyTag(p, ['popular', 'popular products', 'most popular', 'top', 'top products'])),
    [activeProducts, productMatchesAnyTag]
  );

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return activeProducts;
    return activeProducts.filter(product => {
      const needle = normalizedSearch;
      const contains = (value?: string) => Boolean(value && value.toLowerCase().includes(needle));
      if (
        contains(product.name) ||
        contains(product.description) ||
        contains(product.brand) ||
        contains(product.category) ||
        contains(product.subCategory) ||
        contains(product.childCategory)
      ) return true;
      if (product.tags?.some(tag => contains(tag))) return true;
      if (product.searchTags?.some(tag => contains(tag))) return true;
      return false;
    });
  }, [activeProducts, normalizedSearch]);

  const sortedProducts = useMemo(() => {
    const productsClone = [...filteredProducts];
    switch (sortOption) {
      case 'price-low': return productsClone.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high': return productsClone.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating': return productsClone.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest': return productsClone.sort((a, b) => (b.id || 0) - (a.id || 0));
      default: return productsClone;
    }
  }, [filteredProducts, sortOption]);

  // === CATEGORIES ===
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.filter(c => c.status === 'Active' || !c.status);
    }
    return [];
  }, [categories]);

  const handleCategoryClick = useCallback((categoryName: string) => {
    const categorySlug = slugify(categoryName);
    if (onCategoryFilterChange) onCategoryFilterChange(categorySlug);
    setSelectedCategoryView(categoryName);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [onCategoryFilterChange]);

  const handleClearCategoryFilter = useCallback(() => {
    if (onCategoryFilterChange) onCategoryFilterChange(null);
    setSelectedCategoryView(null);
  }, [onCategoryFilterChange]);

  // === FLASH SALE COUNTDOWN ===
  const showFlashSaleCounter = websiteConfig?.showFlashSaleCounter ?? true;

  useEffect(() => {
    if (!showFlashSaleCounter) return;

    flashSaleEndRef.current = getNextFlashSaleReset();
    setFlashTimeLeft(getTimeSegments(flashSaleEndRef.current - Date.now()));

    const timer = setInterval(() => {
      const diff = flashSaleEndRef.current - Date.now();
      if (diff <= 0) {
        flashSaleEndRef.current = getNextFlashSaleReset();
        setFlashTimeLeft(getTimeSegments(flashSaleEndRef.current - Date.now()));
      } else {
        setFlashTimeLeft(getTimeSegments(diff));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [showFlashSaleCounter]);

  // === CATEGORY AUTO SCROLL (Style 2) ===
  useEffect(() => {
    if (websiteConfig?.categorySectionStyle !== 'style2') return;

    const el = categoryScrollRef.current;
    if (!el || typeof window === 'undefined') return;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (motionQuery?.matches) return;

    let isActive = false;
    let animationId: number | null = null;
    const speed = 1.0;

    const stop = () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const tick = () => {
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += speed;
      }
      animationId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!isActive || animationId !== null) return;
      animationId = requestAnimationFrame(tick);
    };

    const handleVisibility: IntersectionObserverCallback = ([entry]) => {
      isActive = entry.isIntersecting;
      isActive ? start() : stop();
    };

    const observer = new IntersectionObserver(handleVisibility, { threshold: 0.2 });
    observer.observe(el);

    const handleMouseEnter = () => stop();
    const handleMouseLeave = () => start();

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stop();
      observer.disconnect();
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [websiteConfig?.categorySectionStyle]);

  // === NAVIGATION HELPERS ===
  const scrollToSection = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (typeof window === 'undefined' || !ref.current) return;
    const headerOffset = 80;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  const performScroll = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (hasSearchQuery) {
      updateSearchTerm('');
      setTimeout(() => scrollToSection(ref), 120);
    } else {
      scrollToSection(ref);
    }
  }, [hasSearchQuery, updateSearchTerm, scrollToSection]);

  const handleCategoriesNav = useCallback(() => performScroll(categoriesSectionRef), [performScroll]);
  
  const handleProductsNav = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/all-products');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  return {
    // State
    isTrackOrderOpen,
    setIsTrackOrderOpen,
    quickViewProduct,
    setQuickViewProduct,
    sortOption,
    setSortOption,
    activePopup,
    showScrollToTop,
    selectedCategoryView,
    flashTimeLeft,
    searchTerm,
    hasSearchQuery,
    showFlashSaleCounter,
    
    // Refs
    categoriesSectionRef,
    productsSectionRef,
    categoryScrollRef,
    
    // Data
    displayCategories,
    displayProducts,
    activeProducts,
    flashSalesProducts,
    bestSaleProducts,
    popularProducts,
    sortedProducts,
    
    // Handlers
    updateSearchTerm,
    scrollToTop,
    handleClosePopup,
    handlePopupNavigate,
    handleCategoryClick,
    handleClearCategoryFilter,
    handleCategoriesNav,
    handleProductsNav,
  };
};
