/**
 * TensorFlow.js Image Analysis Service
 * Uses MobileNet for image classification with product-specific enhancements
 */

// Dynamic imports to avoid SSR issues - using 'any' for dynamic module loading
let tf: any = null;
let mobilenet: any = null;

interface ProductClassification {
  className: string;
  probability: number;
}

interface AnalyzedProduct {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  estimatedPrice: {
    min: number;
    max: number;
    suggested: number;
  };
  brand: string;
  color: string;
  material: string;
  condition: string;
  tags: string[];
  specifications?: Record<string, string>;
  searchKeywords?: string;
  targetAudience?: string;
  sellingPoints?: string[];
}

// Price ranges for different product categories (in BDT)
const CATEGORY_PRICE_RANGES: Record<string, { min: number; max: number; suggested: number }> = {
  'electronics': { min: 2000, max: 50000, suggested: 15000 },
  'clothing': { min: 500, max: 5000, suggested: 1500 },
  'footwear': { min: 800, max: 8000, suggested: 2500 },
  'accessories': { min: 300, max: 3000, suggested: 1000 },
  'furniture': { min: 3000, max: 80000, suggested: 15000 },
  'kitchenware': { min: 200, max: 5000, suggested: 800 },
  'sports': { min: 500, max: 20000, suggested: 3000 },
  'beauty': { min: 200, max: 3000, suggested: 800 },
  'toys': { min: 300, max: 5000, suggested: 1000 },
  'books': { min: 100, max: 2000, suggested: 500 },
  'jewelry': { min: 500, max: 50000, suggested: 5000 },
  'bags': { min: 500, max: 10000, suggested: 2000 },
  'watches': { min: 1000, max: 30000, suggested: 5000 },
  'default': { min: 500, max: 10000, suggested: 2000 }
};

