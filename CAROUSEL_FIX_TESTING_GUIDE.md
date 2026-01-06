# Carousel Image Loading Fix - Testing Guide

## Problem
When adding carousel images from the tenant admin panel's Customization section, the images don't display in the front store. Instead, they show "Failed to load" or appear blank.

## Root Cause
The image URL helper was hardcoding the base URL to `https://systemnextit.com`, which caused issues:
1. In development environments (localhost)
2. For tenants on different domains
3. When the backend API URL differs from the frontend URL

## Solution
We've updated the image URL handling to use dynamic base URLs that adapt to the current environment:

1. **Dynamic Base URL**: Uses `window.location.origin` in the browser
2. **Environment Variable Support**: Falls back to `VITE_API_BASE_URL` if set
3. **Production Fallback**: Uses production URL only during SSR
4. **Lazy Evaluation**: Base URL is computed at runtime, not module-load time

## Changes Made

### 1. utils/imageUrlHelper.ts
- Added `getBaseUrl()` function for dynamic URL resolution
- Changed `UPLOADS_BASE_URL` to lazy function call
- Improved URL pattern handling (relative, localhost, external)
- Added support for various URL formats

### 2. components/OptimizedImage.tsx
- Added error logging for debugging (development only)
- Improved fallback mechanism for failed image loads
- Better error handling and reporting

### 3. components/store/HeroSection.tsx
- Changed objectFit from "contain" to "cover" for better display
- Added debug logging for carousel items (development only)
- Improved image loading and display

### 4. Tests
- Created `utils/imageUrlHelper.test.ts` with comprehensive coverage
- Updated `components/HeroSection.test.tsx` for new component structure
- Tests cover edge cases and various URL formats

## How to Test

### 1. Local Development Testing
```bash
# Start the development server
npm run dev

# Open browser console to see debug logs (only in development)
# The logs will show:
# - Number of carousel items loaded
# - Number of published items
# - First item's image URL
```

### 2. Add a Carousel in Admin Panel
1. Log in to the tenant admin panel
2. Navigate to Customization → Carousel tab
3. Click "Add Carousel"
4. Upload a desktop banner (recommended: 1280×330px)
5. Optionally upload a mobile banner (recommended: 800×450px)
6. Fill in the details:
   - Name: "Test Carousel"
   - URL: "#" or any valid URL
   - URL Type: Internal or External
   - Serial: 1
   - Status: Publish
7. Click "Save Carousel"
8. Save the customization changes

### 3. Verify in Front Store
1. Navigate to the store homepage
2. The carousel should be visible at the top
3. Check browser console for any errors
4. Verify:
   - ✅ Images load correctly
   - ✅ Images fill the container (no blank space)
   - ✅ Images transition smoothly (if multiple carousels)
   - ✅ Click navigation works (arrows and dots)
   - ✅ Mobile responsive (if mobile image uploaded)

### 4. Check Network Tab
Open browser DevTools → Network tab:
1. Filter by "Img" or "XHR"
2. Look for carousel image requests
3. Verify:
   - ✅ Status: 200 OK
   - ✅ URL format: `/uploads/images/carousel/<tenantId>/<filename>`
   - ✅ No CORS errors
   - ✅ No 404 errors

### 5. Test Different Environments

#### Localhost
- URL should be: `http://localhost:5173/uploads/images/carousel/...`
- Images should load from local backend

#### Production
- URL should be: `https://systemnextit.com/uploads/images/carousel/...`
- Images should load from production backend

### 6. Test Multiple Tenants
1. Create/switch to different tenant
2. Add carousel for that tenant
3. Verify each tenant's carousel loads correctly
4. Verify no cross-tenant image leakage

## Expected Behavior

### Before Fix
- ❌ Images show "Failed to load"
- ❌ Carousel appears blank
- ❌ Console shows 404 or CORS errors
- ❌ Wrong base URL in image requests

### After Fix
- ✅ Images load correctly
- ✅ Carousel displays properly
- ✅ No console errors
- ✅ Correct base URL in image requests
- ✅ Works in both development and production

## Debug Information

### Development Console Logs
When running in development mode, you'll see:
```
[HeroSection] Carousel items loaded: 3 items
[HeroSection] Published items: 2
[HeroSection] First item image URL: /uploads/images/carousel/tenant-id/image.webp
```

If an image fails to load:
```
[OptimizedImage] Failed to load image: {
  originalSrc: "/uploads/images/carousel/tenant-id/image.webp",
  optimizedSrc: "http://localhost:5173/uploads/images/carousel/tenant-id/image.webp?w=1600&q=85",
  useFallback: false
}
[OptimizedImage] Attempting fallback to original src
```

## Troubleshooting

### Images still not loading?

1. **Check backend is running**
   ```bash
   # Backend should be running on port 3000 (or configured port)
   curl http://localhost:3000/health
   ```

2. **Verify image file exists**
   ```bash
   ls uploads/images/carousel/<tenant-id>/
   ```

3. **Check CORS configuration**
   - Backend should allow requests from frontend origin
   - See `backend/src/index.ts` CORS configuration

4. **Verify environment variables**
   ```bash
   # Check if VITE_API_BASE_URL is set correctly
   echo $VITE_API_BASE_URL
   ```

5. **Clear browser cache**
   - Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or open in incognito/private mode

### Common Issues

1. **404 Not Found**
   - Image file doesn't exist on server
   - Check upload folder permissions
   - Verify tenant ID is correct

2. **CORS Error**
   - Backend CORS not configured for frontend domain
   - Check `backend/src/index.ts` CORS configuration

3. **Blank Carousel**
   - No published carousel items
   - Check status is "Publish", not "Draft"
   - Verify carousel query filters

## Files Changed
- `utils/imageUrlHelper.ts` - Dynamic base URL handling
- `components/OptimizedImage.tsx` - Better error handling
- `components/store/HeroSection.tsx` - Improved display and debug logging
- `utils/imageUrlHelper.test.ts` - Unit tests (new)
- `components/HeroSection.test.tsx` - Updated tests

## Next Steps
After testing and confirming the fix works:
1. Merge the PR
2. Deploy to staging for further testing
3. Monitor production for any issues
4. Update documentation if needed
