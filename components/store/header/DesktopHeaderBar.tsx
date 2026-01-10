import React, { memo, useMemo } from 'react';
import { ShoppingCart, Heart, User, LogOut, ChevronDown, Truck, UserCircle } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { DesktopSearchBar } from './HeaderSearchBar';
import type { User as UserType, WebsiteConfig } from '../../../types';

interface DesktopHeaderBarProps {
  resolvedHeaderLogo: string | null;
  logoKey: string;
  onHomeClick?: () => void;
  searchProps: HeaderSearchProps;
  wishlistBadgeCount: number;
  cartBadgeCount: number;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  user?: UserType | null;
  onLoginClick?: () => void;
  onProfileClick?: () => void;
  onTrackOrder?: () => void;
  onLogoutClick?: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  categoriesList?: string[];
  onCategoriesClick?: () => void;
  onCategorySelect?: (category: string) => void;
  categoryMenuRef: React.RefObject<HTMLDivElement>;
  isCategoryMenuOpen: boolean;
  onCategoryMenuOpen: (open: boolean) => void;
  onProductsClick?: () => void;
  websiteConfig?: WebsiteConfig;
}

const Badge = memo<{ count: number }>(({ count }) => 
  count > 0 ? <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{count}</span> : null
);

export const DesktopHeaderBar = memo<DesktopHeaderBarProps>(({
  resolvedHeaderLogo, logoKey, onHomeClick, searchProps,
  wishlistBadgeCount, cartBadgeCount, onWishlistOpen, onCartOpen,
  user, onLoginClick, onProfileClick, onTrackOrder, onLogoutClick,
  isMenuOpen, onMenuToggle, onMenuClose, menuRef,
  categoriesList, onCategoriesClick, onCategorySelect,
  categoryMenuRef, isCategoryMenuOpen, onCategoryMenuOpen,
  onProductsClick, websiteConfig
}) => {
  const menuItems = useMemo(() => [
    { icon: <UserCircle size={16} />, label: 'My Profile', action: onProfileClick },
    { icon: <Truck size={16} />, label: 'My Orders', action: onTrackOrder },
    { icon: <LogOut size={16} />, label: 'Logout', action: onLogoutClick, danger: true }
  ], [onProfileClick, onTrackOrder, onLogoutClick]);

  const handleMenuClick = (action?: () => void) => { onMenuClose(); action?.(); };

  return (
    <header className="hidden md:block bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 store-header-modern">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
        {/* Logo */}
        <button type="button" className="flex items-center flex-shrink-0 group" onClick={onHomeClick}>
          {resolvedHeaderLogo ? (
            <img 
              key={logoKey} 
              src={normalizeImageUrl(resolvedHeaderLogo)} 
              alt={websiteConfig?.websiteName || 'Logo'} 
              width={192}
              height={48}
              className="h-10 md:h-12 object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110" 
            />
          ) : (
            <h2 className="text-2xl font-black tracking-tight text-theme-primary transition-all duration-300 group-hover:opacity-80">
              {websiteConfig?.websiteName || 'My Store'}
            </h2>
          )}
        </button>

        <DesktopSearchBar {...searchProps} />

        {/* Actions */}
        <div className="flex items-center gap-2 text-gray-600">
          {[
            { icon: <Heart size={20} strokeWidth={1.8} />, label: 'Wishlist', badge: wishlistBadgeCount, onClick: onWishlistOpen },
            { icon: <ShoppingCart size={20} strokeWidth={1.8} />, label: 'Cart', badge: cartBadgeCount, onClick: onCartOpen }
          ].map(({ icon, label, badge, onClick }) => (
            <button key={label} type="button" className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl hover:bg-gray-50/80 hover:text-theme-primary transition-all duration-300 group store-header-icon" onClick={onClick}>
              <div className="relative">
                {icon}
                <Badge count={badge} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-theme-primary transition-colors duration-300">{label}</span>
            </button>
          ))}

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button type="button" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-gray-50/80 hover:text-theme-primary transition-all duration-300 group store-header-icon" onClick={user ? onMenuToggle : onLoginClick}>
              <div className="bg-gradient-to-br from-theme-primary/10 to-theme-primary/5 p-2.5 rounded-full group-hover:from-theme-primary/15 group-hover:to-theme-primary/10 transition-all duration-300 group-hover:shadow-md">
                <User size={17} strokeWidth={1.8} className="text-theme-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user ? <>{user.name.split(' ')[0]} <ChevronDown size={14} className="inline ml-0.5 transition-transform duration-300 group-hover:translate-y-0.5" /></> : 'Login'}
              </span>
            </button>
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-56 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100/80 py-2 z-50 store-menu-dropdown">
                <div className="px-4 py-3.5 border-b border-gray-100/80 bg-gradient-to-r from-theme-primary/5 to-transparent rounded-t-2xl">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button key={label} type="button" onClick={() => handleMenuClick(action)} 
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all duration-200 ${danger ? 'text-red-600 hover:bg-red-50/80' : 'text-gray-700 hover:bg-gray-50/80 hover:text-theme-primary hover:translate-x-1'}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-100/60 store-nav-glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 py-1.5 text-sm font-medium text-gray-600 items-center">
          <button type="button" onClick={onHomeClick} className="px-4 py-2.5 rounded-xl hover:bg-white/80 hover:text-theme-primary hover:shadow-sm transition-all duration-300">Home</button>
          
          {websiteConfig?.showMobileHeaderCategory && (
            <div ref={categoryMenuRef} className="relative" onMouseEnter={() => onCategoryMenuOpen(true)} onMouseLeave={() => onCategoryMenuOpen(false)}>
              <button type="button" onClick={onCategoriesClick} className="px-4 py-2.5 rounded-xl hover:bg-white/80 hover:text-theme-primary hover:shadow-sm transition-all duration-300 flex items-center gap-1.5">
                Categories <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryMenuOpen && categoriesList?.length ? (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl border border-gray-100/80 bg-white/95 backdrop-blur-lg py-2 shadow-2xl z-50 store-menu-dropdown">
                  {categoriesList.map(cat => (
                    <button key={cat} type="button" onClick={() => { onCategorySelect?.(cat); onCategoryMenuOpen(false); }} 
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50/80 hover:text-theme-primary transition-all duration-200 hover:translate-x-1">{cat}</button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          
          <button type="button" onClick={onProductsClick} className="px-4 py-2.5 rounded-xl hover:bg-white/80 hover:text-theme-primary hover:shadow-sm transition-all duration-300">Products</button>
          <button type="button" onClick={onTrackOrder} className="px-4 py-2.5 rounded-xl hover:bg-white/80 hover:text-theme-primary hover:shadow-sm transition-all duration-300 flex items-center gap-2">
            <Truck size={15} strokeWidth={1.8} /> Track Order
          </button>
        </div>
      </nav>
    </header>
  );
});
// RR