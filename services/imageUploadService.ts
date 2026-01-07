/**
 * Image Upload Service
 * Handles uploading images to the server instead of storing as base64
 * Supports CDN URL generation for uploaded images
 */

import { getCDNImageUrl, isCDNEnabled } from '../config/cdnConfig';
import { compressProductImage, convertFileToWebP, dataUrlToFile, convertProductImage } from './imageUtils';

// Production API URL - get from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://systemnextit.com';

export interface UploadResponse {
  success: boolean;
  imageUrl: string;
  imageId?: string;
  error?: string;
}

/**
 * Upload a file to the server without applying product-specific transforms.
 * Useful for assets like carousel images that are already resized/converted.
 * Returns a relative URL that can be normalized by normalizeImageUrl()
 */
export const uploadPreparedImageToServer = async (
  file: File,
  tenantId: string,
  folder?: 'carousel' | 'branding' | 'gallery'
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', tenantId);
    if (folder) formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.message || error.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data: UploadResponse = JSON.parse(responseText);
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    // Return relative URL - will be normalized when displayed
    const url = data.imageUrl;
    if (url.startsWith('/uploads')) return url;
    // Strip any domain prefix to get relative path
    const match = url.match(/\/uploads\/.+$/);
    return match ? match[0] : url;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a string is a base64 data URL
 */
export const isBase64Image = (str: string): boolean => {
  if (!str) return false;
  const s = str.trim();
  const unquoted =
    (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
      ? s.slice(1, -1).trim()
      : s;
  const lower = unquoted.toLowerCase();
  return lower.startsWith('data:image/') && lower.includes(';base64,');
};

const normalizeBase64DataUrl = (value: string): string => {
  const s = value.trim();
  const unquoted =
    (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
      ? s.slice(1, -1).trim()
      : s;

  const lower = unquoted.toLowerCase();
  if (!lower.startsWith('data:')) return unquoted;

  const commaIndex = unquoted.indexOf(',');
  if (commaIndex === -1) return unquoted;

  const meta = unquoted.slice(0, commaIndex);
  const data = unquoted.slice(commaIndex + 1);

  if (!/;base64$/i.test(meta) && !/;base64/i.test(meta)) return unquoted;

  return `${meta},${data.replace(/\s+/g, '')}`;
};

/**
 * Convert a base64 image to an uploaded file URL
 * Used to fix carousel images that were incorrectly stored as base64
 * Returns a relative URL that can be normalized by normalizeImageUrl()
 */
export const convertBase64ToUploadedUrl = async (
  base64Data: string,
  tenantId: string,
  folder?: 'carousel' | 'branding' | 'gallery'
): Promise<string> => {
  try {
    const normalizedBase64Data = normalizeBase64DataUrl(base64Data);

    const response = await fetch(`${API_BASE_URL}/api/upload/fix-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data: normalizedBase64Data, tenantId, folder, filename: `carousel-fixed-${Date.now()}.webp` }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.message || error.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data: UploadResponse = JSON.parse(responseText);
    if (!data.success) throw new Error(data.error || 'Conversion failed');

    // Return relative URL - will be normalized when displayed
    const url = data.imageUrl;
    if (url.startsWith('/uploads')) return url;
    const match = url.match(/\/uploads\/.+$/);
    return match ? match[0] : url;
  } catch (error) {
    throw new Error(`Failed to convert base64 image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert a server image URL to CDN URL if CDN is enabled
 * @param imageUrl The original image URL from the server
 * @returns CDN URL if enabled, otherwise original URL
 */
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  
  if (isCDNEnabled()) {
    return getCDNImageUrl(imageUrl);
  }
  
  return imageUrl;
};

/**
 * Upload a file to the server
 * @param file The image file to upload
 * @param tenantId The tenant ID for organizing uploads
 * @returns Promise with the uploaded image URL
 */
export const uploadImageToServer = async (
  file: File,
  tenantId: string
): Promise<string> => {
  try {
    // Convert to fixed 800x800 square and compress to under 15KB
    const compressed = await convertProductImage(file);

    console.log(`[ImageUpload] Starting upload for ${compressed.name} (${compressed.size} bytes) to tenant: ${tenantId}`);
    console.log(`[ImageUpload] API URL: ${API_BASE_URL}/api/upload`);
    
    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('tenantId', tenantId);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let the browser set it automatically for FormData
    });

    console.log(`[ImageUpload] Response status: ${response.status} ${response.statusText}`);

    // Get response text first to debug
    const responseText = await response.text();
    console.log(`[ImageUpload] Response body: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Parse JSON from text
    const data: UploadResponse = JSON.parse(responseText);
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log(`[ImageUpload] Success! Image URL: ${data.imageUrl}`);

    // If backend returns full URL (with http/https), use it directly
    // Otherwise, construct the full URL
    if (data.imageUrl.startsWith('http://') || data.imageUrl.startsWith('https://')) {
      // Replace localhost with production domain if present
      const cleanUrl = data.imageUrl.replace('https://systemnextit.com', API_BASE_URL);
      console.log(`[ImageUpload] Cleaned URL: ${cleanUrl}`);
      return cleanUrl;
    }
    
    // If it's a relative path, prepend API_BASE_URL
    const fullUrl = `${API_BASE_URL}${data.imageUrl.startsWith('/') ? '' : '/'}${data.imageUrl}`;
    console.log(`[ImageUpload] Full URL: ${fullUrl}`);
    return fullUrl;
  } catch (error) {
    console.error('[ImageUpload] Error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload multiple images in parallel
 * @param files Array of image files
 * @param tenantId The tenant ID
 * @returns Promise with array of uploaded image URLs
 */
export const uploadMultipleImages = async (
  files: File[],
  tenantId: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImageToServer(file, tenantId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple image upload error:', error);
    throw error;
  }
};

/**
 * Delete an image from the server
 * @param imageUrl The image URL to delete
 * @param tenantId The tenant ID
 */
export const deleteImageFromServer = async (
  imageUrl: string,
  tenantId: string
): Promise<void> => {
  try {
    // Extract the relative path if it's a full URL
    const relativePath = imageUrl.replace(API_BASE_URL, '');
    
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: relativePath,
        tenantId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Image delete error:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
