import React, { useState } from 'react';
import {
  Smartphone,
  Watch,
  Headphones,
  Laptop,
  Camera,
  Gamepad2,
  Speaker,
  Tv,
  Star,
  TrendingUp
} from 'lucide-react';
import { Product, Category } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface MegaMenuProps {
  isOpen: boolean;
  categories?: Category[];
  featuredProduct?: Product;
  onCategoryClick?: (categoryName: string) => void;
  onProductClick?: (product: Product) => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Phones': <Smartphone size={20} />,
  'Watches': <Watch size={20} />,
  'Audio': <Headphones size={20} />,
  'Laptops': <Laptop size={20} />,
  'Cameras': <Camera size={20} />,
  'Gaming': <Gamepad2 size={20} />,
  'Speakers': <Speaker size={20} />,
  'TV': <Tv size={20} />,
};

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  categories = [],
  featuredProduct,
  onCategoryClick,
  onProductClick,
  onClose
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryName: string) => {
    onCategoryClick?.(categoryName);
    onClose?.();
  };

  const categoriesByColumn = React.useMemo(() => {
    const columns: Category[][] = [[], [], []];
    categories.forEach((cat, index) => {
      columns[index % 3].push(cat);
    });
    return columns;
  }, [categories]);

  return (
    <div className={`mega-menu-container ${isOpen ? 'active' : ''}`}>
      <div className="mega-menu-grid">
        {/* Category Columns */}
        {categoriesByColumn.map((columnCategories, colIndex) => (
          <div key={colIndex} className="mega-menu-column">
            <h4>
              {colIndex === 0 && 'Popular Categories'}
              {colIndex === 1 && 'More Categories'}
              {colIndex === 2 && 'Explore'}
            </h4>
            {columnCategories.map((category) => (
              <div
                key={category.id}
                className="mega-menu-item"
                onClick={() => handleCategoryClick(category.name)}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="mega-menu-item-icon">
                  {CATEGORY_ICONS[category.name] || <Star size={20} />}
                </div>
                <div>
                  <div className="font-medium">{category.name}</div>
                  {category.status === 'Active' && (
                    <div className="text-xs text-gray-400">View products</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Featured Product Slot */}
        {featuredProduct && (
          <div className="mega-menu-featured">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-purple-600" />
              <span className="mega-menu-featured-title">Featured Product</span>
            </div>
            
            <div
              className="mega-menu-featured-product cursor-pointer"
              onClick={() => {
                onProductClick?.(featuredProduct);
                onClose?.();
              }}
            >
              <img
                src={normalizeImageUrl(
                  featuredProduct.galleryImages?.[0] || featuredProduct.image
                )}
                alt={featuredProduct.name}
              />
              <div className="font-semibold text-sm mt-2 line-clamp-2">
                {featuredProduct.name}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-purple-600">
                  ৳{featuredProduct.price.toLocaleString()}
                </span>
                {featuredProduct.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ৳{featuredProduct.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {featuredProduct.discount && (
                <div className="mt-2 inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                  {featuredProduct.discount}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MegaMenu;
