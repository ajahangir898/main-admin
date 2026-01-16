/**
 * Advanced Performance Optimization Utilities
 * Image optimization, virtual scrolling, code splitting, and caching strategies
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  lazy?: boolean;
}

export const optimizeImage = (
  imageUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!imageUrl) return '';
  
  // For local URLs, suggest WebP format
  if (!imageUrl.startsWith('http')) {
    return imageUrl.replace(/\.(jpg|png)$/i, '.webp');
  }

  const params = new URLSearchParams();
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', Math.min(100, options.quality).toString());
  
  // Auto-detect format based on browser capabilities
  const format = options.format || 'auto';
  if (format !== 'auto') params.append('fm', format);

  return `${imageUrl}${params.toString() ? '?' + params.toString() : ''}`;
};

// ============================================================================
// VIRTUAL SCROLLING UTILITIES
// ============================================================================

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export const calculateVirtualScrollRange = (
  scrollTop: number,
  options: VirtualScrollOptions
) => {
  const { itemHeight, containerHeight, buffer = 5 } = options;
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = startIndex + visibleCount + buffer * 2;

  return { startIndex, endIndex, visibleCount };
};

export const useVirtualScroll = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrollTop(containerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    const { startIndex, endIndex } = calculateVirtualScrollRange(scrollTop, {
      itemHeight,
      containerHeight,
    });
    
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [scrollTop, items, itemHeight, containerHeight]);

  return {
    visibleItems,
    containerRef,
    onScroll: handleScroll,
    totalHeight: items.length * itemHeight,
  };
};

// ============================================================================
// CODE SPLITTING & LAZY LOADING
// ============================================================================

export const lazyLoadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
};

export const prefetchImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

export const preloadScript = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
};

// ============================================================================
// MEMOIZATION & CACHING
// ============================================================================

export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, value: any) {
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl / 1000,
    };
  }
}

// Global cache instance for products
export const productCache = new CacheManager(600); // 10 minutes

// ============================================================================
// REQUEST BATCHING
// ============================================================================

export class RequestBatcher {
  private queue: Array<{ id: string; fn: () => Promise<any>; resolve: Function; reject: Function }> = [];
  private processing = false;
  private readonly batchSize: number;
  private readonly delayMs: number;

  constructor(batchSize: number = 10, delayMs: number = 100) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
  }

  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, fn, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.processing) {
        setTimeout(() => this.processBatch(), this.delayMs);
      }
    });
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    for (const { fn, resolve, reject } of batch) {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
    
    if (this.queue.length > 0) {
      setTimeout(() => this.processBatch(), this.delayMs);
    }
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string, endMark?: string) {
    const startTime = startMark ? this.marks.get(startMark) : undefined;
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (!startTime || !endTime) return 0;

    const duration = endTime - startTime;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    
    this.measures.get(name)!.push(duration);
    return duration;
  }

  getStats(name: string) {
    const values = this.measures.get(name) || [];
    if (values.length === 0) return null;

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      total: values.reduce((a, b) => a + b, 0),
    };
  }

  clear(name?: string) {
    if (name) {
      this.marks.delete(name);
      this.measures.delete(name);
    } else {
      this.marks.clear();
      this.measures.clear();
    }
  }
}

export const globalMonitor = new PerformanceMonitor();

// ============================================================================
// WEB WORKERS FOR HEAVY COMPUTATIONS
// ============================================================================

export const runInWorker = async (computation: string, data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const result = (${computation})(e.data);
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      if (e.data.success) {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(data);
  });
};

// ============================================================================
// LAZY IMAGE COMPONENT
// ============================================================================

// Image size presets
type ImageSize = 'thumb' | 'small' | 'medium' | 'large' | 'full';
const IMAGE_SIZES: Record<ImageSize, { width: number; quality: number }> = {
  thumb: { width: 100, quality: 58 },
  small: { width: 200, quality: 68 },
  medium: { width: 400, quality: 72 },
  large: { width: 720, quality: 70 },
  full: { width: 1100, quality: 78 },
};

// Placeholder SVG
const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f3f4f6" width="1" height="1"/%3E%3C/svg%3E';

export const LazyImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  size?: ImageSize;
  priority?: boolean;
  optimizationOptions?: ImageOptimizationOptions;
  imgClassName?: string;
  aspectRatio?: string; // e.g., '4/3', '1/1', '16/9'
}> = ({ src, alt, width, height, className = '', size = 'medium', priority = false, imgClassName, aspectRatio }) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(priority);
  
  // Calculate aspect ratio style for CLS prevention
  const containerStyle: React.CSSProperties = aspectRatio ? { aspectRatio } : {};

  // Simple intersection observer - trigger load well before viewport for smooth UX
  useEffect(() => {
    if (priority || shouldRender) return;
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px', threshold: 0 } // Increased for smoother scrolling
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, shouldRender]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-gray-100 ${className}`} style={containerStyle}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      
      {shouldRender && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width || IMAGE_SIZES[size].width}
          height={height || (width ? Math.round(width * 0.75) : Math.round(IMAGE_SIZES[size].width * 0.75))}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // @ts-expect-error React doesn't recognize fetchpriority yet
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${imgClassName || 'w-full h-full object-cover'} transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BUNDLE ANALYSIS HELPERS
// ============================================================================

export const analyzeBundle = () => {
  if (typeof performance === 'undefined') return null;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const stats = {
    totalSize: 0,
    totalTime: 0,
    resources: resources
      .filter(r => r.initiatorType === 'script' || r.initiatorType === 'link')
      .map(r => ({
        name: r.name.split('/').pop(),
        size: r.transferSize || 0,
        time: r.duration,
      }))
      .sort((a, b) => b.size - a.size),
  };

  stats.totalSize = stats.resources.reduce((sum, r) => sum + r.size, 0);
  stats.totalTime = stats.resources.reduce((sum, r) => sum + r.time, 0);

  return stats;
};

// ============================================================================
// EXPORT DEFAULT UTILITIES OBJECT
// ============================================================================

export const PerformanceUtils = {
  optimizeImage,
  calculateVirtualScrollRange,
  useVirtualScroll,
  lazyLoadImage,
  prefetchImage,
  preloadScript,
  CacheManager,
  RequestBatcher,
  PerformanceMonitor,
  globalMonitor,
  productCache,
  runInWorker,
  LazyImage,
  analyzeBundle,
};

export default PerformanceUtils;
