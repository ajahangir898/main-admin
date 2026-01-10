import React, { useState, useEffect } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { LazyImage } from '../utils/performanceOptimization';

interface EnhancedProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (productId: number) => void;
  isWishlisted?: boolean;
}

export const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  onClick,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false
}) => {
  const [imageSwap, setImageSwap] = useState(false);
  const [addAnimation, setAddAnimation] = useState(false);

  const primaryImage = normalizeImageUrl(product.galleryImages?.[0] || product.image);
  const secondaryImage = normalizeImageUrl(
    product.galleryImages?.[1] || product.galleryImages?.[0] || product.image
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddAnimation(true);
    onAddToCart?.(product);
    setTimeout(() => setAddAnimation(false), 600);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  return (
    <div
      className="enhanced-product-card"
      onMouseEnter={() => setImageSwap(true)}
      onMouseLeave={() => setImageSwap(false)}
    >
      {/* Image Container with Swap Effect */}
      <div className="enhanced-product-image-container" onClick={() => onClick(product)}>
        <img
          src={primaryImage}
          alt={product.name}
          className="enhanced-product-image-primary"
          loading="lazy"
        />
        {secondaryImage !== primaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="enhanced-product-image-secondary"
            loading="lazy"
          />
        )}

        {/* Sale Badge */}
        {product.discount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discount}
          </div>
        )}

        {/* Quick Actions */}
        <div className="enhanced-product-quick-actions">
          <button
            className="enhanced-product-quick-action-btn"
            onClick={handleWishlist}
            aria-label="Add to wishlist"
          >
            <Heart
              size={18}
              fill={isWishlisted ? 'currentColor' : 'none'}
              className={isWishlisted ? 'text-red-500' : 'text-gray-600'}
            />
          </button>
          <button
            className="enhanced-product-quick-action-btn"
            onClick={handleQuickView}
            aria-label="Quick view"
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          className={`enhanced-product-quick-add ${addAnimation ? 'button-click-scale' : ''}`}
          onClick={handleAddToCart}
        >
          <ShoppingBag size={16} className="inline mr-2" />
          Quick Add
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3
          className="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-purple-600">
            ৳{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="text-yellow-400">★</span>
            <span className="font-medium">{product.rating}</span>
            {product.reviews && <span>({product.reviews})</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProductCard;
