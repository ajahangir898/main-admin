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
  'App-'
  // NOTE: store-core, store-header, page-storehome load on-demand via lazy import
  // This reduces initial bundle and speeds up first paint
  // Admin, SuperAdmin, Registration pages are NOT preloaded
];

// Critical CSS patterns for preloading (ordered by priority)
// NOTE: CSS is loaded async with media="print" onload pattern to avoid render blocking
const CRITICAL_CSS_PATTERNS = [
  { pattern: 'tailwind-', priority: 1 }  // Tailwind CSS only - highest priority
  // Store/component CSS loads on-demand with their chunks
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

      // Create actual stylesheet links for CSS files (async loading pattern)
      const cssStylesheets = cssFiles.map(({ fileName }) =>
        `<link rel="stylesheet" href="${resolvedBase}${fileName}" media="print" onload="this.media='all'" crossorigin />\n    <noscript><link rel="stylesheet" href="${resolvedBase}${fileName}" /></noscript>`
      ).join('\n    ');

      const allPreloads = [cssPreloads, ...modulepreloadLinks].filter(Boolean).join('\n    ');
      
      if (allPreloads) {
        html = html.replace(
          /<head>/i,
          `<head>\n    <!-- Critical resource preloads for parallel loading -->\n    ${allPreloads}`
        );
      }

      // Inject CSS stylesheets before </head> if not already present
      if (cssStylesheets) {
        // Check if stylesheet links already exist
        const hasExistingStylesheet = cssFiles.some(({ fileName }) => 
          html.includes(`href="${resolvedBase}${fileName}"`) && html.includes('rel="stylesheet"')
        );
        
        if (!hasExistingStylesheet) {
          // Add stylesheet links before </head>
          html = html.replace(
            /<\/head>/i,
            `    <!-- CSS Stylesheets -->\n    ${cssStylesheets}\n  </head>`
          );
        } else {
          // Convert existing CSS stylesheet links to non-render-blocking using media="print" pattern
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
              // Convert to non-render-blocking CSS
              const deferredCss = match
                .replace('rel="stylesheet"', 'rel="stylesheet" media="print" onload="this.media=\'all\'"');
              const noscriptFallback = `<noscript>${match}</noscript>`;
              return `${deferredCss}\n    ${noscriptFallback}`;
            });
          }
        }
      }

      return html;
    }
  };
}

