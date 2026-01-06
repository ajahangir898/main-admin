import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, CarouselItem, WebsiteConfig } from '../types';
import { LazyImage } from '../utils/performanceOptimization';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  variant?: string;
  onQuickView?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const getImage = (p: Product) => normalizeImageUrl(p.galleryImages?.[0] || p.image);

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onBuyNow, onAddToCart }) => {
  const handleBuyNow = (e?: React.MouseEvent) => { e?.stopPropagation(); onBuyNow ? onBuyNow(product) : onClick(product); };
  const handleCart = (e: React.MouseEvent) => { e.stopPropagation(); onAddToCart?.(product); };

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col relative shadow-sm hover:shadow-lg transition-shadow duration-300" style={{ minHeight: '320px', contain: 'layout' }}>
      {/* Purple gradient top bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: 'linear-gradient(to right, #8b5cf6, #ec4899)' }}
      />
      
      {/* Wishlist button - fixed size */}
      <button 
        className="absolute top-3 left-3 z-10 text-pink-400 hover:text-pink-500 transition-colors w-5 h-5"
        onClick={(e) => e.stopPropagation()}
      >
        <Heart size={20} />
      </button>

      {/* Sale badge - fixed size container to prevent CLS */}
      <div className="absolute top-3 right-3 z-10 min-w-[40px] h-[22px]">
        {product.discount && (
          <span 
            className="text-white text-[10px] font-bold px-2.5 py-1 rounded"
            style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}
          >
            SALE
          </span>
        )}
      </div>

      {/* Product Image - explicit aspect ratio */}
      <div 
        className="relative cursor-pointer bg-gray-50" 
        style={{ aspectRatio: '4/3' }}
        onClick={() => onClick(product)}
      >
        <LazyImage 
          src={getImage(product)} 
          alt={product.name} 
          className="w-full h-full object-cover"
          width={300}
          height={225}
        />
      </div>

      {/* Product Details - fixed min-height to prevent CLS */}
      <div className="px-2.5 pb-2.5 pt-1.5 flex-1 flex flex-col" style={{ minHeight: '128px' }}>
        {/* Rating & Sold - fixed height */}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 h-[14px]">
          <Star size={10} className="text-yellow-400 flex-shrink-0" fill="#facc15" />
          <span className="text-gray-600">({product.reviews || 0})</span>
          <span className="text-gray-300">|</span>
          <span>{product.soldCount || 0} Sold</span>
        </div>

        {/* Product Name - fixed height for 2 lines */}
        <h3 
          className="font-semibold text-gray-800 text-xs leading-tight mb-1.5 line-clamp-2 cursor-pointer hover:text-cyan-600 transition-colors min-h-[32px]"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>

        {/* Price - fixed height container */}
        <div className="flex items-baseline gap-1.5 mb-2 min-h-[20px]">
          {product.originalPrice ? (
            <span className="text-[10px] text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>
          ) : (
            <span className="text-[10px] invisible">৳0</span>
          )}
          <span className="text-sm font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
        </div>

        {/* Buttons - fixed height */}
        <div className="flex gap-1.5 mt-auto h-[36px]">
          <button 
            className="flex items-center justify-center w-9 h-full border-2 border-theme-primary text-theme-primary rounded-lg hover:bg-theme-primary/10 transition-all"
            onClick={handleCart}
          >
            <ShoppingCart size={16} />
          </button>
          <button 
            className="flex-1 btn-order text-xs py-2 rounded-lg h-full"
            onClick={handleBuyNow}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

const normalizeCarouselStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase();

export const HeroSection: React.FC<{ carouselItems?: CarouselItem[]; websiteConfig?: WebsiteConfig }> = ({ carouselItems }) => {
  const items = carouselItems
    ?.filter(i => normalizeCarouselStatus(i.status) === 'publish')
    .sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0)) || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex(p => (p + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const navigate = (dir: number) => (e: React.MouseEvent) => { e.preventDefault(); setCurrentIndex(p => (p + dir + items.length) % items.length); };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="relative w-full aspect-[5/2] sm:aspect-[3/1] md:aspect-[7/2] lg:aspect-[4/1] rounded-xl overflow-hidden shadow-lg group bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        {items.map((item, index) => (
          <a key={item.id} href={item.url || '#'} className={`absolute inset-0 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <LazyImage src={normalizeImageUrl(item.image)} alt={item.name} className="absolute inset-0" size="full" priority={index === currentIndex} optimizationOptions={{ width: 1600, quality: 85 }} />
          </a>
        ))}
        {items.length > 1 && (
          <>
            <button onClick={navigate(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 w-9 h-9 rounded-full shadow-lg z-20 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110">
              <ChevronLeft size={20} />
            </button>
            <button onClick={navigate(1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 w-9 h-9 rounded-full shadow-lg z-20 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110">
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {items.map((_, i) => (
                <button key={i} onClick={e => { e.preventDefault(); setCurrentIndex(i); }} className={`h-2 rounded-full transition-all duration-300 shadow-sm ${i === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-2 hover:bg-white/80'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
