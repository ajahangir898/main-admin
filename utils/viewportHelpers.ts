/**
 * Viewport Helpers
 * Utilities to prevent forced reflows when reading viewport dimensions
 * Uses requestAnimationFrame to batch layout reads and avoid layout thrashing
 */

import { useState, useEffect } from 'react';

// Cache for viewport dimensions
let cachedViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
let cachedViewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
let rafId: number | null = null;

// Listeners to notify when viewport changes
const viewportChangeListeners = new Set<() => void>();

/**
 * Update cached viewport dimensions
 * Uses RAF to batch updates and prevent forced reflows
 * Note: Reading window.innerWidth/innerHeight in RAF is safe as we're doing
 * pure reads without interleaving writes, avoiding layout thrashing
 */
const updateViewportCache = () => {
  if (typeof window === 'undefined') return;
  
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  
  rafId = requestAnimationFrame(() => {
    // Read viewport dimensions - safe in RAF read phase
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    // Only update and notify if dimensions actually changed
    if (newWidth !== cachedViewportWidth || newHeight !== cachedViewportHeight) {
      cachedViewportWidth = newWidth;
      cachedViewportHeight = newHeight;
      
      // Notify all listeners after cache update (write phase)
      viewportChangeListeners.forEach(listener => listener());
    }
    
    rafId = null;
  });
};

/**
 * Get cached viewport width without causing a forced reflow
 * Returns the last known viewport width from cache
 */
export const getViewportWidth = (): number => {
  return cachedViewportWidth;
};

/**
 * Get cached viewport height without causing a forced reflow
 * Returns the last known viewport height from cache
 */
export const getViewportHeight = (): number => {
  return cachedViewportHeight;
};

/**
 * Check if viewport is mobile size (< 768px)
 */
export const isMobileViewport = (): boolean => {
  return getViewportWidth() < 768;
};

/**
 * Check if viewport is tablet size (>= 768px and < 1024px)
 */
export const isTabletViewport = (): boolean => {
  const width = getViewportWidth();
  return width >= 768 && width < 1024;
};

/**
 * Check if viewport is desktop size (>= 1024px)
 */
export const isDesktopViewport = (): boolean => {
  return getViewportWidth() >= 1024;
};

/**
 * Check if viewport is large desktop (>= 1280px)
 */
export const isLargeDesktopViewport = (): boolean => {
  return getViewportWidth() >= 1280;
};

/**
 * Initialize viewport tracking
 * Call this once at app startup to set up resize listener
 */
export const initViewportTracking = () => {
  if (typeof window === 'undefined') return;
  
  // Initial cache update
  updateViewportCache();
  
  // Update cache on resize with passive listener for better performance
  window.addEventListener('resize', updateViewportCache, { passive: true });
  
  // Update cache on orientation change
  window.addEventListener('orientationchange', updateViewportCache, { passive: true });
};

/**
 * Cleanup viewport tracking
 * Call this when unmounting the app
 */
export const cleanupViewportTracking = () => {
  if (typeof window === 'undefined') return;
  
  window.removeEventListener('resize', updateViewportCache);
  window.removeEventListener('orientationchange', updateViewportCache);
  
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  
  // Clear all listeners
  viewportChangeListeners.clear();
};

/**
 * React hook to track viewport width changes
 * Returns the current viewport width and updates on resize
 * Leverages the global cache to avoid redundant event listeners
 */
export const useViewportWidth = (): number => {
  if (typeof window === 'undefined') return 1024;
  
  // Use React's useState and useEffect for proper reactivity
  // Use function form to ensure we call getViewportWidth during initialization
  const [width, setWidth] = useState(() => getViewportWidth());
  
  useEffect(() => {
    const updateWidth = () => {
      const newWidth = getViewportWidth();
      // Only update if width has changed to avoid unnecessary re-renders
      setWidth(prevWidth => prevWidth !== newWidth ? newWidth : prevWidth);
    };
    
    // Subscribe to viewport changes via the global listener system
    viewportChangeListeners.add(updateWidth);
    
    return () => {
      // Unsubscribe on cleanup
      viewportChangeListeners.delete(updateWidth);
    };
  }, []);
  
  return width;
};

/**
 * React hook to check if viewport is mobile
 * Returns true if viewport width is less than 768px
 */
export const useIsMobile = (): boolean => {
  const width = useViewportWidth();
  return width < 768;
};

/**
 * React hook to check if viewport is desktop
 * Returns true if viewport width is >= 1024px
 */
export const useIsDesktop = (): boolean => {
  const width = useViewportWidth();
  return width >= 1024;
};

/**
 * Initialize viewport tracking on module load in browser environment
 * This is safe for most use cases. For more control, call initViewportTracking()
 * explicitly from your application entry point before rendering components.
 */
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid potential race conditions during module loading
  setTimeout(() => initViewportTracking(), 0);
}
