/**
 * Performance Optimization Utilities
 * Lazy loading, image optimization, and performance monitoring
 */

import React, { lazy, Suspense, ReactNode } from 'react';
import { getCDNImageUrl, isCDNEnabled, type ImageTransformOptions } from '../config/cdnConfig';

// Lazy load components for code splitting
export const lazyLoadComponent = (
  importStatement: () => Promise<{ default: React.ComponentType<any> }>,
  fallback: ReactNode | (() => React.ReactElement) | null = null
) => {
  const LazyComponent = lazy(importStatement);
  
  const FallbackComponent = () => 
    fallback ? (
      typeof fallback === 'function' ? fallback() : fallback
    ) : (
      React.createElement('div', { className: 'p-4 text-center text-gray-500' }, 'Loading...')
    );
  
  return (props: any) => 
    React.createElement(
      Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(LazyComponent, props)
    );
};

// Image optimization utility with CDN support
export const getOptimizedImageUrl = (
  imageUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number; // 1-100
    format?: 'webp' | 'jpg' | 'png' | 'avif' | 'jpeg' | 'auto';
    fit?: 'cover' | 'contain' | 'scale-down' | 'crop';
  }
): string => {
  if (!imageUrl) return '';
  
  // Convert options to CDN transform options format
  const transformOptions: ImageTransformOptions | undefined = options ? {
    width: options.width,
    height: options.height,
    quality: options.quality,
    format: options.format === 'jpg' ? 'jpeg' : options.format as ImageTransformOptions['format'],
    fit: options.fit,
  } : undefined;
  
  // Use CDN if enabled
  if (isCDNEnabled()) {
    return getCDNImageUrl(imageUrl, transformOptions);
  }
  
  // Fallback: For non-CDN URLs, add query parameters for server-side optimization
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Check if URL already has query parameters
    const hasQueryParams = imageUrl.includes('?');
    const params = new URLSearchParams();
    
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    if (options?.format) params.append('f', options.format);
    
    const queryString = params.toString();
    if (!queryString) return imageUrl;
    
    return `${imageUrl}${hasQueryParams ? '&' : '?'}${queryString}`;
  }
  
  // For relative paths, add query params for server-side optimization
  const params = new URLSearchParams();
  if (options?.width) params.append('w', options.width.toString());
  if (options?.height) params.append('h', options.height.toString());
  if (options?.quality) params.append('q', options.quality.toString());
  if (options?.format) params.append('f', options.format);
  
  const queryString = params.toString();
  return queryString ? `${imageUrl}?${queryString}` : imageUrl;
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  callback: (isVisible: boolean) => void,
  options?: IntersectionObserverInit
) => {
  React.useEffect(() => {
    if (!ref.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      callback(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, callback, options]);
};

// Debounce utility for API calls and event handlers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Virtual scrolling helper for long lists
export const calculateVisibleRange = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  buffer: number = 5
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(startIndex + visibleCount + buffer * 2);
  
  return { startIndex, endIndex, visibleCount };
};

// Memoization helper for expensive computations
export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};

// Request idle callback polyfill
export const scheduleIdleCallback = (callback: () => void, options?: { timeout?: number }) => {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }
  
  // Fallback to setTimeout
  const startTime = performance.now();
  return setTimeout(() => {
    const endTime = performance.now();
    callback();
  }, options?.timeout || 1);
};

// Performance monitoring
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;
  
  performance.mark(startMark);
  
  try {
    const result = await fn();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    throw error;
  }
};

// Prefetch resources (links, images)
export const prefetch = (url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch') => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  
  if (type === 'script') link.as = 'script';
  if (type === 'style') link.as = 'style';
  if (type === 'image') link.as = 'image';
  
  link.href = url;
  document.head.appendChild(link);
};

// Bundle size analyzer helper
export const analyzeComponentSize = (componentName: string, sizeInKB: number) => {
  const threshold = 50; // KB
  
  if (sizeInKB > threshold) {
    console.warn(
      `⚠️ ${componentName} is ${sizeInKB}KB, which exceeds the recommended threshold of ${threshold}KB. Consider lazy loading this component.`
    );
  }
};

// Export optimization recommendations
export const getOptimizationRecommendations = (): string[] => {
  const recommendations: string[] = [];
  
  // Check for large bundles
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const largeResources = resources.filter(r => r.transferSize && r.transferSize > 100000);
    
    if (largeResources.length > 0) {
      recommendations.push(`Found ${largeResources.length} resources larger than 100KB. Consider code splitting.`);
    }
  }
  
  return recommendations;
};
