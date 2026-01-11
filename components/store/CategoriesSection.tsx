import { memo, useMemo, RefObject, useState, useCallback } from 'react';
import { Grid, ChevronRight } from 'lucide-react';
import { Category } from '../../types';

// Lazy load icons - only Grid is needed initially
const getIcon = (name: string, size: number, stroke = 1.5) => {
  return <Grid size={size} strokeWidth={stroke} />;
};

// Check if icon is a URL or base64 image
const isImageUrl = (icon?: string) => {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:');
};

interface Props {
  categories?: Category[];
  onCategoryClick: (name: string) => void;
  sectionRef?: RefObject<HTMLDivElement>;
  categoryScrollRef?: RefObject<HTMLDivElement>;
  style?: string; // Style prop (unused for now, but accepted)
}

// Memoized category button for better performance
const CategoryButton = memo(({ 
  category, 
  onClick 
}: { 
  category: { name: string; icon: string; slug?: string }; 
  onClick: (slug: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(category.slug || category.name);
  }, [category.slug, category.name, onClick]);

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-theme-primary/30 bg-white hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
    >
      <div className="w-4 h-4 flex items-center justify-center">
        {isImageUrl(category.icon) ? (
          <img 
            src={category.icon} 
            alt="" 
            className="w-full h-full object-contain" 
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          getIcon(category.icon, 14, 2)
        )}
      </div>
      <span className="text-xs font-semibold whitespace-nowrap">
        {category.name}
      </span>
    </button>
  );
});

CategoryButton.displayName = 'CategoryButton';

export const CategoriesSection = memo(({ categories, onCategoryClick, sectionRef, categoryScrollRef, style }: Props) => {
  const [isPaused, setIsPaused] = useState(false);
  
  // Use whichever ref is provided
  const ref = categoryScrollRef || sectionRef;

  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .slice(0, 20) // Limit to 20 categories for performance
      .map(c => ({ 
        name: c.name, 
        icon: c.icon || 'grid', 
        slug: c.slug
      })) || []
  , [categories]);

  // Memoize click handler
  const handleClick = useCallback((slug: string) => {
    onCategoryClick(slug);
  }, [onCategoryClick]);

  if (!processed.length) return null;

  // Duplicate for seamless loop
  const duplicatedItems = useMemo(() => [...processed, ...processed], [processed]);

  return (
    <div ref={ref} className="relative py-4 overflow-hidden">
      {/* Header with title and View All */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-theme-primary to-theme-secondary mt-1.5"></div>
        </div>
        <button
          className="flex items-center gap-1 text-sm font-semibold text-theme-primary hover:text-theme-secondary transition-colors"
          onClick={() => onCategoryClick('all')}
        >
          View All
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
      
      <div 
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15px,black_calc(100%-30px),transparent)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex gap-2 w-max px-2 animate-marquee ${isPaused ? '[animation-play-state:paused]' : ''}`}>
          {duplicatedItems.map((category, index) => (
            <CategoryButton 
              key={`${category.name}-${index}`} 
              category={category} 
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

CategoriesSection.displayName = 'CategoriesSection';
export default CategoriesSection;
