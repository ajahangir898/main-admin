# Cloudflare Implementation Guide

This guide covers the complete Cloudflare integration for your e-commerce application, including CDN, R2 storage, and image optimization.

## Overview

The implementation includes:
- **Cloudflare CDN** - Caching and serving static assets from edge locations
- **Cloudflare R2** - Object storage for images and files (S3-compatible)
- **Cloudflare Image Resizing** - On-the-fly image transformations (Pro plan required)

## Quick Start

### 1. Enable Cloudflare CDN

Add these environment variables to your `.env` file:

```bash
# Enable CDN
VITE_CDN_ENABLED=true
VITE_CDN_PROVIDER=cloudflare
VITE_CDN_BASE_URL=https://cdn.yourdomain.com

# Image optimization (requires Cloudflare Pro for Image Resizing)
VITE_CDN_IMAGE_TRANSFORM=true
VITE_CDN_IMAGE_QUALITY=85
VITE_CDN_IMAGE_FORMAT=auto
```

### 2. Set Up Cloudflare R2 Storage (Optional)

For storing uploads on Cloudflare R2:

```bash
# R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Cloudflare Dashboard Setup

### Setting Up Your Domain

1. **Add your domain to Cloudflare**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click "Add a Site" and enter your domain
   - Follow the instructions to update your nameservers

2. **Enable Cloudflare Proxy (Orange Cloud)**
   - Go to DNS settings
   - Ensure the proxy status is "Proxied" (orange cloud) for your domain

3. **Configure SSL/TLS**
   - Go to SSL/TLS → Overview
   - Set to "Full (strict)" for best security

### Setting Up R2 Storage

1. **Create R2 Bucket**
   - Go to R2 in the sidebar
   - Click "Create bucket"
   - Name it (e.g., `systemnextit-uploads`)

2. **Create API Token**
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API token"
   - Select permissions: Object Read & Write
   - Copy the Access Key ID and Secret Access Key

3. **Connect Custom Domain** (for public access)
   - In your bucket settings, go to "Settings"
   - Click "Connect Domain"
   - Enter your subdomain (e.g., `cdn.yourdomain.com`)

### Enabling Image Resizing (Pro Plan)

1. **Upgrade to Pro plan** (if needed)
   - Go to your domain's Overview
   - Click "Upgrade" and select Pro

2. **Enable Image Resizing**
   - Go to Speed → Optimization → Image Resizing
   - Toggle "Enable Image Resizing"

3. **Configure settings**
   - Resize images from: Any origin
   - Image Resizing: On

## Usage in Code

### Frontend - Upload Files

```typescript
import { uploadFile, uploadMultipleFiles } from '@/utils/cloudflareUpload';

// Single file upload
const result = await uploadFile(file, {
  folder: 'products',
  tenantId: 'store-123',
  onProgress: (progress) => console.log(`${progress}%`)
});

if (result.success) {
  console.log('Uploaded to:', result.url);
}

// Multiple files upload
const results = await uploadMultipleFiles(files, {
  folder: 'gallery',
  tenantId: 'store-123'
});
```

### Frontend - Display Optimized Images

```typescript
import { getCDNImageUrl } from '@/config/cdnConfig';

// Get optimized image URL
const imageUrl = getCDNImageUrl('/uploads/product.jpg', {
  width: 400,
  height: 300,
  quality: 80,
  format: 'webp'
});

// Result: https://cdn.yourdomain.com/cdn-cgi/image/width=400,height=300,quality=80,format=webp/uploads/product.jpg
```

### React Component

```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/uploads/product.jpg"
  alt="Product Image"
  width={400}
  height={300}
  priority={false}
  placeholder="blur"
