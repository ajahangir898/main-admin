import { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Product, ProductVariantSelection } from '../../types';
import { formatCurrency } from '../../utils/format';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

export interface ProductQuickViewModalProps { product: Product; onClose: () => void; onCompleteOrder: (p: Product, qty: number, v: ProductVariantSelection) => void; onViewDetails?: (p: Product) => void; }

export const ProductQuickViewModal = ({ product: p, onClose, onCompleteOrder, onViewDetails }: ProductQuickViewModalProps) => {
  const [color, setColor] = useState(p.variantDefaults?.color || p.colors?.[0] || 'Default');
  const [size, setSize] = useState(p.variantDefaults?.size || p.sizes?.[0] || 'Standard');
  const [qty, setQty] = useState(1);

  useEffect(() => { setColor(p.variantDefaults?.color || p.colors?.[0] || 'Default'); setSize(p.variantDefaults?.size || p.sizes?.[0] || 'Standard'); setQty(1); }, [p]);

  const price = formatCurrency(p.price), orig = formatCurrency(p.originalPrice, null);
  const variant: ProductVariantSelection = { color: color || 'Default', size: size || 'Standard' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X size={22}/></button>
        <div className="p-6 lg:p-10 bg-gradient-to-br from-gray-50/80 to-white/90 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm"><div className="absolute inset-6 bg-gradient-to-br from-emerald-200/40 via-transparent to-transparent blur-3xl"/><img src={normalizeImageUrl(p.galleryImages?.[0] || p.image)} alt={p.name} className="relative w-full h-80 object-contain"/></div>
          <div className="mt-4 flex gap-2 text-xs text-gray-500">
            <span className="bg-white/80 backdrop-blur-md border border-gray-200/60 px-3 py-1 rounded-full">Ships 48h</span>
            <span className="bg-white/80 backdrop-blur-md border border-gray-200/60 px-3 py-1 rounded-full">Secure Payment</span>
          </div>
        </div>
        <div className="p-6 lg:p-10 space-y-4">
          <div><p className="text-xs uppercase tracking-[0.3em] text-gray-400">Quick view</p><h3 className="text-2xl font-black text-gray-900 mt-2">{p.name}</h3><p className="text-sm text-gray-500 mt-2 line-clamp-3">{p.description}</p></div>
          <div className="flex items-center gap-3"><span className="text-3xl font-black text-gray-900">৳ {price}</span>{orig && <span className="text-sm line-through text-gray-400">৳ {orig}</span>}</div>
          {p.colors?.length && <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Color</p><div className="flex flex-wrap gap-2">{p.colors.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-emerald-500' : 'border-transparent'} shadow-sm`} style={{ backgroundColor: c }}/>)}</div></div>}
          {p.sizes?.length && <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Size</p><div className="flex flex-wrap gap-2">{p.sizes.map(s => <button key={s} type="button" onClick={() => setSize(s)} className={`px-3 py-1.5 rounded-xl border text-sm font-semibold ${size === s ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-600'}`}>{s}</button>)}</div></div>}
          <div className="flex items-center gap-4"><p className="text-xs font-semibold text-gray-500 uppercase">Quantity</p><div className="flex items-center rounded-full border border-gray-200"><button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 text-gray-500 hover:text-gray-900"><Minus size={16}/></button><span className="px-4 text-sm font-bold text-gray-900">{qty}</span><button type="button" onClick={() => setQty(q => q + 1)} className="p-2 text-gray-500 hover:text-gray-900"><Plus size={16}/></button></div></div>
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => onCompleteOrder(p, qty, variant)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 backdrop-blur-md border border-white/30 text-white py-3 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Complete Order</button>
            <button type="button" onClick={() => onViewDetails?.(p)} className="w-full bg-white/80 backdrop-blur-md py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:border-emerald-400 hover:bg-white transition-all">View Full Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;
