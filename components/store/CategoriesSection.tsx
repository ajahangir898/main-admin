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
      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-theme-primary bg-white hover:bg-theme-primary/10 transition-colors duration-150"
    >
      <div className="w-6 h-6 flex items-center justify-center text-theme-primary">
        {isImageUrl(category.icon) ? (
          <img 
            src={category.icon} 
            alt="" 
            className="w-5 h-5 object-contain" 
            loading="lazy"
            decoding="async"
          />
        ) : (
          getIcon(category.icon, 18, 2)
        )}
      </div>
      <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
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
    <div ref={ref} className="relative py-3 overflow-hidden">
      {/* Header with title and View All */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Categories</h2>
          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 mt-1"></div>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
          View All
          <ChevronRight size={16} className="text-blue-600" />
        </button>
      </div>
      
      <div 
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-40px),transparent)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex gap-3 w-max px-2 animate-marquee ${isPaused ? '[animation-play-state:paused]' : ''}`}>
          {duplicatedItems.map((category, index) => (
            <CategoryButton 
              key={`${category.name}-${index}`} 
              category={category} 
              onClick={handleClick}
            />
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow-lg flex items-center justify-center border border-gray-200 pointer-events-none">
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </div>
  );
});

CategoriesSection.displayName = 'CategoriesSection';
export default CategoriesSection;
