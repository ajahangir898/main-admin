// StoreHeader orchestrates layout, state, and async modals for the storefront header.
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './StoreHeader.css';
import { Product, User as UserType, WebsiteConfig } from '../../types';
import { AdminNoticeTicker } from '../store/header/AdminNoticeTicker';
import { MobileHeaderBar } from '../store/header/MobileHeaderBar';
import { DesktopHeaderBar } from '../store/header/DesktopHeaderBar';
import { StoreHeaderModals } from '../store/header/StoreHeaderModals';
import type { CatalogGroup, HeaderSearchProps } from '../store/header/headerTypes';

// Lazy load toast - avoid sync import of heavy dependency
const showToast = {
  error: (msg: string) => import('react-hot-toast').then(m => m.toast.error(msg)),
  success: (msg: string) => import('react-hot-toast').then(m => m.toast.success(msg)),
};

export interface StoreHeaderProps {
  onTrackOrder?: () => void;
  onHomeClick?: () => void;
  wishlistCount?: number;
  wishlist?: number[];
  onToggleWishlist?: (productId: number) => void;
  notificationsCount?: number;
  cart?: number[];
  onToggleCart?: (productId: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  user?: UserType | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onCategoriesClick?: () => void;
  onProductsClick?: () => void;
  categoriesList?: string[];
  onCategorySelect?: (categoryName: string) => void;
  categories?: any[];
  subCategories?: any[];
  childCategories?: any[];
  brands?: any[];
  tags?: any[];
  productCatalog?: Product[];
  onProductClick?: (product: Product) => void;
  onMobileMenuOpenRef?: (openFn: () => void) => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = (props) => {
  const {
    onTrackOrder,
    onHomeClick,
    wishlistCount,
    wishlist,
    onToggleWishlist,
    notificationsCount,
    cart,
    onToggleCart,
    onCheckoutFromCart,
    user,
    onLoginClick,
    onLogoutClick,
    onProfileClick,
    logo,
    websiteConfig,
    searchValue,
    onSearchChange,
    onCategoriesClick,
    onProductsClick,
    categoriesList,
    onCategorySelect,
    categories = [],
    subCategories = [],
    childCategories = [],
    brands = [],
    tags = [],
    productCatalog,
    onProductClick,
    onMobileMenuOpenRef
  } = props;

  const normalizedCart = useMemo(() => (Array.isArray(cart) ? cart : []), [cart]);
  const normalizedWishlist = useMemo(() => (Array.isArray(wishlist) ? wishlist : []), [wishlist]);
  const catalogSource = useMemo(
    () => {
      const allProducts = Array.isArray(productCatalog) && productCatalog.length ? productCatalog : [];
      // Filter only Active products for store search
      return allProducts.filter(p => !p.status || p.status === 'Active');
    },
    [productCatalog]
  );

  const resolvedHeaderLogo = websiteConfig?.headerLogo || logo || null;
  const logoKey = useMemo(
    () => (resolvedHeaderLogo ? `logo-${resolvedHeaderLogo.slice(-20)}` : 'no-logo'),
    [resolvedHeaderLogo]
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCatalogDropdownOpen, setIsCatalogDropdownOpen] = useState(false);
  const [activeCatalogSection, setActiveCatalogSection] = useState<string>('categories');
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(0);

  // Expose mobile menu open function to parent - use ref to prevent infinite loops
  const openMobileMenuRef = useRef(() => setIsMobileMenuOpen(true));
  useEffect(() => {
    if (onMobileMenuOpenRef) {
      onMobileMenuOpenRef(openMobileMenuRef.current);
    }
  }, [onMobileMenuOpenRef]);

  const [supportsVoiceSearch, setSupportsVoiceSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [typedSearchValue, setTypedSearchValue] = useState(searchValue ?? '');

  const menuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechApiRef = useRef<any>(null);

  const cartItems = normalizedCart;
  const wishlistItems = normalizedWishlist;
  const cartBadgeCount = cartItems.length;
  const wishlistBadgeCount =
    typeof wishlistCount === 'number' ? wishlistCount : wishlistItems.length;
  const notificationBadgeCount =
    typeof notificationsCount === 'number' && notificationsCount > 0 ? notificationsCount : 0;
  const activeSearchValue = isListening && liveTranscript ? liveTranscript : typedSearchValue;

  const parsedHints = useMemo(() => {
    if (websiteConfig?.searchHints) {
      return websiteConfig.searchHints
        .split(/[\n,|]/)
        .map((hint) => hint.trim())
        .filter(Boolean);
    }
    return ['Search smartphones', 'Find the best deals', 'Discover new gadgets'];
  }, [websiteConfig?.searchHints]);

  const activeHint = parsedHints[activeHintIndex] || '';

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeSubCategories = Array.isArray(subCategories) ? subCategories : [];
  const safeChildCategories = Array.isArray(childCategories) ? childCategories : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const catalogGroups = useMemo<CatalogGroup[]>(
    () => [
      {
        key: 'categories',
        label: 'Categories',
        items:
          Array.isArray(categoriesList) && categoriesList.length
            ? categoriesList
            : safeCategories.map((c: any) => c.name)
      },
      { key: 'subCategories', label: 'Sub Categories', items: safeSubCategories.map((s: any) => s.name) },
      { key: 'childCategories', label: 'Child Categories', items: safeChildCategories.map((c: any) => c.name) },
      { key: 'brand', label: 'Brand', items: safeBrands.map((b: any) => b.name) },
      { key: 'tags', label: 'Tags', items: safeTags.map((t: any) => t.name) }
    ],
    [categoriesList, safeCategories, safeSubCategories, safeChildCategories, safeBrands, safeTags]
  );

  const searchSuggestions = useMemo(() => {
    if (!activeSearchValue.trim() || !catalogSource.length) return [];
    const query = activeSearchValue.trim().toLowerCase();
    return catalogSource
      .filter((product) => {
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesCategory = product.category?.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesBrand;
      })
      .slice(0, 6);
  }, [activeSearchValue, catalogSource]);

  const emitSearchValue = useCallback(
    (value: string) => {
      onSearchChange?.(value);
    },
    [onSearchChange]
  );

  const handleSearchInput = useCallback(
    (value: string) => {
      setTypedSearchValue(value);
      emitSearchValue(value);
    },
    [emitSearchValue]
  );

  const handleSuggestionClick = useCallback(
    (product: Product) => {
      setIsSearchSuggestionsOpen(false);
      setTypedSearchValue('');
      emitSearchValue('');
      onProductClick?.(product);
    },
    [onProductClick, emitSearchValue]
  );

  const handleCartItemToggle = useCallback(
    (productId: number) => {
      if (onToggleCart) {
        onToggleCart(productId);
      } else {
        showToast.error('Cart unavailable right now');
      }
    },
    [onToggleCart]
  );

  const handleWishlistItemToggle = useCallback(
    (productId: number) => {
      if (onToggleWishlist) {
        onToggleWishlist(productId);
      } else {
        showToast.error('Wishlist unavailable right now');
      }
    },
    [onToggleWishlist]
  );

  const handleCheckoutFromCartClick = useCallback(
    (productId: number) => {
      if (onCheckoutFromCart) {
        onCheckoutFromCart(productId);
        setIsCartDrawerOpen(false);
      } else {
        showToast.error('Checkout unavailable right now');
      }
    },
    [onCheckoutFromCart]
  );

  const toggleCatalogSection = useCallback((key: string) => {
    setActiveCatalogSection((prev) => (prev === key ? '' : key));
  }, []);

  const handleCatalogItemClick = useCallback(
    (item: string) => {
      onCategorySelect?.(item);
      onCategoriesClick?.();
      setIsMobileMenuOpen(false);
    },
    [onCategoriesClick, onCategorySelect]
  );

  const notifyVoiceSearchIssue = useCallback((message: string) => {
    if (message) showToast.error(message);
  }, []);

  const buildRecognition = useCallback(() => {
    const SpeechRecognitionConstructor = speechApiRef.current;
    if (!SpeechRecognitionConstructor) return null;

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = websiteConfig?.voiceSearchLanguage || 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (!event?.results) return;
      const transcript = Array.from(event.results)
        .map((result: any) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();
      const latestResult = event.results[event.results.length - 1];
      if (latestResult?.isFinal) {
        if (transcript) {
          setTypedSearchValue(transcript);
          emitSearchValue(transcript);
        }
        setLiveTranscript('');
      } else {
        setLiveTranscript(transcript);
      }
    };

    recognition.onstart = () => {
      setLiveTranscript('');
      setIsListening(true);
    };
    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript('');
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscript('');
      recognitionRef.current = null;
    };

    return recognition;
  }, [emitSearchValue, websiteConfig?.voiceSearchLanguage]);

  const handleVoiceSearch = useCallback(async () => {
    if (!supportsVoiceSearch) {
      notifyVoiceSearchIssue('Voice search is not available in this browser.');
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort?.();
      } catch (error) {
        /* no-op */
      }
      recognitionRef.current = null;
    }
    const recognition = buildRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
    }
  }, [supportsVoiceSearch, buildRecognition, notifyVoiceSearchIssue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
    speechApiRef.current = SpeechRecognitionConstructor;
    setSupportsVoiceSearch(Boolean(SpeechRecognitionConstructor));
    return () => {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    setActiveHintIndex(0);
  }, [parsedHints.length]);

  useEffect(() => {
    if (parsedHints.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHintIndex((prev) => (prev + 1) % parsedHints.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [parsedHints.length]);

  useEffect(() => {
    setTypedSearchValue(searchValue ?? '');
  }, [searchValue]);

  useEffect(() => {
    setIsSearchSuggestionsOpen(searchSuggestions.length > 0 && activeSearchValue.trim().length > 0);
  }, [searchSuggestions.length, activeSearchValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node))
        setIsCategoryMenuOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node))
        setIsSearchSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchBarProps = useMemo<HeaderSearchProps>(
    () => ({
      containerRef: searchContainerRef,
      activeSearchValue,
      onInputChange: handleSearchInput,
      suggestions: searchSuggestions,
      isSuggestionsOpen: isSearchSuggestionsOpen,
      onSuggestionClick: handleSuggestionClick,
      activeHint,
      activeHintIndex,
      isListening,
      liveTranscript,
      supportsVoiceSearch,
      onVoiceSearch: handleVoiceSearch
    }),
    [
      activeSearchValue,
      handleSearchInput,
      searchSuggestions,
      isSearchSuggestionsOpen,
      handleSuggestionClick,
      activeHint,
      activeHintIndex,
      isListening,
      liveTranscript,
      supportsVoiceSearch,
      handleVoiceSearch
    ]
  );

  return (
    <>
      <AdminNoticeTicker noticeText={websiteConfig?.adminNoticeText} />

      <header className="store-header w-full bg-white shadow-sm sticky top-0 z-50 transition-colors duration-300">
        <MobileHeaderBar
          resolvedHeaderLogo={resolvedHeaderLogo}
          logoKey={logoKey}
          onHomeClick={onHomeClick}
          wishlistBadgeCount={wishlistBadgeCount}
          cartBadgeCount={cartBadgeCount}
          onWishlistOpen={() => setIsWishlistDrawerOpen(true)}
          onCartOpen={() => setIsCartDrawerOpen(true)}
          onAccountClick={user ? onProfileClick : onLoginClick}
          onMenuOpen={() => setIsMobileMenuOpen(true)}
          onSearchOpen={() => setIsMobileSearchOpen(true)}
        />

        <DesktopHeaderBar
          resolvedHeaderLogo={resolvedHeaderLogo}
          logoKey={logoKey}
          onHomeClick={onHomeClick}
          searchProps={searchBarProps}
          wishlistBadgeCount={wishlistBadgeCount}
          cartBadgeCount={cartBadgeCount}
          onWishlistOpen={() => setIsWishlistDrawerOpen(true)}
          onCartOpen={() => setIsCartDrawerOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onProfileClick={onProfileClick}
          onTrackOrder={onTrackOrder}
          onLogoutClick={onLogoutClick}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen((prev) => !prev)}
          onMenuClose={() => setIsMenuOpen(false)}
          menuRef={menuRef}
          categoriesList={categoriesList}
          onCategoriesClick={onCategoriesClick}
          onCategorySelect={onCategorySelect}
          categoryMenuRef={categoryMenuRef}
          isCategoryMenuOpen={isCategoryMenuOpen}
          onCategoryMenuOpen={setIsCategoryMenuOpen}
          onProductsClick={onProductsClick}
          websiteConfig={websiteConfig}
        />
      </header>

      <StoreHeaderModals
        onCartToggle={handleCartItemToggle}
        onWishlistToggle={handleWishlistItemToggle}
        catalogSource={catalogSource}
        cartItems={cartItems}
        wishlistItems={wishlistItems}
        isWishlistDrawerOpen={isWishlistDrawerOpen}
        onWishlistClose={() => setIsWishlistDrawerOpen(false)}
        isCartDrawerOpen={isCartDrawerOpen}
        onCartClose={() => setIsCartDrawerOpen(false)}
        onCheckoutFromCart={handleCheckoutFromCartClick}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        isMobileSearchOpen={isMobileSearchOpen}
        onMobileSearchClose={() => setIsMobileSearchOpen(false)}
        searchProps={searchBarProps}
        logo={logo}
        logoKey={logoKey}
        catalogGroups={catalogGroups}
        activeCatalogSection={activeCatalogSection}
        isCatalogDropdownOpen={isCatalogDropdownOpen}
        onCatalogDropdownToggle={() => setIsCatalogDropdownOpen((prev) => !prev)}
        onCatalogSectionToggle={toggleCatalogSection}
        onCatalogItemClick={handleCatalogItemClick}
        onTrackOrder={onTrackOrder}
      />
    </>
  );
};

export default StoreHeader;
