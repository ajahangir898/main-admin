var config = db.tenant_data.findOne({
  tenantId: "695d12eba327aa48196200fa",
  key: "website_config"
});

if (config && config.data) {
  print("=== Website Config Found ===");
  print("Carousel Items: " + (config.data.carouselItems ? config.data.carouselItems.length : 0));
  print("Category Style: " + (config.data.categorySectionStyle || "not set"));
  print("Campaigns: " + (config.data.campaigns ? config.data.campaigns.length : 0));
  print("Last Updated: " + config.updatedAt);
  print("");
  
  if (config.data.carouselItems && config.data.carouselItems.length > 0) {
    print("=== Carousel Items Details ===");
    config.data.carouselItems.forEach(function(item, idx) {
      print((idx + 1) + ". Name: " + item.name);
      print("   ID: " + item.id);
      print("   Status: " + item.status);
      print("   Serial: " + item.serial);
      print("   Has Image: " + (item.image ? "Yes" : "No"));
      print("   Has Mobile: " + (item.mobileImage ? "Yes" : "No"));
      print("");
    });
  } else {
    print("⚠️ WARNING: NO CAROUSEL ITEMS FOUND!");
  }
} else {
  print("❌ ERROR: No website_config found!");
}
