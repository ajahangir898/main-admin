import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Try to import sharp dynamically, but make it optional
interface SharpInstance {
  (buffer: Buffer): SharpInstance;
  webp(options: { quality: number }): SharpInstance;
  resize(width: number, height: number, options?: any): SharpInstance;
  toBuffer(): Promise<Buffer>;
}

let sharp: ((buffer: Buffer) => SharpInstance) | null = null;
try {
  sharp = require('sharp') as (buffer: Buffer) => SharpInstance;
} catch (e) {
  console.warn('[Upload] Sharp not installed - server-side compression disabled');
}

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'images');
const ALLOWED_FOLDERS = new Set(['carousel']);

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// Helpers
const sanitizeFolder = (value: unknown): string | null => {
  const folder = typeof value === 'string' ? value.trim() : '';
  return ALLOWED_FOLDERS.has(folder) ? folder : null;
};

const buildPath = (folder: string | null, tenantId: string, filename: string) => {
  const parts = folder ? [uploadDir, folder, tenantId] : [uploadDir, tenantId];
  return { dir: path.join(...parts), url: `/${parts.join('/')}/${filename}`.replace(process.cwd().replace(/\\/g, '/'), '') };
};

const getImageUrl = (folder: string | null, tenantId: string, filename: string) =>
  folder ? `/uploads/images/${folder}/${tenantId}/${filename}` : `/uploads/images/${tenantId}/${filename}`;

/**
 * Compress product images to under 15KB using Sharp
 * If Sharp is not available or image is already small, returns original buffer
 */
const compressProductImage = async (buffer: Buffer, originalName: string): Promise<Buffer> => {
  const targetSizeKB = 15;
  const targetSizeBytes = targetSizeKB * 1024;
  
  // If sharp is not available, return original
  if (!sharp) {
    console.log('[Upload] Sharp not available, skipping server-side compression');
    return buffer;
  }
  
  try {
    // Skip compression for carousel images or if already small enough
    if (buffer.length <= targetSizeBytes) {
      console.log(`[Upload] Image already under ${targetSizeKB}KB: ${(buffer.length / 1024).toFixed(1)}KB`);
      return buffer;
    }
    
    // Start with quality 80 and compress to WebP
    let quality = 80;
    let compressed = await sharp(buffer)
      .webp({ quality })
      .toBuffer();
    
    // If still too large, reduce quality iteratively
    let attempts = 0;
    while (compressed.length > targetSizeBytes && quality > 20 && attempts < 8) {
      quality -= 10;
      compressed = await sharp(buffer)
        .webp({ quality })
        .toBuffer();
      attempts++;
    }
    
    // If still too large, resize down maintaining square aspect ratio
    if (compressed.length > targetSizeBytes) {
      let size = 800; // Start with 800x800
      while (compressed.length > targetSizeBytes && size > 400) {
        size -= 100;
        compressed = await sharp(buffer)
          .resize(size, size, { 
            fit: 'cover',  // Maintain square crop
            position: 'center' 
          })
          .webp({ quality: 60 })
          .toBuffer();
      }
    }
    
    const originalSize = (buffer.length / 1024).toFixed(1);
    const compressedSize = (compressed.length / 1024).toFixed(1);
    console.log(`[Upload] Compressed: ${originalSize}KB → ${compressedSize}KB`);
    
    return compressed;
  } catch (error) {
    console.error('[Upload] Compression failed:', error);
    return buffer; // Fallback to original
  }
};

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Error handler
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 5MB.' : err.message || 'Upload failed';
    return res.status(400).json({ success: false, error: msg });
  }
  next();
};

// POST /api/upload - Upload image
router.post('/api/upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const tenantId = req.body.tenantId || 'default';
    const folder = sanitizeFolder(req.body.folder);
    const tenantDir = folder ? path.join(uploadDir, folder, tenantId) : path.join(uploadDir, tenantId);
    
    fs.mkdirSync(tenantDir, { recursive: true });
    
    // Compress product images (skip carousel images)
    let fileBuffer = req.file.buffer;
    let fileExtension = path.extname(req.file.originalname) || '.jpg';
    
    if (!folder || folder !== 'carousel') {
      // This is a product image - compress it
      fileBuffer = await compressProductImage(req.file.buffer, req.file.originalname);
      // Force .webp extension for compressed images
      fileExtension = '.webp';
    }
    
    const filename = `${uuidv4()}${fileExtension}`;
    fs.writeFileSync(path.join(tenantDir, filename), fileBuffer);
    
    const imageUrl = getImageUrl(folder, tenantId, filename);
    console.log(`[upload] Image saved: ${imageUrl} (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
    
    res.json({ success: true, imageUrl, imageId: filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
  }
});

// DELETE /api/upload - Delete image
router.delete('/api/upload', (req: Request, res: Response) => {
  try {
    const { imageUrl, tenantId = 'default' } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: 'Image URL is required' });

    const relative = String(imageUrl).replace(/^https?:\/\/[^/]+/i, '').trim();
    if (!relative.startsWith('/uploads/images/')) return res.status(400).json({ success: false, error: 'Invalid image URL' });

    const parts = relative.split('/').filter(Boolean);
    const hasFolder = ALLOWED_FOLDERS.has(parts[2]);
    const [resolvedTenantId, filename] = hasFolder ? [parts[3], parts[4]] : [parts[2], parts[3]];

    if (!resolvedTenantId || !filename) return res.status(400).json({ success: false, error: 'Invalid image URL' });
    if (resolvedTenantId !== tenantId) return res.status(403).json({ success: false, error: 'Tenant mismatch' });

    const filePath = hasFolder
      ? path.join(uploadDir, parts[2], resolvedTenantId, filename)
      : path.join(uploadDir, resolvedTenantId, filename);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// POST /api/upload/fix-base64 - Convert base64 to file
router.post('/api/upload/fix-base64', express.json({ limit: '50mb' }), (req: Request, res: Response) => {
  try {
    const { base64Data, tenantId, folder, filename } = req.body;
    if (!base64Data || !tenantId) return res.status(400).json({ success: false, error: 'base64Data and tenantId are required' });

    const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ success: false, error: 'Invalid base64 image format' });

    const validatedFolder = sanitizeFolder(folder);
    const tenantDir = validatedFolder ? path.join(uploadDir, validatedFolder, tenantId) : path.join(uploadDir, tenantId);
    fs.mkdirSync(tenantDir, { recursive: true });

    const extMap: Record<string, string> = { webp: '.webp', png: '.png' };
    const ext = extMap[match[1] as string] || '.jpg';
    const finalFilename = filename || `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(tenantDir, finalFilename), Buffer.from(match[2], 'base64'));

    const imageUrl = getImageUrl(validatedFolder, tenantId, finalFilename);
    console.log(`[upload] Base64 converted: ${imageUrl}`);
    
    res.json({ success: true, imageUrl, imageId: finalFilename });
  } catch (error) {
    console.error('Base64 conversion error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Conversion failed' });
  }
});

export default router;
