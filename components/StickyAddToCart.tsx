import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product, ProductVariantSelection } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface StickyAddToCartProps {
  product: Product;
  quantity: number;
  variant?: ProductVariantSelection;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  triggerOffset?: number;
}

export const StickyAddToCart: React.FC<StickyAddToCartProps> = ({
  product,
  quantity,
  variant,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted = false,
  triggerOffset = 600
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > triggerOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [triggerOffset]);

  return (
    <div className={`enhanced-sticky-add-to-cart ${isVisible ? 'visible' : ''}`}>
      <div className="enhanced-sticky-cart-content">
        <div className="enhanced-sticky-cart-product">
          <img
            src={normalizeImageUrl(product.galleryImages?.[0] || product.image)}
            alt={product.name}
            className="enhanced-sticky-cart-image"
          />
          <div className="enhanced-sticky-cart-info">
            <h4 className="line-clamp-1">{product.name}</h4>
            <p>৳{product.price.toLocaleString()} × {quantity}</p>
          </div>
        </div>

        <div className="enhanced-sticky-cart-actions">
          {onToggleWishlist && (
            <button
              onClick={onToggleWishlist}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Toggle wishlist"
            >
              <Heart
                size={20}
                fill={isWishlisted ? 'currentColor' : 'none'}
                className={isWishlisted ? 'text-red-500' : 'text-gray-600'}
              />
            </button>
          )}
          
          <button
            onClick={onAddToCart}
            className="px-4 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            Add to Cart
          </button>
          
          <button
            onClick={onBuyNow}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2"
          >
            <ShoppingBag size={20} />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyAddToCart;