// Category mappings from MobileNet classes
const CLASS_TO_CATEGORY: Record<string, { category: string; subcategory?: string }> = {
  // Electronics
  'laptop': { category: 'Electronics', subcategory: 'Computers' },
  'notebook': { category: 'Electronics', subcategory: 'Computers' },
  'desktop computer': { category: 'Electronics', subcategory: 'Computers' },
  'keyboard': { category: 'Electronics', subcategory: 'Accessories' },
  'mouse': { category: 'Electronics', subcategory: 'Accessories' },
  'monitor': { category: 'Electronics', subcategory: 'Displays' },
  'television': { category: 'Electronics', subcategory: 'Displays' },
  'cellular telephone': { category: 'Electronics', subcategory: 'Mobile Phones' },
  'mobile phone': { category: 'Electronics', subcategory: 'Mobile Phones' },
  'ipod': { category: 'Electronics', subcategory: 'Audio' },
  'headphone': { category: 'Electronics', subcategory: 'Audio' },
  'speaker': { category: 'Electronics', subcategory: 'Audio' },
  'camera': { category: 'Electronics', subcategory: 'Cameras' },
  'reflex camera': { category: 'Electronics', subcategory: 'Cameras' },
  'digital watch': { category: 'Electronics', subcategory: 'Wearables' },
  'smartwatch': { category: 'Electronics', subcategory: 'Wearables' },
  
  // Clothing
  'jersey': { category: 'Clothing', subcategory: 'Tops' },
  't-shirt': { category: 'Clothing', subcategory: 'Tops' },
  'shirt': { category: 'Clothing', subcategory: 'Tops' },
  'suit': { category: 'Clothing', subcategory: 'Formal' },
  'coat': { category: 'Clothing', subcategory: 'Outerwear' },
  'jacket': { category: 'Clothing', subcategory: 'Outerwear' },
  'sweatshirt': { category: 'Clothing', subcategory: 'Tops' },
  'cardigan': { category: 'Clothing', subcategory: 'Knitwear' },
  'jean': { category: 'Clothing', subcategory: 'Bottoms' },
  'trousers': { category: 'Clothing', subcategory: 'Bottoms' },
  'miniskirt': { category: 'Clothing', subcategory: 'Bottoms' },
  'gown': { category: 'Clothing', subcategory: 'Dresses' },
  'dress': { category: 'Clothing', subcategory: 'Dresses' },
  'bikini': { category: 'Clothing', subcategory: 'Swimwear' },
  'swimming trunks': { category: 'Clothing', subcategory: 'Swimwear' },
  
  // Footwear
  'running shoe': { category: 'Footwear', subcategory: 'Sports' },
  'sneaker': { category: 'Footwear', subcategory: 'Casual' },
  'loafer': { category: 'Footwear', subcategory: 'Formal' },
  'sandal': { category: 'Footwear', subcategory: 'Casual' },
  'boot': { category: 'Footwear', subcategory: 'Boots' },
  'clog': { category: 'Footwear', subcategory: 'Casual' },
  'cowboy boot': { category: 'Footwear', subcategory: 'Boots' },
  
  // Accessories
  'sunglasses': { category: 'Accessories', subcategory: 'Eyewear' },
  'sunglass': { category: 'Accessories', subcategory: 'Eyewear' },
  'watch': { category: 'Accessories', subcategory: 'Watches' },
  'analog clock': { category: 'Accessories', subcategory: 'Watches' },
  'wallet': { category: 'Accessories', subcategory: 'Wallets' },
  'purse': { category: 'Accessories', subcategory: 'Bags' },
  'handbag': { category: 'Accessories', subcategory: 'Bags' },
  'backpack': { category: 'Accessories', subcategory: 'Bags' },
  'briefcase': { category: 'Accessories', subcategory: 'Bags' },
  'umbrella': { category: 'Accessories', subcategory: 'Others' },
  'necktie': { category: 'Accessories', subcategory: 'Neckwear' },
  'bow tie': { category: 'Accessories', subcategory: 'Neckwear' },
  'scarf': { category: 'Accessories', subcategory: 'Neckwear' },
  'hat': { category: 'Accessories', subcategory: 'Headwear' },
  'cap': { category: 'Accessories', subcategory: 'Headwear' },
  'sombrero': { category: 'Accessories', subcategory: 'Headwear' },
  'cowboy hat': { category: 'Accessories', subcategory: 'Headwear' },
  'sunhat': { category: 'Accessories', subcategory: 'Headwear' },
  'belt': { category: 'Accessories', subcategory: 'Belts' },
  
  // Jewelry
  'necklace': { category: 'Jewelry', subcategory: 'Necklaces' },
  'ring': { category: 'Jewelry', subcategory: 'Rings' },
  'earring': { category: 'Jewelry', subcategory: 'Earrings' },
  'bracelet': { category: 'Jewelry', subcategory: 'Bracelets' },
  
  // Home & Furniture
  'chair': { category: 'Furniture', subcategory: 'Seating' },
  'table': { category: 'Furniture', subcategory: 'Tables' },
  'desk': { category: 'Furniture', subcategory: 'Tables' },
  'sofa': { category: 'Furniture', subcategory: 'Seating' },
  'couch': { category: 'Furniture', subcategory: 'Seating' },
  'bed': { category: 'Furniture', subcategory: 'Bedroom' },
  'wardrobe': { category: 'Furniture', subcategory: 'Storage' },
  'bookcase': { category: 'Furniture', subcategory: 'Storage' },
  'lamp': { category: 'Home Decor', subcategory: 'Lighting' },
  'vase': { category: 'Home Decor', subcategory: 'Decor' },
  'pillow': { category: 'Home Decor', subcategory: 'Bedding' },
  'quilt': { category: 'Home Decor', subcategory: 'Bedding' },
  
  // Kitchen
  'coffee mug': { category: 'Kitchenware', subcategory: 'Drinkware' },
  'cup': { category: 'Kitchenware', subcategory: 'Drinkware' },
  'bottle': { category: 'Kitchenware', subcategory: 'Drinkware' },
  'plate': { category: 'Kitchenware', subcategory: 'Dinnerware' },
  'bowl': { category: 'Kitchenware', subcategory: 'Dinnerware' },
  'spatula': { category: 'Kitchenware', subcategory: 'Utensils' },
  'pot': { category: 'Kitchenware', subcategory: 'Cookware' },
  'frying pan': { category: 'Kitchenware', subcategory: 'Cookware' },
  'wok': { category: 'Kitchenware', subcategory: 'Cookware' },
  'toaster': { category: 'Kitchenware', subcategory: 'Appliances' },
  'microwave': { category: 'Kitchenware', subcategory: 'Appliances' },
  'refrigerator': { category: 'Kitchenware', subcategory: 'Appliances' },
  
  // Sports
  'basketball': { category: 'Sports', subcategory: 'Ball Sports' },
  'football': { category: 'Sports', subcategory: 'Ball Sports' },
  'soccer ball': { category: 'Sports', subcategory: 'Ball Sports' },
  'tennis ball': { category: 'Sports', subcategory: 'Ball Sports' },
  'golf ball': { category: 'Sports', subcategory: 'Ball Sports' },
  'baseball': { category: 'Sports', subcategory: 'Ball Sports' },
  'racket': { category: 'Sports', subcategory: 'Racket Sports' },
  'tennis racket': { category: 'Sports', subcategory: 'Racket Sports' },
  'dumbbell': { category: 'Sports', subcategory: 'Fitness' },
  'bicycle': { category: 'Sports', subcategory: 'Cycling' },
  'mountain bike': { category: 'Sports', subcategory: 'Cycling' },
  
  // Beauty
  'lipstick': { category: 'Beauty', subcategory: 'Makeup' },
  'perfume': { category: 'Beauty', subcategory: 'Fragrance' },
  'lotion': { category: 'Beauty', subcategory: 'Skincare' },
  'hair spray': { category: 'Beauty', subcategory: 'Haircare' },
  
  // Toys
  'teddy': { category: 'Toys', subcategory: 'Stuffed Animals' },
  'teddy bear': { category: 'Toys', subcategory: 'Stuffed Animals' },
  'toy': { category: 'Toys', subcategory: 'General' },
  'doll': { category: 'Toys', subcategory: 'Dolls' },
  'puzzle': { category: 'Toys', subcategory: 'Games' },
  'jigsaw puzzle': { category: 'Toys', subcategory: 'Games' },
};

