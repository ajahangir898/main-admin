
import React, { lazy, Suspense, useMemo, useState } from 'react';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
import { CheckCircle, Copy, Check } from 'lucide-react';
import { User, WebsiteConfig, Product, Order } from '../types';

interface SuccessProps {
  onHome: () => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  orderId?: string;
  orders?: Order[];
}

const StoreOrderSuccess = ({ onHome, user, onLoginClick, onLogoutClick, onProfileClick, logo, websiteConfig, searchValue, onSearchChange, onImageSearchClick, onOpenChat, cart, onToggleCart, onCheckoutFromCart, productCatalog, orderId: propsOrderId, orders = [] }: SuccessProps) => {
  const [copied, setCopied] = React.useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  
  // Get orderId from URL or props
  const orderId = useMemo(() => {
    if (propsOrderId) return propsOrderId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('orderId') || '';
    }
    return '';
  }, [propsOrderId]);

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 font-sans text-slate-900 flex flex-col">
      <Suspense fallback={null}>
        <StoreHeader 
          onHomeClick={onHome}
          onImageSearchClick={onImageSearchClick}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={productCatalog}
        />
      </Suspense>
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-12">
        <div className="store-card rounded-2xl p-8 md:p-12 max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-theme-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-theme-primary" />
           </div>
           
           <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
           <p className="text-gray-500 mb-8">Thank you for your purchase. Your order has been placed successfully and is being processed.</p>
           
           {orderId && (
             <div className="bg-theme-primary/5 rounded-xl p-4 mb-6 border border-theme-primary/20">
               <div className="flex items-center justify-between">
                 <div>
                   <span className="text-sm text-gray-500 block">Order ID</span>
                   <span className="text-xl font-bold text-theme-primary">{orderId}</span>
                 </div>
                 <button
                   onClick={handleCopyOrderId}
                   className="p-2 hover:bg-theme-primary/10 rounded-lg transition-colors"
                   title="Copy Order ID"
                 >
                   {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-gray-500" />}
                 </button>
               </div>
             </div>
           )}
           
           <div className="bg-white/70 rounded-lg p-4 mb-8 text-left border border-white/60 shadow-inner">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-gray-500">Order Status</span>
               <span className="text-sm font-bold text-theme-hover bg-theme-hover/10 px-2 py-1 rounded">Pending</span>
             </div>
             <p className="text-xs text-gray-400">You can track your order status in the "Track Order" section.</p>
           </div>

           <div className="flex flex-col gap-3">
              <button 
                onClick={onHome}
                className="flex-1 btn-order py-5 text-md"
              >
            Continue Shopping
              </button>
              <button 
                onClick={() => window.print()}
                className="btn-outline py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                 Download Invoice
              </button>
           </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreOrderSuccess;
