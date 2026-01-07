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
    <div className="bg-white rounded-xl overflow-hidden flex flex-col relative shadow-sm hover:shadow-xl transition-shadow duration-300" style={{ contain: 'layout' }}>
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
            className="flex items-center justify-center w-9 h-full border-2 border-theme-primary text-theme-primary rounded-lg hover:bg-theme-primary hover:text-white transition-all"
            onClick={handleCart}
          >
            <ShoppingCart size={16} />
          </button>
          <button 
            className="flex-1 btn-order text-xs py-2 rounded-lg h-full bg-theme-primary text-white hover:bg-theme-primary/90 transition-all"
            onClick={handleBuyNow}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};
