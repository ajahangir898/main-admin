/**
 * Enhanced UI/UX Components Integration Guide
 * 
 * This file demonstrates how to integrate all the enhanced UI components
 * into your existing e-commerce platform.
 */

import React, { useState } from 'react';
import { Product, Category, WebsiteConfig } from '../types';

// Import enhanced components
import EnhancedHeroSection from './EnhancedHeroSection';
import EnhancedProductCard from './EnhancedProductCard';
import { TrustBadges, ShippingCalculator } from './TrustBadges';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import StickyAddToCart from './StickyAddToCart';
import EnhancedCheckout from './EnhancedCheckout';
import OrderSuccessPage from './OrderSuccessPage';
import MegaMenu from './MegaMenu';
import {
  EnhancedProductCardSkeleton,
  EnhancedHeroSkeleton,
  ProductGridSkeleton,
  HeaderSkeleton
} from './EnhancedSkeletonLoaders';

// Import hooks
import { useCartAnimations, useColorTheme } from '../hooks/useEnhancedUI';

/**
 * INTEGRATION EXAMPLE 1: Enhanced Homepage with Hero Section
 * 
 * Replace your existing hero section with this enhanced version:
 */
export const EnhancedHomePage: React.FC<{
  websiteConfig?: WebsiteConfig;
  products: Product[];
  onProductClick: (product: Product) => void;
}> = ({ websiteConfig, products, onProductClick }) => {
  const { accentColor, setAccentColor } = useColorTheme(websiteConfig?.chatAccentColor);
  const { triggerBadgeBounce, badgeBouncing } = useCartAnimations();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <EnhancedHeroSection
        title="Discover Amazing Tech at Unbeatable Prices"
        subtitle="Shop the latest smartphones, gadgets, and accessories with free delivery and 7-day returns."
        badgeText="🎉 New Year Sale - Up to 50% OFF"
        ctaPrimaryText="Shop Now"
        ctaSecondaryText="View All Products"
        imageUrl="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
        features={['Free Shipping', '7-Day Returns', '100% Authentic']}
        accentColor={accentColor}
        onCtaPrimaryClick={() => {
          // Scroll to products section
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Product Grid with Enhanced Cards */}
      <div id="products" className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.slice(0, 10).map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onClick={onProductClick}
                onQuickView={(p) => console.log('Quick view:', p.name)}
                onAddToCart={(p) => {
                  console.log('Added to cart:', p.name);
                  triggerBadgeBounce();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * INTEGRATION EXAMPLE 2: Enhanced Product Detail Page
 * 
 * Use these components on your product detail page:
 */
export const EnhancedProductDetailPage: React.FC<{
  product: Product;
  relatedProducts: Product[];
  websiteConfig?: WebsiteConfig;
}> = ({ product, relatedProducts, websiteConfig }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { triggerBadgeBounce } = useCartAnimations();

  const handleAddToCart = () => {
    console.log('Add to cart:', product.name, quantity);
    triggerBadgeBounce();
  };

  const handleBuyNow = () => {
    console.log('Buy now:', product.name, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Images - Left */}
        <div className="lg:col-span-2">
          {/* Your existing image gallery */}
        </div>

        {/* Buy Box - Right */}
        <div>
          <div className="enhanced-buy-box">
            <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-purple-600">
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Trust Badges */}
            <TrustBadges variant="default" />

            {/* Shipping Calculator */}
            <ShippingCalculator onCalculate={(zip) => console.log('Calculate shipping for:', zip)} />

            {/* Add to Cart Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {relatedProducts.length > 0 && (
        <FrequentlyBoughtTogether
          mainProduct={product}
          suggestedProducts={relatedProducts.slice(0, 2)}
          onAddToCart={(products) => {
            console.log('Add bundle to cart:', products);
            triggerBadgeBounce();
          }}
        />
      )}

      {/* Sticky Add to Cart for Mobile */}
      <StickyAddToCart
        product={product}
        quantity={quantity}
        variant={selectedVariant}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        triggerOffset={600}
      />
    </div>
  );
};

/**
 * INTEGRATION EXAMPLE 3: Enhanced Checkout Flow
 * 
 * Replace your existing checkout page with this:
 */
export const EnhancedCheckoutPage: React.FC<{
  cartItems: Array<{ product: Product; quantity: number }>;
  websiteConfig?: WebsiteConfig;
  onOrderSuccess: (orderId: string) => void;
}> = ({ cartItems, websiteConfig, onOrderSuccess }) => {
  const handleCheckoutSubmit = (formData: any) => {
    console.log('Checkout submitted:', formData);
    // Process checkout and get order ID
    const orderId = 'ORD' + Date.now();
    onOrderSuccess(orderId);
  };

  return (
    <EnhancedCheckout
      cartItems={cartItems}
      onSubmit={handleCheckoutSubmit}
      accentColor={websiteConfig?.chatAccentColor}
    />
  );
};

/**
 * INTEGRATION EXAMPLE 4: Order Success Page
 * 
 * Show this after successful checkout:
 */
export const EnhancedOrderSuccessRoute: React.FC<{
  orderId: string;
  orderTotal: number;
  customerName: string;
  onContinueShopping: () => void;
  onTrackOrder: (orderId: string) => void;
}> = ({ orderId, orderTotal, customerName, onContinueShopping, onTrackOrder }) => {
  return (
    <OrderSuccessPage
      orderId={orderId}
      orderTotal={orderTotal}
      customerName={customerName}
      estimatedDelivery="3-5 business days"
      referralCode={`REF${orderId.slice(-6)}`}
      onContinueShopping={onContinueShopping}
      onTrackOrder={onTrackOrder}
    />
  );
};

/**
 * INTEGRATION EXAMPLE 5: Enhanced Header with Mega Menu
 * 
 * Add this to your StoreHeader component:
 */
export const EnhancedHeaderIntegration: React.FC<{
  categories: Category[];
  featuredProduct?: Product;
  onCategoryClick: (name: string) => void;
  onProductClick: (product: Product) => void;
}> = ({ categories, featuredProduct, onCategoryClick, onProductClick }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  return (
    <header className="enhanced-sticky-header">
      <div className="accent-bar" />
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold">Your Store</div>
            
            <button
              className="hidden md:block px-4 py-2 text-sm font-medium hover:text-purple-600 transition-colors"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              Categories
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Your existing header items */}
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      <div
        onMouseEnter={() => setIsMegaMenuOpen(true)}
        onMouseLeave={() => setIsMegaMenuOpen(false)}
      >
        <MegaMenu
          isOpen={isMegaMenuOpen}
          categories={categories}
          featuredProduct={featuredProduct}
          onCategoryClick={onCategoryClick}
          onProductClick={onProductClick}
          onClose={() => setIsMegaMenuOpen(false)}
        />
      </div>
    </header>
  );
};

/**
 * COLOR THEME INTEGRATION
 * 
 * To apply custom accent color from WebsiteConfig:
 */
export const useThemeIntegration = (websiteConfig?: WebsiteConfig) => {
  const { setAccentColor, applyColorTheme } = useColorTheme();

  React.useEffect(() => {
    if (websiteConfig?.chatAccentColor) {
      setAccentColor(websiteConfig.chatAccentColor);
      applyColorTheme();
    }
  }, [websiteConfig?.chatAccentColor, setAccentColor, applyColorTheme]);

  return { applyColorTheme };
};

/**
 * LOADING STATES
 * 
 * Use skeleton loaders while data is loading:
 */
export const LoadingStates = {
  hero: <EnhancedHeroSkeleton />,
  header: <HeaderSkeleton />,
  productCard: <EnhancedProductCardSkeleton />,
  productGrid: <ProductGridSkeleton count={8} />,
};

export default {
  EnhancedHomePage,
  EnhancedProductDetailPage,
  EnhancedCheckoutPage,
  EnhancedOrderSuccessRoute,
  EnhancedHeaderIntegration,
  useThemeIntegration,
  LoadingStates
};
