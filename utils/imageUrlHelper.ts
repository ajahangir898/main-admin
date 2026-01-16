/**
 * Normalizes image URLs to use current domain or production domain
 * Fixes legacy localhost URLs from development
 * OPTIMIZED: Serves images without query params for better Cloudflare CDN caching
 */
import { getCDNImageUrl, isCDNEnabled } from '../config/cdnConfig';

const getBaseUrl = (): string => {
  // In browser, use current origin for uploads to avoid CORS issues
  if (typeof window !== 'undefined') {
    // Get the backend API URL from environment or use current origin
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Validate URL format before using
    if (apiUrl && /^https?:\/\/.+/.test(apiUrl)) {
      return apiUrl;
    }
    // Use current origin for same-domain requests
    return window.location.origin;
  }
  // Fallback to production URL during SSR
  return 'https://systemnextit.com';
};

const PRODUCTION_URL = 'https://systemnextit.com';

// Image size presets for different use cases
export type ImageSize = 'thumb' | 'small' | 'medium' | 'large' | 'full';
export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'avif' | 'auto';

// DISABLED: Query params break Cloudflare CDN caching
// Images are served as-is for maximum CDN HIT rate
const IMAGE_SIZES: Record<ImageSize, { width: number; height?: number; quality: number }> = {
  thumb: { width: 150, height: 150, quality: 95 },
  small: { width: 300, height: 300, quality: 95 },
  medium: { width: 500, height: 500, quality: 95 },
  large: { width: 1000, height: 1000, quality: 98 },
  full: { width: 1600, quality: 100 },
};

const stripWrappingQuotes = (value: string): string => {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).trim();
  }
  return v;
};

const normalizeDataUrl = (value: string): string => {
  const v = stripWrappingQuotes(value);
  if (!v.toLowerCase().startsWith('data:')) return v;
  
  const match = v.match(/^data:([^,]*),(.*)$/s);
  if (!match) return v;

  const meta = match[1];
  const data = match[2];
  if (/;base64/i.test(meta)) {
    return `data:${meta},${data.replace(/\s+/g, '')}`;
  }
  return v;
};

export interface NormalizeImageUrlOptions {
  disableCDN?: boolean;
}

export const normalizeImageUrl = (url: string | undefined | null, options?: NormalizeImageUrlOptions): string => {
  if (!url) return '';

  const cleaned = stripWrappingQuotes(url);
  if (!cleaned) return '';

  // Data URIs and blob URLs should not be rewritten.
  if (cleaned.toLowerCase().startsWith('data:')) return normalizeDataUrl(cleaned);
  if (cleaned.toLowerCase().startsWith('blob:')) return cleaned;

  const cdnAllowed = !options?.disableCDN;

  // If CDN is enabled, prefer CDN URLs
  if (cdnAllowed && isCDNEnabled()) {
    if (cleaned.includes('cdn.systemnextit.com') || 
        cleaned.includes('images.systemnextit.com') || 
        cleaned.includes('static.systemnextit.com')) {
      return cleaned;
    }

    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      if (cleaned.includes('systemnextit.com') && cleaned.includes('/uploads')) {
        return getCDNImageUrl(cleaned);
      }
      return cleaned;
    }

    if (cleaned.startsWith('/uploads') || cleaned.startsWith('uploads/')) {
      return getCDNImageUrl(cleaned);
    }
  }

  // CDN disabled: fallback handling
  if (cleaned.includes('cdn.systemnextit.com')) {
    return cleaned.replace(/^https?:\/\/cdn\.systemnextit\.com/i, PRODUCTION_URL);
  }

  if (cleaned.includes('systemnextit.com')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('/uploads')) {
    return `${getBaseUrl()}${cleaned}`;
  }
  
  if (cleaned.startsWith('uploads/')) {
    return `${getBaseUrl()}/${cleaned}`;
  }
  
  if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
    const baseUrl = getBaseUrl();
    return cleaned.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, baseUrl);
  }
  
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  
  return cleaned;
};

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
}

/**
 * Build optimized image URL
 * SIMPLIFIED: Returns normalized URL without query params for Cloudflare CDN caching
 * Images are pre-optimized as WebP on upload, no runtime transformation needed
 */
export const buildOptimizedUrl = (
  url: string | undefined | null,
  options: ImageOptimizeOptions = {}
): string => {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl) return '';
  
  // Return as-is for data/blob URLs
  if (normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return normalizedUrl;
  }
  
  // Return normalized URL WITHOUT query params for CDN caching
  // This ensures cf-cache-status: HIT instead of DYNAMIC
  return normalizedUrl;
};

/**
 * Get WebP optimized image URL
 * SIMPLIFIED: Returns normalized URL for CDN caching
 */
export const getWebPUrl = (
  url: string | undefined | null,
  width?: number,
  height?: number,
  quality: number = 95
): string => {
  return normalizeImageUrl(url);
};

/**
 * Get responsive image srcset
 * SIMPLIFIED: Returns single URL for CDN caching efficiency
 */
export const getResponsiveSrcSet = (
  url: string | undefined | null,
  sizes: number[] = [320, 480, 720, 960, 1280]
): string => {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return '';
  }
  
  // Return single srcset entry for CDN caching
  // Browser handles responsive sizing via CSS
  return `${normalizedUrl} 1600w`;
};

/**
 * Get optimized image URL
 * SIMPLIFIED: Returns normalized URL without size params for CDN caching
 */
export const getOptimizedImageUrl = (
  url: string | undefined | null, 
  size: ImageSize = 'medium',
  format: ImageFormat = 'webp'
): string => {
  return normalizeImageUrl(url);
};

/**
 * Normalizes an array of image URLs
 */
export const normalizeImageUrls = (urls: (string | undefined | null)[] | undefined): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => normalizeImageUrl(url)).filter(Boolean);
};

/**
 * Get optimized image URLs array
 */
export const getOptimizedImageUrls = (
  urls: (string | undefined | null)[] | undefined,
  size: ImageSize = 'medium'
): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => normalizeImageUrl(url)).filter(Boolean);
};
