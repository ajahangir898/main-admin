/**
 * Cloudflare R2 Storage Service
 * 
 * This service provides integration with Cloudflare R2 for storing and serving
 * static assets like images, documents, and other files.
 * 
 * R2 is S3-compatible, so we use the AWS SDK with custom endpoint.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import crypto from 'crypto';

// Environment variables for R2 configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'uploads';
const CLOUDFLARE_R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

// Check if R2 is configured
export const isR2Configured = (): boolean => {
  return !!(
    CLOUDFLARE_ACCOUNT_ID &&
    CLOUDFLARE_R2_ACCESS_KEY_ID &&
    CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    CLOUDFLARE_R2_BUCKET_NAME
  );
};

// Create S3 client for R2
const createR2Client = (): S3Client | null => {
  if (!isR2Configured()) {
    console.warn('Cloudflare R2 is not configured. File uploads will use local storage.');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
};

let r2Client: S3Client | null = null;

const getR2Client = (): S3Client | null => {
  if (!r2Client && isR2Configured()) {
    r2Client = createR2Client();
  }
  return r2Client;
};

// Supported image types and their MIME types
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const DOCUMENT_MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Get MIME type from filename
 */
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_MIME_TYPES[ext] || DOCUMENT_MIME_TYPES[ext] || 'application/octet-stream';
};

/**
 * Generate a unique filename with timestamp and random hash
 */
const generateUniqueFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename).toLowerCase();
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const sanitizedName = path.basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50);
  return `${sanitizedName}-${timestamp}-${randomHash}${ext}`;
};

export interface UploadOptions {
  folder?: string;          // Folder path (e.g., 'products', 'tenants/store-name')
  filename?: string;        // Custom filename (will be sanitized)
  contentType?: string;     // Override content type
  cacheControl?: string;    // Cache control header
  isPublic?: boolean;       // Whether the file should be publicly accessible
  metadata?: Record<string, string>; // Custom metadata
}

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  error?: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export const uploadToR2 = async (
  fileBuffer: Buffer,
  originalFilename: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const client = getR2Client();
  
  if (!client) {
    return {
      success: false,
      url: '',
      key: '',
      bucket: CLOUDFLARE_R2_BUCKET_NAME,
      size: 0,
      contentType: '',
      error: 'Cloudflare R2 is not configured',
    };
  }

  try {
    const filename = options.filename 
      ? generateUniqueFilename(options.filename)
      : generateUniqueFilename(originalFilename);
    
    const folder = options.folder ? `${options.folder}/` : '';
    const key = `${folder}${filename}`;
    const contentType = options.contentType || getMimeType(originalFilename);
    
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: options.cacheControl || 'public, max-age=31536000, immutable',
      Metadata: options.metadata,
    });

    await client.send(command);

    // Construct the public URL
    const publicUrl = CLOUDFLARE_R2_PUBLIC_URL 
      ? `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`
      : `https://${CLOUDFLARE_R2_BUCKET_NAME}.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
      bucket: CLOUDFLARE_R2_BUCKET_NAME,
      size: fileBuffer.length,
      contentType,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      url: '',
      key: '',
      bucket: CLOUDFLARE_R2_BUCKET_NAME,
      size: 0,
      contentType: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Delete a file from Cloudflare R2
 */
export const deleteFromR2 = async (key: string): Promise<boolean> => {
  const client = getR2Client();
  
  if (!client) {
    console.warn('Cloudflare R2 is not configured');
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
};

/**
 * Check if a file exists in R2
 */
export const fileExistsInR2 = async (key: string): Promise<boolean> => {
  const client = getR2Client();
  
  if (!client) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate a pre-signed URL for private file access
 */
export const getSignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  const client = getR2Client();
  
  if (!client) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('R2 signed URL error:', error);
    return null;
  }
};

/**
 * Generate a pre-signed URL for direct upload from client
 */
export const getSignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  const client = getR2Client();
  
  if (!client) {
    return null;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('R2 signed upload URL error:', error);
    return null;
  }
};

/**
 * Get the public URL for a file key
 */
export const getPublicUrl = (key: string): string => {
  if (CLOUDFLARE_R2_PUBLIC_URL) {
    return `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
  }
  return `https://${CLOUDFLARE_R2_BUCKET_NAME}.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
};

/**
 * Extract key from a full R2 URL
 */
export const extractKeyFromUrl = (url: string): string | null => {
  try {
    if (CLOUDFLARE_R2_PUBLIC_URL && url.startsWith(CLOUDFLARE_R2_PUBLIC_URL)) {
      return url.replace(`${CLOUDFLARE_R2_PUBLIC_URL}/`, '');
    }
    
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
};

export default {
  isR2Configured,
  uploadToR2,
  deleteFromR2,
  fileExistsInR2,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  getPublicUrl,
  extractKeyFromUrl,
};
