// MongoDB Verification Scripts for Data Loss Testing
// Run these in MongoDB Compass or MongoDB Shell

// ============================================
// 1. Check Current Website Config
// ============================================
db.tenant_data.findOne(
  { 
    tenantId: "your-tenant-id-here",  // Replace with your actual tenant ID
    key: "website_config" 
  },
  {
    "data.carouselItems": 5,
    "data.categorySectionStyle": 1,
    "data.campaigns": 1,
    updatedAt: 1,
    _id: 0
  }
)

// ============================================
// 2. Count Carousel Items
// ============================================
db.tenant_data.aggregate([
  {
    $match: {
      tenantId: "your-tenant-id-here",
      key: "website_config"
    }
  },
  {
    $project: {
      carouselCount: { $size: { $ifNull: ["$data.carouselItems", []] } },
      campaignCount: { $size: { $ifNull: ["$data.campaigns", []] } },
      categorySectionStyle: "$data.categorySectionStyle",
      lastUpdated: "$updatedAt"
    }
  }
])

// ============================================
// 3. List All Carousel Items with Details
// ============================================
db.tenant_data.findOne(
  { 
    tenantId: "your-tenant-id-here",
    key: "website_config" 
  }
).data.carouselItems.map((item, index) => ({
  index: index + 1,
  id: item.id,
  name: item.name,
  status: item.status,
  serial: item.serial,
  hasImage: !!item.image,
  hasMobileImage: !!item.mobileImage
}))

// ============================================
// 4. Watch for Real-time Changes (MongoDB 4.0+)
// ============================================
// This will show you changes as they happen
const changeStream = db.tenant_data.watch([
  {
    $match: {
      "fullDocument.key": "website_config"
    }
  }
]);

changeStream.on("change", (change) => {
  print("=== Website Config Changed ===");
  print("Operation: " + change.operationType);
  if (change.fullDocument) {
    print("Carousel Count: " + (change.fullDocument.data.carouselItems?.length || 0));
    print("Category Style: " + change.fullDocument.data.categorySectionStyle);
    print("Updated At: " + change.fullDocument.updatedAt);
  }
});

// ============================================
// 5. History Check (if you have timestamps)
// ============================================
db.tenant_data.find(
  { 
    tenantId: "your-tenant-id-here",
    key: "website_config"
  }
).sort({ updatedAt: -1 }).limit(5).forEach(doc => {
  print("=== Update at: " + doc.updatedAt + " ===");
  print("Carousel items: " + (doc.data.carouselItems?.length || 0));
  print("Category style: " + doc.data.categorySectionStyle);
  print("---");
});

// ============================================
// 6. Verify Data After Save
// ============================================
// Run this immediately after clicking Save in admin panel
const config = db.tenant_data.findOne({ 
  tenantId: "your-tenant-id-here",
  key: "website_config" 
});

print("=== Verification Results ===");
print("✓ Carousel Items: " + (config.data.carouselItems?.length || 0));
print("✓ Category Style: " + config.data.categorySectionStyle);
print("✓ Campaigns: " + (config.data.campaigns?.length || 0));
print("✓ Last Updated: " + config.updatedAt);
print("========================");

if (config.data.carouselItems?.length >= 8) {
  print("✅ SUCCESS: All carousel items preserved!");
} else {
  print("❌ FAILED: Carousel items lost!");
}
