import React from 'react';
import { ShoppingCart, Heart, User } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { MobileSearchBar } from './HeaderSearchBar';

interface MobileHeaderBarProps {
  resolvedHeaderLogo: string | null;
  logoKey: string;
  onHomeClick?: () => void;
  wishlistBadgeCount: number;
  cartBadgeCount: number;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  onAccountClick?: () => void;
  searchProps: HeaderSearchProps;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({
  resolvedHeaderLogo,
  logoKey,
  onHomeClick,
  wishlistBadgeCount,
  cartBadgeCount,
  onWishlistOpen,
  onCartOpen,
  onAccountClick,
  searchProps
}) => (
  <header className="md:hidden bg-white px-3 py-3 border-b border-gray-100 shadow-sm sticky top-0 z-50">
    {/* Top Row: Logo Left, Icons Right */}
    <div className="flex items-center justify-between gap-3 mb-3">
      {/* Left: Logo */}
      <button type="button" className="flex items-center" onClick={onHomeClick}>
        {resolvedHeaderLogo ? (
          <img
            key={logoKey}
            src={normalizeImageUrl(resolvedHeaderLogo)}
            alt="Store logo"
            width={130}
            height={36}
            className="h-9 max-w-[130px] object-contain"
          />
        ) : (
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-theme-primary">YOUR</span>
            <span className="text-gray-800">SHOP</span>
          </h1>
        )}
      </button>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-1">
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors" 
          onClick={onWishlistOpen}
          aria-label="Wishlist"
        >
          <Heart size={21} />
          {wishlistBadgeCount > 0 && (
            <span className="absolute top-1 right-1 bg-theme-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
              {wishlistBadgeCount > 9 ? '9+' : wishlistBadgeCount}
            </span>
          )}
        </button>
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors" 
          onClick={onCartOpen}
          aria-label="Cart"
        >
          <ShoppingCart size={21} />
          {cartBadgeCount > 0 && (
            <span className="absolute top-1 right-1 bg-theme-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
              {cartBadgeCount > 9 ? '9+' : cartBadgeCount}
            </span>
          )}
        </button>
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors" 
          onClick={onAccountClick}
          aria-label="Account"
        >
          <User size={21} />
        </button>
      </div>
    </div>

    {/* Bottom Row: Search Bar */}
    <MobileSearchBar {...searchProps} />
  </header>
);