import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../StoreProductComponents';
import { SectionHeader } from '../StoreComponents';
import { getViewportWidth } from '../../utils/viewportHelpers';

interface Props { title: string; products: Product[]; accentColor?: 'green' | 'purple' | 'orange' | 'blue'; onProductClick: (p: Product) => void; onBuyNow: (p: Product) => void; onQuickView: (p: Product) => void; onAddToCart: (p: Product) => void; productCardStyle?: string; keyPrefix: string; maxProducts?: number; reverseOrder?: boolean; }

const colors = { green: 'bg-green-500', purple: 'bg-purple-500', orange: 'bg-orange-500', blue: 'bg-blue-500' };

export const ProductGridSection = ({ title, products, accentColor = 'green', onProductClick, onBuyNow, onQuickView, onAddToCart, productCardStyle, keyPrefix, maxProducts = 10, reverseOrder = false }: Props) => {
  const display = reverseOrder ? products.slice().reverse().slice(0, maxProducts) : products.slice(0, maxProducts);
  const initCount = useCallback(() => {
    const t = display.length;
    if (typeof window === 'undefined') return Math.min(6, t);
    const w = getViewportWidth();
    return w >= 1280 ? Math.min(10, t) : w >= 768 ? Math.min(8, t) : Math.min(6, t);
  }, [display.length]);

  const [visible, setVisible] = useState(initCount);
  useEffect(() => { setVisible(initCount()); }, [initCount]);
  useEffect(() => {
    if (typeof window === 'undefined' || visible >= display.length) return;
    const t = setTimeout(() => setVisible(c => Math.min(display.length, c + (display.length > 12 ? 4 : 2))), 180);
    return () => clearTimeout(t);
  }, [display.length, visible]);

  const gridMinHeight = useMemo(() => {
    const cols = typeof window !== 'undefined' 
      ? (getViewportWidth() >= 1024 ? 5 : getViewportWidth() >= 768 ? 4 : 2)
      : 5;
    const rows = Math.ceil(Math.min(visible, display.length) / cols);
    const cardHeight = typeof window !== 'undefined' && getViewportWidth() < 768 ? 260 : 300;
    return Math.max(320, rows * cardHeight);
  }, [visible, display.length]);

  return (
    <section style={{ minHeight: `${gridMinHeight}px`, contain: 'layout' }}>
      <div className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl p-3 md:p-4 mb-3 shadow-sm flex items-center gap-2.5">
        <div className={`h-6 w-1 rounded-full ${colors[accentColor]}`}/>
        <SectionHeader title={title} className="text-lg md:text-xl font-bold text-gray-900"/>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ minHeight: `${gridMinHeight - 32}px` }}>
        {display.slice(0, visible).map(p => <ProductCard key={`${keyPrefix}-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart}/>)}
      </div>
    </section>
  );
};

export default ProductGridSection;
