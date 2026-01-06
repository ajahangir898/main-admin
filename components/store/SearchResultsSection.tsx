import { Product } from '../../types';
import { ProductCard } from '../StoreProductComponents';
import { ProductFilter, SortOption } from '../ProductFilter';
import { EmptySearchState } from '../EmptyStates';

interface Props { searchTerm: string; products: Product[]; sortOption: SortOption; onSortChange: (o: SortOption) => void; onClearSearch: () => void; onProductClick: (p: Product) => void; onBuyNow: (p: Product) => void; onQuickView: (p: Product) => void; onAddToCart: (p: Product) => void; productCardStyle?: string; }

export const SearchResultsSection = ({ searchTerm, products, sortOption, onSortChange, onClearSearch, onProductClick, onBuyNow, onQuickView, onAddToCart, productCardStyle }: Props) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Search</p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{products.length} {products.length === 1 ? 'result' : 'results'} for "{searchTerm}".</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Matching product titles, categories, brands, and tags.</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <ProductFilter value={sortOption} onChange={onSortChange}/>
        <button onClick={onClearSearch} className="rounded-full border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-gray-300 h-10 min-w-[80px] sm:min-w-[100px]" aria-label="Clear search filters">Clear</button>
      </div>
    </div>
    {products.length ? (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 auto-rows-max">{products.map(p => <ProductCard key={`search-${p.id}`} product={p} onClick={onProductClick} onBuyNow={onBuyNow} variant={productCardStyle} onQuickView={onQuickView} onAddToCart={onAddToCart}/>)}</div>
    ) : <EmptySearchState searchTerm={searchTerm} onClearSearch={onClearSearch}/>}
  </section>
);

export default SearchResultsSection;
