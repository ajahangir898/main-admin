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
            className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden flex flex-col relative hover:-translate-y-2 md:hover:-translate-y-3"
        >
            {/* Discount Badge */}
            {(product.discount || discountPercent) && (
                <div className="absolute top-2 left-2 z-10">
                    <span 
                        className="inline-flex items-center bg-gradient-to-r from-rose-500 to-orange-500 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg"
                    >
                        {product.discount || `-${discountPercent}%`}
                    </span>
                </div>
            )}

            {/* Product Image */}
            <div 
                className="relative aspect-square p-4 cursor-pointer overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/90 rounded-t-xl md:rounded-t-2xl" 
                onClick={() => onClick(product)}
            >
                <OptimizedImage
                    src={imageSrc}
                    alt={product.name}
                    width={400}
                    height={400}
                    placeholder="blur"
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110"
                />
                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
            </div>

            {/* Product Details */}
            <div className="px-3 pb-3 pt-2 flex-1 flex flex-col">
                <h3 
                    className="font-semibold text-gray-800 text-xs md:text-sm leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-theme-primary transition-colors"
                    style={{ minHeight: '32px' }}
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg md:text-xl font-bold text-theme-primary">৳{product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">৳{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button 
                        className="flex items-center justify-center w-10 h-10 bg-white/85 backdrop-blur-md border-2 border-gray-200/80 text-gray-600 rounded-lg hover:border-theme-primary hover:text-white hover:bg-theme-primary transition-all duration-200 transform hover:scale-110 active:scale-95"
                        onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                        aria-label="Add to cart"
                    >
                        <ShoppingCart size={18} />
                    </button>
                    <button 
                        className="flex-1 bg-gradient-to-r from-theme-primary to-theme-primary/90 backdrop-blur-md border border-white/30 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
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