import { useState, useCallback, useRef, useEffect, RefObject } from 'react';

interface CartAnimation {
  triggerBadgeBounce: () => void;
  triggerWishlistPop: () => void;
  triggerButtonClick: (elementId: string) => void;
  badgeBouncing: boolean;
  wishlistPopping: boolean;
}

export const useCartAnimations = (): CartAnimation => {
  const [badgeBouncing, setBadgeBouncing] = useState(false);
  const [wishlistPopping, setWishlistPopping] = useState(false);

  const triggerBadgeBounce = useCallback(() => {
    setBadgeBouncing(true);
    setTimeout(() => setBadgeBouncing(false), 500);
  }, []);

  const triggerWishlistPop = useCallback(() => {
    setWishlistPopping(true);
    setTimeout(() => setWishlistPopping(false), 600);
  }, []);

  const triggerButtonClick = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('button-click-scale');
      setTimeout(() => {
        element.classList.remove('button-click-scale');
      }, 300);
    }
  }, []);

  return {
    triggerBadgeBounce,
    triggerWishlistPop,
    triggerButtonClick,
    badgeBouncing,
    wishlistPopping
  };
};

interface ColorTheme {
  accentColor: string;
  setAccentColor: (color: string) => void;
  applyColorTheme: () => void;
}

// NOTE: This hook is deprecated in favor of the theme system in useThemeEffects
// The --store-accent-color variable is now automatically synced with the primary theme color
// Keep this for backward compatibility but it won't override the theme
export const useColorTheme = (initialColor: string = '#8b5cf6'): ColorTheme => {
  const [accentColor, setAccentColor] = useState(initialColor);

  const applyColorTheme = useCallback(() => {
    // DO NOT set --store-accent-color here as it's managed by useThemeEffects
    // This function is kept for backward compatibility
    console.warn('[useColorTheme] This hook is deprecated. Colors are managed by theme system.');
  }, []);

  // Don't apply on mount to avoid conflicts with theme system
  // useEffect(() => {
  //   applyColorTheme();
  // }, [applyColorTheme]);

  return {
    accentColor,
    setAccentColor,
    applyColorTheme
  };
};

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

interface StickyElement {
  isSticky: boolean;
  targetRef: RefObject<HTMLElement>;
}

export const useStickyElement = (offset: number = 0): StickyElement => {
  const [isSticky, setIsSticky] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= offset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);

  return { isSticky, targetRef };
};

interface ImagePreloader {
  preloadImages: (urls: string[]) => void;
  loadedImages: Set<string>;
}

export const useImagePreloader = (): ImagePreloader => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const preloadImages = useCallback((urls: string[]) => {
    urls.forEach(url => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
      };
      img.src = url;
    });
  }, []);

  return { preloadImages, loadedImages };
};

interface IntersectionObserverHook {
  isVisible: boolean;
  ref: RefObject<HTMLElement>;
}

export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): IntersectionObserverHook => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { isVisible, ref };
};

export default {
  useCartAnimations,
  useColorTheme,
  useStickyElement,
  useImagePreloader,
  useIntersectionObserver
};
