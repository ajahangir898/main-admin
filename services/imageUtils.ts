export interface WebPOptions {
  quality?: number;
  maxDimension?: number;
}

export interface CarouselOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export interface ProductImageOptions {
  targetSizeKB?: number; // Target size in KB (default: 15KB)
  maxDimension?: number; // Max width/height (default: 800px)
  minQuality?: number;   // Minimum quality threshold (default: 0.3)
}

// Carousel standard dimensions: 1400 x 420 pixels (HD quality)
export const CAROUSEL_WIDTH = 1400;
export const CAROUSEL_HEIGHT = 420;

// Mobile carousel dimensions: 600 x 288 pixels (Retina quality)
export const CAROUSEL_MOBILE_WIDTH = 600;
export const CAROUSEL_MOBILE_HEIGHT = 288;

// Product image fixed dimensions: 1000 x 1000 pixels (1:1 square, HD quality)
export const PRODUCT_IMAGE_WIDTH = 1000;
export const PRODUCT_IMAGE_HEIGHT = 1000;

// Product image target size (increased for HD quality)
export const PRODUCT_IMAGE_TARGET_KB = 100; // Target under 25KB for HD images

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = src;
  });
};

/**
 * Converts any supported image file to WebP using an off-screen canvas.
 * Falls back to the original DataURL if WebP is not supported.
 */
export const convertFileToWebP = async (file: File, options: WebPOptions = {}): Promise<string> => {
  const originalDataUrl = await fileToDataUrl(file);
  try {
    const { quality = 0.95, maxDimension = 2000 } = options;
    const img = await loadImage(originalDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable.');
    }

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const webpDataUrl = canvas.toDataURL('image/webp', quality);
    if (webpDataUrl.startsWith('data:image/webp')) {
      return webpDataUrl;
    }
  } catch (error) {
    console.warn('WebP conversion failed, using original image.', error);
  }
  return originalDataUrl;
};

/**
 * Converts and resizes image specifically for carousel banners.
 * Output: 1280 x 330 pixels, WebP format, 24-bit color.
 * The image is center-cropped to fit the exact dimensions.
 */
export const convertCarouselImage = async (file: File, options: CarouselOptions = {}): Promise<string> => {
  const originalDataUrl = await fileToDataUrl(file);
  try {
    const { 
      width = CAROUSEL_WIDTH, 
      height = CAROUSEL_HEIGHT, 
      quality = 0.95 
    } = options;
    
    const img = await loadImage(originalDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable.');
    }

    // Set exact carousel dimensions
    canvas.width = width;
    canvas.height = height;

    // Calculate scaling to cover the target dimensions (center crop)
    const targetRatio = width / height;
    const imgRatio = img.width / img.height;
    
    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    
    if (imgRatio > targetRatio) {
      // Image is wider - crop sides
      srcW = img.height * targetRatio;
      srcX = (img.width - srcW) / 2;
    } else {
      // Image is taller - crop top/bottom
      srcH = img.width / targetRatio;
      srcY = (img.height - srcH) / 2;
    }

    // Draw the center-cropped image scaled to exact dimensions
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

    const webpDataUrl = canvas.toDataURL('image/webp', quality);
    if (webpDataUrl.startsWith('data:image/webp')) {
      return webpDataUrl;
    }
  } catch (error) {
    console.warn('Carousel image conversion failed, using original.', error);
  }
  return originalDataUrl;
};

/**
 * Helper function to get file size from data URL (in bytes)
 */
const getDataUrlSize = (dataUrl: string): number => {
  // Data URL format: data:image/webp;base64,ENCODED_DATA
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return 0;
  // Base64 encoded data is ~33% larger than binary
  return Math.ceil((base64Data.length * 3) / 4);
};

/**
 * Helper function to convert data URL to File object
 */
