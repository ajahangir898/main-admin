/**
 * Normalizes image URLs to use current domain or production domain
 * Fixes legacy localhost URLs from development
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

const IMAGE_SIZES: Record<ImageSize, { width: number; quality: number }> = {
  thumb: { width: 100, quality: 60 },   // For tiny thumbnails
  small: { width: 200, quality: 70 },   // For cart items, lists
  medium: { width: 400, quality: 75 },  // For product cards
  large: { width: 800, quality: 80 },   // For product details
  full: { width: 1200, quality: 85 },   // For hero images
};

const stripWrappingQuotes = (value: string): string => {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).trim();
  }
  return v;
};

const normalizeDataUrl = (value: string): string => {
  // Keep non-data URLs untouched.
  const v = stripWrappingQuotes(value);
  if (!v.toLowerCase().startsWith('data:')) return v;

  // data:[<mediatype>][;base64],<data>
  // If base64, strip whitespace/newlines from the data payload.
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
  /**
   * When true, skips CDN rewriting and returns an origin/relative URL.
   * Useful when a component has its own CDN/fallback logic.
   */
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

  // If CDN is enabled, prefer CDN URLs and avoid downgrading them back to origin.
  if (cdnAllowed && isCDNEnabled()) {
    // If it's already a CDN URL, keep it.
    if (cleaned.includes('cdn.systemnextit.com') || cleaned.includes('images.systemnextit.com') || cleaned.includes('static.systemnextit.com')) {
      return cleaned;
    }

    // If it's a systemnextit.com upload URL, CDN-ify it.
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      if (cleaned.includes('systemnextit.com') && cleaned.includes('/uploads')) {
        return getCDNImageUrl(cleaned);
      }
      // External URL
      return cleaned;
    }

    // Relative upload paths should go through CDN.
    if (cleaned.startsWith('/uploads') || cleaned.startsWith('uploads/')) {
      return getCDNImageUrl(cleaned);
    }
  }

  // CDN disabled (or disabled for this call): Convert cdn.systemnextit.com URLs to production URL (fallback if CDN doesn't have files)
  if (cleaned.includes('cdn.systemnextit.com')) {
    return cleaned.replace(/^https?:\/\/cdn\.systemnextit\.com/i, PRODUCTION_URL);
  }

  // If it's already a full URL with systemnextit.com, keep it
  if (cleaned.includes('systemnextit.com')) {
    return cleaned;
  }
  
  // If it's a relative URL (starts with /uploads), prepend the base URL
  if (cleaned.startsWith('/uploads')) {
    return `${getBaseUrl()}${cleaned}`;
  }
  
  // Handle relative URLs without leading slash (e.g., uploads/...)
  if (cleaned.startsWith('uploads/')) {
    return `${getBaseUrl()}/${cleaned}`;
  }
  
  // If it's a localhost URL, replace with current origin or production
  if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
    const baseUrl = getBaseUrl();
    return cleaned.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, baseUrl);
  }
  
  // If it's already a full URL (http:// or https://), return as-is
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  
  // Return as-is if it doesn't match any pattern
  return cleaned;
};

/**
 * Get optimized image URL with size parameters
 * Falls back to original if optimization not available
 */
export const getOptimizedImageUrl = (
  url: string | undefined | null, 
  size: ImageSize = 'medium'
): string => {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl) return '';
  
  // For data URIs, return as-is
  if (normalizedUrl.startsWith('data:')) {
    return normalizedUrl;
  }
  
  // For external URLs (not on our domain), return as-is
  const baseUrl = getBaseUrl();
  if (!normalizedUrl.includes(baseUrl) && !normalizedUrl.includes(PRODUCTION_URL) && !normalizedUrl.includes('systemnextit.com')) {
    return normalizedUrl;
  }
  
  const { width, quality } = IMAGE_SIZES[size];
  
  // Add optimization params (will work if backend supports it)
  // Format: /uploads/image.jpg?w=400&q=75
  const separator = normalizedUrl.includes('?') ? '&' : '?';
  return `${normalizedUrl}${separator}w=${width}&q=${quality}`;
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
  return urls.map(url => getOptimizedImageUrl(url, size)).filter(Boolean);
};