// Model instance cache
let modelInstance: any = null;
let isModelLoading = false;
let modelLoadPromise: Promise<any> | null = null;

/**
 * Initialize TensorFlow.js and load MobileNet model
 */
export const initializeTensorFlow = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    console.warn('[TensorFlow] Cannot initialize in SSR environment');
    return false;
  }

  if (modelInstance) {
    return true;
  }

  if (isModelLoading && modelLoadPromise) {
    await modelLoadPromise;
    return !!modelInstance;
  }

  isModelLoading = true;

  modelLoadPromise = (async () => {
    try {
      // Dynamic imports
      if (!tf) {
        tf = await import('@tensorflow/tfjs');
        // Set backend
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('[TensorFlow] Backend:', tf.getBackend());
      }

      if (!mobilenet) {
        mobilenet = await import('@tensorflow-models/mobilenet');
      }

      // Load MobileNet model (v2 with alpha 1.0 for best accuracy)
      console.log('[TensorFlow] Loading MobileNet model...');
      modelInstance = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      console.log('[TensorFlow] MobileNet model loaded successfully');

      return modelInstance;
    } catch (error) {
      console.error('[TensorFlow] Failed to initialize:', error);
      throw error;
    } finally {
      isModelLoading = false;
    }
  })();

  await modelLoadPromise;
  return !!modelInstance;
};

/**
 * Classify an image using MobileNet
 */
export const classifyImage = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<ProductClassification[]> => {
  if (!modelInstance) {
    await initializeTensorFlow();
  }

  if (!modelInstance) {
    throw new Error('TensorFlow model not initialized');
  }

  const predictions = await modelInstance.classify(imageElement, 10);
  return predictions.map((pred: any) => ({
    className: pred.className,
    probability: pred.probability
  }));
};

/**
 * Extract dominant colors from image
 */
export const extractColors = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<string[]> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return ['Unknown'];

  canvas.width = 50;
  canvas.height = 50;
  ctx.drawImage(imageElement, 0, 0, 50, 50);

  const imageData = ctx.getImageData(0, 0, 50, 50).data;
  const colorCounts: Record<string, number> = {};

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const colorName = getColorName(r, g, b);
    colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color);

  return sortedColors.length > 0 ? sortedColors : ['Mixed'];
};

/**
 * Get color name from RGB values
 */
