import { useState, useMemo, Suspense, lazy } from 'react';
import { ChevronRight, ChevronLeft, Package, Tag, X, SlidersHorizontal } from 'lucide-react';
import { Product, Category, Brand, WebsiteConfig, User, Order } from '../../../types';
import { ProductCard } from '../../StoreProductComponents';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { ProductFilter, SortOption } from '../../ProductFilter';

const LazyStoreHeader = lazy(() => import('../../StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

export interface StoreCategoryProductsProps {
  products: Product[]; categories?: Category[]; subCategories?: any[]; childCategories?: any[];
  brands?: Brand[]; tags?: any[]; selectedCategory: string; websiteConfig?: WebsiteConfig;
  onCategoryChange: (c: string | null) => void; onBack: () => void; onHome?: () => void; onProductClick: (p: Product) => void;
  onBuyNow?: (p: Product) => void; onQuickView?: (p: Product) => void; onAddToCart?: (p: Product) => void;
  logo?: string | null; user?: User | null; wishlistCount?: number; wishlist?: number[]; cart?: number[];
  onToggleWishlist?: (id: number) => void; onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (id: number) => void; onLoginClick?: () => void; onLogoutClick?: () => void;
  onProfileClick?: () => void; onOpenChat?: () => void; onImageSearchClick?: () => void; orders?: Order[];
}

const eq = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

export const StoreCategoryProducts = ({ products, categories, subCategories, childCategories, brands, tags,
  selectedCategory, onCategoryChange, onBack, onHome, onProductClick, onBuyNow, onQuickView, onAddToCart, websiteConfig,
  logo, user, wishlistCount = 0, wishlist = [], onToggleWishlist, cart = [], onToggleCart, onCheckoutFromCart,
  onLoginClick, onLogoutClick, onProfileClick, onOpenChat, onImageSearchClick, orders = [] }: StoreCategoryProductsProps) => {
  
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [mobileFilter, setMobileFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const isAll = selectedCategory === '__all__';
  const isBrandFilter = selectedCategory.startsWith('brand:');
  const brandFromUrl = isBrandFilter ? selectedCategory.slice(6) : null;

  const activeCats = useMemo(() => categories?.filter(c => c.status === 'Active') || [], [categories]);
  const activeBrands = useMemo(() => brands?.filter(b => b.status === 'Active') || [], [brands]);

  // Filter products to show only Active status in store
  const activeProducts = useMemo(() => 
    products.filter(p => !p.status || p.status === 'Active'), 
    [products]
  );

  const filtered = useMemo(() => activeProducts.filter(p => {
    const brandOk = !selectedBrand || eq(p.brand, selectedBrand);
    if (isAll) return brandOk;
    if (isBrandFilter) return eq(p.brand, brandFromUrl!) || brandOk;
    return eq(p.category, selectedCategory) && brandOk;
  }), [activeProducts, selectedCategory, selectedBrand, isAll, isBrandFilter, brandFromUrl]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    const sorts: Record<string, () => Product[]> = {
      'price-low': () => s.sort((a, b) => (a.price || 0) - (b.price || 0)),
      'price-high': () => s.sort((a, b) => (b.price || 0) - (a.price || 0)),
      'rating': () => s.sort((a, b) => (b.rating || 0) - (a.rating || 0)),
      'newest': () => s.sort((a, b) => (b.id || 0) - (a.id || 0)),
    };
    return sorts[sortOption]?.() || s;
  }, [filtered, sortOption]);

  const catBrands = useMemo(() => {
    if (isAll) return activeBrands;
    const names = new Set(activeProducts.filter(p => eq(p.category, selectedCategory)).map(p => p.brand).filter(Boolean));
    return activeBrands.filter(b => names.has(b.name));
  }, [activeProducts, selectedCategory, activeBrands, isAll]);

  const title = isAll ? 'All Products' : brandFromUrl || selectedCategory;
  const clearFilters = () => { setSelectedBrand(null); setSortOption('relevance'); };
  const closeFilter = () => setMobileFilter(false);

  const Sidebar = () => (<>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3"><h3 className="text-white font-bold text-sm">Categories</h3></div>
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
        {activeCats.map(c => {
          const active = eq(selectedCategory, c.name);
          return (<button key={c.id} onClick={() => { onCategoryChange(c.name); setSelectedBrand(null); closeFilter(); }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-orange-50 group ${active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700'}`}>
            <div className="flex items-center gap-3">
              {c.image ? <img src={normalizeImageUrl(c.image)} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
              <span className="truncate">{c.name}</span>
            </div>
            <ChevronRight size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${active ? 'rotate-90 text-orange-500' : 'group-hover:translate-x-1'}`} />
          </button>);
        })}
      </div>
    </div>
    {catBrands.length > 0 && <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3"><h3 className="text-white font-bold text-sm">Brands</h3></div>
      <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
        {catBrands.map(b => (<button key={b.id} onClick={() => { setSelectedBrand(p => p === b.name ? null : b.name); closeFilter(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-gray-50 ${selectedBrand === b.name ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>
          {b.logo ? <img src={normalizeImageUrl(b.logo)} alt={b.name} className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-white p-1" />
            : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Tag size={16} className="text-gray-400" /></div>}
          <span className="truncate">{b.name}</span>
        </button>))}
      </div>
    </div>}
    {selectedBrand && <button onClick={() => { clearFilters(); closeFilter(); }} className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition">Clear Brand Filter</button>}
  </>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Suspense fallback={null}>
        <LazyStoreHeader onTrackOrder={() => setIsTrackOrderOpen(true)} onHomeClick={onHome || onBack} onImageSearchClick={onImageSearchClick} productCatalog={activeProducts}
          wishlistCount={wishlistCount} wishlist={wishlist} onToggleWishlist={onToggleWishlist} cart={cart}
          onToggleCart={onToggleCart} onCheckoutFromCart={onCheckoutFromCart} user={user} onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} logo={logo} websiteConfig={websiteConfig}
          searchValue={searchTerm} onSearchChange={setSearchTerm} onCategoriesClick={onBack} onProductsClick={onBack}
          categoriesList={activeCats.map(c => c.name)} onCategorySelect={onCategoryChange} onProductClick={onProductClick}
          categories={categories} subCategories={subCategories} childCategories={childCategories} brands={brands} tags={tags} />
      </Suspense>

      <div className="bg-white border-b border-gray-100 sticky top-[60px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <ChevronLeft size={20} /><span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
  <div><h1 className="text-lg font-bold text-gray-900">{title}</h1><p className="text-xs text-gray-500">{sorted.length} products</p></div>
</div>
<div className="flex items-center gap-2">
  <ProductFilter 
    products={sorted} 
    sortBy={sortOption} 
    onSortChange={(s, _) => setSortOption(s)} 
  />
  <button onClick={() => setMobileFilter(true)} className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition">
    <SlidersHorizontal size={16} />
    <span>Filters</span>
  </button>
</div>
        </div>
      </div>

      <div className="flex-1"><div className="max-w-7xl mx-auto px-4 py-6"><div className="flex gap-6">
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4"><Sidebar /></aside>
        <div className="flex-1 min-w-0">
          {selectedBrand && <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Filters:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {selectedBrand}<button onClick={() => setSelectedBrand(null)} className="ml-1 hover:text-blue-900"><X size={14} /></button>
            </span>
          </div>}
          {sorted.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sorted.map(p => <ProductCard key={`cat-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={websiteConfig?.productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart} />)}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-1">{selectedBrand ? `No ${selectedBrand} products in ${title}` : `No products in ${title}`}</p>
              {selectedBrand && <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition">Clear Brand Filter</button>}
            </div>
          )}
        </div>
      </div></div></div>

      {mobileFilter && <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={closeFilter} />
        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-gray-50 shadow-xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Filters</h2>
            <button onClick={closeFilter} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
          </div>
          <div className="p-4 space-y-4"><Sidebar /></div>
        </div>
      </div>}

      <Suspense fallback={null}><StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} /></Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreCategoryProducts;
