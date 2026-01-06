# Product Seeding Guide

This guide explains how to seed 30 default products into the database for faisal.systrmnextit.com.

## Prerequisites

- MongoDB must be running and accessible
- Backend dependencies must be installed (`npm install` in the `/backend` directory)
- **IMPORTANT**: Proper `.env` file must be configured in the `/backend` directory with `MONGODB_URI`
- A tenant with subdomain containing "faisal" must exist in the database

## Running the Product Seed Script

### Method 1: Using standalone JavaScript (Easiest - No TypeScript required)

```bash
cd backend
node src/scripts/seedProductsStandalone.js
```

This method works with just Node.js and doesn't require TypeScript compilation. Perfect for running directly on the server.

### Method 2: Using npm script

```bash
cd backend
npm run seed:products
```

### Method 3: Using ts-node directly

```bash
cd backend
npx ts-node src/scripts/seedProducts.ts
```

### Method 4: Using compiled JavaScript

```bash
cd backend
npm run build
node dist/scripts/seedProducts.js
```

## What Gets Seeded

The script will insert **30 diverse products** from the following categories:

1. **Electronics** (5 products)
   - Wireless Bluetooth Headphones
   - Smart Watch Pro
   - Portable Power Bank
   - USB-C Hub
   - Wireless Gaming Mouse

2. **Fashion** (7 products)
   - Men's Casual Cotton T-Shirt
   - Women's Summer Dress
   - Leather Wallet
   - Designer Sunglasses
   - Casual Sneakers
   - Women's Handbag
   - Men's Formal Shirt

3. **Home & Living** (6 products)
   - Ceramic Coffee Mug Set
   - LED Desk Lamp
   - Cotton Bed Sheet Set
   - Wall Clock
   - Non-Stick Cookware Set
   - Decorative Cushion Covers

4. **Sports & Outdoors** (4 products)
   - Yoga Mat with Bag
   - Adjustable Dumbbells Set
   - Camping Backpack
   - Sports Water Bottle

5. **Beauty & Health** (3 products)
   - Skincare Gift Set
   - Electric Toothbrush
   - Fitness Tracker Band

6. **Books & Stationery** (2 products)
   - Premium Notebook Set
   - Art Supplies Kit

7. **Toys & Games** (2 products)
   - Building Blocks Set
   - Board Game Collection

8. **Food & Beverages** (1 product)
   - Premium Green Tea Box

## Product Features

Each product includes:
- **Unique ID** and SKU
- **Name** and slug
- **Pricing**: Regular price, original price, and cost price
- **Images**: Professional product images from Unsplash
- **Categories**: Main category, subcategory, and brand
- **Tags**: Search and filter tags
- **Descriptions**: Detailed product descriptions
- **Stock levels**: Realistic inventory counts
- **Ratings & Reviews**: Sample ratings and review counts
- **Variants**: Colors and sizes where applicable
- **Status**: All products are set to "Active"

## Tenant Configuration

The script **requires** a tenant with "faisal" in the subdomain to exist in the database:

1. The script searches for any tenant where the subdomain contains "faisal" (case-insensitive)
2. If found, it uses that tenant's ID for seeding products
3. **If not found, the script exits without seeding** to prevent data inconsistency

### Creating the Faisal Tenant

If the tenant doesn't exist yet, you need to create it first:

1. Use the admin panel to create a new tenant
2. Set the subdomain to include "faisal" (e.g., "faisal" or "faisal.systrmnextit")
3. Then run the seed script

Alternatively, you can modify the script to use a specific existing tenant ID.

## Important Notes

- **Existing Data**: If products already exist for the tenant, they will be **replaced** with the new seed data
- **Database**: Products are stored in the `tenant_data` collection with key `products`
- **Images**: All product images use Unsplash URLs (free, high-quality stock photos)

## Verifying the Seeded Products

After running the script, you can verify the products in several ways:

### 1. Using MongoDB Shell

```javascript
db.tenant_data.findOne({ key: "products" })
```

### 2. Using the Admin UI

Navigate to the Products page in your admin panel to see all 30 products.

### 3. Check the script output

The script will display:
- Total number of products seeded
- Breakdown by category
- Success/error messages

## Troubleshooting

### MongoDB Connection Error

If you see `ECONNREFUSED` errors:
- Ensure MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Verify network connectivity to MongoDB

### Missing MONGODB_URI Error

If you see "MONGODB_URI environment variable is required":
- Create a `.env` file in the `backend` directory
- Add: `MONGODB_URI=mongodb://username:password@host:port/dbname?authSource=admin`
- Replace with your actual MongoDB credentials

### TypeScript Compilation Errors

If you encounter TypeScript errors:
- Ensure all dependencies are installed: `npm install`
- Check that `ts-node` is available in `node_modules`

### Tenant Not Found

If "Faisal tenant not found in database":
- **The script will exit without seeding** to prevent data inconsistency
- Create a tenant with subdomain containing "faisal" first
- Or modify the script to use a specific existing tenant ID (see below)

## Customization

To modify the products, edit `/backend/src/scripts/seedProducts.ts`:
- Change product details in the `PRODUCTS` array
- Add or remove products
- Modify categories
- Update pricing or stock levels

After making changes, re-run the seed script to update the database.

### Using a Specific Tenant ID

If you want to seed products for a different tenant, edit the script:

In `seedProductsStandalone.js` or `seedProducts.ts`, find this section:

```javascript
// Look for faisal tenant
let faisalTenant = tenants.find(t => 
  t.subdomain && t.subdomain.toLowerCase().includes('faisal')
);
```

Replace it with:

```javascript
// Use a specific tenant ID
const tenantId = 'your-tenant-id-here';
console.log(`Using tenant ID: ${tenantId}`);
// Skip the tenant search and directly use this ID
```

