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
    <header className="hidden md:block bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        {/* Logo */}
        <button type="button" className="flex items-center flex-shrink-0 group" onClick={onHomeClick}>
          {resolvedHeaderLogo ? (
            <img 
              key={logoKey} 
              src={normalizeImageUrl(resolvedHeaderLogo)} 
              alt="Logo" 
              width={192}
              height={48}
              className="h-10 md:h-12 object-contain transition-transform group-hover:scale-105" 
            />
          ) : (
            <h2 className="text-2xl font-black tracking-tight">
              <span className="text-theme-primary">YOUR</span>
              <span className="text-gray-800">SHOP</span>
            </h2>
          )}
        </button>

        <DesktopSearchBar {...searchProps} />

        {/* Actions */}
        <div className="flex items-center gap-4 text-gray-600">
          {[
            { icon: <Heart size={22} />, label: 'Wishlist', badge: wishlistBadgeCount, onClick: onWishlistOpen },
            { icon: <ShoppingCart size={22} />, label: 'Cart', badge: cartBadgeCount, onClick: onCartOpen }
          ].map(({ icon, label, badge, onClick }) => (
            <button key={label} type="button" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 hover:text-theme-primary transition-all group" onClick={onClick}>
              <div className="relative">
                {icon}
                <Badge count={badge} />
              </div>
              <span className="text-sm font-semibold group-hover:text-theme-primary">{label}</span>
            </button>
          ))}

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 hover:text-theme-primary transition-all group" onClick={user ? onMenuToggle : onLoginClick}>
              <div className="bg-gradient-to-br from-theme-primary/10 to-theme-primary/5 p-2 rounded-full group-hover:from-theme-primary/20 group-hover:to-theme-primary/10 transition-colors">
                <User size={18} className="text-theme-primary" />
              </div>
              <span className="text-sm font-semibold">
                {user ? <>{user.name.split(' ')[0]} <ChevronDown size={14} className="inline ml-0.5" /></> : 'Login'}
              </span>
            </button>
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-theme-primary/5 to-transparent">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                {menuItems.map(({ icon, label, action, danger }) => (
                  <button key={label} type="button" onClick={() => handleMenuClick(action)} 
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50 hover:text-theme-primary'}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-1 text-sm font-medium text-gray-700 items-center">
          <button type="button" onClick={onHomeClick} className="px-4 py-2 rounded-lg hover:bg-white hover:text-theme-primary hover:shadow-sm transition-all">Home</button>
          
          {websiteConfig?.showMobileHeaderCategory && (
            <div ref={categoryMenuRef} className="relative" onMouseEnter={() => onCategoryMenuOpen(true)} onMouseLeave={() => onCategoryMenuOpen(false)}>
              <button type="button" onClick={onCategoriesClick} className="px-4 py-2 rounded-lg hover:bg-white hover:text-theme-primary hover:shadow-sm transition-all flex items-center gap-1">
                Categories <ChevronDown size={14} className={`transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryMenuOpen && categoriesList?.length ? (
                <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {categoriesList.map(cat => (
                    <button key={cat} type="button" onClick={() => { onCategorySelect?.(cat); onCategoryMenuOpen(false); }} 
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 hover:text-theme-primary transition-colors">{cat}</button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          
          <button type="button" onClick={onProductsClick} className="px-4 py-2 rounded-lg hover:bg-white hover:text-theme-primary hover:shadow-sm transition-all">Products</button>
          <button type="button" onClick={onTrackOrder} className="px-4 py-2 rounded-lg hover:bg-white hover:text-theme-primary hover:shadow-sm transition-all flex items-center gap-1.5">
            <Truck size={16} /> Track Order
          </button>
        </div>
      </nav>
    </header>
  );
});
// RR