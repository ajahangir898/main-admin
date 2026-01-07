import { useState, useRef, useEffect, memo } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  objectFit?: 'cover' | 'contain';
  onLoad?: () => void;
  onError?: () => void;
  rootMargin?: string;
  eager?: boolean;
}

const EMPTY =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const isDataUrl = (value: string | undefined | null): boolean =>
  !!value && value.trim().toLowerCase().startsWith('data:');

const isBlobUrl = (value: string | undefined | null): boolean =>
  !!value && value.trim().toLowerCase().startsWith('blob:');

const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;

  // Vitest runs in JSDOM where canvas.toDataURL may be unimplemented/noisy.
  // WebP support detection is a runtime optimization only; disable in tests.
  try {
    if ((import.meta as any)?.env?.MODE === 'test') return false;
  } catch {
    // ignore
  }

  try {
    const canvas = document.createElement('canvas');
    const dataUrl = canvas.toDataURL('image/webp');
    return typeof dataUrl === 'string' && dataUrl.includes('data:image/webp');
  } catch {
    return false;
  }
})();

const generateBlurPlaceholder = (s: string): string => {
  if (isDataUrl(s) || isBlobUrl(s)) return s.trim();
  if (s.includes('unsplash.com')) return s.replace(/w=\d+/, 'w=20').replace(/q=\d+/, 'q=10');
  if (s.includes('systemnextit.com')) return `${s}${s.includes('?') ? '&' : '?'}w=20&q=10`;
  return EMPTY;
};

const applyCDN = (url: string, w?: number) => {
  // Skip CDN for now - just return the original URL
  // CDN transformation was causing issues with some images
  return url;
};

const getOptimizedUrl = (src: string, w?: number): string => {
  if (!src) return EMPTY;
  if (isDataUrl(src) || isBlobUrl(src)) return src.trim();
  
  // Return the original URL without transformation
  // This fixes broken images that were showing placeholder
  return src.trim();
};

const generateSrcSet = (s: string): string => {
  // Disable srcset generation for now - it was causing issues
  return '';
};

const OptimizedImage = memo(
  ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    placeholder = 'empty',
    objectFit = 'cover',
    onLoad,
    onError,
    rootMargin = '400px',
    eager = false
  }: Props) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [fallback, setFallback] = useState(false);
    const [inView, setInView] = useState(priority || eager);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (priority || eager || inView) return;

      if (typeof IntersectionObserver === 'undefined') {
        setInView(true);
        return;
      }

      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        },
        { rootMargin, threshold: 0.01 }
      );

      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, [priority, eager, inView, rootMargin]);

    const handleLoad = () => {
      setLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      if (!fallback && src && !isDataUrl(src) && !isBlobUrl(src)) {
        setFallback(true);
        return;
      }
      setError(true);
      onError?.();
    };

    const rawSrc = src?.trim() || '';
    const optSrc = fallback ? rawSrc : getOptimizedUrl(rawSrc, width);
    const srcSet = fallback ? '' : generateSrcSet(rawSrc);
    const phSrc = placeholder === 'blur' ? generateBlurPlaceholder(rawSrc) : EMPTY;
    const sizes = width
      ? `(max-width: ${width}px) 100vw, ${width}px`
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

    if (error) {
      return (
        <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ width, height }}>
          <span className="text-gray-400 text-xs">Failed to load</span>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden ${className}`} ref={ref}>
        {!loaded && placeholder === 'blur' && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true" />
        )}

        {!loaded && placeholder === 'blur' && (
          <img
            src={phSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
            aria-hidden="true"
          />
        )}

        {!loaded && (placeholder === 'empty' || placeholder === 'skeleton') && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {inView && (
          <img
            src={optSrc}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={priority || eager ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full transition-opacity duration-300 ${
              objectFit === 'contain' ? 'object-contain' : 'object-cover'
            } ${loaded ? 'opacity-100' : 'opacity-0'}`}
            {...(priority ? ({ fetchpriority: 'high' } as any) : {})}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
export default OptimizedImage;
export { OptimizedImage, getOptimizedUrl, generateSrcSet };