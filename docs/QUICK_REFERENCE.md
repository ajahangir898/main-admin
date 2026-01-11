# Quick Reference: What's Saved Where

## 🗄️ MongoDB Storage by Tenant ID

All data is stored in the `tenant_data` collection with this structure:
```javascript
{
  tenantId: "your-tenant-id",  // Isolates data by tenant
  key: "products",              // Data type
  data: [...],                  // Actual data
  updatedAt: "2026-01-09..."   // Timestamp
}
```

---

## 📦 Data Types & Keys

| What | MongoDB Key | Contains |
|------|-------------|----------|
| **Products** | `products` | Product info, main image, gallery images, prices, etc. |
| **Logo** | `logo` | Single logo URL string |
| **Website Config** | `website_config` | Carousel, favicon, header/footer logos, social links |
| **Theme Config** | `theme_config` | Colors, fonts, dark mode settings |
| **Orders** | `orders` | Customer orders |
| **Categories** | `categories` | Categories with images |
| **Subcategories** | `subcategories` | Subcategories |
| **Child Categories** | `childcategories` | Child categories |
| **Brands** | `brands` | Brand info with logos |
| **Tags** | `tags` | Product tags |
| **Delivery Config** | `delivery_config` | Shipping zones and prices |
| **Courier Config** | `courier` | Steadfast/Pathao settings |
| **Facebook Pixel** | `facebook_pixel` | Pixel ID and settings |
| **Landing Pages** | `landing_pages` | Landing page data |
| **Users** | `users` | Tenant users (staff, admins) |
| **Roles** | `roles` | Custom roles and permissions |

---

## 🖼️ Image Fields Reference

### Products
```typescript
{
  image: "https://cdn.example.com/product-main.jpg",
  galleryImages: [
    "https://cdn.example.com/gallery-1.jpg",
    "https://cdn.example.com/gallery-2.jpg"
  ]
}
```

### Website Config  
```typescript
{
  favicon: "https://cdn.example.com/favicon.ico",
  headerLogo: "https://cdn.example.com/header-logo.png",
  footerLogo: "https://cdn.example.com/footer-logo.png",
  carouselItems: [
    {
      image: "https://cdn.example.com/banner-desktop.jpg",
      mobileImage: "https://cdn.example.com/banner-mobile.jpg",
      name: "Sale Banner",
      url: "/sale"
    }
  ]
}
```

### Categories/Brands
```typescript
{
  id: "cat-1",
  name: "Electronics",
  image: "https://cdn.example.com/electronics-icon.png"
}
```

---

## 🔑 User Authentication

### Users Collection (Separate)
```javascript
// Collection: users
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$...",  // Bcrypt hashed
  role: "customer",
  tenantId: "gadgetshop",
  phone: "1234567890",
  isActive: true,
  createdAt: ISODate("..."),
  lastLogin: ISODate("...")
}
```

### JWT Tokens
Stored in browser `localStorage`:
- Key: `admin_auth_token`
- Value: JWT token (7-day expiry)

---

## 📝 Quick Commands

### Check Products
```bash
db.tenant_data.findOne({ tenantId: "gadgetshop", key: "products" })
```

### Check Images
```bash
# Logo
db.tenant_data.findOne({ tenantId: "gadgetshop", key: "logo" })

# Carousel
db.tenant_data.findOne({ tenantId: "gadgetshop", key: "website_config" })
```

### Check Users
```bash
db.users.find({ tenantId: "gadgetshop" })
```

### Check Specific User
```bash
db.users.findOne({ email: "customer@example.com" })
```

---

## ✅ What Happens Automatically

When admin:
1. ✅ Uploads product image → Auto-saved to `products` key
2. ✅ Adds gallery images → Auto-saved to `products` key
3. ✅ Changes logo → Auto-saved to `logo` key
4. ✅ Updates carousel → Auto-saved to `website_config` key
5. ✅ Uploads category image → Auto-saved to `categories` key
6. ✅ Changes theme colors → Auto-saved to `theme_config` key

When customer:
1. ✅ Signs up → Saved to `users` collection
2. ✅ Logs in → JWT token issued and stored
3. ✅ Places order → Saved to `orders` key
4. ✅ Updates profile → Updates `users` collection

**No manual saves needed - everything is automatic!** 🎉

---

## 🔍 Verification Checklist

After deploying, verify:

- [ ] Upload product → Check MongoDB → Product with images exists
- [ ] Change logo → Check MongoDB → Logo URL updated
- [ ] Add carousel → Check MongoDB → Carousel items exist
- [ ] User signs up → Check MongoDB users → User created
- [ ] User logs in → Check browser localStorage → Token exists
- [ ] Refresh page → All data loads correctly
- [ ] Switch tenants → Data isolated correctly

---

## 📚 More Info

See full documentation:
- **`IMAGE_PERSISTENCE.md`** - Complete image persistence guide
- **`AUTH_AND_IMAGES_SUMMARY.md`** - Full implementation summary
