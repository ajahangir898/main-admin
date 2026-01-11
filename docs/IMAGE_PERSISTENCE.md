# Image URL Persistence - Complete Guide

This document explains how ALL image URLs are automatically saved to the MongoDB database by tenant ID.

## ✅ Automatic Persistence System

The application uses a **centralized persistence system** via the `useDataPersistence` hook that automatically saves ALL data changes to MongoDB, organized by tenant ID.

## 📦 Data Storage Structure

All tenant data is stored in MongoDB using this structure:

```javascript
{
  tenantId: "tenant-123",
  key: "products", // or "logo", "website_config", etc.
  data: [...], // The actual data
  updatedAt: "2026-01-09T19:00:00.000Z"
}
```

## 🖼️ Image Types & Their Storage

### 1. **Product Images** ✅
**Location**: `tenant_data` collection, key: `products`

```typescript
interface Product {
  id: number;
  image: string;              // Main product image URL
  galleryImages?: string[];   // Product gallery/carousel images
  tenantId: string;
  // ... other fields
}
```

**How it's saved**:
- When admin uploads product image → Stored in `product.image`
- When admin adds gallery images → Stored in `product.galleryImages[]`
- State update triggers `useDataPersistence` hook (line 160)
- Automatically saved to MongoDB with `tenantId`

**Code Reference**: `hooks/useDataPersistence.ts:136-161`

---

### 2. **Logo** ✅
**Location**: `tenant_data` collection, key: `logo`

```typescript
logo: string | null  // Logo URL
```

**How it's saved**:
- Admin uploads logo → Updates `logo` state
- `useDataPersistence` hook detects change (line 184-195)
- Saves to MongoDB: `{ tenantId, key: 'logo', data: logoUrl }`

**Code Reference**: `hooks/useDataPersistence.ts:184-195`

---

### 3. **Carousel/Banner Images** ✅
**Location**: `tenant_data` collection, key: `website_config`

```typescript
interface WebsiteConfig {
  carouselItems: CarouselItem[];
  favicon: string | null;
  headerLogo?: string | null;
  footerLogo?: string | null;
  // ... other fields
}

interface CarouselItem {
  id: string;
  image: string;        // Desktop carousel image
  mobileImage?: string; // Mobile carousel image
  name: string;
  url: string;
}
```

**How it's saved**:
- Admin adds/updates carousel items → Updates `websiteConfig.carouselItems`
- `useDataPersistence` hook detects change (line 210-223)
- Saves entire `websiteConfig` to MongoDB with `tenantId`

**Code Reference**: `hooks/useDataPersistence.ts:210-223`

---

### 4. **Favicon & Header/Footer Logos** ✅
**Location**: `tenant_data` collection, key: `website_config`

```typescript
interface WebsiteConfig {
  favicon: string | null;
  headerLogo?: string | null;
  footerLogo?: string | null;
}
```

**Same persistence as carousel images** (part of WebsiteConfig)

---

### 5. **Category/Brand Images** ✅
**Location**: `tenant_data` collection, keys: `categories`, `brands`

```typescript
interface Category {
  id: string;
  name: string;
  image?: string;  // Category image URL
  tenantId: string;
}

interface Brand {
  id: string;
  name: string;
  image?: string;  // Brand logo URL
  tenantId: string;
}
```

**How it's saved**:
- Admin uploads category/brand image → Updates category/brand state
- `useDataPersistence` hook saves (line 253+ for categories, etc.)
- Stored with `tenantId`

**Code Reference**: `hooks/useDataPersistence.ts:253-290`

---

## 🔄 How Persistence Works

### The Flow:

```
1. User Action (Upload/Update Image)
   ↓
2. Handler updates React State
   (e.g., setProducts, setLogo, setWebsiteConfig)
   ↓
3. useDataPersistence Hook Detects Change
   (via useEffect monitoring state)
   ↓
4. Compares with Previous Value
   (prevents unnecessary saves)
   ↓
5. Calls DataService.save() or DataService.saveImmediate()
   ↓
6. MongoDB Update
   { tenantId, key, data, updatedAt }
   ↓
7. Data Persisted! ✅
```

### Code Locations:

