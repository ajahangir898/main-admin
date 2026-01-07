import path from 'path';
import { defineConfig, loadEnv, splitVendorChunkPlugin, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const toPosixPath = (id: string) => id.split('\\').join('/');

// Critical chunks that should be modulepreloaded for parallel loading
// Priority order matters - these will load in parallel instead of sequentially
// Keep this list MINIMAL - only truly critical above-the-fold chunks
const CRITICAL_JS_CHUNKS = [
  // Core React chunks - required for any rendering
  'react-dom',
  'react-core', 
  'scheduler',
  'react-jsx-runtime',
  // App entry chunks ONLY
  'index-',
  'App-',
  // Store home critical path ONLY - minimal set for storefront
  'page-storehome',
  'store-core',
  'store-header'
  // NOTE: Admin, SuperAdmin, Registration pages are NOT preloaded
  // They load on-demand when user navigates to those routes
];

// Critical CSS patterns for preloading (ordered by priority)
const CRITICAL_CSS_PATTERNS = [
  { pattern: 'tailwind-', priority: 1 }  // Tailwind CSS only - highest priority
  // REMOVED: cmp-storeheader CSS - not critical for first paint
];

/**
 * Vite plugin to optimize critical request chains by:
 * 1. Injecting modulepreload hints for parallel JS loading
 * 2. Preloading CSS for faster styling
 * 3. Converting non-critical CSS to non-render-blocking
 * This dramatically reduces sequential loading waterfall
 */
function criticalPreloadPlugin(): Plugin {
  let resolvedBase = '/';

  return {
    name: 'critical-preload',
    enforce: 'post',
    configResolved(config) {
      const base = config.base || '/';
      resolvedBase = base.endsWith('/') ? base : `${base}/`;
    },
    transformIndexHtml(html, ctx) {
      // Only process in build mode
      if (!ctx.bundle) return html;

      // Collect CSS files and JS modulepreloads
      const cssFiles: Array<{ fileName: string; priority: number }> = [];
      const modulepreloadLinks: string[] = [];
      const allJsChunks: string[] = [];

      // Find critical assets from the bundle
      for (const [fileName, chunk] of Object.entries(ctx.bundle) as [string, { type: string; code?: string }][]) {
        // Collect main CSS files
        if (fileName.endsWith('.css')) {
          const matchedPattern = CRITICAL_CSS_PATTERNS.find(p => fileName.includes(p.pattern));
          if (matchedPattern) {
            cssFiles.push({
              fileName,
              priority: matchedPattern.priority
            });
          }
        }
        
        // Modulepreload critical JS chunks for parallel loading
        if (fileName.endsWith('.js') && 'code' in chunk) {
          allJsChunks.push(fileName);
          if (CRITICAL_JS_CHUNKS.some(name => fileName.includes(name))) {
            // Add fetchpriority="high" for critical chunks
            modulepreloadLinks.push(`<link rel="modulepreload" href="${resolvedBase}${fileName}" fetchpriority="high" crossorigin />`);
          }
        }
      }

      // Sort CSS files by priority
      cssFiles.sort((a, b) => a.priority - b.priority);

      // Create preload hints for CSS with crossorigin for subdomain support
      const cssPreloads = cssFiles.map(({ fileName }) => 
        `<link rel="preload" href="${resolvedBase}${fileName}" as="style" fetchpriority="high" crossorigin />`
      ).join('\n    ');

      const allPreloads = [cssPreloads, ...modulepreloadLinks].filter(Boolean).join('\n    ');
      
      if (allPreloads) {
        html = html.replace(
          /<head>/i,
          `<head>\n    <!-- Critical resource preloads for parallel loading -->\n    ${allPreloads}`
        );
      }

      // Convert CSS stylesheet links to non-render-blocking using media="print" pattern
      // This defers CSS loading without blocking first paint
      for (const { fileName } of cssFiles) {
        const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cssLinkRegex = new RegExp(
          `<link[^>]*href="[^"]*${escapedFileName}"[^>]*rel="stylesheet"[^>]*>|` +
          `<link[^>]*rel="stylesheet"[^>]*href="[^"]*${escapedFileName}"[^>]*>`,
          'gi'
        );
        
        html = html.replace(cssLinkRegex, (match) => {
          // Skip if already has media attribute or onload
          if (match.includes('media=') || match.includes('onload=')) {
            return match;
          }
          // Convert to non-render-blocking CSS using media="print" pattern
          // This loads CSS asynchronously and switches to media="all" when loaded
          const deferredCss = match
            .replace('rel="stylesheet"', 'rel="stylesheet" media="print" onload="this.media=\'all\'"');
          // Add noscript fallback for users without JavaScript
          const noscriptFallback = `<noscript>${match}</noscript>`;
          return `${deferredCss}\n    ${noscriptFallback}`;
        });
      }

      return html;
    }
  };
}

const vendorChunkMatchers = [
  { name: 'react-dom', matcher: /node_modules\/react-dom\// },
  { name: 'react-jsx-runtime', matcher: /node_modules\/react\/jsx-runtime/ },
  { name: 'react-core', matcher: /node_modules\/react\// },
  { name: 'scheduler', matcher: /node_modules\/scheduler\// },
  // Split heavy dependencies into separate chunks for better caching
  { name: 'pkg-toast', matcher: /node_modules\/react-hot-toast\// },
  { name: 'pkg-socket', matcher: /node_modules\/socket\.io/ },
  { name: 'icons-chunk', matcher: /node_modules\/lucide-react\// }
];

const resolveRechartsChunk = (normalized: string) => {
  if (!normalized.includes('node_modules/recharts/')) return undefined;

  const segment = normalized.split('node_modules/recharts/')[1] || '';
  const parts = segment.split('/').filter(Boolean);

  // Typical path looks like: es6/chart/LineChart.js
  const top = parts[0] || 'core';
  const area = parts[1] || 'core';
  const file = parts[2] || '';
  const baseName = file.replace(/\.(mjs|cjs|js|ts)$/, '').toLowerCase().replace(/\W+/g, '-');

  if (top === 'es6' && (area === 'chart' || area === 'component' || area === 'container')) {
    return `recharts-${area}-${baseName || 'index'}`;
  }

  // Coarser split for other areas (cartesian/polar/shape/util/etc.)
  return `recharts-${top}-${area}`.replace(/\W+/g, '-');
};

const manualChunkResolver = (id: string): string | undefined => {
  const normalized = toPosixPath(id);

  if (normalized.includes('node_modules')) {
    const rechartsChunk = resolveRechartsChunk(normalized);
    if (rechartsChunk) return rechartsChunk;

    const vendorMatch = vendorChunkMatchers.find(({ matcher }) => matcher.test(normalized));
    if (vendorMatch) return vendorMatch.name;

    const pkgName = normalized.match(/node_modules\/([^/]+)/)?.[1];
    if (pkgName?.startsWith('@')) {
      const scoped = normalized.match(/node_modules\/(@[^/]+\/[^/]+)/)?.[1];
      if (scoped) return `pkg-${scoped.replace(/[\/]/g, '-')}`;
    }
    if (pkgName) return `pkg-${pkgName}`;
    return 'vendor';
  }

  if (normalized.includes('/pages/')) {
    const segment = normalized.split('/pages/')[1];
    if (segment) {
      const pageName = segment.split('/')[0].replace(/\W+/g, '-').toLowerCase();
      
      // === STOREFRONT PAGES - Isolated chunks for shop loading ===
      // StoreHome - main storefront, loads only when visiting shop
      if (pageName === 'storehome-tsx' || pageName === 'storehome') {
        return 'page-storehome';
      }
      // Store product detail - loads only when viewing a product
      if (pageName === 'storeproductdetail-tsx' || pageName === 'storeproductdetail') {
        return 'page-storeproductdetail';
      }
      // Store checkout - loads only during checkout
      if (pageName === 'storecheckout-tsx' || pageName === 'storecheckout') {
        return 'page-storecheckout';
      }
      // Store order success - loads after order completion
      if (pageName === 'storeordersuccess-tsx' || pageName === 'storeordersuccess') {
        return 'page-storeordersuccess';
      }
      // Store profile - user profile page
      if (pageName === 'storeprofile-tsx' || pageName === 'storeprofile') {
        return 'page-storeprofile';
      }
      
      // === OTHER ISOLATED PAGES ===
      // ImageSearch/Visual Search - isolated chunk
      if (pageName === 'imagesearch-tsx' || pageName === 'imagesearch') {
        return 'page-visual-search';
      }
      // TenantRegistration - isolated chunk, only loaded when navigating to /register
      if (pageName === 'tenantregistration-tsx' || pageName === 'tenantregistration') {
        return 'page-tenant-registration';
      }
      // Landing page preview - isolated
      if (pageName === 'landingpagepreview-tsx' || pageName === 'landingpagepreview') {
        return 'page-landingpreview';
      }
      // SuperAdmin dashboard - isolated
      if (pageName === 'superadmindashboard-tsx' || pageName === 'superadmindashboard') {
        return 'page-superadmin';
      }
      // Admin login - isolated
      if (pageName === 'adminlogin-tsx' || pageName === 'adminlogin') {
        return 'page-adminlogin';
      }
      
      // === ADMIN PAGES - Group together ===
      if (pageName.startsWith('admin')) {
        return 'page-admin';
      }
      
      return `page-${pageName}`;
    }
  }

  // Visual search service should be in the same chunk as ImageSearch
  if (normalized.includes('/services/visualSearchService')) {
    return 'page-visual-search';
  }

  // === STORE COMPONENTS - Isolated for storefront loading ===
  // These components are ONLY loaded when visiting shop/storefront
  if (normalized.includes('/components/store/')) {
    const segment = normalized.split('/components/store/')[1];
    if (segment) {
      const componentName = segment.split('/')[0].replace(/\.(tsx|ts|jsx|js)$/, '').toLowerCase();
      
      // Core storefront components - loaded with StoreHome
      const coreStoreComponents = [
        'herosection', 'categoriessection', 'productgridsection', 
        'flashsalessection', 'productcard', 'lazysection', 'promobanner'
      ];
      if (coreStoreComponents.includes(componentName)) {
        return 'store-core';
      }
      
      // Header components - separate chunk (used across store pages)
      if (componentName === 'header' || segment.startsWith('header/')) {
        return 'store-header';
      }
      
      // Footer components - lazy loaded
      if (componentName.includes('footer') || segment.startsWith('StoreFooter/')) {
        return 'store-footer';
      }
      
      // Modals - loaded on demand
      if (componentName.includes('modal')) {
        return 'store-modals';
      }
      
      // Chat - loaded on demand
      if (componentName.includes('chat')) {
        return 'store-chat';
      }
      
      // Category products - loaded when browsing categories
      if (segment.startsWith('StoreCategoryProducts/')) {
        return 'store-categoryproducts';
      }
      
      // Skeletons - loaded with core
      if (segment.startsWith('skeletons/')) {
        return 'store-core';
      }
      
      // Popup components - loaded on demand
      if (segment.startsWith('StorePopup/')) {
        return 'store-popup';
      }
      
      // Other store components - individual chunks
      return `store-${componentName}`;
    }
  }

  // SuperAdmin tab components - split each into its own chunk for optimal lazy loading
  // IMPORTANT: Keep this list synchronized with components/superadmin/*Tab.tsx files
  // The lowercase names below match the actual component file names (e.g., OverviewTab.tsx → 'overviewtab')
  if (normalized.includes('/components/superadmin/')) {
    const segment = normalized.split('/components/superadmin/')[1];
    if (segment) {
      const fileName = segment.split('/')[0];
      const componentName = fileName.replace(/\.(tsx|ts|jsx|js)$/, '').toLowerCase();
      
      // Tab components get individual chunks (each 8-22KB, loaded on-demand)
      const tabComponents = [
        'overviewtab', 'settingstab', 'notificationstab', 'themeconfigtab',
        'chatconfigtab', 'subscriptionstab', 'bulkannouncementstab',
        'supportticketstab', 'merchantsuccesstab'
      ];
      
      if (tabComponents.includes(componentName)) {
        return `superadmin-${componentName}`;
      }
      
      // Core UI components bundled together (Sidebar, TopBar - loaded immediately with dashboard, ~9KB)
      // NavItem, StatsCard, etc. are small utility components used by Sidebar/TopBar
      if (['sidebar', 'topbar', 'navitem', 'statscard', 'servermetric', 'quickactionbutton'].includes(componentName)) {
        return 'superadmin-ui';
      }
      
      // Types and utilities (~500 bytes)
      if (componentName === 'types' || componentName === 'utils' || componentName === 'index') {
        return 'superadmin-core';
      }
      
      // Other superadmin components
      return `superadmin-${componentName}`;
    }
  }

  if (normalized.includes('/components/')) {
    const componentSegment = normalized.split('/components/')[1];
    if (componentSegment) {
      const componentName = componentSegment.split('/')[0].replace(/\W+/g, '-').toLowerCase();
      return `cmp-${componentName}`;
    }
  }

  return undefined;
};

export default defineConfig(({ mode, isSsrBuild }) => {
    const env = loadEnv(mode, '.', '');
    
    // CDN configuration for build assets
    // When VITE_CDN_ENABLED is true and VITE_CDN_STATIC_URL is set, use it as base URL for assets
    const cdnEnabled = env.VITE_CDN_ENABLED === 'true';
    const cdnStaticUrl = env.VITE_CDN_STATIC_URL || env.VITE_CDN_BASE_URL || '';
    const normalizeBase = (value: string) => {
      if (!value || value === '/') return '/';
      return value.endsWith('/') ? value : `${value}/`;
    };
    const baseUrl = (mode === 'production' && cdnEnabled && cdnStaticUrl) ? normalizeBase(cdnStaticUrl) : '/';
    
    return {
      // Set base URL for all assets (CDN in production if configured)
      base: baseUrl,
      publicDir: 'public',
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.systemnextit.com', 'systemnextit.com', '.cartnget.shop', 'cartnget.shop', 'localhost', '.localhost'],
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
            secure: false,
            configure: (proxy) => {
              proxy.on('error', (err, _req, res) => {
                console.warn('[vite proxy] API proxy error, backend may be starting...', err.message);
                if (res && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Backend unavailable', retry: true }));
                }
              });
            }
          },
          '/uploads': {
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
            secure: false
          },
          '/socket.io': {
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
            ws: true
          }
        },
        warmup: {
          clientFiles: [
            './App.tsx', 
            './entry-client.tsx', 
            './pages/StoreHome.tsx',
            './components/store/CategoriesSection.tsx',
            './components/store/HeroSection/HeroSection.tsx'
          ]
        }
      },
      optimizeDeps: {
        include: [
          'react', 
          'react-dom', 
          'react-dom/client',
          'lucide-react',
          'react-hot-toast',
          'socket.io-client'
        ],
        holdUntilCrawlEnd: false,
        esbuildOptions: {
          target: 'esnext',
          treeShaking: true
        }
      },
      ssr: {
        noExternal: ['react-hot-toast', 'lucide-react']
      },
      esbuild: {
        target: 'esnext',
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        treeShaking: true,
        legalComments: 'none',
        drop: mode === 'production' ? ['debugger'] : [] // Temporarily keep console.log for debugging
      },
      plugins: [
        react(),
        splitVendorChunkPlugin(),
        criticalPreloadPlugin()
      ],
      // Handle JSON files explicitly
      json: {
        namedExports: true,
        stringify: false
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
        css: true
      },
      build: {
        target: 'esnext',
        chunkSizeWarningLimit: 150,
        outDir: isSsrBuild ? 'dist/server' : 'dist/client',
        // Enable CSS code splitting for better caching
        cssCodeSplit: true,
        // Minify CSS in production builds
        cssMinify: mode === 'production',
        // Minify for better performance
        minify: mode === 'production' ? 'esbuild' : false,
        // Faster builds
        sourcemap: false,
        // Remove unused code
        reportCompressedSize: false,
        // Optimize assets
        assetsInlineLimit: 4096, // Inline assets < 4KB
        rollupOptions: {
          input: isSsrBuild ? './entry-server.tsx' : './index.html',
          output: {
            manualChunks: isSsrBuild ? undefined : (id) => manualChunkResolver(id),
            // Ensure consistent chunk naming for better caching
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            // Compact output
            compact: true,
            // Hoist transitive imports for better parallelization
            hoistTransitiveImports: true
          },
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            // More aggressive tree shaking
            preset: 'smallest'
          }
        }
      }
    };
});
