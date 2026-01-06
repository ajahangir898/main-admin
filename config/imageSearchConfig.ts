/**
 * Image Search Configuration
 * Centralized settings for the image search feature
 */

export const IMAGE_SEARCH_CONFIG = {
  // Upload settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    timeoutMs: 30000,
    storageLocation: './uploads/images'
  },

  // Model settings
  model: {
    type: 'mobilenet', // or 'resnet', 'efficientnet'
    version: 2,
    embeddingDimensions: 2048,
    preloadModel: true, // Load on app startup
    cachePath: './models'
  },

  // Vector store settings
  vectorStore: {
    type: 'memory', // 'memory' | 'pinecone' | 'milvus' | 'redis'
    // Pinecone config (if type === 'pinecone')
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || 'production',
      indexName: 'product-embeddings',
      namespace: 'default'
    },
    // Milvus config (if type === 'milvus')
    milvus: {
      host: process.env.MILVUS_HOST || 'localhost',
      port: parseInt(process.env.MILVUS_PORT || '19530'),
      collectionName: 'products'
    },
    // Redis config (if type === 'redis')
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1,
      keyPrefix: 'embeddings:'
    }
  },

  // Search settings
  search: {
    defaultTopK: 50,
    maxTopK: 500,
    minSimilarityScore: 0.3, // Filter results below this score
    enableFiltering: true,
    enableSorting: true,
    // Default filters
    defaultFilters: {
      minStock: 1,
      maxPrice: null,
      minPrice: null,
      excludeCategories: []
    }
  },

  // Image upload settings
  images: {
    uploadDirName: 'images',
    tempDirName: 'temp',
    retentionDays: 1, // Delete uploaded images after 1 day
    scanForViruses: false, // Enable if using VirusTotal
    optimizeOnUpload: true,
    // Image optimization
    optimization: {
      resize: {
        width: 800,
        height: 800,
        fit: 'inside'
      },
      quality: 80,
      format: 'webp' // Convert to WebP for smaller size
    }
  },

  // Performance settings
  performance: {
    enableCaching: true,
    cacheTTLSeconds: 3600, // 1 hour
    maxCacheSize: 1000, // Max cached embeddings
    batchProcessing: true,
    batchSize: 10,
    // Indexing
    indexing: {
      autoIndex: false,
      parallelJobs: 4,
      retryAttempts: 3
    }
  },

  // UI settings
  ui: {
    // Component variants
    searchVariant: 'full', // 'minimal' | 'full'
    resultsPerPage: 50,
    gridColumns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
      wide: 5
    },
    // Filter options
    showFilterPanel: true,
    collapsibleFilters: true,
    showRelevanceScore: true,
    showMatchPercentage: true,
    // Sorting options
    sortOptions: [
      { label: 'Best Match', value: 'relevance' },
      { label: 'Price: Low to High', value: 'price-asc' },
      { label: 'Price: High to Low', value: 'price-desc' },
      { label: 'Newest', value: 'newest' }
    ]
  },

  // API settings
  api: {
    baseUrl: 'https://systemnextit.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    // Endpoints
    endpoints: {
      upload: '/api/image-search/upload',
      search: '/api/image-search/query',
      index: '/api/image-search/index',
      embeddings: '/api/image-search/embeddings',
      health: '/api/image-search/health'
    }
  },

  // Analytics settings
  analytics: {
    enabled: true,
    trackSearches: true,
    trackResultClicks: true,
    trackAddToCart: true,
    trackConversions: true,
    // Data retention
    retention: {
      searches: 90, // days
      clicks: 30,
      conversions: 365
    }
  },

  // Logging settings
  logging: {
    enabled: true,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    logSearches: true,
    logErrors: true,
    logPerformance: true
  },

  // Security settings
  security: {
    requireAuth: false, // Require login for image search
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    },
    validateOrigin: true,
    corsOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    // File upload security
    virusScanning: false,
    malwareDetection: false,
    ipWhitelist: [] // Empty = allow all
  },

  // Development settings
  dev: {
    enableMockData: false,
    debugMode: process.env.NODE_ENV === 'development',
    mockSearchResults: [
      // Mock results for testing
    ]
  }
};

/**
 * Get image search configuration for a specific environment
 */
export function getConfig(environment: 'development' | 'staging' | 'production' = 'development') {
  const config = { ...IMAGE_SEARCH_CONFIG };

  switch (environment) {
    case 'production':
      config.images.retentionDays = 7;
      config.search.minSimilarityScore = 0.5;
      config.security.requireAuth = true;
      config.security.virusScanning = true;
      config.logging.logSearches = false; // Privacy
      config.dev.debugMode = false;
      break;

    case 'staging':
      config.search.minSimilarityScore = 0.3;
      config.performance.enableCaching = true;
      config.logging.level = 'info';
      break;

    case 'development':
      config.dev.enableMockData = false;
      config.dev.debugMode = true;
      config.logging.level = 'debug';
      break;
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: typeof IMAGE_SEARCH_CONFIG): string[] {
  const errors: string[] = [];

  // Validate upload settings
  if (config.upload.maxFileSize < 1024 * 100) { // 100KB minimum
    errors.push('maxFileSize must be at least 100KB');
  }

  // Validate model
  if (!['mobilenet', 'resnet', 'efficientnet'].includes(config.model.type)) {
    errors.push('Invalid model type');
  }

  // Validate vector store
  if (!['memory', 'pinecone', 'milvus', 'redis'].includes(config.vectorStore.type)) {
    errors.push('Invalid vector store type');
  }

  // Validate search settings
  if (config.search.defaultTopK < 1 || config.search.defaultTopK > config.search.maxTopK) {
    errors.push('Invalid topK settings');
  }

  return errors;
}

export default IMAGE_SEARCH_CONFIG;
