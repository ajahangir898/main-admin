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
    <section ref={sectionRef} className="py-2 md:py-3" style={{ minHeight: products.length > 0 ? '320px' : 'auto', contain: 'layout' }}>
      {/* Header row - with glassmorphism */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/40 rounded-2xl p-4 md:p-6 mb-4 shadow-lg flex items-center justify-between min-h-[40px] md:min-h-[48px]">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="relative flex h-2 w-2 md:h-3 md:w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-pink-500" />
            </span>
            <h2 className="text-base md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              ⚡ Flash Sale
            </h2>
          </div>
          {/* Countdown - with glass effect */}
          <div className="bg-gradient-to-r from-pink-500/15 to-cyan-500/15 backdrop-blur-xl border border-white/40 rounded-xl px-3 md:px-4 py-1.5 md:py-2 shadow-md flex items-center gap-0.5 md:gap-1 min-w-[140px] md:min-w-[180px] h-[36px] md:h-[44px]" style={{ visibility: showCounter ? 'visible' : 'hidden' }}>
            {displayCountdown.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center bg-gradient-to-br from-pink-500 to-cyan-500 rounded-md md:rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 w-[32px] md:w-[42px] shadow-md">
                  <span className="text-xs md:text-base font-bold text-white tabular-nums leading-none font-mono">{s.value}</span>
                  <span className="text-[7px] md:text-[9px] text-white/80 uppercase tracking-wider mt-0.5">{s.label}</span>
                </div>
                {i < displayCountdown.length - 1 && <span className="text-pink-500 font-bold mx-0.5 text-sm md:text-lg animate-pulse">:</span>}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-0.5 md:gap-1 text-xs md:text-sm font-semibold text-gray-600 hover:text-pink-600 transition-colors flex-shrink-0">
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
          <ChevronRight size={14} className="md:hidden" />
          <ChevronRight size={16} className="hidden md:block text-pink-600" />
        </button>
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 lg:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" style={{ minHeight: '260px' }}>
        {products.slice(0, visible).map(p => (
          <ProductCard key={`flash-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
};

export default FlashSalesSection;