const getColorName = (r: number, g: number, b: number): string => {
  const colors: Record<string, [number, number, number]> = {
    'Black': [0, 0, 0],
    'White': [255, 255, 255],
    'Red': [255, 0, 0],
    'Green': [0, 128, 0],
    'Blue': [0, 0, 255],
    'Yellow': [255, 255, 0],
    'Orange': [255, 165, 0],
    'Pink': [255, 192, 203],
    'Purple': [128, 0, 128],
    'Brown': [139, 69, 19],
    'Gray': [128, 128, 128],
    'Navy': [0, 0, 128],
    'Beige': [245, 245, 220],
    'Gold': [255, 215, 0],
    'Silver': [192, 192, 192],
    'Maroon': [128, 0, 0],
    'Teal': [0, 128, 128],
    'Olive': [128, 128, 0],
    'Coral': [255, 127, 80],
    'Turquoise': [64, 224, 208],
  };

  let closestColor = 'Mixed';
  let minDistance = Infinity;

  for (const [name, [cr, cg, cb]] of Object.entries(colors)) {
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + 
      Math.pow(g - cg, 2) + 
      Math.pow(b - cb, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = name;
    }
  }

  return closestColor;
};

/**
 * Generate product details from classification results
 */
export const generateProductDetails = (
  classifications: ProductClassification[],
  colors: string[]
): AnalyzedProduct => {
  const topClass = classifications[0]?.className.toLowerCase() || 'product';
  const allClassNames = classifications.map(c => c.className.toLowerCase());
  
  // Find matching category
  let categoryInfo: { category: string; subcategory?: string } = { category: 'General', subcategory: 'Others' };
  for (const className of allClassNames) {
    const words = className.split(/[,\s]+/);
    for (const word of words) {
      if (CLASS_TO_CATEGORY[word]) {
        categoryInfo = CLASS_TO_CATEGORY[word];
        break;
      }
    }
    if (categoryInfo.category !== 'General') break;
  }

  // Get price range
  const priceKey = categoryInfo.category.toLowerCase().replace(/\s+/g, '');
  const priceRange = CATEGORY_PRICE_RANGES[priceKey] || CATEGORY_PRICE_RANGES['default'];

  // Generate product name
  const primaryClass = classifications[0]?.className || 'Product';
  const productName = primaryClass.split(',')[0].trim();
  const capitalizedName = productName.charAt(0).toUpperCase() + productName.slice(1);

  // Generate tags from classifications
  const tags = new Set<string>();
  tags.add(categoryInfo.category);
  if (categoryInfo.subcategory) tags.add(categoryInfo.subcategory);
  colors.forEach(c => tags.add(c));
  
  classifications.forEach(c => {
    const words = c.className.split(/[,\s]+/).filter(w => w.length > 2);
    words.slice(0, 3).forEach(w => tags.add(w.toLowerCase()));
  });

  // Generate description
  const description = `High-quality ${capitalizedName} in ${colors[0] || 'classic'} color. ` +
    `Perfect for ${categoryInfo.category.toLowerCase()} enthusiasts. ` +
    `Features excellent craftsmanship and modern design.`;

  // Generate selling points based on category
  const sellingPoints = generateSellingPoints(categoryInfo.category, primaryClass);

  // Generate specifications
  const specifications: Record<string, string> = {
    'Category': categoryInfo.category,
    'Type': categoryInfo.subcategory || 'General',
    'Primary Color': colors[0] || 'Mixed',
    'Condition': 'New',
    'AI Confidence': `${(classifications[0]?.probability * 100).toFixed(1)}%`
  };

  return {
    name: `${capitalizedName} - ${colors[0] || 'Classic'} ${categoryInfo.subcategory || ''}`.trim(),
    category: categoryInfo.category,
    subcategory: categoryInfo.subcategory,
    description,
    estimatedPrice: priceRange,
    brand: 'Unbranded',
    color: colors[0] || 'Mixed',
    material: guessMaterial(categoryInfo.category),
    condition: 'New',
    tags: Array.from(tags).slice(0, 10),
    specifications,
    searchKeywords: Array.from(tags).join(', '),
    targetAudience: getTargetAudience(categoryInfo.category),
    sellingPoints
  };
};

/**
 * Guess material based on category
 */
