import { memo, useMemo, RefObject, useState, useCallback, useEffect, useRef } from 'react';
import { Grid, ChevronRight, ChevronLeft } from 'lucide-react';
import { Category } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

const isImageUrl = (icon?: string) => {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:');
};

interface Props {
  categories?: Category[];
  onCategoryClick: (name: string) => void;
  sectionRef?: RefObject<HTMLDivElement>;
  categoryScrollRef?: RefObject<HTMLDivElement>;
  style?: string;
}

// Mobile-friendly pill with improved design
const CategoryPill = memo(({ 
  category, 
  onClick 
}: { 
  category: { name: string; icon?: string; image?: string; slug?: string }; 
  onClick: (slug: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(category.slug || category.name);
  }, [category.slug, category.name, onClick]);

  const iconSrc = category.image || category.icon;
  const hasImage = iconSrc && isImageUrl(iconSrc);

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white border border-cyan-200 text-gray-700 hover:border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md group touch-manipulation"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:from-cyan-100 group-hover:to-blue-100 transition-all">
        {hasImage ? (
          <img 
            src={normalizeImageUrl(iconSrc)} 
            alt={category.name} 
            className="w-full h-full object-cover" 
            loading="eager"
            decoding="sync"
          />
        ) : (
          <Grid size={14} className="text-cyan-500 group-hover:text-cyan-600 transition-colors" strokeWidth={2} />
        )}
      </div>
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap group-hover:text-cyan-700 transition-colors">
        {category.name}
      </span>
    </button>
  );
});

CategoryPill.displayName = 'CategoryPill';

export const CategoriesSection = memo(({ categories, onCategoryClick, sectionRef, categoryScrollRef, style }: Props) => {
  const ref = categoryScrollRef || sectionRef;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(30);

  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .slice(0, 30)
      .map(c => ({ 
        name: c.name, 
        icon: c.icon || 'grid',
        image: c.image,
        slug: c.slug
      })) || []
  , [categories]);

  // Calculate animation duration based on number of items
  useEffect(() => {
    const baseSpeed = 20; // seconds for 10 items
    const itemCount = processed.length;
    const duration = Math.max(15, (itemCount / 10) * baseSpeed);
    setAnimationDuration(duration);
  }, [processed.length]);

  const handleClick = useCallback((slug: string) => {
    onCategoryClick(slug);
  }, [onCategoryClick]);

  const handleManualScroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setIsPaused(true);
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
    // Resume after manual scroll
    setTimeout(() => setIsPaused(false), 3000);
  }, []);

  if (!processed.length) return null;

  // Duplicate items for seamless infinite scroll
  const duplicatedItems = [...processed, ...processed];

  return (
    <div 
      ref={ref} 
      className="relative py-3 sm:py-4 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Categories</h2>
          <div className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleManualScroll('left')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-cyan-100 text-gray-500 hover:text-cyan-600 transition-all shadow-sm hover:shadow"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => handleManualScroll('right')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-cyan-100 text-gray-500 hover:text-cyan-600 transition-all shadow-sm hover:shadow"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
          <button
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors px-2 py-1 rounded-full hover:bg-cyan-50"
            onClick={() => onCategoryClick('__all__')}
          >
            View All
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* Scrollable Pills with CSS animation */}
      <div 
        ref={scrollContainerRef}
        className="overflow-hidden"
      >
        <div 
          className={`flex gap-2.5 sm:gap-3 w-max ${isPaused ? '' : 'animate-marquee'}`}
          style={{
            animationDuration: `${animationDuration}s`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {duplicatedItems.map((category, index) => (
            <CategoryPill 
              key={`${category.name}-${index}`} 
              category={category} 
              onClick={handleClick}
            />
          ))}
        </div>
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-12 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-12 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
      
      {/* CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
});

CategoriesSection.displayName = 'CategoriesSection';
export default CategoriesSection;
