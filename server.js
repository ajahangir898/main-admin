import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

// Cache durations
const ONE_YEAR = 31536000; // 1 year in seconds
const ONE_DAY = 86400; // 1 day in seconds
const ONE_WEEK = 604800; // 1 week in seconds

// Pre-cache templates in production for instant response
let cachedTemplate = null;
let criticalAssets = []; // Cache critical asset paths for Early Hints

// Set cache headers based on file type and whether it's hashed
const setCacheHeaders = (res, filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  
  // Check if file is in assets directory (Vite output) or has a content hash
  // Vite adds 8-character hashes like: filename.abc12345.js
  const isInAssets = normalizedPath.includes('/assets/');
  const hasHash = /\.[a-f0-9]{8}\.(js|css|woff2?|ttf|eot)$/i.test(filename);
  
  if (isInAssets || hasHash) {
    // Hashed assets: immutable, long cache (1 year)
    res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  } else if (['.js', '.css'].includes(ext)) {
    // Unhashed JS/CSS: short cache with revalidation
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`);
  } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'].includes(ext)) {
    // Images: moderate cache with revalidation
    res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK}, stale-while-revalidate=${ONE_YEAR}`);
  } else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    // Unhashed fonts: moderate cache with revalidation
    res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK}, stale-while-revalidate=${ONE_YEAR}`);
  } else if (['.json', '.xml', '.txt'].includes(ext)) {
    // Config/data files: short cache with revalidation
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`);
  } else {
    // Default: moderate cache
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}`);
  }
};

async function createServer() {
  const app = express();

  // Use aggressive compression for faster responses
  app.use(compression({ level: 6, threshold: 0 }));

  // Allow static assets to be requested cross-origin (e.g., static.* CDN subdomain)
  // This is required for ES module scripts when Vite `base` points to a different origin.
  app.use((req, res, next) => {
    const url = (req.url || '').toLowerCase();
    const isAssetRequest =
      url.startsWith('/assets/') ||
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.woff') ||
      url.endsWith('.woff2') ||
      url.endsWith('.ttf') ||
      url.endsWith('.eot') ||
      url.endsWith('.svg') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.webp') ||
      url.endsWith('.gif');

    if (isAssetRequest) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
      res.setHeader('Timing-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }

    next();
  });

  // Block access to sensitive files and directories
  app.use((req, res, next) => {
    const blocked = ['.git', '.env', '.htaccess', '.svn', 'wp-admin', 'wp-login', 'phpinfo', '.DS_Store'];
    const url = req.url.toLowerCase();
    if (blocked.some(b => url.includes(b))) {
      return res.status(404).end();
    }
    next();
  });

  let vite;
  if (!isProduction) {
    // Development: use Vite's dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    // Production: pre-cache template at startup
    cachedTemplate = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
    
    // Extract critical asset paths for Early Hints
    const modulePreloadRegex = /<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"[^>]*>/gi;
    const cssPreloadRegex = /<link[^>]+rel="preload"[^>]+href="([^"]+)"[^>]+as="style"[^>]*>/gi;
    let match;
    while ((match = modulePreloadRegex.exec(cachedTemplate)) !== null) {
      criticalAssets.push({ path: match[1], type: 'script' });
    }
    while ((match = cssPreloadRegex.exec(cachedTemplate)) !== null) {
      criticalAssets.push({ path: match[1], type: 'style' });
    }
    console.log(`📦 Cached ${criticalAssets.length} critical assets for Early Hints`);
    
    // Production: serve static files with optimized caching
    app.use(express.static(path.resolve(__dirname, 'dist/client'), {
      index: false,
      setHeaders: setCacheHeaders,
      maxAge: ONE_YEAR * 1000, // Express uses ms
      immutable: true
    }));
  }

  // Handle all routes - serve static HTML (no SSR to avoid hydration issues)
  app.use('*', async (req, res, next) => {
    try {
      let template;

      if (!isProduction) {
        // Development: read and transform HTML on the fly
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        // Production: use pre-cached template (zero I/O)
        template = cachedTemplate;
        
        // Send Early Hints (103) for critical resources - parallel preloading
        if (criticalAssets.length > 0 && res.writeEarlyHints) {
          const linkHeaders = criticalAssets.map(({ path, type }) => {
            if (type === 'script') {
              return `<${path}>; rel=modulepreload`;
            }
            return `<${path}>; rel=preload; as=style`;
          });
          res.writeEarlyHints({ link: linkHeaders });
        }
      }

      // Send static HTML - React will hydrate on client side
      res.status(200)
        .set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': isProduction ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400' : 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Vary': 'Accept-Encoding'
        })
        .end(template);
    } catch (e) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error('Server Error:', e.message);
      next(e);
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 SSR Server running at http://localhost:${port}`);
  });
}

createServer();
