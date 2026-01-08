import { useMemo } from 'react';
import { 
  buildOptimizedUrl, 
  getWebPUrl, 
  getResponsiveSrcSet,
  ImageOptimizeOptions,
  ImageSize,
  getOptimizedImageUrl
} from '../utils/imageUrlHelper';

/**
 * Hook to get optimized image URLs with WebP support
 * 
 * Usage with preset size:
 * const { src, srcSet } = useOptimizedImage('/uploads/product.jpg', 'medium');
 * <img src={src} srcSet={srcSet} sizes="(max-width: 768px) 100vw, 400px" />
 * 
 * Usage with custom dimensions:
 * const { src, srcSet } = useOptimizedImage('/uploads/product.jpg', { width: 400, height: 300 });
 * <img src={src} srcSet={srcSet} />
 */
export function useOptimizedImage(
  url: string | undefined | null,
  options?: ImageOptimizeOptions | ImageSize
) {
  return useMemo(() => {
    if (!url) {
      return { src: '', srcSet: '', webp: '' };
    }

    // If options is a size preset string
    if (typeof options === 'string') {
      const src = getOptimizedImageUrl(url, options, 'webp');
      return {
        src,
        srcSet: getResponsiveSrcSet(url),
        webp: src,
      };
    }

    // Custom options
    const opts = options || {};
    const src = buildOptimizedUrl(url, { ...opts, format: opts.format || 'webp' });
    
    return {
      src,
      srcSet: getResponsiveSrcSet(url),
      webp: getWebPUrl(url, opts.width, opts.height, opts.quality),
    };
  }, [url, typeof options === 'string' ? options : JSON.stringify(options)]);
}

export default useOptimizedImage;
