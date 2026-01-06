import { CheckCircle } from 'lucide-react';
import { Product, ProductVariantSelection } from '../../types';

interface Props {
    product: Product;
    onClose: () => void;
    onCheckout: () => void;
    variant?: ProductVariantSelection | null;
    quantity?: number;
}

export const AddToCartSuccessModal = ({ product, onClose, onCheckout, variant, quantity }: Props) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Added to Cart!</h3>
            <p className="text-gray-600 text-sm mb-2">{product.name} has been added to your cart.</p>
            {variant && (
                <p className="text-xs text-gray-500 mb-4">
                    Variant: <span className="font-semibold text-gray-700">{variant.color} / {variant.size}</span>
                    {quantity ? ` • Qty: ${quantity}` : ''}
                </p>
            )}
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                    Continue Shopping
                </button>
                <button onClick={onCheckout} className="flex-1 py-2.5 rounded-lg font-medium transition btn-order">
                    Checkout
                </button>
            </div>
        </div>
    </div>
);

export default AddToCartSuccessModal;
// RR