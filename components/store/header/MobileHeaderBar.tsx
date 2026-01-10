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
  <header className="md:hidden bg-white/95 backdrop-blur-md px-3 py-2.5 border-b border-gray-100/60 mobile-header-refined top-0 z-50">
    <div className="flex items-center justify-between gap-3">
      {/* Left: Menu and Logo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50/80 active:scale-95 transition-all duration-200 mobile-action-btn"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={21} strokeWidth={1.8} />
        </button>
        <button type="button" className="flex items-center group" onClick={onHomeClick}>
          {resolvedHeaderLogo ? (
            <img
              key={logoKey}
              src={normalizeImageUrl(resolvedHeaderLogo)}
              alt={websiteConfig?.websiteName || 'Store logo'}
              width={120}
              height={32}
              className="h-8 max-w-[120px] object-contain transition-all duration-300 group-active:scale-95"
            />
          ) : (
            <h1 className="text-lg font-black tracking-tight text-theme-primary transition-colors duration-300">
              {websiteConfig?.websiteName || 'My Store'}
            </h1>
          )}
        </button>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50/80 active:scale-95 transition-all duration-200 mobile-action-btn"
          onClick={onSearchOpen}
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.8} />
        </button>
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50/80 active:scale-95 transition-all duration-200 mobile-action-btn" 
          onClick={onWishlistOpen}
          aria-label="Wishlist"
        >
          <Heart size={20} strokeWidth={1.8} />
          {wishlistBadgeCount > 0 && (
            <span className="absolute top-1 right-1 bg-theme-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm store-badge-pulse">
              {wishlistBadgeCount > 9 ? '9+' : wishlistBadgeCount}
            </span>
          )}
        </button>
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50/80 active:scale-95 transition-all duration-200 mobile-action-btn" 
          onClick={onCartOpen}
          aria-label="Cart"
        >
          <ShoppingCart size={20} strokeWidth={1.8} />
          {cartBadgeCount > 0 && (
            <span className="absolute top-1 right-1 bg-theme-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm store-badge-pulse">
              {cartBadgeCount > 9 ? '9+' : cartBadgeCount}
            </span>
          )}
        </button>
        <button 
          type="button" 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50/80 active:scale-95 transition-all duration-200 mobile-action-btn" 
          onClick={onAccountClick}
          aria-label="Account"
        >
          <User size={20} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  </header>
);