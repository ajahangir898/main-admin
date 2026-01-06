# CDN Setup Guide

This guide explains how to configure a CDN (Content Delivery Network) for your e-commerce admin application to improve performance and reduce server load.

## Benefits of Using a CDN

1. **Faster Load Times**: Assets are served from edge locations closer to your users
2. **Reduced Server Load**: Static assets are cached on the CDN
3. **Better Scalability**: Handle traffic spikes without affecting your origin server
4. **Image Optimization**: Many CDNs offer on-the-fly image transformations
5. **Global Availability**: Better experience for international users

## Supported CDN Providers

The application supports the following CDN providers out of the box:

- **Cloudflare** - Popular choice with free tier and image resizing
- **CloudFront** (AWS) - Integrates well with S3 and other AWS services
- **BunnyCDN** - Cost-effective with good performance
- **Custom** - Any CDN that supports standard query parameters

## Configuration

### Environment Variables

Add the following variables to your `.env` or `.env.production` file:

```bash
# Enable CDN (set to 'true' to activate)
VITE_CDN_ENABLED=true

# CDN Provider: cloudflare, cloudfront, bunnycdn, or custom
VITE_CDN_PROVIDER=cloudflare

# Base CDN URL (your CDN domain)
VITE_CDN_BASE_URL=https://cdn.yourdomain.com

# Optional: Separate URLs for images and static assets
VITE_CDN_IMAGE_URL=https://images.yourdomain.com
VITE_CDN_STATIC_URL=https://static.yourdomain.com

# Image transformation settings (optional)
VITE_CDN_IMAGE_TRANSFORM=true
VITE_CDN_IMAGE_QUALITY=80
VITE_CDN_IMAGE_FORMAT=auto  # auto, webp, avif, original
```

## Provider-Specific Setup

### Cloudflare

1. **Create a Cloudflare account** at [cloudflare.com](https://cloudflare.com)

2. **Add your domain** to Cloudflare and update your DNS nameservers

3. **Enable Cloudflare CDN** (orange cloud icon) for your domain

4. **Configure caching**:
   - Go to **Caching** > **Configuration**
   - Set **Caching Level** to "Standard"
   - Enable **Always Online**

5. **Enable Image Resizing** (optional, requires Pro plan):
   - Go to **Speed** > **Optimization** > **Image Resizing**
   - Enable the feature

6. **Configure environment variables**:
   ```bash
   VITE_CDN_ENABLED=true
   VITE_CDN_PROVIDER=cloudflare
   VITE_CDN_BASE_URL=https://cdn.yourdomain.com
   VITE_CDN_IMAGE_TRANSFORM=true
   ```

### AWS CloudFront

1. **Create an S3 bucket** for your assets (or use your existing origin)

2. **Create a CloudFront distribution**:
   - Go to CloudFront console
   - Click "Create Distribution"
   - Set your origin (S3 bucket or custom origin)
   - Configure cache behaviors

3. **Set up Origin Access Control** (for S3):
   - Create an OAC policy
   - Update your S3 bucket policy

4. **Configure caching**:
   - Set appropriate TTL values
   - Enable compression

5. **Optional: Set up Lambda@Edge** for image optimization:
   - Deploy the [Serverless Image Handler](https://aws.amazon.com/solutions/implementations/serverless-image-handler/)

6. **Configure environment variables**:
   ```bash
   VITE_CDN_ENABLED=true
   VITE_CDN_PROVIDER=cloudfront
   VITE_CDN_BASE_URL=https://d1234567890.cloudfront.net
   VITE_CDN_IMAGE_TRANSFORM=true
   ```

### BunnyCDN

1. **Create a BunnyCDN account** at [bunny.net](https://bunny.net)

2. **Create a Pull Zone**:
   - Go to CDN > Pull Zones
   - Add a new pull zone
   - Set your origin URL

3. **Configure caching**:
   - Enable "Smart Caching"
   - Set cache expiration times

4. **Enable Bunny Optimizer** (optional):
   - Enable image optimization
   - Configure WebP conversion

5. **Configure environment variables**:
   ```bash
   VITE_CDN_ENABLED=true
   VITE_CDN_PROVIDER=bunnycdn
   VITE_CDN_BASE_URL=https://yourzone.b-cdn.net
   VITE_CDN_IMAGE_TRANSFORM=true
   ```

## Usage in Code

### Using CDN for Images

```typescript
import { getCDNImageUrl } from './config/cdnConfig';

// Basic usage
const imageUrl = getCDNImageUrl('/uploads/images/product.jpg');

// With transformations
const thumbnailUrl = getCDNImageUrl('/uploads/images/product.jpg', {
  width: 200,
  height: 200,
  quality: 75,
  format: 'webp'
});
```

### Using the Performance Helper

```typescript
import { getOptimizedImageUrl } from './utils/performanceHelpers';

// Automatically uses CDN when enabled
const optimizedUrl = getOptimizedImageUrl(product.image, {
  width: 400,
  quality: 80
});
```

### In React Components

```tsx
import { getOptimizedImageUrl } from '../utils/performanceHelpers';

function ProductCard({ product }) {
  const imageUrl = getOptimizedImageUrl(product.image, {
    width: 300,
    height: 300,
    quality: 80,
    format: 'webp'
  });

  return (
    <div>
      <img 
        src={imageUrl} 
        alt={product.name}
        loading="lazy"
      />
    </div>
  );
}
```

## Build Configuration

When CDN is enabled, Vite will automatically:

1. Use the CDN URL as the base path for all assets
2. Generate asset URLs pointing to your CDN
3. Add appropriate cache headers

## Cache Invalidation

After deploying new assets, you may need to invalidate the CDN cache:

### Cloudflare
```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### CloudFront
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### BunnyCDN
```bash
curl -X POST "https://api.bunny.net/pullzone/{pull_zone_id}/purgeCache" \
  -H "AccessKey: YOUR_API_KEY"
```

## Best Practices

1. **Use hashed filenames**: Vite automatically adds content hashes to filenames, enabling long cache times

2. **Set appropriate cache headers**:
   - Static assets with hashes: 1 year
   - HTML files: No cache or short cache
   - API responses: Based on data freshness needs

3. **Enable compression**: Most CDNs support gzip/brotli compression

4. **Monitor performance**: Use tools like Lighthouse or WebPageTest to measure CDN impact

5. **Use responsive images**: Generate multiple sizes and let the CDN serve the appropriate one

## Troubleshooting

### Images not loading from CDN
- Verify `VITE_CDN_ENABLED=true` is set
- Check that `VITE_CDN_BASE_URL` is correct
- Ensure CORS is properly configured on your CDN

### Cache not updating
- Check cache TTL settings
- Purge the CDN cache after deployment
- Verify cache headers are correct

### Mixed content warnings
- Ensure your CDN URL uses HTTPS
- Check that all asset URLs are consistent

## Security Considerations

1. **Use HTTPS**: Always serve assets over HTTPS
2. **Enable Origin Shield**: Protect your origin server
3. **Configure WAF**: Enable Web Application Firewall if available
4. **Restrict access**: Use signed URLs for sensitive content