**Main Persistence Hook**: `hooks/useDataPersistence.ts`
- Products: Lines 136-161
- Logo: Lines 184-195
- Website Config (Carousel, Favicon, etc.): Lines 210-223
- Delivery Config: Lines 225-237
- Courier Config: Lines 239-244
- Categories: Lines 253+
- Brands, Tags, etc.: Lines 270+

**Data Service**: `services/DataService.ts`
- `save()`: Debounced save (3 second delay)
- `saveImmediate()`: Immediate save (for critical data)

---

## 🎯 Key Features

### ✅ Automatic Deduplication
The system compares new data with previous state using `JSON.stringify()` to avoid unnecessary database writes.

### ✅ Socket Update Protection
When data arrives via WebSocket (real-time updates), the system flags it and skips persistence to avoid infinite loops.

### ✅ Tenant Isolation
Every piece of data is stored with `tenantId`, ensuring complete isolation between tenants.

### ✅ Race Condition Prevention
Uses `saveImmediate()` for critical data (products, theme) and debounced `save()` for less critical data.

---

## 📊 Example: Product with Images

When an admin creates/updates a product:

```typescript
const product = {
  id: 123,
  name: "Laptop Stand",
  image: "https://cdn.example.com/laptop-stand-main.jpg",
  galleryImages: [
    "https://cdn.example.com/laptop-stand-1.jpg",
    "https://cdn.example.com/laptop-stand-2.jpg",
    "https://cdn.example.com/laptop-stand-3.jpg"
  ],
  price: 2500,
  tenantId: "gadgetshop",
  // ... other fields
};

// Stored in MongoDB as:
{
  tenantId: "gadgetshop",
  key: "products",
  data: [product, ...otherProducts],
  updatedAt: "2026-01-09T19:00:00.000Z"
}
```

---

## 📊 Example: Carousel Images

When an admin adds carousel items:

```typescript
const websiteConfig = {
  websiteName: "Gadget Shop",
  carouselItems: [
    {
      id: "car-1",
      image: "https://cdn.example.com/banner-desktop-1.jpg",
      mobileImage: "https://cdn.example.com/banner-mobile-1.jpg",
      name: "Summer Sale",
      url: "/products"
    },
    {
      id: "car-2",
      image: "https://cdn.example.com/banner-desktop-2.jpg",
      mobileImage: "https://cdn.example.com/banner-mobile-2.jpg",
      name: "New Arrivals",
      url: "/new"
    }
  ],
  favicon: "https://cdn.example.com/favicon.ico",
  headerLogo: "https://cdn.example.com/header-logo.png",
  // ... other config
};

// Stored in MongoDB as:
{
  tenantId: "gadgetshop",
  key: "website_config",
  data: websiteConfig,
  updatedAt: "2026-01-09T19:00:00.000Z"
}
```

---

## 🔍 Verification

To verify images are being saved:

1. **Check MongoDB directly**:
```bash
db.tenant_data.find({ tenantId: "your-tenant-id", key: "products" })
db.tenant_data.find({ tenantId: "your-tenant-id", key: "logo" })
db.tenant_data.find({ tenantId: "your-tenant-id", key: "website_config" })
```

2. **Check browser console**:
- Look for `[DataService] Saving...` logs
- Check Network tab for POST/PUT requests to `/api/tenantData/:tenantId/:key`

3. **Test persistence**:
- Upload an image
- Refresh the page
- Image should still be there (loaded from database)

---

## ⚠️ Important Notes

1. **No Manual Save Needed**: Developers don't need to call `DataService.save()` manually. The `useDataPersistence` hook handles everything automatically.

2. **State is Truth**: Just update React state (via setProducts, setLogo, etc.) and persistence happens automatically.

3. **Tenant Switching**: When switching tenants, all refs are reset and new data is loaded from the new tenant's database.

4. **Image URLs Only**: The system stores image **URLs**, not the actual image files. Image files should be uploaded to a CDN/cloud storage first, then the URL is stored.

---

## 🚀 Summary

**ALL images are automatically saved to MongoDB by tenant ID**:

✅ Product images (main + gallery)  
✅ Logo  
✅ Carousel/Banner images  
✅ Favicon  
✅ Header/Footer logos  
✅ Category images  
✅ Brand logos  
✅ Any other image URLs in the system  

**No additional code needed** - the persistence system is already fully implemented and working! 🎉
