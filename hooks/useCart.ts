import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Product, User, ProductVariantSelection } from '../types';
import { DataService } from '../services/DataService';
import { CART_STORAGE_KEY, ensureVariantSelection } from '../utils/appHelpers';

// Lazy load toast to avoid including 20KB in initial bundle
let toastModule: typeof import('react-hot-toast') | null = null;
const getToast = async () => {
  if (toastModule) return toastModule;
  toastModule = await import('react-hot-toast');
  return toastModule;
};
const showToast = {
  success: (msg: string) => getToast().then(m => m.toast.success(msg)),
  error: (msg: string) => getToast().then(m => m.toast.error(msg)),
  info: (msg: string) => getToast().then(m => m.toast(msg)),
};

interface Options { user: User | null; products: Product[]; tenantId?: string; }

const getKey = (tid?: string) => tid ? `${CART_STORAGE_KEY}-${tid}` : CART_STORAGE_KEY;
const parse = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };

export function useCart({ user, products, tenantId }: Options) {
  const key = useMemo(() => getKey(tenantId), [tenantId]);
  const [cart, setCart] = useState<number[]>(() => typeof window === 'undefined' ? [] : parse(key));

  useEffect(() => { if (typeof window !== 'undefined') setCart(parse(key)); }, [key]);
  useEffect(() => { if (typeof window !== 'undefined') try { localStorage.setItem(key, JSON.stringify(cart)); } catch {} }, [cart, key]);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    (async () => { try { const r = await DataService.get('cart', [], user.id); if (!cancel && Array.isArray(r)) setCart(r); } catch {} })();
    return () => { cancel = true; };
  }, [user?.id]);

  useEffect(() => { if (user?.id) DataService.save('cart', cart, user.id).catch(() => {}); }, [cart, user?.id]);

  const handleCartToggle = useCallback((id: number, opts?: { silent?: boolean }) => {
    setCart(p => {
      const has = p.includes(id), next = has ? p.filter(x => x !== id) : [...p, id];
      if (!opts?.silent) showToast.success(has ? 'Removed from cart' : 'Added to cart');
      return next;
    });
  }, []);

  const handleAddProductToCart = useCallback((p: Product, qty = 1, v?: ProductVariantSelection | null, opts?: { silent?: boolean }) => {
    setCart(prev => {
      if (prev.includes(p.id)) { if (!opts?.silent) showToast.info('Already in cart'); return prev; }
      if (!opts?.silent) showToast.success(`${p.name} added to cart`);
      return [...prev, p.id];
    });
  }, []);

  const handleCheckoutFromCart = useCallback((id: number, onCheckout: (p: Product, q: number, v: ProductVariantSelection) => void) => {
    const p = products.find(x => x.id === id);
    if (!p) { showToast.error('Product unavailable'); return; }
    onCheckout(p, 1, ensureVariantSelection(p));
  }, [products]);

  return { cartItems: cart, setCartItems: setCart, handleCartToggle, handleAddProductToCart, handleCheckoutFromCart };
}