/>
```

## API Endpoints

### Check Status
```
GET /api/cloudflare/status
Response: { r2Configured: boolean, provider: 'cloudflare-r2' | 'local' }
```

### Upload Single File
```
POST /api/cloudflare/upload
Body: FormData with 'file', optional 'folder', 'tenantId'
Response: { success, url, key, size, contentType, provider }
```

### Upload Multiple Files
```
POST /api/cloudflare/upload-multiple
Body: FormData with 'files[]', optional 'folder', 'tenantId'
Response: { success, files: [...] }
```

### Delete File
```
DELETE /api/cloudflare/delete
Body: { url: string } or { key: string }
Response: { success: boolean }
```

### Get Presigned Upload URL
```
POST /api/cloudflare/presigned-url
Body: { filename, contentType, folder?, tenantId? }
Response: { success, uploadUrl, key, publicUrl }
```

## Caching Configuration

### Cloudflare Page Rules

Set up page rules for optimal caching:

1. **Static Assets** (CSS, JS, fonts)
   - URL: `*yourdomain.com/assets/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 year

2. **Images**
   - URL: `*yourdomain.com/uploads/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   - Browser Cache TTL: 1 year

3. **API Endpoints** (no caching)
   - URL: `*yourdomain.com/api/*`
   - Cache Level: Bypass

### Cache Headers (Backend)

The backend automatically sets appropriate cache headers:
- Static assets: `public, max-age=31536000, immutable`
- Dynamic API: `no-cache, no-store`

## Image Transformation URL Format

Cloudflare Image Resizing uses this URL format:

```
https://yourdomain.com/cdn-cgi/image/{options}/{image_path}
```

### Options

| Parameter | Values | Description |
|-----------|--------|-------------|
| `width` | number | Target width in pixels |
| `height` | number | Target height in pixels |
| `quality` | 1-100 | JPEG/WebP quality |
| `format` | auto, webp, avif, jpeg, png | Output format |
| `fit` | cover, contain, scale-down, crop | Resize behavior |

### Examples

```
# Resize to 400px width
/cdn-cgi/image/width=400/uploads/image.jpg

# Convert to WebP with 80% quality
/cdn-cgi/image/format=webp,quality=80/uploads/image.jpg

# Resize and crop to 400x300
/cdn-cgi/image/width=400,height=300,fit=cover/uploads/image.jpg
```

## Security Best Practices

1. **Use HTTPS everywhere** - Cloudflare provides free SSL

2. **Enable WAF** (Web Application Firewall)
   - Go to Security → WAF
   - Enable managed rules

3. **Rate Limiting**
   - Go to Security → Rate Limiting
   - Create rules for API endpoints

4. **Bot Protection**
   - Go to Security → Bots
   - Enable Bot Fight Mode

5. **Hotlink Protection** (optional)
   - Go to Scrape Shield → Hotlink Protection
   - Prevents other sites from embedding your images

## Troubleshooting

### Images Not Loading from CDN

1. Check if CDN is enabled in `.env`
2. Verify Cloudflare proxy is active (orange cloud)
3. Check browser console for CORS errors

### R2 Upload Failures

1. Verify R2 credentials are correct
2. Check bucket permissions
3. Ensure bucket has public access or custom domain

### Image Resizing Not Working

1. Verify you have Cloudflare Pro plan
2. Check Image Resizing is enabled
3. Verify URL format is correct

### Cache Not Updating

1. Purge cache in Cloudflare dashboard
2. Check cache headers being set
3. Use cache busting query strings if needed

## Cost Estimation

### Cloudflare Free Plan
- CDN: Unlimited bandwidth
- R2: 10GB storage free, 10 million reads, 1 million writes
- No Image Resizing

### Cloudflare Pro Plan ($20/month)
- Everything in Free
- Image Resizing: Unlimited transformations
- WAF with managed rules
- Faster performance

### R2 Pricing (after free tier)
- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million
- Class B operations (reads): $0.36/million
- Egress: Free!

## Migration Guide

### From Local Storage to R2

1. Enable R2 configuration in `.env`
2. Run migration script:

```bash
# Future: Add migration script
node scripts/migrate-to-r2.js
```

3. Update existing image URLs in database
4. Test thoroughly
5. Remove local files after verification
