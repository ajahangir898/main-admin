import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Try to import sharp, but make it optional
let sharp: any = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[ImageOptimize] Sharp not installed - image optimization disabled. Run: npm install sharp');
}

const router = express.Router();

// Cache for optimized images (in-memory for dev, use CDN in production)
const imageCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100; // Max cached images

/**
 * Image optimization route
 * Supports: ?w=width&h=height&q=quality&f=format
 * Example: /uploads/images/product.jpg?w=400&q=75
 */
router.get('/images/*', async (req: Request, res: Response) => {
  try {
    const imagePath = req.params[0];
    const fullPath = path.join(process.cwd(), 'uploads', 'images', imagePath);
    
    // Check if original file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Parse optimization parameters
    const width = parseInt(req.query.w as string) || undefined;
    const height = parseInt(req.query.h as string) || undefined;
    const quality = Math.min(100, Math.max(1, parseInt(req.query.q as string) || 80));
    const format = (req.query.f as string) || 'webp';

    // If no optimization needed or sharp not available, serve original
    if (!sharp || (!width && !height && !req.query.q && !req.query.f)) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      return res.sendFile(fullPath);
    }

    // Generate cache key
    const cacheKey = `${imagePath}:${width}:${height}:${quality}:${format}`;
    
    // Check cache
    if (imageCache.has(cacheKey)) {
      const cached = imageCache.get(cacheKey)!;
      res.set({
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Image-Optimized': 'true',
        'X-Cache': 'HIT'
      });
      return res.send(cached);
    }

    // Process image with sharp
    let pipeline = sharp(fullPath);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to desired format
    let buffer: Buffer;
    switch (format) {
      case 'webp':
        buffer = await pipeline.webp({ quality }).toBuffer();
        break;
      case 'jpeg':
      case 'jpg':
        buffer = await pipeline.jpeg({ quality, progressive: true }).toBuffer();
        break;
      case 'png':
        buffer = await pipeline.png({ quality: Math.min(quality, 9) }).toBuffer();
        break;
      case 'avif':
        buffer = await pipeline.avif({ quality }).toBuffer();
        break;
      default:
        buffer = await pipeline.webp({ quality }).toBuffer();
    }

    // Cache the result (with LRU eviction)
    if (imageCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, buffer);

    // Send optimized image
    res.set({
      'Content-Type': `image/${format === 'jpg' ? 'jpeg' : format}`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Image-Optimized': 'true',
      'X-Original-Size': (await fs.promises.stat(fullPath)).size.toString(),
      'X-Optimized-Size': buffer.length.toString(),
      'X-Cache': 'MISS'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('[ImageOptimize] Error:', error);
    
    // Fallback: try to serve original
    try {
      const imagePath = req.params[0];
      const fullPath = path.join(process.cwd(), 'uploads', 'images', imagePath);
      if (fs.existsSync(fullPath)) {
        return res.sendFile(fullPath);
      }
    } catch {}
    
    res.status(500).json({ error: 'Image processing failed' });
  }
});

/**
 * Clear image cache (for admin use)
 */
router.post('/clear-cache', (_req: Request, res: Response) => {
  const size = imageCache.size;
  imageCache.clear();
  res.json({ message: `Cleared ${size} cached images` });
});

export default router;
