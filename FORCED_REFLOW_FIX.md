# Forced Reflow Fix - Performance Optimization

## Problem
The application was experiencing forced reflows, which occur when JavaScript queries geometric properties (such as `offsetWidth`, `offsetHeight`, or `window.innerWidth`) after styles have been invalidated by DOM changes. This causes the browser to synchronously recalculate layout, resulting in poor performance.

### Affected Files
- `/assets/scheduler-CWG1rEj-.js` - 10ms reflow time
- `/assets/store-flashsalessection-DoEcsoJl.js` - 38ms reflow time
- Components reading `window.innerWidth`:
  - `FlashSalesSection.tsx`
  - `HeroSection.tsx`
  - `ProductGridSection.tsx`

## Solution

### 1. Viewport Helpers Utility (`utils/viewportHelpers.ts`)
Created a comprehensive utility module that prevents forced reflows by:

#### Core Features
- **Cached Viewport Dimensions**: Stores viewport width/height in memory to avoid repeated layout reads
- **RAF-based Updates**: Uses `requestAnimationFrame` to batch viewport dimension updates
- **Passive Event Listeners**: Improves scroll performance by using passive resize listeners
- **SSR-Safe**: Handles server-side rendering gracefully with sensible defaults

#### Functions
- `getViewportWidth()`: Returns cached viewport width
- `getViewportHeight()`: Returns cached viewport height
- `isMobileViewport()`: Check if viewport is mobile (<768px)
- `isTabletViewport()`: Check if viewport is tablet (768-1024px)
- `isDesktopViewport()`: Check if viewport is desktop (≥1024px)
- `isLargeDesktopViewport()`: Check if viewport is large desktop (≥1280px)

#### React Hooks
- `useViewportWidth()`: React hook for reactive viewport width tracking
- `useIsMobile()`: React hook for mobile viewport detection
- `useIsDesktop()`: React hook for desktop viewport detection

### 2. Component Updates

#### FlashSalesSection.tsx
**Before:**
```typescript
const initCount = () => Math.min(window.innerWidth >= 1024 ? 6 : 4, products.length);
```

**After:**
```typescript
import { getViewportWidth } from '../../utils/viewportHelpers';
const initCount = () => Math.min(getViewportWidth() >= 1024 ? 6 : 4, products.length);
```

#### HeroSection.tsx
**Before:**
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

**After:**
```typescript
import { useIsMobile } from '../../utils/viewportHelpers';
const isMobile = useIsMobile();
// No need for manual resize listener or useState!
```

#### ProductGridSection.tsx
**Before:**
```typescript
const w = window.innerWidth;
return w >= 1280 ? Math.min(8, t) : w >= 768 ? Math.min(6, t) : Math.min(4, t);
```

**After:**
```typescript
import { getViewportWidth } from '../../utils/viewportHelpers';
const w = getViewportWidth();
return w >= 1280 ? Math.min(8, t) : w >= 768 ? Math.min(6, t) : Math.min(4, t);
```

## Performance Benefits

### 1. Eliminates Forced Reflows
- No more synchronous layout recalculations when reading viewport dimensions
- Browser can optimize layout updates in its own rendering pipeline

### 2. Batched Updates with RAF
- All viewport dimension updates are batched in `requestAnimationFrame`
- Ensures updates happen at optimal times in the rendering cycle
- Reduces unnecessary recalculations during rapid resize events

### 3. Improved Code Simplicity
- React hooks reduce boilerplate code
- Centralized viewport logic in one utility module
- Easier to maintain and test

### 4. Better Scroll Performance
- Passive event listeners allow browser optimizations
- No blocking of main thread during scroll events

## Testing

A comprehensive test suite (`viewportHelpers.test.ts`) was created to ensure:
- Viewport dimensions are correctly cached
- React hooks update reactively on resize
- Breakpoint detection functions work correctly
- SSR scenarios are handled properly

## Metrics

### Before
- Total reflow time: ~48ms
- Multiple synchronous layout reads per component
- Potential layout thrashing during resize events

### After (Expected)
- Significantly reduced reflow time
- Single cached read per viewport access
- Batched updates during resize with RAF
- No layout thrashing

## Best Practices Going Forward

1. **Always use viewport helpers** instead of directly reading `window.innerWidth` or `window.innerHeight`
2. **Use React hooks** (`useIsMobile`, `useIsDesktop`) in React components for reactive viewport tracking
3. **Avoid reading layout properties** (offsetWidth, scrollHeight, etc.) immediately after DOM manipulation
4. **Batch layout reads** when multiple geometric queries are needed
5. **Use RAF** for any code that reads layout properties and performs animations

## References

- [Avoid forced synchronous layouts](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)
- [requestAnimationFrame for better performance](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Layout thrashing](https://kellegous.com/j/2013/01/26/layout-performance/)