export const dataUrlToFile = (dataUrl: string, fileName: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

/**
 * Converts and resizes image to fixed square dimensions for product images.
 * Output: 800 x 800 pixels (1:1 square), WebP format, under 15KB.
 * The image is center-cropped to fit the exact square dimensions.
 */
export const convertProductImage = async (file: File): Promise<File> => {
  const originalDataUrl = await fileToDataUrl(file);
  const targetSizeBytes = PRODUCT_IMAGE_TARGET_KB * 1024;
  
  try {
    const img = await loadImage(originalDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable.');
    }

    // Set exact square dimensions
    canvas.width = PRODUCT_IMAGE_WIDTH;
    canvas.height = PRODUCT_IMAGE_HEIGHT;

    // Fill with white background (for transparent images)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PRODUCT_IMAGE_WIDTH, PRODUCT_IMAGE_HEIGHT);

    // Calculate center crop to make square
    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    
    if (img.width > img.height) {
      // Landscape - crop sides
      srcW = img.height;
      srcX = (img.width - srcW) / 2;
    } else if (img.height > img.width) {
      // Portrait - crop top/bottom
      srcH = img.width;
      srcY = (img.height - srcH) / 2;
    }
    // Square images - no crop needed

    // Draw the center-cropped image scaled to exact dimensions
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, PRODUCT_IMAGE_WIDTH, PRODUCT_IMAGE_HEIGHT);

    // Binary search for optimal quality to reach target size (under 15KB)
    let minQ = 0.15;
    let maxQ = 0.85;
    let bestDataUrl = canvas.toDataURL('image/webp', maxQ);
    let bestSize = getDataUrlSize(bestDataUrl);
    
    // If already under target, use high quality
    if (bestSize <= targetSizeBytes) {
      console.log(`[ProductImage] Already under target: ${(bestSize / 1024).toFixed(1)}KB`);
      const newFileName = file.name.replace(/\.[^.]+$/, '.webp');
      return dataUrlToFile(bestDataUrl, newFileName);
    }

    // Iterative quality reduction to find optimal size under 15KB
    for (let i = 0; i < 15; i++) {
      const midQ = (minQ + maxQ) / 2;
      const testDataUrl = canvas.toDataURL('image/webp', midQ);
      const testSize = getDataUrlSize(testDataUrl);
      
      if (testSize <= targetSizeBytes) {
        bestDataUrl = testDataUrl;
        bestSize = testSize;
        minQ = midQ; // Try higher quality
      } else {
        maxQ = midQ; // Need lower quality
      }
      
      // Close enough to target (within 1KB)
      if (testSize <= targetSizeBytes && testSize > targetSizeBytes * 0.9) {
        bestDataUrl = testDataUrl;
        bestSize = testSize;
        break;
      }
    }

    // If still too large, reduce dimensions more aggressively
    if (bestSize > targetSizeBytes) {
      let scale = 0.85;
      while (bestSize > targetSizeBytes && scale > 0.4) {
        const newSize = Math.round(PRODUCT_IMAGE_WIDTH * scale);
        canvas.width = newSize;
        canvas.height = newSize;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newSize, newSize);
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, newSize, newSize);
        
        bestDataUrl = canvas.toDataURL('image/webp', 0.5);
        bestSize = getDataUrlSize(bestDataUrl);
        scale -= 0.05;
      }
    }

    console.log(`[ProductImage] Fixed size: ${PRODUCT_IMAGE_WIDTH}x${PRODUCT_IMAGE_HEIGHT}, ${(bestSize / 1024).toFixed(1)}KB`);
    
    const newFileName = file.name.replace(/\.[^.]+$/, '.webp');
    return dataUrlToFile(bestDataUrl, newFileName);
    
  } catch (error) {
    console.warn('Product image conversion failed, returning original.', error);
    return file;
  }
};

/**
 * Compresses a product image to target size (~15KB) for faster page loads.
 * Uses iterative quality reduction to achieve optimal file size.
 * Returns a compressed File object ready for upload.
 */
export const compressProductImage = async (
  file: File, 
  options: ProductImageOptions = {}
): Promise<File> => {
  const {
    targetSizeKB = PRODUCT_IMAGE_TARGET_KB,
    maxDimension = 800,
    minQuality = 0.3
  } = options;

  const targetSizeBytes = targetSizeKB * 1024;
  const originalDataUrl = await fileToDataUrl(file);
  
  try {
    const img = await loadImage(originalDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable.');
    }

    // Calculate dimensions while maintaining aspect ratio
    let width = img.width;
    let height = img.height;
    
    // Scale down if larger than maxDimension
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Binary search for optimal quality to reach target size
    let minQ = minQuality;
    let maxQ = 0.988;
    let bestDataUrl = canvas.toDataURL('image/webp', maxQ);
    let bestSize = getDataUrlSize(bestDataUrl);
    
    // If already under target, just use high quality
    if (bestSize <= targetSizeBytes) {
      console.log(`[CompressImage] Image already under target: ${(bestSize / 1024).toFixed(1)}KB`);
      const newFileName = file.name.replace(/\.[^.]+$/, '.webp');
      return dataUrlToFile(bestDataUrl, newFileName);
    }

    // Iterative quality reduction to find optimal size
    for (let i = 0; i < 10; i++) {
      const midQ = (minQ + maxQ) / 2;
      const testDataUrl = canvas.toDataURL('image/webp', midQ);
      const testSize = getDataUrlSize(testDataUrl);
      
      if (testSize <= targetSizeBytes) {
        bestDataUrl = testDataUrl;
        bestSize = testSize;
        minQ = midQ; // Try higher quality
      } else {
        maxQ = midQ; // Need lower quality
      }
      
      // Close enough to target (within 5KB tolerance)
      if (Math.abs(testSize - targetSizeBytes) < 5 * 1024) {
        if (testSize <= targetSizeBytes) {
          bestDataUrl = testDataUrl;
          bestSize = testSize;
        }
        break;
      }
    }

    // If still too large, try smaller dimensions
    if (bestSize > targetSizeBytes) {
      let scaleFactor = 0.8;
      while (bestSize > targetSizeBytes && scaleFactor > 0.3) {
        const newWidth = Math.round(width * scaleFactor);
        const newHeight = Math.round(height * scaleFactor);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        bestDataUrl = canvas.toDataURL('image/webp', 0.7);
        bestSize = getDataUrlSize(bestDataUrl);
        scaleFactor -= 0.1;
      }
    }

    console.log(`[CompressImage] Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(bestSize / 1024).toFixed(1)}KB`);
    
    const newFileName = file.name.replace(/\.[^.]+$/, '.webp');
    return dataUrlToFile(bestDataUrl, newFileName);
    
  } catch (error) {
    console.warn('Product image compression failed, returning original.', error);
    return file;
  }
};

/**
 * Compress multiple product images
 */
export const compressProductImages = async (
  files: File[],
  options: ProductImageOptions = {}
): Promise<File[]> => {
  const compressedFiles = await Promise.all(
    files.map(file => compressProductImage(file, options))
  );
  return compressedFiles;
};
