/**
 * AppRoutes.tsx - All view rendering logic extracted from App.tsx
 */
import React, { Suspense, lazy } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  ProductVariantSelection, LandingPage, FacebookPixelConfig, CourierConfig,
  Category, SubCategory, ChildCategory, Brand, Tag, User, ChatMessage
} from '../types';
import { SuperAdminDashboardSkeleton, StorePageSkeleton, ProductDetailSkeleton } from './SkeletonLoaders';
import { ensureVariantSelection } from '../utils/appHelpers';

// Lazy load pages
const StoreHome = lazy(() => import('../pages/StoreHome'));
const StoreProductDetail = lazy(() => import('../pages/StoreProductDetail'));
const StoreCheckout = lazy(() => import('../pages/StoreCheckout'));
const StoreOrderSuccess = lazy(() => import('../pages/StoreOrderSuccess'));
const StoreProfile = lazy(() => import('../pages/StoreProfile'));
const LandingPagePreview = lazy(() => import('../pages/LandingPagePreview'));
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdminDashboard'));
const AdminLogin = lazy(() => import('../pages/AdminLogin'));
const AdminAppWithAuth = lazy(() => import('../pages/AdminAppWithAuth'));
const MobileBottomNav = lazy(() => import('./store/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));
const StoreChatModal = lazy(() => import('./store/StoreChatModal').then(m => ({ default: m.StoreChatModal })));

interface AppRoutesProps {
  currentView: string;
  isSuperAdminSubdomain: boolean;
  
  // Data
  products: Product[];
  orders: Order[];
  logo: string | null;
  themeConfig: ThemeConfig | null;
  websiteConfig: WebsiteConfig | undefined;
  deliveryConfig: DeliveryConfig[];
  courierConfig: CourierConfig;
  facebookPixelConfig: FacebookPixelConfig;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  chatMessages: ChatMessage[];
  
  // User & Auth
  user: User | null;
  wishlist: number[];
  cartItems: any[];
  
  // Selected items
  selectedProduct: Product | null;
  selectedLandingPage: LandingPage | null;
  selectedVariant: ProductVariantSelection | null;
  checkoutQuantity: number;
  
  // Search
  storeSearchQuery: string;
  urlCategoryFilter: string | null;
  
  // Tenant
  activeTenantId: string;
  headerTenants: any[];
  isTenantSwitching: boolean;
  isTenantSeeding: boolean;
  deletingTenantId: string | null;
  
  // Chat state
  isChatOpen: boolean;
  isAdminChatOpen: boolean;
  hasUnreadChat: boolean;
  canAccessAdminChat: boolean;
  
  // Handlers
  onProductClick: (product: Product) => void;
  onQuickCheckout: (product: Product, quantity: number, variant?: ProductVariantSelection) => void;
  onToggleWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (email: string, password: string, name: string) => Promise<any>;
  onGoogleLogin: () => Promise<any>;
  onLogout: () => void;
  onUpdateProfile: (updates: Partial<User>) => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkDeleteProducts: (ids: number[]) => void;
  onBulkUpdateProducts: (ids: number[], updates: Partial<Product>) => void;
  onUpdateLogo: (logo: string | null) => void;
  onUpdateTheme: (config: ThemeConfig) => void;
  onUpdateWebsiteConfig: (config: WebsiteConfig) => void;
  onUpdateDeliveryConfig: (configs: DeliveryConfig[]) => void;
  onUpdateCourierConfig: (config: CourierConfig) => void;
  onPlaceOrder: (formData: any) => Promise<void>;
  onLandingOrderSubmit: (payload: any) => Promise<void>;
  onCloseLandingPreview: () => void;
  onTenantChange: (tenantId: string) => void;
  onCreateTenant: (payload: any, options?: { activate?: boolean }) => Promise<any>;
  onDeleteTenant: (tenantId: string) => Promise<void>;
  onRefreshTenants: () => Promise<void>;
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (category: string | null) => void;
  onMobileMenuOpenRef: (fn: () => void) => void;
  
  // Cart handlers
  onToggleCart: (product: Product, quantity: number, variant?: ProductVariantSelection) => void;
  onCheckoutFromCart: (productId: number) => void;
  onAddToCart: (product: Product, quantity: number, variant?: ProductVariantSelection, options?: { silent?: boolean }) => void;
  
  // Chat handlers
  onOpenChat: () => void;
  onCloseChat: () => void;
  onOpenAdminChat: () => void;
  onCloseAdminChat: () => void;
  onCustomerSendChat: (message: string) => void;
  onAdminSendChat: (message: string) => void;
  onEditChatMessage: (messageId: string, newText: string) => void;
  onDeleteChatMessage: (messageId: string) => void;
  
  // View setters
  setCurrentView: (view: string) => void;
  setUser: (user: User | null) => void;
  setIsLoginOpen: (open: boolean) => void;
  
  // Login modal
  isLoginOpen: boolean;
}

// Login Modal component (lazy loaded separately)
const LoginModal = lazy(() => import('./store/LoginModal').then(m => ({ default: m.LoginModal })));

export const AppRoutes: React.FC<AppRoutesProps> = (props) => {
  const {
    currentView,
    isSuperAdminSubdomain,
    products,
    orders,
    logo,
    themeConfig,
    websiteConfig,
    deliveryConfig,
    courierConfig,
    facebookPixelConfig,
    categories,
    subCategories,
    childCategories,
    brands,
    tags,
    chatMessages,
    user,
    wishlist,
    cartItems,
    selectedProduct,
    selectedLandingPage,
    selectedVariant,
    checkoutQuantity,
    storeSearchQuery,
    urlCategoryFilter,
    activeTenantId,
    headerTenants,
    isTenantSwitching,
    isTenantSeeding,
    deletingTenantId,
    isChatOpen,
    isAdminChatOpen,
    hasUnreadChat,
    canAccessAdminChat,
    onProductClick,
    onQuickCheckout,
    onToggleWishlist,
    isInWishlist,
    onLogin,
    onRegister,
    onGoogleLogin,
    onLogout,
    onUpdateProfile,
    onUpdateOrder,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
    onBulkDeleteProducts,
    onBulkUpdateProducts,
    onUpdateLogo,
    onUpdateTheme,
    onUpdateWebsiteConfig,
    onUpdateDeliveryConfig,
    onUpdateCourierConfig,
    onPlaceOrder,
    onLandingOrderSubmit,
    onCloseLandingPreview,
    onTenantChange,
    onCreateTenant,
    onDeleteTenant,
    onRefreshTenants,
    onSearchChange,
    onCategoryFilterChange,
    onMobileMenuOpenRef,
    onToggleCart,
    onCheckoutFromCart,
    onAddToCart,
    onOpenChat,
    onCloseChat,
    onOpenAdminChat,
    onCloseAdminChat,
    onCustomerSendChat,
    onAdminSendChat,
    onEditChatMessage,
    onDeleteChatMessage,
    setCurrentView,
    setUser,
    setIsLoginOpen,
    isLoginOpen,
  } = props;

  const mobileMenuOpenFnRef = React.useRef<(() => void) | null>(null);
  
  React.useEffect(() => {
    if (onMobileMenuOpenRef) {
      onMobileMenuOpenRef(() => mobileMenuOpenFnRef.current?.());
    }
  }, [onMobileMenuOpenRef]);

  return (
    <>
      {isLoginOpen && (
        <Suspense fallback={null}>
          <LoginModal
            onClose={() => setIsLoginOpen(false)}
            onLogin={onLogin}
            onRegister={onRegister}
            onGoogleLogin={onGoogleLogin}
          />
        </Suspense>
      )}

      {currentView === 'admin-login' ? (
        <Suspense fallback={null}>
          <AdminLogin
            onLoginSuccess={(loggedUser) => {
              setUser(loggedUser);
              if (loggedUser.role === 'super_admin' && isSuperAdminSubdomain) {
                setCurrentView('super-admin');
              } else {
                setCurrentView('admin');
              }
            }}
          />
        </Suspense>
      ) : currentView === 'super-admin' ? (
        <Suspense fallback={<SuperAdminDashboardSkeleton />}>
          <SuperAdminDashboard />
        </Suspense>
      ) : currentView === 'admin' ? (
        <Suspense fallback={null}>
          <AdminAppWithAuth
            activeTenantId={activeTenantId}
            tenants={headerTenants}
            orders={orders}
            products={products}
            logo={logo}
            themeConfig={themeConfig}
            websiteConfig={websiteConfig}
            deliveryConfig={deliveryConfig}
            courierConfig={courierConfig}
            facebookPixelConfig={facebookPixelConfig}
            chatMessages={chatMessages}
            parentUser={user}
            onLogout={onLogout}
            onUpdateOrder={onUpdateOrder}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            onBulkDeleteProducts={onBulkDeleteProducts}
            onBulkUpdateProducts={onBulkUpdateProducts}
            onUpdateLogo={onUpdateLogo}
            onUpdateTheme={onUpdateTheme}
            onUpdateWebsiteConfig={onUpdateWebsiteConfig}
            onUpdateDeliveryConfig={onUpdateDeliveryConfig}
            onUpdateCourierConfig={onUpdateCourierConfig}
            onUpdateProfile={onUpdateProfile}
            onTenantChange={onTenantChange}
            isTenantSwitching={isTenantSwitching}
            onSwitchToStore={() => setCurrentView('store')}
            onOpenAdminChat={onOpenAdminChat}
            hasUnreadChat={hasUnreadChat}
            onCreateTenant={onCreateTenant}
            onDeleteTenant={onDeleteTenant}
            onRefreshTenants={onRefreshTenants}
            isTenantCreating={isTenantSeeding}
            deletingTenantId={deletingTenantId}
          />
        </Suspense>
      ) : (
        <>
          {currentView === 'store' && (
            <Suspense fallback={<StorePageSkeleton />}>
              <>
                <StoreHome
                  products={products}
                  orders={orders}
                  tenantId={activeTenantId}
                  onProductClick={onProductClick}
                  onQuickCheckout={onQuickCheckout}
                  wishlistCount={wishlist.length}
                  wishlist={wishlist}
                  onToggleWishlist={(id) => onToggleWishlist(id)}
                  user={user}
                  onLoginClick={() => setIsLoginOpen(true)}
                  onLogoutClick={onLogout}
                  onProfileClick={() => setCurrentView('profile')}
                  logo={logo}
                  websiteConfig={websiteConfig}
                  searchValue={storeSearchQuery}
                  onSearchChange={onSearchChange}
                  onOpenChat={onOpenChat}
                  cart={cartItems}
                  onToggleCart={onToggleCart}
                  onCheckoutFromCart={onCheckoutFromCart}
                  onAddToCart={onAddToCart}
                  categories={categories}
                  subCategories={subCategories}
                  childCategories={childCategories}
                  brands={brands}
                  tags={tags}
                  initialCategoryFilter={urlCategoryFilter}
                  onCategoryFilterChange={onCategoryFilterChange}
                  onMobileMenuOpenRef={(fn) => { mobileMenuOpenFnRef.current = fn; }}
                />
                <MobileBottomNav
                  onHomeClick={() => { setCurrentView('store'); window.scrollTo(0, 0); }}
                  onCartClick={() => {}}
                  onAccountClick={() => user ? setCurrentView('profile') : setIsLoginOpen(true)}
                  onMenuClick={() => mobileMenuOpenFnRef.current?.()}
                  cartCount={cartItems.length}
                  websiteConfig={websiteConfig}
                  onChatClick={onOpenChat}
                  user={user}
                  onLogoutClick={onLogout}
                />
              </>
            </Suspense>
          )}

          {currentView === 'detail' && selectedProduct && (
            <Suspense fallback={<ProductDetailSkeleton />}>
              <StoreProductDetail
                product={selectedProduct}
                orders={orders}
                tenantId={activeTenantId}
                onBack={() => setCurrentView('store')}
                onProductClick={onProductClick}
                wishlistCount={wishlist.length}
                isWishlisted={isInWishlist(selectedProduct.id)}
                onToggleWishlist={() => onToggleWishlist(selectedProduct.id)}
                onCheckout={onQuickCheckout}
                user={user}
                onLoginClick={() => setIsLoginOpen(true)}
                onLogoutClick={onLogout}
                onProfileClick={() => setCurrentView('profile')}
                logo={logo}
                websiteConfig={websiteConfig}
                searchValue={storeSearchQuery}
                onSearchChange={onSearchChange}
                onOpenChat={onOpenChat}
                cart={cartItems}
                onToggleCart={onToggleCart}
                onCheckoutFromCart={onCheckoutFromCart}
                onAddToCart={(product, quantity, variant) => onAddToCart(product, quantity, variant, { silent: true })}
                productCatalog={products}
                categories={categories}
                onCategoryClick={onCategoryFilterChange}
              />
            </Suspense>
          )}

          {currentView === 'checkout' && selectedProduct && (
            <Suspense fallback={null}>
              <StoreCheckout
                product={selectedProduct}
                quantity={checkoutQuantity}
                variant={selectedVariant || ensureVariantSelection(selectedProduct)}
                onBack={() => setCurrentView('detail')}
                onConfirmOrder={onPlaceOrder}
                user={user}
                onLoginClick={() => setIsLoginOpen(true)}
                onLogoutClick={onLogout}
                onProfileClick={() => setCurrentView('profile')}
                logo={logo}
                websiteConfig={websiteConfig}
                deliveryConfigs={deliveryConfig}
                searchValue={storeSearchQuery}
                onSearchChange={onSearchChange}
                onOpenChat={onOpenChat}
                cart={cartItems}
                onToggleCart={onToggleCart}
                onCheckoutFromCart={onCheckoutFromCart}
                productCatalog={products}
                orders={orders}
              />
            </Suspense>
          )}

          {currentView === 'success' && (
            <Suspense fallback={null}>
              <StoreOrderSuccess
                onHome={() => setCurrentView('store')}
                user={user}
                onLoginClick={() => setIsLoginOpen(true)}
                onLogoutClick={onLogout}
                onProfileClick={() => setCurrentView('profile')}
                logo={logo}
                websiteConfig={websiteConfig}
                searchValue={storeSearchQuery}
                onSearchChange={onSearchChange}
                onOpenChat={onOpenChat}
                cart={cartItems}
                onToggleCart={onToggleCart}
                onCheckoutFromCart={onCheckoutFromCart}
                productCatalog={products}
                orders={orders}
              />
            </Suspense>
          )}

          {currentView === 'profile' && user && (
            <Suspense fallback={null}>
              <>
                <StoreProfile
                  user={user}
                  onUpdateProfile={onUpdateProfile}
                  orders={orders}
                  onHome={() => setCurrentView('store')}
                  onLoginClick={() => setIsLoginOpen(true)}
                  onLogoutClick={onLogout}
                  logo={logo}
                  websiteConfig={websiteConfig}
                  searchValue={storeSearchQuery}
                  onSearchChange={onSearchChange}
                  onOpenChat={onOpenChat}
                  cart={cartItems}
                  onToggleCart={onToggleCart}
                  onCheckoutFromCart={onCheckoutFromCart}
                  productCatalog={products}
                />
                <MobileBottomNav
                  onHomeClick={() => { setCurrentView('store'); window.scrollTo(0, 0); }}
                  onCartClick={() => {}}
                  onAccountClick={() => {}}
                  onMenuClick={() => mobileMenuOpenFnRef.current?.()}
                  cartCount={cartItems.length}
                  websiteConfig={websiteConfig}
                  onChatClick={onOpenChat}
                  user={user}
                  onLogoutClick={onLogout}
                  activeTab="account"
                />
              </>
            </Suspense>
          )}

          {currentView === 'landing_preview' && selectedLandingPage && (
            <Suspense fallback={null}>
              <LandingPagePreview
                page={selectedLandingPage}
                product={selectedLandingPage.productId ? products.find(p => p.id === selectedLandingPage.productId) : undefined}
                onBack={onCloseLandingPreview}
                onSubmitLandingOrder={onLandingOrderSubmit}
              />
            </Suspense>
          )}

          <StoreChatModal
            isOpen={isChatOpen}
            onClose={onCloseChat}
            websiteConfig={websiteConfig}
            themeConfig={themeConfig}
            user={user}
            messages={chatMessages}
            onSendMessage={onCustomerSendChat}
            context="customer"
            onEditMessage={onEditChatMessage}
            onDeleteMessage={onDeleteChatMessage}
          />
        </>
      )}

      {canAccessAdminChat && (
        <StoreChatModal
          isOpen={Boolean(isAdminChatOpen && currentView.startsWith('admin'))}
          onClose={onCloseAdminChat}
          websiteConfig={websiteConfig}
          themeConfig={themeConfig}
          user={user}
          messages={chatMessages}
          onSendMessage={onAdminSendChat}
          context="admin"
          onEditMessage={onEditChatMessage}
          onDeleteMessage={onDeleteChatMessage}
          canDeleteAll
        />
      )}
    </>
  );
};

export default AppRoutes;