const vendorChunkMatchers = [
  // React core - split for optimal caching
  { name: 'react-dom-client', matcher: /node_modules\/react-dom\/client/ },
  { name: 'react-dom-server', matcher: /node_modules\/react-dom\/server/ },
  { name: 'react-dom', matcher: /node_modules\/react-dom\// },
  { name: 'react-jsx-runtime', matcher: /node_modules\/react\/jsx-runtime/ },
  { name: 'react-core', matcher: /node_modules\/react\// },
  { name: 'scheduler', matcher: /node_modules\/scheduler\// },
  // Split heavy dependencies into separate chunks for better caching
  { name: 'pkg-toast', matcher: /node_modules\/react-hot-toast\// },
  { name: 'pkg-socket', matcher: /node_modules\/socket\.io-client\// },
  { name: 'pkg-engine-io', matcher: /node_modules\/engine\.io/ },
  { name: 'icons-chunk', matcher: /node_modules\/lucide-react\// },
  // Lodash - split into separate chunk
  { name: 'pkg-lodash', matcher: /node_modules\/lodash/ },
  // D3 libraries - split by module for smaller chunks
  { name: 'pkg-d3-shape', matcher: /node_modules\/d3-shape\// },
  { name: 'pkg-d3-scale', matcher: /node_modules\/d3-scale\// },
  { name: 'pkg-d3-array', matcher: /node_modules\/d3-array\// },
  { name: 'pkg-d3-path', matcher: /node_modules\/d3-path\// },
  { name: 'pkg-d3-time', matcher: /node_modules\/d3-time\// },
  { name: 'pkg-d3-format', matcher: /node_modules\/d3-format\// },
  { name: 'pkg-d3-color', matcher: /node_modules\/d3-color\// },
  { name: 'pkg-d3-interpolate', matcher: /node_modules\/d3-interpolate\// },
  { name: 'pkg-d3-time-format', matcher: /node_modules\/d3-time-format\// },
  // React-smooth for animations
  { name: 'pkg-react-smooth', matcher: /node_modules\/react-smooth\// },
  // Helmet for SEO
  { name: 'pkg-react-helmet', matcher: /node_modules\/react-helmet-async\// }
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

  // Split cartesian into smaller chunks
  if (top === 'es6' && area === 'cartesian') {
    if (baseName) {
      return `recharts-cartesian-${baseName}`;
    }
    return 'recharts-cartesian-core';
  }

  // Split util into smaller chunks
  if (top === 'es6' && area === 'util') {
    if (baseName) {
      return `recharts-util-${baseName}`;
    }
    return 'recharts-util-core';
  }

  // Split shape into smaller chunks  
  if (top === 'es6' && area === 'shape') {
    if (baseName) {
      return `recharts-shape-${baseName}`;
    }
    return 'recharts-shape-core';
  }

  // Split polar into smaller chunks
  if (top === 'es6' && area === 'polar') {
    if (baseName) {
      return `recharts-polar-${baseName}`;
    }
    return 'recharts-polar-core';
  }

  // Coarser split for other areas
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
      
      // === ADMIN PAGES - Split into individual chunks for code splitting ===
      // Heavy admin pages get their own chunks to keep each under 50KB
      const heavyAdminPages = [
        'adminproducts',      // Product management - largest admin page
        'adminorders',        // Order management - very large
        'admincustomization', // Theme customization - large
        'admindashboard',     // Dashboard with charts
        'admincatalog',       // Category/brand management
        'admincustomers',     // Customer management
        'admingallery',       // Image gallery
        'admincontrolnew',    // Admin control panel
        'adminsettings',      // Settings page
        'adminexpenses',      // Expense tracking
        'adminincome',        // Income tracking
        'adminprofitloss',    // Profit/loss reports
        'adminduelist',       // Due management
        'admininventory',     // Inventory management
        'adminreviews',       // Review management
        'adminpopups',        // Popup management
        'adminsupport',       // Support system
        'adminnote',          // Notes
        'adminfacebookpixel', // Facebook pixel
        'admingtm',           // GTM integration
        'adminfigmaintegration', // Figma integration
        'admindeliverysettings', // Delivery settings
        'admincouriersettings',  // Courier settings
        'admindailytarget',      // Daily targets
        'adminbusinessreport',   // Business reports
        'adminlandingpage',      // Landing page editor
        'admintenantmanagement', // Tenant management
        'adminapp',              // Admin app wrapper
        'adminappwithauth'       // Auth wrapper
      ];
      
      if (pageName.startsWith('admin')) {
        const cleanName = pageName.replace(/-tsx$/, '').replace(/\W+/g, '');
        if (heavyAdminPages.includes(cleanName)) {
          return `page-${cleanName}`;
        }
        // Other admin pages go to admin-misc chunk
        return 'page-admin-misc';
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
      
      // Critical above-fold components - HeroSection and Categories only
      // These load synchronously with StoreHome for instant render
      const criticalStoreComponents = ['herosection', 'categoriessection'];
      if (criticalStoreComponents.includes(componentName)) {
        return 'store-core';
      }
      
      // Product display components - split into individual chunks
      if (componentName === 'productgridsection') return 'store-productgrid';
      if (componentName === 'flashsalessection') return 'store-flashsales';
      if (componentName === 'productcard') return 'store-productcard';
      if (componentName === 'lazysection') return 'store-lazysection';
      
      // Header components - split into smaller chunks
      if (segment.startsWith('header/') || segment.startsWith('StoreHeader/')) {
        const headerFile = segment.split('/')[1]?.replace(/\.(tsx|ts|jsx|js)$/, '').toLowerCase();
        if (headerFile) {
          // Modals in header folder - individual chunks
          if (headerFile === 'cartmodal') return 'store-modal-cart';
          if (headerFile === 'wishlistmodal') return 'store-modal-wishlist';
          if (headerFile === 'mobilesearchmodal') return 'store-modal-search';
          if (headerFile === 'storeheadermodals') return 'store-header-modals';
          
          // Search components
          if (headerFile.includes('search')) return 'store-header-search';
          
          // Mobile components
          if (headerFile.includes('mobile')) return 'store-header-mobile';
          
          // Desktop header bar
          if (headerFile === 'desktopheaderbar') return 'store-header-desktop';
          
          // Types and index
          if (headerFile === 'headertypes' || headerFile === 'index') return 'store-header-core';
        }
        return 'store-header';
      }
      
      // Footer components - lazy loaded
      if (componentName.includes('footer') || segment.startsWith('StoreFooter/')) {
        return 'store-footer';
      }
      
      // Modals - split each modal into its own chunk for on-demand loading
      if (componentName.includes('modal') || segment.includes('Modal')) {
        if (componentName === 'loginmodal') return 'store-modal-login';
        if (componentName === 'productquickviewmodal') return 'store-modal-quickview';
        if (componentName === 'addtocartsuccess' || componentName === 'addtocartsuccesmodal') return 'store-modal-addtocart';
        if (componentName === 'trackordermodal') return 'store-modal-track';
        if (componentName === 'storechatmodal') return 'store-chat';
        return `store-modal-misc`;
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
      
      // Mobile bottom nav - separate chunk
      if (componentName.includes('mobilebottom') || componentName.includes('bottomnav')) {
        return 'store-mobilenav';
      }
      
      // Search results - separate chunk
      if (componentName.includes('searchresults')) {
        return 'store-searchresults';
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
      
      // Heavy components get individual chunks
      const heavyComponents = [
        'admincomponents-tsx',
        'adminproductmanager-tsx', 
        'landingpagecomponents-tsx',
        'gallerypicker-tsx',
        'richtexteditor-tsx',
        'skeletonloaders-tsx',
        'storecomponents-tsx',
        'storeproductcomponents-tsx',
        'productpricingandstock-tsx',
        'optimizedimage-tsx',
        'productfilter-tsx',
        'duehistorymodal-tsx',
        'addnewduemodal-tsx',
        'storecategoryproducts-tsx',
        'emptystates-tsx',
        'approutes-tsx'
      ];
      
      if (heavyComponents.includes(componentName)) {
        return `cmp-${componentName}`;
      }
      
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
