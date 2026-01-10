import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { OptimizedImage } from '../OptimizedImage';

export interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    onBuyNow?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
    onQuickView?: (product: Product) => void;
    variant?: string;
    showSaleBadge?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    onClick, 
    onBuyNow, 
    onAddToCart,
    onQuickView,
    variant,
    showSaleBadge = false
}) => {
    const imageSrc = normalizeImageUrl(product.galleryImages?.[0] || product.image);
    
    const handleBuyNow = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onBuyNow ? onBuyNow(product) : onClick(product);
    };

    const discountPercent = product.originalPrice && product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    const hasSale = showSaleBadge || product.discount || discountPercent;

    return (
        <div 
            className="bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col relative"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            {/* Wishlist Heart Button */}
            <button 
                className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                onClick={(e) => { e.stopPropagation(); }}
            >
                <Heart size={16} />
            </button>

            {/* SALE Badge - CocoKids style */}
            {hasSale && (
                <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex items-center bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                        SALE
                    </span>
                </div>
            )}

            {/* Product Image */}
            <div 
                className="relative aspect-square p-4 cursor-pointer overflow-hidden bg-gray-50" 
                onClick={() => onClick(product)}
            >
                <OptimizedImage
                    src={imageSrc}
                    alt={product.name}
                    width={400}
                    height={400}
                    placeholder="blur"
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
            </div>

            {/* Product Details */}
            <div className="px-3 pb-3 pt-2 flex-1 flex flex-col">
                <h3 
                    className="font-medium text-gray-800 text-xs leading-snug mb-2 line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors"
                    style={{ minHeight: '32px' }}
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-base font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button 
                        className="flex items-center justify-center w-10 h-9 border border-gray-200 text-gray-500 rounded-lg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/5 transition-all"
                        onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                    >
                        <ShoppingCart size={16} />
                    </button>
                    <button 
                        className="flex-1 btn-order text-xs font-semibold py-2 px-3 rounded-lg"
                        onClick={handleBuyNow}
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;