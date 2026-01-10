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
            className="bg-white rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col relative"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
            {/* Discount Badge */}
            {(product.discount || discountPercent) && (
                <div className="absolute top-2 left-2 z-10">
                    <span 
                        className="inline-flex items-center text-white text-[9px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: 'linear-gradient(to right, #ef4444, #f97316)' }}
                    >
                        {product.discount || `-${discountPercent}%`}
                    </span>
                </div>
            )}

            {/* Product Image */}
            <div 
                className="relative aspect-square p-3 cursor-pointer overflow-hidden" 
                style={{ background: 'linear-gradient(to bottom, #f9fafb, #ffffff)' }}
                onClick={() => onClick(product)}
            >
                <OptimizedImage
                    src={imageSrc}
                    alt={product.name}
                    width={400}
                    height={400}
                    placeholder="blur"
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            {/* Product Details */}
            <div className="px-2.5 pb-2.5 pt-1.5 flex-1 flex flex-col border-t border-gray-50">
                <h3 
                    className="font-medium text-gray-700 text-[11px] leading-snug mb-1.5 line-clamp-2 cursor-pointer hover:text-orange-500 transition-colors"
                    style={{ minHeight: '28px' }}
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[13px] font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                        <span className="text-[9px] text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                <div className="flex gap-1.5 mt-auto">
                    <button 
                        className="flex items-center justify-center gap-1 px-2 py-1.5 border border-gray-200 text-gray-500 text-[10px] font-medium rounded-md hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/5 transition-all"
                        onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                    >
                        <ShoppingCart size={12} />
                    </button>
                    <button 
                        className="flex-1 btn-order text-[11px] font-medium py-1.5 px-3 rounded-md"
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