const guessMaterial = (category: string): string => {
  const materialMap: Record<string, string> = {
    'Electronics': 'Plastic/Metal',
    'Clothing': 'Cotton/Polyester',
    'Footwear': 'Leather/Synthetic',
    'Accessories': 'Mixed Materials',
    'Jewelry': 'Metal/Stone',
    'Furniture': 'Wood/Metal',
    'Kitchenware': 'Stainless Steel/Plastic',
    'Sports': 'Synthetic/Rubber',
    'Beauty': 'Various',
    'Toys': 'Plastic/Fabric',
    'Home Decor': 'Mixed Materials'
  };
  return materialMap[category] || 'Mixed Materials';
};

/**
 * Get target audience based on category
 */
const getTargetAudience = (category: string): string => {
  const audienceMap: Record<string, string> = {
    'Electronics': 'Tech enthusiasts, professionals',
    'Clothing': 'Fashion-conscious individuals',
    'Footwear': 'Active lifestyle seekers',
    'Accessories': 'Style-conscious shoppers',
    'Jewelry': 'Luxury seekers, gift buyers',
    'Furniture': 'Homeowners, interior decorators',
    'Kitchenware': 'Home cooks, kitchen enthusiasts',
    'Sports': 'Athletes, fitness enthusiasts',
    'Beauty': 'Beauty enthusiasts, self-care seekers',
    'Toys': 'Parents, gift shoppers',
    'Home Decor': 'Homeowners, decorators'
  };
  return audienceMap[category] || 'General consumers';
};

/**
 * Generate selling points based on category
 */
const generateSellingPoints = (category: string, productName: string): string[] => {
  const basePoints = [
    'Premium quality materials',
    'Modern and stylish design',
    'Excellent value for money',
    'Durable and long-lasting'
  ];

  const categoryPoints: Record<string, string[]> = {
    'Electronics': ['Advanced technology', 'Energy efficient', 'User-friendly interface'],
    'Clothing': ['Comfortable fit', 'Breathable fabric', 'Easy to wash and maintain'],
    'Footwear': ['Comfortable for all-day wear', 'Non-slip sole', 'Stylish design'],
    'Accessories': ['Versatile style', 'Perfect for gifting', 'Timeless design'],
    'Jewelry': ['Elegant craftsmanship', 'Hypoallergenic materials', 'Gift box included'],
    'Furniture': ['Easy assembly', 'Space-saving design', 'Sturdy construction'],
    'Kitchenware': ['Dishwasher safe', 'Heat resistant', 'Easy to clean'],
    'Sports': ['Professional grade', 'Lightweight design', 'Enhanced performance'],
    'Beauty': ['Dermatologist tested', 'Natural ingredients', 'Long-lasting results'],
    'Toys': ['Safe for children', 'Educational value', 'Hours of entertainment']
  };

  return [...basePoints, ...(categoryPoints[category] || [])].slice(0, 6);
};

/**
 * Main function to analyze product image using TensorFlow.js
 */
export const analyzeProductWithTensorFlow = async (
  imageFile: File | HTMLImageElement | HTMLCanvasElement | string
): Promise<AnalyzedProduct> => {
  // Ensure TensorFlow is initialized
  await initializeTensorFlow();

  let imageElement: HTMLImageElement;

  if (typeof imageFile === 'string') {
    // Base64 or URL
    imageElement = await loadImage(imageFile);
  } else if (imageFile instanceof File) {
    // File object
    const base64 = await fileToBase64(imageFile);
    imageElement = await loadImage(base64);
  } else if (imageFile instanceof HTMLImageElement) {
    imageElement = imageFile;
  } else {
    // Canvas element - convert to image
    const canvas = imageFile as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL('image/png');
    imageElement = await loadImage(dataUrl);
  }

  // Classify image
  const classifications = await classifyImage(imageElement);
  console.log('[TensorFlow] Classifications:', classifications);

  // Extract colors
  const colors = await extractColors(imageElement);
  console.log('[TensorFlow] Colors:', colors);

  // Generate product details
  const productDetails = generateProductDetails(classifications, colors);
  console.log('[TensorFlow] Product Details:', productDetails);

  return productDetails;
};

/**
 * Helper to load image from URL/base64
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Helper to convert File to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Check if TensorFlow is available and model is loaded
 */
export const isTensorFlowReady = (): boolean => {
  return !!modelInstance;
};

/**
 * Get model loading status
 */
export const getModelStatus = (): 'not-loaded' | 'loading' | 'ready' | 'error' => {
  if (modelInstance) return 'ready';
  if (isModelLoading) return 'loading';
  return 'not-loaded';
};
