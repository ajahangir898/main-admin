import { useState } from 'react';
import { ChevronDown, Sliders } from 'lucide-react';
import { Product } from '../types';

export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest';
interface Props { products: Product[]; onSortChange: (s: SortOption, p: Product[]) => void; sortBy: SortOption; }
const opts: { value: SortOption; label: string }[] = [{ value: 'relevance', label: 'Most Relevant' }, { value: 'price-low', label: 'Price: Low to High' }, { value: 'price-high', label: 'Price: High to Low' }, { value: 'rating', label: 'Highest Rated' }, { value: 'newest', label: 'Newest First' }];

export const ProductFilter = ({ products, onSortChange, sortBy }: Props) => {
  const [open, setOpen] = useState(false);
  const sort = (o: SortOption) => {
    let s = [...products];
    if (o === 'price-low') s.sort((a, b) => a.price - b.price);
    else if (o === 'price-high') s.sort((a, b) => b.price - a.price);
    else if (o === 'rating') s.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (o === 'newest') s.reverse();
    onSortChange(o, s); setOpen(false);
  };
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition">
        <Sliders size={16}/><span className="text-sm font-medium">{opts.find(o => o.value === sortBy)?.label || 'Sort'}</span><ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">{opts.map(o => <button key={o.value} onClick={() => sort(o.value)} className={`block w-full text-left px-4 py-3 text-sm font-medium transition ${sortBy === o.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>{o.label}</button>)}</div>}
    </div>
  );
};
