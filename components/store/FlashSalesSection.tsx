import { useState, useEffect, RefObject } from 'react';
import { ChevronRight } from 'lucide-react';
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
    <section ref={sectionRef} className="py-3" style={{ minHeight: products.length > 0 ? '360px' : 'auto', contain: 'layout' }}>
      {/* Header row - fixed height to prevent CLS */}
      <div className="flex items-center justify-between pb-2 mb-4 min-h-[48px]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              ⚡ Flash Sale
            </h2>
          </div>
          {/* Countdown container - always rendered with fixed dimensions */}
          <div className="flex items-center gap-1 min-w-[180px] h-[44px]" style={{ visibility: showCounter ? 'visible' : 'hidden' }}>
            {displayCountdown.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center bg-gradient-to-br from-pink-500 to-cyan-500 rounded-lg px-2.5 py-1.5 w-[42px] shadow-md">
                  <span className="text-base font-bold text-white tabular-nums leading-none font-mono">{s.value}</span>
                  <span className="text-[9px] text-white/80 uppercase tracking-wider mt-0.5">{s.label}</span>
                </div>
                {i < displayCountdown.length - 1 && <span className="text-pink-500 font-bold mx-0.5 text-lg animate-pulse">:</span>}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex-shrink-0">
          View All
          <ChevronRight size={16} className="text-blue-600" />
        </button>
      </div>
      {/* Product grid - min-height based on expected card height */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" style={{ minHeight: '280px' }}>
        {products.slice(0, visible).map(p => (
          <ProductCard key={`flash-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
};

export default FlashSalesSection;
