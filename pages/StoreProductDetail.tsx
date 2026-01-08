
import React, { useState, useEffect, useMemo, lazy, Suspense, memo, useCallback, useRef } from 'react';
import { Product, User, WebsiteConfig, Order, ProductVariantSelection, Category } from '../types';

// Lazy load heavy layout components and modals from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const AddToCartSuccessModal = lazy(() => import('../components/store/AddToCartSuccessModal').then(m => ({ default: m.AddToCartSuccessModal })));
const MobileBottomNav = lazy(() => import('../components/store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));

// Lazy load visitor tracking
const getTrackPageView = () => import('../hooks/useVisitorStats').then(m => m.trackPageView);

// Skeleton loaders removed for faster initial render

import { Heart, Star, ShoppingCart, ShoppingBag, Smartphone, Watch, BatteryCharging, Headphones, Zap, Bluetooth, Gamepad2, Camera, ArrowLeft, Share2, AlertCircle, ZoomIn, X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { LazyImage } from '../utils/performanceOptimization';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

// Lazy load heavy modals from individual files
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Lightweight skeleton loader
const ProductDetailSkeleton = lazy(() => import('../components/SkeletonLoaders').then(m => ({ default: m.ProductDetailSkeleton })));

// Modal loading fallback
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
  </div>
);

// Helper for stars
const StarRating = ({ rating, count }: { rating: number, count?: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={14} fill={s <= rating ? "currentColor" : "none"} className={s <= rating ? "text-yellow-400" : "text-gray-300"} />
      ))}
    </div>
    {count !== undefined && <span className="text-xs text-gray-400">({count} reviews)</span>}
  </div>
);

const iconMap: Record<string, React.ReactNode> = {
  smartphone: <Smartphone size={20} strokeWidth={1.5} />,
  watch: <Watch size={20} strokeWidth={1.5} />,
  'battery-charging': <BatteryCharging size={20} strokeWidth={1.5} />,
  headphones: <Headphones size={20} strokeWidth={1.5} />,
  zap: <Zap size={20} strokeWidth={1.5} />,
  bluetooth: <Bluetooth size={20} strokeWidth={1.5} />,
  'gamepad-2': <Gamepad2 size={20} strokeWidth={1.5} />,
  camera: <Camera size={20} strokeWidth={1.5} />,
  grid: <Grid size={20} strokeWidth={1.5} />,
};

type MatchType = 'compatible' | 'complementary' | 'behavioral';

interface RelatedProductMatch {
  product: Product;
  matchType: MatchType;
  reason: string;
  stockCount: number;
  score: number;
}

const MATCH_PRIORITY: Record<MatchType, number> = {
  compatible: 3,
  complementary: 2,
  behavioral: 1,
};

