import React, { Suspense, lazy } from 'react';
import type { Product } from '../../../types';
import type { CatalogGroup } from './headerTypes';

const CartModal = lazy(() => import('./CartModal'));
const WishlistModal = lazy(() => import('./WishlistModal'));
const MobileDrawer = lazy(() => import('./MobileDrawer'));

interface StoreHeaderModalsProps {
  onCartToggle: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
  catalogSource: Product[];
  cartItems: number[];
  wishlistItems: number[];
  isWishlistDrawerOpen: boolean;
  onWishlistClose: () => void;
  isCartDrawerOpen: boolean;
  onCartClose: () => void;
  onCheckoutFromCart: (productId: number) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  logo?: string | null;
  logoKey: string;
  catalogGroups: CatalogGroup[];
  activeCatalogSection: string;
  isCatalogDropdownOpen: boolean;
  onCatalogDropdownToggle: () => void;
  onCatalogSectionToggle: (key: string) => void;
  onCatalogItemClick: (item: string) => void;
  onTrackOrder?: () => void;
}

export const StoreHeaderModals: React.FC<StoreHeaderModalsProps> = ({
  onCartToggle,
  onWishlistToggle,
  catalogSource,
  cartItems,
  wishlistItems,
  isWishlistDrawerOpen,
  onWishlistClose,
  isCartDrawerOpen,
  onCartClose,
  onCheckoutFromCart,
  isMobileMenuOpen,
  onMobileMenuClose,
  logo,
  logoKey,
  catalogGroups,
  activeCatalogSection,
  isCatalogDropdownOpen,
  onCatalogDropdownToggle,
  onCatalogSectionToggle,
  onCatalogItemClick,
  onTrackOrder
}) => (
  <>
    {isWishlistDrawerOpen && (
      <Suspense fallback={null}>
        <WishlistModal
          isOpen={isWishlistDrawerOpen}
          onClose={onWishlistClose}
          wishlistItems={wishlistItems}
          catalogSource={catalogSource}
          onToggleWishlist={onWishlistToggle}
        />
      </Suspense>
    )}

    {isCartDrawerOpen && (
      <Suspense fallback={null}>
        <CartModal
          isOpen={isCartDrawerOpen}
          onClose={onCartClose}
          cartItems={cartItems}
          catalogSource={catalogSource}
          onToggleCart={onCartToggle}
          onCheckout={onCheckoutFromCart}
        />
      </Suspense>
    )}

    {isMobileMenuOpen && (
      <Suspense fallback={null}>
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={onMobileMenuClose}
          logo={logo}
          logoKey={logoKey}
          catalogGroups={catalogGroups}
          activeCatalogSection={activeCatalogSection}
          isCatalogDropdownOpen={isCatalogDropdownOpen}
          onCatalogDropdownToggle={onCatalogDropdownToggle}
          onCatalogSectionToggle={onCatalogSectionToggle}
          onCatalogItemClick={onCatalogItemClick}
          onTrackOrder={onTrackOrder}
        />
      </Suspense>
    )}
  </>
);