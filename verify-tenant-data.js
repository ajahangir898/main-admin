var db = db.getSiblingDB('ecommerce');

var tenantId = "6951929bba8ac9d0fe70afa7";

print("=== Checking Tenant: " + tenantId + " ===\n");

var config = db.tenant_data.findOne({ 
  tenantId: tenantId, 
  key: "website_config" 
});

if (config) {
  print("✓ Website Config Found");
  print("  Carousel Items: " + (config.data.carouselItems ? config.data.carouselItems.length : 0));
  print("  Category Style: " + (config.data.categorySectionStyle || "none"));
  print("  Campaigns: " + (config.data.campaigns ? config.data.campaigns.length : 0));
  print("  Last Updated: " + config.updatedAt);
  
  if (config.data.carouselItems && config.data.carouselItems.length > 0) {
    print("\n=== Carousel Items ===");
    config.data.carouselItems.forEach(function(item, idx) {
      print("  " + (idx + 1) + ". " + item.name + " (ID: " + item.id + ", Status: " + item.status + ")");
    });
  } else {
    print("\n⚠ WARNING: No carousel items found!");
  }
  
  print("\n=== Full Config Preview ===");
  print(JSON.stringify({
    carouselCount: config.data.carouselItems ? config.data.carouselItems.length : 0,
    campaignCount: config.data.campaigns ? config.data.campaigns.length : 0,
    categorySectionStyle: config.data.categorySectionStyle,
    hasFooterLinks: !!config.data.footerQuickLinks,
    updatedAt: config.updatedAt
  }, null, 2));
} else {
  print("✗ No website_config found for this tenant!");
}
