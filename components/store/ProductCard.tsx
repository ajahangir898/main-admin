import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { OptimizedImage } from '../OptimizedImage';

export interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    onBuyNow?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    onClick, 
    onBuyNow, 
    onAddToCart 
}) => {
    const imageSrc = normalizeImageUrl(product.galleryImages?.[0] || product.image);
    
    const handleBuyNow = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onBuyNow ? onBuyNow(product) : onClick(product);
    };

    const discountPercent = product.originalPrice && product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    return (
        <div 
            className="bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col relative"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
            {/* Discount Badge */}
            {(product.discount || discountPercent) && (
                <div className="absolute top-2.5 left-2.5 z-10">
                    <span 
                        className="inline-flex items-center text-white text-[11px] font-bold px-2.5 py-1 rounded-md"
                        style={{ background: 'linear-gradient(to right, #ef4444, #f97316)' }}
                    >
                        {product.discount || `-${discountPercent}%`}
                    </span>
                </div>
            )}

            {/* Product Image */}
            <div 
                className="relative aspect-square p-4 cursor-pointer overflow-hidden" 
                style={{ background: 'linear-gradient(to bottom, #f9fafb, #ffffff)' }}
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
            <div className="px-3.5 pb-3.5 pt-2 flex-1 flex flex-col border-t border-gray-100">
                <h3 
                    className="font-semibold text-gray-800 text-[13px] leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-orange-500 transition-colors"
                    style={{ minHeight: '36px' }}
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button 
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10 transition-all"
                        onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                    >
                        <ShoppingCart size={16} /> Cart
                    </button>
                    <button 
                        className="flex-1 btn-order text-sm py-2 px-4 rounded-lg"
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