
import React, { lazy, Suspense, useCallback } from 'react';
import type { Product, User, WebsiteConfig, Order, ProductVariantSelection } from '../types';

// Custom hook with all business logic
import { useStoreHome, formatSegment } from '../hooks/useStoreHome';

// Critical above-the-fold components - loaded EAGERLY (minimal set for first paint)
import { StoreHeader } from '../components/StoreHeader';
import { HeroSection } from '../components/store/HeroSection';
import { CategoriesSection } from '../components/store/CategoriesSection';

// Skeletons
import { SectionSkeleton, FooterSkeleton, StoreHomeSkeleton } from '../components/store/skeletons';

// Near-fold components - lazy loaded but eagerly prefetched
const FlashSalesSection = lazy(() => import('../components/store/FlashSalesSection').then(m => ({ default: m.FlashSalesSection })));
const ProductGridSection = lazy(() => import('../components/store/ProductGridSection').then(m => ({ default: m.ProductGridSection })));
const LazySection = lazy(() => import('../components/store/LazySection').then(m => ({ default: m.LazySection })));

// Below-the-fold - lazy loaded
const StorePopup = lazy(() => import('../components/StorePopup').then(m => ({ default: m.StorePopup })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const ProductQuickViewModal = lazy(() => import('../components/store/ProductQuickViewModal').then(m => ({ default: m.ProductQuickViewModal })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
const StoreCategoryProducts = lazy(() => import('../components/StoreCategoryProducts'));
const SearchResultsSection = lazy(() => import('../components/store/SearchResultsSection').then(m => ({ default: m.SearchResultsSection })));

interface StoreHomeProps {
  products?: Product[];
  orders?: Order[];
  tenantId?: string;
  onProductClick: (p: Product) => void;
  onQuickCheckout?: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
  wishlistCount: number;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  onAddToCart?: (product: Product, quantity: number, variant: ProductVariantSelection) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  categories?: any[];
  subCategories?: any[];
  childCategories?: any[];
  brands?: any[];
  tags?: any[];
  initialCategoryFilter?: string | null;
  onCategoryFilterChange?: (categorySlug: string | null) => void;
  onMobileMenuOpenRef?: (openFn: () => void) => void;
}

const StoreHome: React.FC<StoreHomeProps> = ({ 
  products,
  orders,
  tenantId,
  onProductClick, 
  onQuickCheckout,
  wishlistCount, 
  wishlist, 
  onToggleWishlist,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  onAddToCart,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  categories = [],
  subCategories,
  childCategories,
  brands,
  tags,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  initialCategoryFilter,
  onCategoryFilterChange,
  onMobileMenuOpenRef
}) => {
  // Display skeleton if products are not yet available.
  if (!products || products.length === 0) {
    return <StoreHomeSkeleton />;
  }
  // All state and logic from custom hook
  const {
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
    categoriesSectionRef,
    productsSectionRef,
    categoryScrollRef,
    displayCategories,
    displayProducts,
    activeProducts,
    flashSalesProducts,
    bestSaleProducts,
    popularProducts,
    sortedProducts,
    updateSearchTerm,
    scrollToTop,
    handleClosePopup,
    handlePopupNavigate,
    handleCategoryClick,
    handleClearCategoryFilter,
    handleCategoriesNav,
    handleProductsNav,
  } = useStoreHome({
    products,
    tenantId,
    categories,
    websiteConfig,
    initialCategoryFilter,
    onCategoryFilterChange,
    searchValue,
    onSearchChange
  });

  // === HANDLERS ===
  const selectInstantVariant = useCallback((product: Product): ProductVariantSelection => ({
    color: product.variantDefaults?.color || product.colors?.[0] || 'Default',
    size: product.variantDefaults?.size || product.sizes?.[0] || 'Standard'
  }), []);

  const handleBuyNow = useCallback((product: Product) => {
    if (onQuickCheckout) {
      onQuickCheckout(product, 1, selectInstantVariant(product));
    } else {
      onProductClick(product);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onQuickCheckout, onProductClick, selectInstantVariant]);

  const handleAddProductToCartFromCard = useCallback((product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1, selectInstantVariant(product));
    } else {
      onProductClick(product);
    }
  }, [onAddToCart, onProductClick, selectInstantVariant]);

  const handleQuickViewOrder = useCallback((product: Product, quantity: number, variant: ProductVariantSelection) => {
    if (onQuickCheckout) {
      onQuickCheckout(product, quantity, variant);
    } else {
      onProductClick(product);
    }
    setQuickViewProduct(null);
  }, [onQuickCheckout, onProductClick, setQuickViewProduct]);

  const flashSaleCountdown = [
    { label: 'Hours', value: formatSegment(flashTimeLeft.hours) },
    { label: 'Mins', value: formatSegment(flashTimeLeft.minutes) },
    { label: 'Sec', value: formatSegment(flashTimeLeft.seconds) }
  ];

  // === CATEGORY VIEW ===
  if (selectedCategoryView) {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <StoreCategoryProducts
          products={displayProducts}
          categories={categories}
          subCategories={subCategories}
          childCategories={childCategories}
          brands={brands}
          tags={tags}
          selectedCategory={selectedCategoryView}
          onCategoryChange={(category) => category ? handleCategoryClick(category) : handleClearCategoryFilter()}
          onBack={handleClearCategoryFilter}
          onHome={handleClearCategoryFilter}
          onProductClick={onProductClick}
          onBuyNow={handleBuyNow}
          onQuickView={setQuickViewProduct}
          onAddToCart={handleAddProductToCartFromCard}
          websiteConfig={websiteConfig}
          logo={logo}
          user={user}
          wishlistCount={wishlistCount}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          onOpenChat={onOpenChat}
          onImageSearchClick={onImageSearchClick}
          orders={orders}
        />
      </Suspense>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <StoreHeader 
        onTrackOrder={() => setIsTrackOrderOpen(true)} 
        onImageSearchClick={onImageSearchClick}
        productCatalog={activeProducts}
        wishlistCount={wishlistCount}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        cart={cart}
        onToggleCart={onToggleCart}
        onCheckoutFromCart={onCheckoutFromCart}
        user={user}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
        logo={logo}
        websiteConfig={websiteConfig}
        searchValue={searchTerm}
        onSearchChange={updateSearchTerm}
        onCategoriesClick={handleCategoriesNav}
        onProductsClick={handleProductsNav}
        categoriesList={categories.map((cat) => cat.name)}
        onCategorySelect={handleCategoryClick}
        onProductClick={onProductClick}
        categories={categories}
        subCategories={subCategories}
        childCategories={childCategories}
        brands={brands}
        tags={tags}
        onMobileMenuOpenRef={onMobileMenuOpenRef}
      />
      
      {/* Track Order Modal */}
      {isTrackOrderOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" /></div>}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
     
      {/* Quick View Modal */}
      {quickViewProduct && (
        <Suspense fallback={null}>
          <ProductQuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onCompleteOrder={handleQuickViewOrder}
            onViewDetails={(product) => {
              setQuickViewProduct(null);
              onProductClick(product);
            }}
          />
        </Suspense>
      )}
      
      {/* Hero Section */}
      <HeroSection carouselItems={websiteConfig?.carouselItems} websiteConfig={websiteConfig} />

      {/* Categories Section */}
      {displayCategories.length > 0 && (
        <section ref={categoriesSectionRef} className="max-w-7xl mx-auto px-4 pt-1">
          <CategoriesSection
            style={(websiteConfig?.categorySectionStyle as any) || 'style6'}
            categories={displayCategories}
            onCategoryClick={handleCategoryClick}
            categoryScrollRef={categoryScrollRef}
          />
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 space-y-4 pb-4" style={{ minHeight: '680px', contain: 'layout' }}>
        {hasSearchQuery ? (
          <Suspense fallback={<SectionSkeleton />}>
            <SearchResultsSection
              searchTerm={searchTerm.trim()}
              products={sortedProducts}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onClearSearch={() => {
                updateSearchTerm('');
                setSortOption('relevance');
              }}
              onProductClick={onProductClick}
              onBuyNow={handleBuyNow}
              onQuickView={setQuickViewProduct}
              onAddToCart={handleAddProductToCartFromCard}
              productCardStyle={websiteConfig?.productCardStyle}
            />
          </Suspense>
        ) : (
          <>
            {/* Flash Deals */}
            {flashSalesProducts.length > 0 && (
              <Suspense fallback={<SectionSkeleton />}>
                <FlashSalesSection
                  products={flashSalesProducts}
                  showCounter={showFlashSaleCounter}
                  countdown={flashSaleCountdown}
                  onProductClick={onProductClick}
                  onBuyNow={handleBuyNow}
                  onQuickView={setQuickViewProduct}
                  onAddToCart={handleAddProductToCartFromCard}
                  productCardStyle={websiteConfig?.productCardStyle}
                  sectionRef={productsSectionRef}
                />
              </Suspense>
            )}

            {/* Best Sale Products */}
            {bestSaleProducts.length > 0 && (
              <Suspense fallback={<SectionSkeleton />}>
                <LazySection fallback={<SectionSkeleton />} rootMargin="0px 0px 300px" minHeight="400px">
                  <ProductGridSection
                    title="Best Sale Products"
                    products={bestSaleProducts}
                    accentColor="green"
                    keyPrefix="best"
                    maxProducts={10}
                    reverseOrder={true}
                    onProductClick={onProductClick}
                    onBuyNow={handleBuyNow}
                    onQuickView={setQuickViewProduct}
                    onAddToCart={handleAddProductToCartFromCard}
                    productCardStyle={websiteConfig?.productCardStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* Popular Products */}
            {popularProducts.length > 0 && (
              <Suspense fallback={<SectionSkeleton />}>
                <LazySection fallback={<SectionSkeleton />} rootMargin="0px 0px 300px" minHeight="400px">
                  <ProductGridSection
                    title="Popular products"
                    products={popularProducts}
                    accentColor="purple"
                    keyPrefix="pop"
                    maxProducts={10}
                    reverseOrder={false}
                    onProductClick={onProductClick}
                    onBuyNow={handleBuyNow}
                    onQuickView={setQuickViewProduct}
                    onAddToCart={handleAddProductToCartFromCard}
                    productCardStyle={websiteConfig?.productCardStyle}
                  />
                </LazySection>
              </Suspense>
            )}

            {/* All Products */}
            {activeProducts.length > 0 && (
              <Suspense fallback={<SectionSkeleton />}>
                <LazySection fallback={<SectionSkeleton />} rootMargin="0px 0px 300px" minHeight="500px">
                  <ProductGridSection
                    title="Our Products"
                    products={activeProducts}
                    accentColor="blue"
                    keyPrefix="all"
                    maxProducts={50}
                    reverseOrder={false}
                    onProductClick={onProductClick}
                    onBuyNow={handleBuyNow}
                    onQuickView={setQuickViewProduct}
                    onAddToCart={handleAddProductToCartFromCard}
                    productCardStyle={websiteConfig?.productCardStyle}
                  />
                </LazySection>
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Suspense fallback={<FooterSkeleton />}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
      </Suspense>
      
      {/* Popup */}
      {activePopup && (
        <Suspense fallback={null}>
          <StorePopup
            popup={activePopup}
            onClose={handleClosePopup}
            onNavigate={handlePopupNavigate}
          />
        </Suspense>
      )}

      {/* Scroll to Top Button */}
      <button
        className={`fixed bottom-4 right-4 bg-purple-600 text-white rounded-full p-3 shadow-lg hover:bg-purple-700 transition-all duration-300 ${
          showScrollToTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default StoreHome;
