import React, { memo, useMemo } from 'react';
import { ShoppingCart, User, LogOut, ChevronDown, Truck, UserCircle, Search } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import type { HeaderSearchProps } from './headerTypes';
import { SimpleSearchBar } from './HeaderSearchBar';
import type { User as UserType, WebsiteConfig } from '../../../types';
import { TopBar } from './TopBar';

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
  count > 0 ? <span className="absolute -top-1.5 -right-1.5 bg-theme-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{count > 99 ? '99+' : count}</span> : null
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
    <>
      {/* Top utility bar */}
      <TopBar
        websiteConfig={websiteConfig}
        user={user}
        onWishlistClick={onWishlistOpen}
        onTrackOrderClick={onTrackOrder}
        onLoginClick={onLoginClick}
        wishlistCount={wishlistBadgeCount}
      />
      
      {/* Main header */}
      <header className="hidden md:block bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-8">
          {/* Logo */}
          <button type="button" className="flex items-center flex-shrink-0 group" onClick={onHomeClick}>
            {resolvedHeaderLogo ? (
              <img 
                key={logoKey} 
                src={normalizeImageUrl(resolvedHeaderLogo)} 
                alt={websiteConfig?.websiteName || 'Logo'} 
                width={180}
                height={50}
                className="h-12 md:h-14 object-contain transition-all duration-300 group-hover:scale-105" 
              />
            ) : (
              <h2 className="text-2xl font-black tracking-tight text-theme-primary transition-all duration-300 group-hover:opacity-80">
                {websiteConfig?.websiteName || 'My Store'}
              </h2>
            )}
          </button>

          {/* Search Bar - Clean CocoKids style */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder={searchProps.placeholder || "Search products..."}
                value={searchProps.value}
                onChange={(e) => searchProps.onChange(e.target.value)}
                onFocus={searchProps.onFocus}
                className="w-full h-12 pl-5 pr-14 rounded-lg border-2 border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 text-gray-700 placeholder-gray-400"
              />
              <button 
                type="button"
                className="absolute right-0 top-0 h-12 w-12 bg-theme-primary text-white rounded-r-lg flex items-center justify-center hover:brightness-110 transition-all"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Right Actions - Cart and Login */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button 
              type="button" 
              onClick={onCartOpen}
              className="relative flex items-center gap-2 text-gray-700 hover:text-theme-primary transition-colors"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                <Badge count={cartBadgeCount} />
              </div>
            </button>

            {/* User/Login */}
            <div className="relative" ref={menuRef}>
              <button 
                type="button" 
                onClick={user ? onMenuToggle : onLoginClick}
                className="flex items-center gap-2 text-gray-700 hover:text-theme-primary transition-colors"
              >
                <User size={24} strokeWidth={1.5} />
                <span className="text-sm font-medium">
                  {user ? user.name.split(' ')[0] : 'Login / SignUp'}
                </span>
              </button>
              
              {user && isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  {menuItems.map(({ icon, label, action, danger }) => (
                    <button 
                      key={label} 
                      type="button" 
                      onClick={() => handleMenuClick(action)} 
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50 hover:text-theme-primary'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
});

DesktopHeaderBar.displayName = 'DesktopHeaderBar';