const MATCH_BADGE: Record<MatchType, { label: string; className: string }> = {
  compatible: { label: 'Compatible', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  complementary: { label: 'Complements', className: 'bg-sky-50 text-sky-700 border border-sky-100' },
  behavioral: { label: 'Trending', className: 'bg-gray-50 text-gray-600 border border-gray-100' },
};

const COMPLEMENTARY_CATEGORY_MAP: Record<string, string[]> = {
  Phones: ['Charger', 'Power Bank', 'Audio', 'Earbuds'],
  Watches: ['Charger', 'Audio', 'Phones'],
  Audio: ['Phones', 'Power Bank', 'Gaming'],
  Gaming: ['Audio', 'Accessories', 'Phones'],
  Charger: ['Phones', 'Power Bank', 'Audio'],
  'Power Bank': ['Phones', 'Audio', 'Watches'],
};

const capitalize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

const getProductBrandToken = (name?: string) => (name ? name.split(' ')[0].toLowerCase() : '');

const getProductStockCount = (product: Product) => {
  if (product.variantStock?.length) {
    return product.variantStock.reduce((total, variant) => total + (variant.stock || 0), 0);
  }
  return product.stock ?? 0;
};

const buildBehavioralReason = (tags?: string[]) => {
  if (tags?.length) {
    return `Customers eyeing ${tags[0]} accessories often grab this too.`;
  }
  return 'Frequently bought after viewing this item.';
};

const selectRelatedProducts = (current: Product, catalog: Product[]): RelatedProductMatch[] => {
  const baseBrand = getProductBrandToken(current.name);
  const baseCategory = current.category || '';
  const baseTags = [...(current.tags || []), ...(current.searchTags || [])];
  const complementCategories = COMPLEMENTARY_CATEGORY_MAP[baseCategory] || [];

  const candidates = catalog.filter(
    (candidate) => candidate.id !== current.id && candidate.tenantId === current.tenantId
  );

  const scored: RelatedProductMatch[] = candidates.map((candidate) => {
    const candidateBrand = getProductBrandToken(candidate.name);
    const sameBrand = baseBrand && candidateBrand && baseBrand === candidateBrand;
    const sameCategory = baseCategory && candidate.category === baseCategory;
    const isComplement = complementCategories.includes(candidate.category || '');
    const candidateAllTags = [...(candidate.tags || []), ...(candidate.searchTags || [])];
    const tagOverlap = baseTags.filter((tag) => candidateAllTags.includes(tag)).length;
    const stockCount = getProductStockCount(candidate);
    const inStock = stockCount > 0;

    let matchType: MatchType = 'behavioral';
    let reason = buildBehavioralReason(candidate.tags);
    let score = (candidate.rating || 0) * 6 + (candidate.reviews || 0) * 0.08;

    if (sameBrand) {
      matchType = 'compatible';
      score += 60;
      reason = `Complete your ${capitalize(baseBrand)} ecosystem.`;
    } else if (sameCategory) {
      matchType = 'compatible';
      score += 40;
      reason = `Explore more top-rated ${(candidate.category || 'tech').toLowerCase()} gear.`;
    } else if (isComplement) {
      matchType = 'complementary';
      score += 45;
      const formattedCategory = candidate.category || 'Accessory';
      const baseLabel = baseCategory ? baseCategory.toLowerCase() : 'setup';
      reason = `${capitalize(formattedCategory)} that pairs with your ${baseLabel}.`;
    }

    if (tagOverlap > 0) {
      score += tagOverlap * 8;
      if (matchType === 'behavioral') {
        reason = `Shoppers interested in ${baseTags.slice(0, 2).join(', ')} also add this.`;
      }
    }

    if (inStock) {
      score += Math.min(stockCount, 80) * 0.4;
    } else {
      score -= 200;
    }

    return { product: candidate, matchType, reason, stockCount, score };
  });

  const sortByPriority = (a: RelatedProductMatch, b: RelatedProductMatch) => {
    if (MATCH_PRIORITY[b.matchType] !== MATCH_PRIORITY[a.matchType]) {
      return MATCH_PRIORITY[b.matchType] - MATCH_PRIORITY[a.matchType];
    }
    if (b.score === a.score) {
      return b.stockCount - a.stockCount;
    }
    return b.score - a.score;
  };

  const compatibilityFirst = scored.filter((item) => item.matchType !== 'behavioral').sort(sortByPriority);
  const behavioralFallback = scored.filter((item) => item.matchType === 'behavioral').sort(sortByPriority);
  const combined = [...compatibilityFirst, ...behavioralFallback];
  return combined.slice(0, 6);
};

interface StoreProductDetailProps {
  product: Product;
  orders?: Order[];
  tenantId?: string;
  onBack: () => void;
  onProductClick: (p: Product) => void;
  wishlistCount: number;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onCheckout: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
  onAddToCart?: (p: Product, quantity: number, variant: ProductVariantSelection) => void;
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
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  categories?: Category[];
  onCategoryClick?: (categoryName: string) => void;
}

const StoreProductDetail = ({ 
  product, 
  orders,
  tenantId,
  onBack, 
  onProductClick, 
  wishlistCount, 
  isWishlisted, 
  onToggleWishlist,
  onCheckout,
  onAddToCart,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  productCatalog,
  categories,
  onCategoryClick
}: StoreProductDetailProps) => {
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [isLoading, setIsLoading] = useState(true);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Track product page view
  useEffect(() => {
    if (!tenantId || !product) return;
    const trackVisit = async () => {
      try {
        const trackPageView = await getTrackPageView();
        const page = `/product/${product.slug || product.id}`;
        trackPageView(tenantId, page);
      } catch (err) {
        console.warn('Failed to track page view:', err);
      }
    };
    trackVisit();
  }, [tenantId, product?.id]);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [product.id]);
  const galleryImages = product.galleryImages && product.galleryImages.length ? product.galleryImages.map(url => normalizeImageUrl(url)) : [normalizeImageUrl(product.image)];
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const fallbackColor = product.variantDefaults?.color || 'Default';
  const fallbackSize = product.variantDefaults?.size || 'Standard';
  const colorOptions = product.colors && product.colors.length ? product.colors : [fallbackColor];
  const sizeOptions = product.sizes && product.sizes.length ? product.sizes : [fallbackSize];
  const showColorSelector = (product.colors?.length || 0) > 0;
  const showSizeSelector = (product.sizes?.length || 0) > 0;
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [lastAddedVariant, setLastAddedVariant] = useState<ProductVariantSelection | null>(null);
  const shareBase = typeof window !== 'undefined' ? window.location.origin : 'https://mydomain.com';
  const shareUrl = `${shareBase}/${product.slug || `product-${product.id}`}`;

  useEffect(() => {
    const refreshGallery = product.galleryImages && product.galleryImages.length ? product.galleryImages.map(url => normalizeImageUrl(url)) : [normalizeImageUrl(product.image)];
    setSelectedImage(refreshGallery[0]);
    setSelectedImageIndex(0);
    setSelectedColor(colorOptions[0]);
    setSelectedSize(sizeOptions[0]);
    setQuantity(1);
    setVariantError(null);
  }, [product.id]);

  // Thumbnail navigation helpers
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 100;
      thumbnailScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleThumbnailSelect = (img: string, index: number) => {
    setSelectedImage(img);
    setSelectedImageIndex(index);
  };

  const handlePrevImage = () => {
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : galleryImages.length - 1;
    setSelectedImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = selectedImageIndex < galleryImages.length - 1 ? selectedImageIndex + 1 : 0;
    setSelectedImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  useEffect(() => {
    if (variantError) {
      setVariantError(null);
    }
  }, [selectedColor, selectedSize, quantity, variantError]);

  const additionalImages = galleryImages;

  // Filter only Active products for store display
  const catalogProducts = useMemo(() => {
    const allProducts = Array.isArray(productCatalog) && productCatalog.length ? productCatalog : [];
    return allProducts.filter(p => !p.status || p.status === 'Active');
  }, [productCatalog]);

  const relatedProducts = useMemo(() => selectRelatedProducts(product, catalogProducts), [product, catalogProducts]);

  const currentVariant: ProductVariantSelection = useMemo(() => ({
    color: selectedColor || fallbackColor,
    size: selectedSize || fallbackSize,
  }), [selectedColor, selectedSize, fallbackColor, fallbackSize]);

  const variantStockEntry = product.variantStock?.find(v => v.color === currentVariant.color && v.size === currentVariant.size);
  const availableStock = variantStockEntry?.stock ?? product.stock ?? Infinity;
  const isOutOfStock = !Number.isFinite(availableStock) ? false : availableStock <= 0;
  const atStockLimit = Number.isFinite(availableStock) && quantity >= (availableStock as number);

  const formattedPrice = formatCurrency(product.price);
  const formattedOriginalPrice = formatCurrency(product.originalPrice, null);

  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const increaseQuantity = () => {
    if (!Number.isFinite(availableStock) || quantity < (availableStock as number)) {
      setQuantity(prev => prev + 1);
    }
  };

  const validateVariant = () => {
    if ((showColorSelector && !selectedColor) || (showSizeSelector && !selectedSize)) {
      setVariantError('Please choose a color and size option.');
      return false;
    }
    if (isOutOfStock) {
      setVariantError('Selected variant is currently out of stock.');
      return false;
    }
    if (Number.isFinite(availableStock) && quantity > (availableStock as number)) {
      setVariantError('Reduce quantity to match available stock.');
      return false;
    }
    setVariantError(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!validateVariant()) return;
    onAddToCart?.(product, quantity, currentVariant);
    setLastAddedVariant(currentVariant);
    setShowCartSuccess(true);
  };

  const handleBuyNow = () => {
    if (!validateVariant()) return;
    onCheckout(product, quantity, currentVariant);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Product link copied to clipboard');
        return;
      }
      window.prompt('Copy this product link', shareUrl);
    } catch (error) {
      console.warn('Share cancelled', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 font-sans text-slate-900 pb-20 md:pb-0">
        <Suspense fallback={null}>
          <ProductDetailSkeleton />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 font-sans text-slate-900 pb-20 md:pb-0 animate-fadeIn" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Suspense fallback={null}>
        <StoreHeader 
          onTrackOrder={() => setIsTrackOrderOpen(true)} 
          onHomeClick={onBack}
          onImageSearchClick={onImageSearchClick}
          wishlistCount={wishlistCount}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={catalogProducts}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onProductClick={onProductClick}
        />
      </Suspense>
      
      {isTrackOrderOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
      {showCartSuccess && (
        <AddToCartSuccessModal 
          product={product} 
          variant={lastAddedVariant || currentVariant}
          quantity={quantity}
          onClose={() => setShowCartSuccess(false)} 
          onCheckout={() => onCheckout(product, quantity, lastAddedVariant || currentVariant)} 
        />
      )}

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition p-2"
              aria-label="Close zoom"
            >
              <X size={28} />
            </button>
            
            <div className="w-full h-full max-h-[90vh] overflow-auto bg-black rounded-lg">
              <div className="relative w-full bg-black flex items-center justify-center min-h-[90vh]">
                <img 
                  src={selectedImage} 
                  alt={product.name}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Thumbnail Gallery in Zoom Modal */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {additionalImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 p-0.5 transition-all ${
                    selectedImage === img
                      ? 'border-theme-primary bg-theme-primary/10'
                      : 'border-gray-600 hover:border-theme-primary/70'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 shadow-lg">
          
          {/* Main Content: Product Details */}
          <div className="flex-1">
            {/* Product Hero Block */}
            <div className="store-card rounded-xl p-6 flex flex-col md:flex-row gap-8  shadow-lg border border-gray-200">
              
              {/* Image Section - Enhanced Gallery */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                {/* Main Product Image with Zoom */}
                <div className="relative">
                  <div
                    className="aspect-square bg-white rounded-2xl overflow-hidden relative group border border-gray-200 shadow-lg cursor-crosshair"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPosition({ x, y });
                    }}
                    onClick={() => setIsZoomOpen(true)}
                  >
                    {/* Main Image */}
                    <LazyImage
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Hover Zoom Lens Effect */}
                    {isHovering && (
                      <div
                        className="absolute w-32 h-32 border-2 border-theme-primary rounded-lg pointer-events-none bg-white/20 backdrop-blur-[1px] shadow-lg hidden md:block"
                        style={{
                          left: `calc(${zoomPosition.x}% - 64px)`,
                          top: `calc(${zoomPosition.y}% - 64px)`,
                          backgroundImage: `url(${selectedImage})`,
                          backgroundSize: '400%',
                          backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }}
                      />
                    )}

                    {/* Discount Badge */}
                    {product.discount && (
                      <span className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-md">
                        {product.discount}
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist();
                      }}
                      className={`absolute top-4 right-4 p-2.5 rounded-full transition-all ${
                        isWishlisted
                          ? 'bg-rose-100 text-rose-500 shadow-md'
                          : 'bg-white text-gray-400 shadow hover:text-rose-500 hover:bg-rose-50'
                      }`}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={22} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
                    </button>

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
                          aria-label="Next image"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    {/* Zoom Hint */}
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow flex items-center gap-1.5">
                      <ZoomIn size={14} />
                      Click to zoom
                    </div>
                  </div>

                  {/* Zoomed Preview Panel (Desktop Only) */}
                  {isHovering && (
                    <div className="hidden md:block absolute left-[calc(100%+16px)] top-0 w-[400px] h-[400px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${selectedImage})`,
                          backgroundSize: '200%',
                          backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery - Bottom with Arrows */}
                <div className="relative">
                  {/* Left Arrow */}
                  {galleryImages.length > 5 && (
                    <button
                      onClick={() => scrollThumbnails('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
                      aria-label="Scroll thumbnails left"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}

                  {/* Thumbnails Container */}
                  <div
                    ref={thumbnailScrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    {additionalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onMouseEnter={() => handleThumbnailSelect(img, idx)}
                        onClick={() => handleThumbnailSelect(img, idx)}
                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 p-1 transition-all overflow-hidden transform hover:scale-105 ${
                          selectedImageIndex === idx
                            ? 'border-theme-primary shadow-md'
                            : 'border-gray-200 hover:border-theme-primary/70'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                        aria-pressed={selectedImageIndex === idx}
                      >
                        <LazyImage src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  {galleryImages.length > 5 && (
                    <button
                      onClick={() => scrollThumbnails('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
                      aria-label="Scroll thumbnails right"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="w-full md:w-1/2 flex flex-col">
                 <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                 
                 <div className="mb-4">
                   <StarRating rating={product.rating || 0} count={product.reviews} />
                 </div>

                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-4xl font-bold text-theme-primary">৳ {formattedPrice}</span>
                    {formattedOriginalPrice && (
                      <span className="text-lg text-gray-400 line-through mb-1">৳ {formattedOriginalPrice}</span>
                    )}
                 </div>

                   <div className="flex flex-wrap items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0064d1] hover:bg-[#0055b2] text-white text-sm font-semibold px-4 py-2 shadow-sm"
                    >
                        <Share2 size={16} /> Share
                     </button>
                     <span className="text-xs text-gray-500 break-all">
                       
                     </span>
                   </div>

                 <div className="space-y-5 mb-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-theme-primary/30 rounded-lg">
                           <button 
                             onClick={decreaseQuantity}
                             className="px-4 py-2 text-theme-primary hover:bg-theme-primary/10 font-bold transition"
                           >-</button>
                           <span className="px-4 py-2 font-bold text-gray-700 w-12 text-center">{quantity}</span>
                           <button 
                             onClick={increaseQuantity}
                             className={`px-4 py-2 font-bold transition ${atStockLimit ? 'text-gray-400 cursor-not-allowed' : 'text-theme-primary hover:bg-theme-primary/10'}`}
                             disabled={atStockLimit}
                           >+</button>
                        </div>
                        {Number.isFinite(availableStock) && (
                          <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                            {isOutOfStock ? 'Out of stock' : `${availableStock} pcs available`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {showColorSelector ? (
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-3">
                            Color
                            <span className="text-xs font-normal text-gray-500 ml-2">
                              {selectedColor}
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {colorOptions.map(color => (
                              <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                aria-pressed={selectedColor === color}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all transform ${
                                  selectedColor === color 
                                    ? 'border-theme-primary bg-theme-primary/10 text-theme-primary shadow-md scale-105' 
                                    : 'border-gray-200 text-gray-600 hover:border-theme-primary/50 hover:shadow'
                                }`}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">Color: {fallbackColor}</p>
                      )}

                      {showSizeSelector ? (
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-3">
                            Size
                            <span className="text-xs font-normal text-gray-500 ml-2">
                              {selectedSize}
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {sizeOptions.map(size => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                aria-pressed={selectedSize === size}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all transform ${
                                  selectedSize === size 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105' 
                                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:shadow'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">Size: {fallbackSize}</p>
                      )}
                    </div>

                    {variantError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <span>{variantError}</span>
                      </div>
                    )}
                 </div>

                 {/* Desktop Buttons */}
                 <div className="hidden md:flex gap-3 mb-8">
                    <button 
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition transform active:scale-95 ${isOutOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    >
                       <ShoppingCart size={20} /> Add to cart
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition transform active:scale-95 ${isOutOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                       <ShoppingBag size={20} /> Buy Now
                    </button>
                 </div>

                 <div className="text-xs text-gray-500 mb-4">
                    Selected: <span className="font-semibold text-gray-700">{currentVariant.color} / {currentVariant.size}</span>
                 </div>

                 <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4 mt-auto">
                    <p><span className="font-semibold text-gray-800 w-24 inline-block">Category:</span> <span className="text-theme-primary">{product.category || 'Electronics'}</span></p>
                    {product.tags && (
                      <><p><span className="font-semibold text-gray-800 w-24 inline-block">Tags:</span> {product.tags.join(', ')}</p> <p><span className="font-semibold text-gray-800 w-24 inline-block">SKU: {product.sku}</span></p></>   
                   )}
                 </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-8 store-card rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 px-6 py-4 font-bold text-sm transition ${
                      activeTab === 'description' 
                        ? 'text-theme-primary border-b-2 border-theme-primary bg-white' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    aria-selected={activeTab === 'description'}
                    role="tab"
                  >
                    Description
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 px-6 py-4 font-bold text-sm transition ${
                      activeTab === 'reviews' 
                        ? 'text-theme-primary border-b-2 border-theme-primary bg-white' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    aria-selected={activeTab === 'reviews'}
                    role="tab"
                  >
                    Reviews
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-theme-primary/15 text-xs font-bold text-theme-primary">
                      {product.reviews || 0}
                    </span>
                  </button>
               </div>
               <div className="p-8 min-h-[200px]">
                  {activeTab === 'description' ? (
                    <div className="text-gray-600 leading-relaxed space-y-4">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: product.description || "No description available for this product." 
                        }}
                      />
                      <p className="text-sm italic text-gray-500">Experience premium quality with our latest collection. This product features state-of-the-art technology, ergonomic design for comfort, and durable materials that last. Perfect for daily use or special occasions.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {product.reviews && product.reviews > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={28} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-gray-800">{product.rating || 4.5}/5</p>
                          <p className="text-gray-600">Based on {product.reviews} customer reviews</p>
                          <button className="mt-4 px-6 py-2 btn-theme-primary rounded-lg font-semibold transition">
                            Write a Review
                          </button>
                        </div>
                      ) : (
                        <div className="py-8 space-y-3">
                          <Star size={48} className="mx-auto text-gray-300" />
                          <p className="text-gray-500 font-medium">No reviews yet</p>
                          <p className="text-gray-400 text-sm">Be the first to review this product and help others make informed decisions.</p>
                          <button className="mt-4 px-6 py-2 btn-theme-primary rounded-lg font-semibold transition">
                            Write a Review
                          </button>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 space-y-8 shadow-lg">
            
            {/* Related Products Widget */}
            <div className="store-card rounded-xl p-5 shadow-lg border border-gray-200">
               <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-gray-100">Related Products</h3>
               <div className="space-y-4">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => <div key={`skeleton-${i}`} className="h-20 bg-gray-100 rounded animate-pulse" />)
                  ) : (
                  relatedProducts.map(({ product: related, matchType, reason, stockCount }) => (
                    <div 
                      key={related.id} 
                      onClick={() => onProductClick(related)}
                      className="flex gap-3 group cursor-pointer"
                    >
                       <div className="w-16 h-16 bg-gray-50 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                          <LazyImage src={normalizeImageUrl(related.image)} alt={related.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-theme-primary transition">
                              {related.name}
                            </h4>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${MATCH_BADGE[matchType].className}`}>
                              {MATCH_BADGE[matchType].label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reason}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-theme-primary font-bold text-sm">৳ {formatCurrency(related.price)}</span>
                            <div className="text-[11px] text-gray-500">
                              {stockCount > 0 ? `${stockCount} in stock` : 'Restocking soon'}
                            </div>
                          </div>
                       </div>
                    </div>
                  ))
                  )}
               </div>
            </div>

            {/* Category Widget */}
            <div className="store-card rounded-xl p-5 shadow-lg border border-gray-200">
               <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-gray-100">Category</h3>
               <div className="space-y-2">
                 {(categories && categories.length > 0 ? categories.filter(c => c.status === 'Active').slice(0, 6) : []).map((cat, idx) => (
                   <div 
                     key={idx} 
                     onClick={() => onCategoryClick?.(cat.name)}
                     className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition cursor-pointer group"
                   >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-theme-primary/30 transition">
                        {cat.image || (cat.icon && cat.icon.startsWith('http')) ? (
                          <img 
                            src={normalizeImageUrl(cat.image || cat.icon || '')} 
                            alt={cat.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 group-hover:text-theme-primary transition">
                            {iconMap[cat.icon || 'grid'] || <Grid size={20} strokeWidth={1.5} />}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{cat.name}</span>
                   </div>
                 ))}
               </div>
            </div>

          </aside>

        </div>
      </main>
      
      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 md:hidden z-50 flex items-center gap-3 shadow-[0_-6px_25px_rgba(15,23,42,0.08)]">
        <button
          onClick={onBack}
          className="h-12 w-12 flex items-center justify-center rounded-xl text-gray-600 border border-slate-200 bg-white shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'btn-order active:scale-95'
            }`}
          >
            <ShoppingCart size={20} />
            <span>Add to cart</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-theme-primary text-white shadow-lg active:scale-95'
            }`}
          >
            <ShoppingBag size={20} />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <Suspense fallback={null}>
          <StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
        </Suspense>
      </div>
    </div>
  );
};

export default StoreProductDetail;
