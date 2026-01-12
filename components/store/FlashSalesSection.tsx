import { useState, useEffect, useRef, RefObject } from 'react';
import { ChevronRight, ChevronLeft, Heart, ShoppingCart, Eye, Star, Flame } from 'lucide-react';
import { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface Props { 
  products: Product[]; 
  showCounter: boolean; 
  countdown: { label: string; value: string }[]; 
  onProductClick: (p: Product) => void; 
  onBuyNow: (p: Product) => void; 
  onQuickView: (p: Product) => void; 
  onAddToCart: (p: Product) => void; 
  productCardStyle?: string; 
  sectionRef?: RefObject<HTMLElement>;
  onViewAll?: () => void;
}

// Modern Product Card - Same style as regular products
const ProductCard = ({ product, onProductClick, onBuyNow, onAddToCart, onQuickView }: { 
  product: Product; 
  onProductClick: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onQuickView: (p: Product) => void;
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imageSrc = normalizeImageUrl(product.galleryImages?.[0] || product.image);
  const discountPercent = product.originalPrice && product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0 border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Wishlist */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        
        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
            -{discountPercent}%
          </span>
        )}
        
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-contain p-2 cursor-pointer group-hover:scale-105 transition-transform duration-300"
          onClick={() => onProductClick(product)}
          loading="lazy"
        />
        
        {/* Quick Actions on Hover */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-center gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <button 
            onClick={() => onQuickView(product)}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          >
            <Eye size={14} className="text-gray-700" />
          </button>
          <button 
            onClick={() => onAddToCart(product)}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          >
            <ShoppingCart size={14} className="text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* Details */}
      <div className="p-3 flex flex-col flex-1">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs text-gray-500">{product.rating || '4.5'} ({product.reviews || 0})</span>
        </div>
        
        {/* Name */}
        <h3 
          className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 cursor-pointer hover:text-pink-600 transition-colors min-h-[40px]"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-gray-900">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">৳{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        
        {/* Buy Now Button */}
        <button 
          onClick={() => onBuyNow(product)}
          className="mt-2 w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-sm"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export const FlashSalesSection = ({ products, showCounter, countdown, onProductClick, onBuyNow, onQuickView, onAddToCart, productCardStyle, sectionRef, onViewAll }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide effect
  useEffect(() => {
    if (products.length <= 3 || isPaused) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (container.scrollLeft >= maxScroll - 10) {
          // Reset to start smoothly
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: 210, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 420;
    const newPos = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount 
      : scrollRef.current.scrollLeft + scrollAmount;
    scrollRef.current.scrollTo({ left: newPos, behavior: 'smooth' });
  };

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    setCanScrollLeft(scrollRef.current.scrollLeft > 0);
    setCanScrollRight(scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [products]);

  if (!products.length) return null;

  return (
    <section 
      ref={sectionRef} 
      className="py-4 md:py-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-2xl p-1 shadow-lg">
        <div className="bg-gradient-to-r from-pink-500/90 via-rose-500/90 to-orange-500/90 rounded-xl p-4 md:p-5">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Flame className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Deal of The Day</h2>
                <p className="text-white/80 text-xs md:text-sm">Limited time offers</p>
              </div>
            </div>
            
            {/* Countdown */}
            {showCounter && (
              <div className="hidden sm:flex items-center gap-1.5">
                {countdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[45px] text-center">
                      <span className="text-lg font-bold text-white">{item.value}</span>
                      <p className="text-[9px] text-white/70 uppercase">{item.label}</p>
                    </div>
                    {idx < countdown.length - 1 && <span className="text-white font-bold">:</span>}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={onViewAll} 
              className="flex items-center gap-1 bg-white text-pink-600 text-xs md:text-sm font-bold px-4 py-2 rounded-full hover:bg-pink-50 transition-all shadow-md"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Products Slider */}
          <div className="relative">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button 
                onClick={() => handleScroll('left')}
                className="absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            
            {/* Products Container */}
            <div 
              ref={scrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth px-1"
            >
              {products.map(p => (
                <ProductCard 
                  key={p.id}
                  product={p} 
                  onProductClick={onProductClick} 
                  onBuyNow={onBuyNow}
                  onAddToCart={onAddToCart}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
            
            {/* Right Arrow */}
            {canScrollRight && (
              <button 
                onClick={() => handleScroll('right')}
                className="absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          
          {/* Progress Dots */}
          {products.length > 4 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: Math.min(5, Math.ceil(products.length / 2)) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/80 transition-colors cursor-pointer" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlashSalesSection;
