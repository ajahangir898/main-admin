import { X, Trash2 } from 'lucide-react';
import { Product } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

interface Props { isOpen: boolean; onClose: () => void; wishlistItems: number[]; catalogSource: Product[]; onToggleWishlist: (id: number) => void; }

export const WishlistModal = ({ isOpen, onClose, wishlistItems, catalogSource, onToggleWishlist }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900" onClick={onClose}><X size={22} /></button>
        <h2 className="text-lg font-bold mb-4">My Wishlist</h2>
        {wishlistItems.length === 0 ? <div className="text-center text-gray-500 py-8">No items in wishlist.</div> : (
          <ul className="space-y-4 max-h-96 overflow-y-auto">
            {wishlistItems.map(id => {
              const p = catalogSource.find(x => x.id === id);
              if (!p) return null;
              return (<li key={id} className="flex items-center gap-3 border-b pb-3 last:border-b-0">
                <img src={normalizeImageUrl(p.image)} alt={p.name} className="w-14 h-14 rounded-lg object-cover border" loading="lazy" decoding="async" />
                <div className="flex-1 min-w-0"><div className="font-semibold">{p.name}</div><div className="text-sm font-bold text-green-600 mt-1">৳ {formatCurrency(p.price)}</div></div>
                <button className="text-red-500 hover:text-red-700" onClick={() => onToggleWishlist(id)}><Trash2 size={18} /></button>
              </li>);
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WishlistModal;
