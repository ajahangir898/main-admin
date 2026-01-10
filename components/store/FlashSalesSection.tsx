import { useState, useEffect, RefObject } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../StoreProductComponents';
import { getViewportWidth } from '../../utils/viewportHelpers';

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

const getInitialCount = (len: number) => Math.min(typeof window !== 'undefined' && getViewportWidth() >= 1024 ? 6 : 4, len);

// Default countdown placeholder to prevent CLS when timer initializes
const DEFAULT_COUNTDOWN = [
  { label: 'HRS', value: '00' },
  { label: 'MIN', value: '00' },
  { label: 'SEC', value: '00' }
];

export const FlashSalesSection = ({ products, showCounter, countdown, onProductClick, onBuyNow, onQuickView, onAddToCart, productCardStyle, sectionRef, onViewAll }: Props) => {
  const [visible, setVisible] = useState(() => getInitialCount(products.length));
  
  // Use default countdown if not provided to prevent CLS
  const displayCountdown = countdown?.length ? countdown : DEFAULT_COUNTDOWN;

  useEffect(() => {
    setVisible(getInitialCount(products.length));
  }, [products.length]);

  useEffect(() => {
    if (visible >= products.length) return;
    const t = setTimeout(() => setVisible(v => Math.min(products.length, v + 2)), 180);
    return () => clearTimeout(t);
  }, [products.length, visible]);

  return (
    <section 
      ref={sectionRef} 
      className="py-6 px-4 md:px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600" 
      style={{ minHeight: products.length > 0 ? '420px' : 'auto', contain: 'layout' }}
    >
      {/* Header row - CocoKids "Deal of The Day" style */}
      <div className="flex items-center justify-between pb-4 mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Deal of The Day
          </h2>
          <p className="text-white/80 text-sm mt-1">Best Price, Top Products</p>
        </div>
        
        <button 
          onClick={onViewAll} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-theme-primary rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg"
        >
          View All
          <Play size={14} fill="currentColor" />
        </button>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" style={{ minHeight: '320px' }}>
        {products.slice(0, visible).map(p => (
          <ProductCard 
            key={`flash-${p.id}`} 
            product={p} 
            onClick={onProductClick} 
            onBuyNow={onBuyNow} 
            variant={productCardStyle} 
            onQuickView={onQuickView} 
            onAddToCart={onAddToCart}
            showSaleBadge={true}
          />
        ))}
      </div>
    </section>
  );
};

export default FlashSalesSection;
