# Enhanced UI/UX - Quick Reference Card

## 🚀 Quick Import Guide

```tsx
// Hero Section
import EnhancedHeroSection from './components/EnhancedHeroSection';

// Product Cards
import EnhancedProductCard from './components/EnhancedProductCard';

// Trust & Shipping
import { TrustBadges, ShippingCalculator } from './components/TrustBadges';

// Product Bundles
import FrequentlyBoughtTogether from './components/FrequentlyBoughtTogether';

// Mobile Sticky Cart
import StickyAddToCart from './components/StickyAddToCart';

// Checkout
import EnhancedCheckout from './components/EnhancedCheckout';

// Success Page
import OrderSuccessPage from './components/OrderSuccessPage';

// Navigation
import MegaMenu from './components/MegaMenu';

// Skeletons
import {
  EnhancedProductCardSkeleton,
  ProductGridSkeleton,
  EnhancedHeroSkeleton,
  HeaderSkeleton,
  EnhancedCheckoutSkeleton
} from './components/EnhancedSkeletonLoaders';

// Hooks
import {
  useCartAnimations,
  useColorTheme,
  useStickyElement,
  useIntersectionObserver
} from './hooks/useEnhancedUI';
```

## 🎨 Color Theme Setup

```tsx
// In your main App or StoreLayout component
import { useColorTheme } from './hooks/useEnhancedUI';

function App() {
  const { setAccentColor } = useColorTheme('#8b5cf6');
  
  useEffect(() => {
    // Update from WebsiteConfig
    if (websiteConfig?.chatAccentColor) {
      setAccentColor(websiteConfig.chatAccentColor);
    }
  }, [websiteConfig]);
}
```

## 💫 Micro-Interactions

```tsx
const { triggerBadgeBounce, triggerWishlistPop } = useCartAnimations();

// On add to cart
const handleAddToCart = (product) => {
  addToCart(product);
  triggerBadgeBounce(); // ✨
};

// On toggle wishlist
const handleWishlist = (productId) => {
  toggleWishlist(productId);
  triggerWishlistPop(); // ❤️
};
```

## 📦 Component Props Cheatsheet

### EnhancedHeroSection
```tsx
<EnhancedHeroSection
  title="Your Title"                    // Required
  subtitle="Your Subtitle"              // Required
  badgeText="🎉 New Sale"              // Optional
  ctaPrimaryText="Shop Now"             // Optional
  ctaSecondaryText="View Catalog"       // Optional
  imageUrl="https://..."                // Optional
  features={['Free Ship', '24/7']}      // Optional
  accentColor="#8b5cf6"                 // Optional
  onCtaPrimaryClick={() => {}}          // Optional
  onCtaSecondaryClick={() => {}}        // Optional
/>
```

### EnhancedProductCard
```tsx
<EnhancedProductCard
  product={product}                     // Required
  onClick={(p) => {}}                   // Required
  onQuickView={(p) => {}}              // Optional
  onAddToCart={(p) => {}}              // Optional
  onToggleWishlist={(id) => {}}        // Optional
  isWishlisted={false}                  // Optional
/>
```

### FrequentlyBoughtTogether
```tsx
<FrequentlyBoughtTogether
  mainProduct={product}                 // Required
  suggestedProducts={[p1, p2]}         // Required
  onAddToCart={(products) => {}}       // Optional
/>
```

### StickyAddToCart
```tsx
<StickyAddToCart
  product={product}                     // Required
  quantity={quantity}                   // Required
  variant={selectedVariant}             // Optional
  onAddToCart={() => {}}               // Required
  onBuyNow={() => {}}                  // Required
  onToggleWishlist={() => {}}          // Optional
  isWishlisted={false}                  // Optional
  triggerOffset={600}                   // Optional (px)
/>
```

### EnhancedCheckout
```tsx
<EnhancedCheckout
  cartItems={[                          // Required
    { product: p1, quantity: 2 },
    { product: p2, quantity: 1 }
  ]}
  onSubmit={(formData) => {}}          // Required
  accentColor="#8b5cf6"                 // Optional
/>
```

### OrderSuccessPage
```tsx
<OrderSuccessPage
  orderId="ORD123456"                   // Required
  orderTotal={5000}                     // Required
  customerName="John Doe"               // Required
  estimatedDelivery="3-5 days"          // Optional
  referralCode="REF123"                 // Optional
  onContinueShopping={() => {}}        // Optional
  onTrackOrder={(id) => {}}            // Optional
/>
```

### MegaMenu
```tsx
<MegaMenu
  isOpen={isOpen}                       // Required
  categories={categories}               // Optional
  featuredProduct={product}             // Optional
  onCategoryClick={(name) => {}}       // Optional
  onProductClick={(p) => {}}           // Optional
  onClose={() => {}}                   // Optional
/>
```

