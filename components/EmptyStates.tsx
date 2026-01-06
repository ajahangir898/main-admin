import { ShoppingCart, Search, AlertTriangle, Home } from 'lucide-react';

const Icon = ({ icon: I, color }: { icon: any; color: string }) => <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-full flex items-center justify-center mb-4`}><I size={40} className="text-current"/></div>;
const Btn = ({ onClick, primary, children }: { onClick?: () => void; primary?: boolean; children: any }) => <button onClick={onClick} className={primary ? 'px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg transition transform hover:-translate-y-1' : 'px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition flex items-center gap-2'}>{children}</button>;

export const EmptyCartState = ({ onShop }: { onShop: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <Icon icon={ShoppingCart} color="from-blue-100 to-indigo-100"/>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
    <p className="text-gray-500 mb-6 max-w-sm">Explore our collection of amazing products and add your favorites to get started!</p>
    <Btn onClick={onShop} primary>Start Shopping</Btn>
  </div>
);

export const EmptySearchState = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <Icon icon={Search} color="from-amber-100 to-orange-100"/>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">No results for "{query}"</h2>
    <p className="text-gray-500 mb-6 max-w-sm">Try adjusting your search terms, filters, or browse our categories below.</p>
    <Btn onClick={onClear}>Clear Search</Btn>
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <Icon icon={AlertTriangle} color="from-rose-100 to-red-100"/>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
    <p className="text-gray-500 mb-6 max-w-sm">{message}</p>
    <div className="flex gap-3">{onRetry && <Btn onClick={onRetry} primary>Try Again</Btn>}<Btn><Home size={16}/> Go Home</Btn></div>
  </div>
);

export const LoadingState = () => <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl animate-pulse"/>)}</div>;
