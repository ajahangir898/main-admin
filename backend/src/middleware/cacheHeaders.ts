/**
 * Cache Headers Middleware
 * Sets proper cache headers for Cloudflare and browser caching
 */
import { Request, Response, NextFunction } from 'express';

// Cache durations
const CACHE = {
  IMAGES: 31536000,     // 1 year for images (immutable content)
  STATIC: 31536000,     // 1 year for static assets
  API_DATA: 0,          // No cache for API data (real-time)
  HTML: 0,              // No cache for HTML
};

/**
 * Set image cache headers - 1 year max-age + CDN edge caching
 */
export const imageCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('CDN-Cache-Control', 'max-age=31536000'); // Cloudflare CDN
  res.setHeader('Cloudflare-CDN-Cache-Control', 'max-age=31536000'); // Cloudflare specific
  res.setHeader('Vary', 'Accept-Encoding');
  next();
};

/**
 * Set static asset cache headers
 */
export const staticCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  const ext = req.path.split('.').pop()?.toLowerCase();
  
  // Static assets (JS, CSS, fonts)
  if (['js', 'css', 'woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext || '')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control', 'max-age=31536000');
  }
  // Images
  else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico'].includes(ext || '')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control', 'max-age=31536000');
  }
  // HTML - no cache
  else if (['html', 'htm'].includes(ext || '') || !ext) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
  }
  
  next();
};

/**
 * API response cache headers - no cache for dynamic data
 */
export const apiCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Skip OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // For GET requests on specific cacheable endpoints
  if (req.method === 'GET') {
    // Cacheable API endpoints (tenant data that doesn't change frequently)
    const cacheablePatterns = [
      /^\/api\/tenant-data\/[^/]+$/,  // Tenant bootstrap data
      /^\/api\/tenants\/[^/]+$/,       // Tenant info
    ];
    
    const isCacheable = cacheablePatterns.some(pattern => pattern.test(req.path));
    
    if (isCacheable) {
      // Short cache for API data - 5 minutes
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
      res.setHeader('CDN-Cache-Control', 'max-age=300');
    } else {
      // No cache for real-time data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
  
  next();
};

export default {
  imageCacheHeaders,
  staticCacheHeaders,
  apiCacheHeaders,
};