## 🎯 Common Use Cases

### Loading State
```tsx
{isLoading ? (
  <ProductGridSkeleton count={8} />
) : (
  <div className="grid grid-cols-4 gap-4">
    {products.map(p => <EnhancedProductCard key={p.id} product={p} />)}
  </div>
)}
```

### Sticky Header with Mega Menu
```tsx
const [isMegaOpen, setIsMegaOpen] = useState(false);

<header className="enhanced-sticky-header">
  <div className="accent-bar" />
  <nav onMouseEnter={() => setIsMegaOpen(true)}>
    <button>Categories</button>
  </nav>
  <MegaMenu 
    isOpen={isMegaOpen}
    onClose={() => setIsMegaOpen(false)}
  />
</header>
```

### Complete Product Detail Page
```tsx
<div>
  {/* Product Gallery */}
  <div className="enhanced-buy-box">
    <TrustBadges />
    <ShippingCalculator />
    {/* Variant selectors */}
    <button onClick={handleAddToCart}>Add to Cart</button>
  </div>
  
  <FrequentlyBoughtTogether
    mainProduct={product}
    suggestedProducts={related}
  />
  
  <StickyAddToCart
    product={product}
    quantity={quantity}
    onAddToCart={handleAddToCart}
    onBuyNow={handleBuyNow}
  />
</div>
```

## 🎨 CSS Classes Quick Reference

### Layout
- `.enhanced-sticky-header` - Sticky header with shadow
- `.enhanced-hero-section` - Hero container
- `.enhanced-buy-box` - Product buy box (sticky on desktop)
- `.enhanced-checkout-container` - Checkout page wrapper

### Product Cards
- `.enhanced-product-card` - Product card container
- `.enhanced-product-image-container` - Image wrapper
- `.enhanced-product-quick-actions` - Hover action buttons
- `.enhanced-product-quick-add` - Bottom slide button

### Checkout
- `.enhanced-checkout-progress` - Progress indicator
- `.enhanced-checkout-form` - Checkout form container
- `.enhanced-checkout-summary` - Order summary sidebar

### Animations
- `.cart-badge-bounce` - Badge bounce animation
- `.wishlist-heart-pop` - Heart pop animation
- `.button-click-scale` - Button click feedback
- `.enhanced-skeleton` - Skeleton loader wave

### Utilities
- `.enhanced-fbt-section` - Frequently Bought Together
- `.enhanced-trust-badges` - Trust badge grid
- `.enhanced-shipping-calculator` - Shipping widget
- `.enhanced-refer-widget` - Referral widget

## 📱 Responsive Classes

All components are responsive by default. Key breakpoints:

```css
/* Mobile: default */
/* Tablet: md: (768px) */
/* Desktop: lg: (1024px) */
```

Example:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* Cards */}
</div>
```

## ⚡ Performance Tips

1. **Lazy load components**:
```tsx
const EnhancedCheckout = lazy(() => import('./components/EnhancedCheckout'));
```

2. **Preload images**:
```tsx
const { preloadImages } = useImagePreloader();
useEffect(() => {
  preloadImages([img1, img2, img3]);
}, []);
```

3. **Use skeletons**:
```tsx
{isLoading ? <EnhancedHeroSkeleton /> : <EnhancedHeroSection />}
```

4. **Intersection observer**:
```tsx
const { isVisible, ref } = useIntersectionObserver();
<div ref={ref}>
  {isVisible && <ExpensiveComponent />}
</div>
```

## 🔧 Customization

### Change accent color globally
```tsx
document.documentElement.style.setProperty('--store-accent-color', '#FF5733');
```

### Override individual component colors
```tsx
<EnhancedHeroSection accentColor="#FF5733" />
<EnhancedCheckout accentColor="#FF5733" />
```

### Custom animations
Add to `enhanced-ui.css`:
```css
@keyframes my-animation {
  /* ... */
}
.my-element {
  animation: my-animation 1s ease;
}
```

## 🐛 Debugging

### Check if CSS loaded
```js
console.log(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--store-accent-color')
);
```

### Check animation state
```tsx
const { badgeBouncing } = useCartAnimations();
console.log('Badge bouncing:', badgeBouncing);
```

### Verify theme applied
```tsx
const { accentColor, applyColorTheme } = useColorTheme();
console.log('Current accent:', accentColor);
applyColorTheme(); // Force reapply
```

## 📚 Full Documentation

For complete guide, see:
- **`docs/ENHANCED_UI_GUIDE.md`** - Full implementation guide
- **`ENHANCED_UI_IMPLEMENTATION_SUMMARY.md`** - Summary & overview
- **`components/EnhancedUIIntegration.tsx`** - Code examples

---

**Quick Help**: Check browser console for errors, verify CSS is imported, test in incognito mode.
