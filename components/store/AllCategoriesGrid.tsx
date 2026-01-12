import { memo, useMemo } from 'react';
import { Grid } from 'lucide-react';
import { Category } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

const isImageUrl = (icon?: string) => {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:');
};

interface Props {
  categories?: Category[];
  onCategoryClick: (name: string) => void;
  title?: string;
}

const CategoryCard = memo(({ 
  category, 
  onClick 
}: { 
  category: { name: string; icon?: string; image?: string; slug?: string }; 
  onClick: (slug: string) => void;
}) => {
  const iconSrc = category.image || category.icon;
  const hasImage = iconSrc && isImageUrl(iconSrc);

  return (
    <button
      onClick={() => onClick(category.slug || category.name)}
      className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border border-gray-100 bg-white hover:border-cyan-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-50 border-2 border-cyan-100 flex items-center justify-center overflow-hidden group-hover:border-cyan-300 group-hover:bg-cyan-100 transition-all">
        {hasImage ? (
          <img 
            src={normalizeImageUrl(iconSrc)} 
            alt={category.name} 
            className="w-10 h-10 md:w-12 md:h-12 object-contain" 
            loading="lazy"
          />
        ) : (
          <Grid size={28} className="text-cyan-500" strokeWidth={1.5} />
        )}
      </div>
      <span className="text-xs md:text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-cyan-600 transition-colors">
        {category.name}
      </span>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

export const AllCategoriesGrid = memo(({ categories, onCategoryClick, title = 'CATEGORIES' }: Props) => {
  const processed = useMemo(() => 
    categories?.filter(c => !c.status || c.status === 'Active' || c.status?.toLowerCase() === 'active')
      .map(c => ({ 
        name: c.name, 
        icon: c.icon || 'grid',
        image: c.image,
        slug: c.slug
      })) || []
  , [categories]);

  if (!processed.length) return null;

  return (
    <div className="py-4 md:py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        <div className="h-0.5 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto mt-2"></div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 md:gap-3">
        {processed.map((category, index) => (
          <CategoryCard 
            key={`${category.name}-${index}`} 
            category={category} 
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </div>
  );
});

AllCategoriesGrid.displayName = 'AllCategoriesGrid';
export default AllCategoriesGrid;
