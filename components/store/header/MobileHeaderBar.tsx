import React from 'react';
import { ShoppingCart, Heart, User, Search, Menu } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { WebsiteConfig } from '../../../types';

interface MobileHeaderBarProps {
  resolvedHeaderLogo: string | null;
  logoKey: string;
  onHomeClick?: () => void;
  wishlistBadgeCount: number;
  cartBadgeCount: number;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  onAccountClick?: () => void;
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  websiteConfig?: WebsiteConfig;
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
  onMenuOpen,
  onSearchOpen,
  websiteConfig
}) => (
  <header className="md:hidden bg-white px-3 py-2 border-b border-gray-100 shadow-sm sticky top-0 z-50">
    <div className="flex items-center justify-between gap-3">
      {/* Left: Menu and Logo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <button type="button" className="flex items-center" onClick={onHomeClick}>
          {resolvedHeaderLogo ? (
            <img
              key={logoKey}
              src={normalizeImageUrl(resolvedHeaderLogo)}
              alt={websiteConfig?.websiteName || 'Store logo'}
              width={120}
              height={32}
              className="h-8 max-w-[120px] object-contain"
            />
          ) : (
            <h1 className="text-lg font-black tracking-tight text-theme-primary">
              {websiteConfig?.websiteName || 'My Store'}
            </h1>
          )}
        </button>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          onClick={onSearchOpen}
          aria-label="Search"
        >
          <Search size={21} />
        </button>
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
  </header>
);