import { config } from 'dotenv';
config();

import { getDatabase } from '../db/mongo';
import { disconnectMongo } from '../db/mongo';

// Define 30 diverse products
const PRODUCTS = [
  // Electronics (1-5)
  {
    id: 1,
    name: 'Wireless Bluetooth Headphones',
    price: 4999,
    originalPrice: 6999,
    costPrice: 3500,
    sku: 'WBH-001',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    category: 'Electronics',
    subCategory: 'Audio',
    brand: 'TechSound',
    tags: ['wireless', 'bluetooth', 'audio'],
    description: 'Premium wireless Bluetooth headphones with noise cancellation and 30-hour battery life.',
    stock: 50,
    status: 'Active',
    rating: 4.5,
    reviews: 128,
    slug: 'wireless-bluetooth-headphones'
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    price: 8999,
    originalPrice: 12999,
    costPrice: 6500,
    sku: 'SWP-002',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    category: 'Electronics',
    subCategory: 'Wearables',
    brand: 'FitTrack',
    tags: ['smartwatch', 'fitness', 'health'],
    description: 'Advanced fitness tracker with heart rate monitor, GPS, and waterproof design.',
    stock: 35,
    status: 'Active',
    rating: 4.7,
    reviews: 256,
    slug: 'smart-watch-pro'
  },
  {
    id: 3,
    name: 'Portable Power Bank 20000mAh',
    price: 2499,
    originalPrice: 3499,
    costPrice: 1800,
    sku: 'PPB-003',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800',
    category: 'Electronics',
    subCategory: 'Accessories',
    brand: 'PowerCore',
    tags: ['powerbank', 'charging', 'portable'],
    description: 'High-capacity portable charger with fast charging support for multiple devices.',
    stock: 100,
    status: 'Active',
    rating: 4.3,
    reviews: 89,
    slug: 'portable-power-bank-20000mah'
  },
  {
    id: 4,
    name: 'USB-C Hub 7-in-1',
    price: 1999,
    originalPrice: 2999,
    costPrice: 1200,
    sku: 'UCH-004',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800',
    category: 'Electronics',
    subCategory: 'Accessories',
    brand: 'ConnectPro',
    tags: ['usb-c', 'hub', 'adapter'],
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery.',
    stock: 75,
    status: 'Active',
    rating: 4.6,
    reviews: 145,
    slug: 'usb-c-hub-7-in-1'
  },
  {
    id: 5,
    name: 'Wireless Gaming Mouse',
    price: 3499,
    originalPrice: 4999,
    costPrice: 2500,
    sku: 'WGM-005',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800',
    category: 'Electronics',
    subCategory: 'Gaming',
    brand: 'GameTech',
    tags: ['gaming', 'mouse', 'wireless'],
    description: 'RGB wireless gaming mouse with programmable buttons and 16000 DPI sensor.',
    stock: 60,
    status: 'Active',
    rating: 4.8,
    reviews: 312,
    slug: 'wireless-gaming-mouse'
  },

  // Fashion (6-12)
  {
    id: 6,
    name: 'Men\'s Casual Cotton T-Shirt',
    price: 799,
    originalPrice: 1299,
    costPrice: 500,
    sku: 'MCT-006',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    category: 'Fashion',
    subCategory: 'Men\'s Clothing',
    brand: 'StyleHub',
    tags: ['tshirt', 'casual', 'cotton'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#000000', '#FFFFFF', '#3B82F6', '#EF4444'],
    description: 'Premium cotton t-shirt with comfortable fit and breathable fabric.',
    stock: 200,
    status: 'Active',
    rating: 4.4,
    reviews: 567,
    slug: 'mens-casual-cotton-tshirt'
  },
  {
    id: 7,
    name: 'Women\'s Summer Dress',
    price: 1899,
    originalPrice: 2999,
    costPrice: 1200,
    sku: 'WSD-007',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    category: 'Fashion',
    subCategory: 'Women\'s Clothing',
    brand: 'Elegance',
    tags: ['dress', 'summer', 'fashion'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#F59E0B', '#EC4899', '#10B981'],
    description: 'Elegant floral summer dress perfect for casual outings and beach vacations.',
    stock: 80,
    status: 'Active',
    rating: 4.6,
    reviews: 234,
    slug: 'womens-summer-dress'
  },
  {
    id: 8,
    name: 'Leather Wallet for Men',
    price: 1499,
    originalPrice: 2499,
    costPrice: 900,
    sku: 'LWM-008',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
    category: 'Fashion',
    subCategory: 'Accessories',
    brand: 'LeatherCraft',
    tags: ['wallet', 'leather', 'accessories'],
    colors: ['#654321', '#000000'],
    description: 'Genuine leather wallet with multiple card slots and RFID protection.',
    stock: 120,
    status: 'Active',
    rating: 4.7,
    reviews: 456,
    slug: 'leather-wallet-men'
  },
  {
    id: 9,
    name: 'Designer Sunglasses',
    price: 2499,
    originalPrice: 3999,
    costPrice: 1500,
    sku: 'DSG-009',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    category: 'Fashion',
    subCategory: 'Accessories',
    brand: 'SunStyle',
    tags: ['sunglasses', 'fashion', 'eyewear'],
    description: 'UV protection sunglasses with polarized lenses and stylish frame.',
    stock: 90,
    status: 'Active',
    rating: 4.5,
    reviews: 178,
    slug: 'designer-sunglasses'
  },
  {
    id: 10,
    name: 'Casual Sneakers',
    price: 3999,
    originalPrice: 5999,
    costPrice: 2800,
    sku: 'CSN-010',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    category: 'Fashion',
    subCategory: 'Footwear',
    brand: 'StepUp',
    tags: ['sneakers', 'shoes', 'casual'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    colors: ['#FFFFFF', '#000000', '#3B82F6'],
    description: 'Comfortable casual sneakers with cushioned sole and breathable material.',
    stock: 150,
    status: 'Active',
    rating: 4.8,
    reviews: 892,
    slug: 'casual-sneakers'
  },
  {
    id: 11,
    name: 'Women\'s Handbag',
    price: 2999,
    originalPrice: 4499,
    costPrice: 2000,
    sku: 'WHB-011',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'Fashion',
    subCategory: 'Accessories',
    brand: 'BagCouture',
    tags: ['handbag', 'fashion', 'accessories'],
    colors: ['#000000', '#654321', '#DC2626'],
    description: 'Stylish leather handbag with multiple compartments and adjustable strap.',
    stock: 70,
    status: 'Active',
    rating: 4.6,
    reviews: 321,
    slug: 'womens-handbag'
  },
  {
    id: 12,
    name: 'Men\'s Formal Shirt',
    price: 1699,
    originalPrice: 2499,
    costPrice: 1100,
    sku: 'MFS-012',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
    category: 'Fashion',
    subCategory: 'Men\'s Clothing',
    brand: 'FormalFit',
    tags: ['shirt', 'formal', 'office'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#FFFFFF', '#3B82F6', '#1E40AF'],
    description: 'Premium formal shirt with wrinkle-free fabric, perfect for office wear.',
    stock: 110,
    status: 'Active',
    rating: 4.5,
    reviews: 267,
    slug: 'mens-formal-shirt'
  },

  // Home & Living (13-18)
  {
    id: 13,
    name: 'Ceramic Coffee Mug Set',
    price: 899,
    originalPrice: 1499,
    costPrice: 600,
    sku: 'CCM-013',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
    category: 'Home & Living',
    subCategory: 'Kitchenware',
    brand: 'HomeEssentials',
    tags: ['mug', 'coffee', 'ceramic'],
    description: 'Set of 4 elegant ceramic coffee mugs with ergonomic handles.',
    stock: 85,
    status: 'Active',
    rating: 4.4,
    reviews: 156,
    slug: 'ceramic-coffee-mug-set'
  },
  {
    id: 14,
    name: 'LED Desk Lamp',
    price: 1999,
    originalPrice: 2999,
    costPrice: 1300,
    sku: 'LDL-014',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
    category: 'Home & Living',
    subCategory: 'Lighting',
    brand: 'BrightHome',
    tags: ['lamp', 'led', 'desk'],
    description: 'Adjustable LED desk lamp with touch control and USB charging port.',
    stock: 95,
    status: 'Active',
    rating: 4.7,
    reviews: 234,
    slug: 'led-desk-lamp'
  },
  {
    id: 15,
    name: 'Cotton Bed Sheet Set',
    price: 2499,
    originalPrice: 3999,
    costPrice: 1700,
    sku: 'CBS-015',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    category: 'Home & Living',
    subCategory: 'Bedding',
    brand: 'ComfortLiving',
    tags: ['bedsheet', 'cotton', 'bedroom'],
    sizes: ['Single', 'Double', 'Queen', 'King'],
    colors: ['#FFFFFF', '#3B82F6', '#F59E0B'],
    description: 'Premium 100% cotton bed sheet set with pillow covers, soft and durable.',
    stock: 60,
    status: 'Active',
    rating: 4.6,
    reviews: 189,
    slug: 'cotton-bed-sheet-set'
  },
  {
    id: 16,
    name: 'Wall Clock Modern Design',
    price: 1299,
    originalPrice: 1999,
    costPrice: 800,
    sku: 'WCM-016',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800',
    category: 'Home & Living',
    subCategory: 'Decor',
    brand: 'TimeDecor',
    tags: ['clock', 'wall', 'decor'],
    description: 'Silent quartz wall clock with modern minimalist design.',
    stock: 120,
    status: 'Active',
    rating: 4.5,
    reviews: 298,
    slug: 'wall-clock-modern-design'
  },
  {
    id: 17,
    name: 'Non-Stick Cookware Set',
    price: 4999,
    originalPrice: 7999,
    costPrice: 3500,
    sku: 'NCS-017',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    category: 'Home & Living',
    subCategory: 'Kitchenware',
    brand: 'ChefPro',
    tags: ['cookware', 'kitchen', 'nonstick'],
    description: '7-piece non-stick cookware set with heat-resistant handles.',
    stock: 45,
    status: 'Active',
    rating: 4.8,
    reviews: 412,
    slug: 'non-stick-cookware-set'
  },
  {
    id: 18,
    name: 'Decorative Cushion Covers',
    price: 699,
    originalPrice: 1199,
    costPrice: 450,
    sku: 'DCC-018',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800',
    category: 'Home & Living',
    subCategory: 'Decor',
    brand: 'HomeStyle',
    tags: ['cushion', 'decor', 'living'],
    colors: ['#3B82F6', '#F59E0B', '#10B981', '#DC2626'],
    description: 'Set of 4 decorative cushion covers with vibrant patterns.',
    stock: 150,
    status: 'Active',
    rating: 4.3,
    reviews: 178,
    slug: 'decorative-cushion-covers'
  },

  // Sports & Outdoors (19-22)
  {
    id: 19,
    name: 'Yoga Mat with Bag',
    price: 1499,
    originalPrice: 2299,
    costPrice: 1000,
    sku: 'YMB-019',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
    category: 'Sports & Outdoors',
    subCategory: 'Fitness',
    brand: 'FitLife',
    tags: ['yoga', 'mat', 'fitness'],
    colors: ['#3B82F6', '#EC4899', '#10B981'],
    description: 'Extra thick yoga mat with carrying bag and strap, non-slip surface.',
    stock: 80,
    status: 'Active',
    rating: 4.6,
    reviews: 267,
    slug: 'yoga-mat-with-bag'
  },
  {
    id: 20,
    name: 'Adjustable Dumbbells Set',
    price: 3999,
    originalPrice: 5999,
    costPrice: 2800,
    sku: 'ADS-020',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    category: 'Sports & Outdoors',
    subCategory: 'Fitness',
    brand: 'StrongFit',
    tags: ['dumbbells', 'weights', 'fitness'],
    description: 'Adjustable dumbbell set (2.5kg to 25kg) with secure locking mechanism.',
    stock: 40,
    status: 'Active',
    rating: 4.7,
    reviews: 345,
    slug: 'adjustable-dumbbells-set'
  },
  {
    id: 21,
    name: 'Camping Backpack 50L',
    price: 3499,
    originalPrice: 5499,
    costPrice: 2400,
    sku: 'CBP-021',
    image: 'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800',
    category: 'Sports & Outdoors',
    subCategory: 'Camping',
    brand: 'OutdoorPro',
    tags: ['backpack', 'camping', 'hiking'],
    colors: ['#000000', '#22C55E', '#3B82F6'],
    description: 'Waterproof 50L camping backpack with multiple compartments.',
    stock: 55,
    status: 'Active',
    rating: 4.5,
    reviews: 189,
    slug: 'camping-backpack-50l'
  },
  {
    id: 22,
    name: 'Sports Water Bottle 1L',
    price: 599,
    originalPrice: 999,
    costPrice: 400,
    sku: 'SWB-022',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
    category: 'Sports & Outdoors',
    subCategory: 'Accessories',
    brand: 'HydroFlow',
    tags: ['bottle', 'water', 'sports'],
    colors: ['#3B82F6', '#000000', '#DC2626', '#10B981'],
    description: 'BPA-free sports water bottle with leak-proof cap and time markers.',
    stock: 200,
    status: 'Active',
    rating: 4.4,
    reviews: 456,
    slug: 'sports-water-bottle-1l'
  },

  // Beauty & Health (23-25)
  {
    id: 23,
    name: 'Skincare Gift Set',
    price: 2999,
    originalPrice: 4499,
    costPrice: 2000,
    sku: 'SGS-023',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800',
    category: 'Beauty & Health',
    subCategory: 'Skincare',
    brand: 'GlowEssence',
    tags: ['skincare', 'beauty', 'giftset'],
    description: 'Complete skincare gift set with cleanser, toner, serum, and moisturizer.',
    stock: 65,
    status: 'Active',
    rating: 4.7,
    reviews: 289,
    slug: 'skincare-gift-set'
  },
  {
    id: 24,
    name: 'Electric Toothbrush',
    price: 2499,
    originalPrice: 3999,
    costPrice: 1700,
    sku: 'ETB-024',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800',
    category: 'Beauty & Health',
    subCategory: 'Personal Care',
    brand: 'SmileBright',
    tags: ['toothbrush', 'electric', 'dental'],
    description: 'Rechargeable electric toothbrush with multiple brushing modes and timer.',
    stock: 75,
    status: 'Active',
    rating: 4.6,
    reviews: 234,
    slug: 'electric-toothbrush'
  },
  {
    id: 25,
    name: 'Fitness Tracker Band',
    price: 1999,
    originalPrice: 2999,
    costPrice: 1400,
    sku: 'FTB-025',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800',
    category: 'Beauty & Health',
    subCategory: 'Health',
    brand: 'HealthTrack',
    tags: ['fitness', 'tracker', 'health'],
    description: 'Activity tracker with heart rate monitor, sleep tracking, and step counter.',
    stock: 90,
    status: 'Active',
    rating: 4.5,
    reviews: 178,
    slug: 'fitness-tracker-band'
  },

  // Books & Stationery (26-27)
  {
    id: 26,
    name: 'Premium Notebook Set',
    price: 799,
    originalPrice: 1299,
    costPrice: 550,
    sku: 'PNS-026',
    image: 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=800',
    category: 'Books & Stationery',
    subCategory: 'Stationery',
    brand: 'WritePro',
    tags: ['notebook', 'stationery', 'writing'],
    description: 'Set of 3 premium hardcover notebooks with ruled pages.',
    stock: 120,
    status: 'Active',
    rating: 4.5,
    reviews: 267,
    slug: 'premium-notebook-set'
  },
  {
    id: 27,
    name: 'Art Supplies Kit',
    price: 1999,
    originalPrice: 2999,
    costPrice: 1400,
    sku: 'ASK-027',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    category: 'Books & Stationery',
    subCategory: 'Art Supplies',
    brand: 'ArtMaster',
    tags: ['art', 'supplies', 'drawing'],
    description: 'Complete art supplies kit with colored pencils, markers, and sketch pads.',
    stock: 70,
    status: 'Active',
    rating: 4.6,
    reviews: 198,
    slug: 'art-supplies-kit'
  },

  // Toys & Games (28-29)
  {
    id: 28,
    name: 'Building Blocks Set',
    price: 1499,
    originalPrice: 2299,
    costPrice: 1000,
    sku: 'BBS-028',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
    category: 'Toys & Games',
    subCategory: 'Educational Toys',
    brand: 'PlayLearn',
    tags: ['blocks', 'toys', 'educational'],
    description: '500-piece building blocks set for creative play and learning.',
    stock: 85,
    status: 'Active',
    rating: 4.7,
    reviews: 312,
    slug: 'building-blocks-set'
  },
  {
    id: 29,
    name: 'Board Game Collection',
    price: 2499,
    originalPrice: 3499,
    costPrice: 1700,
    sku: 'BGC-029',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800',
    category: 'Toys & Games',
    subCategory: 'Board Games',
    brand: 'FamilyFun',
    tags: ['boardgame', 'family', 'entertainment'],
    description: 'Classic board game collection for family entertainment.',
    stock: 60,
    status: 'Active',
    rating: 4.6,
    reviews: 245,
    slug: 'board-game-collection'
  },

  // Food & Beverages (30)
  {
    id: 30,
    name: 'Premium Green Tea Box',
    price: 899,
    originalPrice: 1499,
    costPrice: 600,
    sku: 'PGT-030',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
    category: 'Food & Beverages',
    subCategory: 'Beverages',
    brand: 'TeaEssence',
    tags: ['tea', 'green tea', 'beverages'],
    description: 'Premium organic green tea in elegant gift box, 50 tea bags.',
    stock: 110,
    status: 'Active',
    rating: 4.5,
    reviews: 234,
    slug: 'premium-green-tea-box'
  }
];

async function seedProducts() {
  console.log('\n🌱 Starting product seeding for faisal.systrmnextit.com...\n');
  
  const db = await getDatabase();
  
  try {
    // First, check if faisal tenant exists
    const tenants = await db.collection('entities').find({}).toArray();
    console.log('📋 Available tenants:');
    tenants.forEach((t: any) => {
      console.log(`  - ${t.subdomain || t.name} (ID: ${t._id})`);
    });
    
    // Look for faisal tenant
    let faisalTenant = tenants.find((t: any) => 
      t.subdomain && t.subdomain.toLowerCase().includes('faisal')
    );
    
    let tenantId: string;
    
    if (!faisalTenant) {
      console.log('\n⚠️  Warning: Faisal tenant not found in database.');
      console.log('Please choose one of the following options:');
      console.log('1. Create a tenant with subdomain containing "faisal"');
      console.log('2. Modify this script to use an existing tenant ID');
      console.log('\nExiting without seeding products...\n');
      return;
    } else {
      tenantId = faisalTenant._id.toString();
      console.log(`\n✅ Found Faisal tenant: ${faisalTenant.subdomain} (ID: ${tenantId})`);
    }
    
    // Check if products already exist
    const existingProducts = await db.collection('tenant_data').findOne({
      tenantId: tenantId,
      key: 'products'
    });
    
    if (existingProducts && existingProducts.data && existingProducts.data.length > 0) {
      console.log(`\n⚠️  Warning: Found ${existingProducts.data.length} existing products for this tenant.`);
      console.log('Products will be replaced with the new seed data.');
    }
    
    // Insert or update products
    const now = new Date().toISOString();
    await db.collection('tenant_data').updateOne(
      { tenantId: tenantId, key: 'products' },
      {
        $set: {
          tenantId: tenantId,
          key: 'products',
          data: PRODUCTS,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
    
    console.log(`\n✅ Successfully seeded ${PRODUCTS.length} products!`);
    console.log('\n📊 Product breakdown by category:');
    
    const categoryCounts: Record<string, number> = {};
    PRODUCTS.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    
    console.log('\n🎉 Product seeding completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await disconnectMongo();
  }
}

// Run the seeding
seedProducts().catch(error => {
  console.error('Failed to seed products:', error);
  process.exit(1);
});
