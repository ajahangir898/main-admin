/**
 * Cloudflare R2 Upload Routes
 * 
 * Provides endpoints for uploading files to Cloudflare R2 storage.
 * Falls back to local storage if R2 is not configured.
 */

import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadToR2,
  deleteFromR2,
  isR2Configured,
  getSignedUploadUrl,
  extractKeyFromUrl,
  getPublicUrl,
} from '../services/cloudflareR2';

const router: Router = express.Router();

// Configure multer for memory storage (files go to R2) or disk storage (fallback)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/svg+xml',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// Local upload fallback directory
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure local upload directory exists
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

/**
 * Check if Cloudflare R2 is configured
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    r2Configured: isR2Configured(),
    provider: isR2Configured() ? 'cloudflare-r2' : 'local',
  });
});

/**
 * Upload a single file
 * POST /api/cloudflare/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folder = 'uploads', tenantId } = req.body;
    const uploadFolder = tenantId ? `tenants/${tenantId}/${folder}` : folder;

    if (isR2Configured()) {
      // Upload to Cloudflare R2
      const result = await uploadToR2(req.file.buffer, req.file.originalname, {
        folder: uploadFolder,
        contentType: req.file.mimetype,
      });

      if (result.success) {
        return res.json({
          success: true,
          url: result.url,
          key: result.key,
          size: result.size,
          contentType: result.contentType,
          provider: 'cloudflare-r2',
        });
      } else {
        return res.status(500).json({
          error: result.error || 'Failed to upload to R2',
        });
      }
    } else {
      // Fallback to local storage
      const timestamp = Date.now();
      const ext = path.extname(req.file.originalname);
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
      const folderPath = path.join(LOCAL_UPLOAD_DIR, uploadFolder);
      
      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const relativePath = path.join('/uploads', uploadFolder, filename).replace(/\\/g, '/');

      return res.json({
        success: true,
        url: relativePath,
        key: relativePath,
        size: req.file.size,
        contentType: req.file.mimetype,
        provider: 'local',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

/**
 * Upload multiple files
 * POST /api/cloudflare/upload-multiple
 */
router.post('/upload-multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { folder = 'uploads', tenantId } = req.body;
    const uploadFolder = tenantId ? `tenants/${tenantId}/${folder}` : folder;

    const results = await Promise.all(
      files.map(async (file) => {
        if (isR2Configured()) {
          const result = await uploadToR2(file.buffer, file.originalname, {
            folder: uploadFolder,
            contentType: file.mimetype,
          });
          return {
            originalName: file.originalname,
            ...result,
            provider: 'cloudflare-r2',
          };
        } else {
          // Local fallback
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
          const folderPath = path.join(LOCAL_UPLOAD_DIR, uploadFolder);
          
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          const filePath = path.join(folderPath, filename);
          fs.writeFileSync(filePath, file.buffer);

          const relativePath = path.join('/uploads', uploadFolder, filename).replace(/\\/g, '/');

          return {
            originalName: file.originalname,
            success: true,
            url: relativePath,
            key: relativePath,
            size: file.size,
            contentType: file.mimetype,
            provider: 'local',
          };
        }
      })
    );

    return res.json({
      success: true,
      files: results,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

/**
 * Delete a file
 * DELETE /api/cloudflare/delete
 */
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;

    if (!url && !key) {
      return res.status(400).json({ error: 'URL or key is required' });
    }

    const fileKey = key || extractKeyFromUrl(url);

    if (!fileKey) {
      return res.status(400).json({ error: 'Invalid URL or key' });
    }

    if (isR2Configured()) {
      const deleted = await deleteFromR2(fileKey);
      return res.json({ success: deleted });
    } else {
      // Local deletion
      const filePath = path.join(LOCAL_UPLOAD_DIR, fileKey.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true });
      }
      return res.json({ success: false, error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Delete failed',
    });
  }
});

/**
 * Get a pre-signed upload URL for direct client upload
 * POST /api/cloudflare/presigned-url
 */
router.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { filename, contentType, folder = 'uploads', tenantId } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and contentType are required' });
    }

    if (!isR2Configured()) {
      return res.status(400).json({
        error: 'R2 is not configured. Use regular upload endpoint.',
      });
    }

    const uploadFolder = tenantId ? `tenants/${tenantId}/${folder}` : folder;
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const sanitizedName = path.basename(filename, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
    const key = `${uploadFolder}/${sanitizedName}-${timestamp}${ext}`;

    const signedUrl = await getSignedUploadUrl(key, contentType);

    if (!signedUrl) {
      return res.status(500).json({ error: 'Failed to generate signed URL' });
    }

    return res.json({
      success: true,
      uploadUrl: signedUrl,
      key,
      publicUrl: getPublicUrl(key),
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate URL',
    });
  }
});

export default router;
