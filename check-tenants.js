// List all tenants
print("=== All Tenant IDs ===");
db.tenant_data.distinct("tenantId").forEach(t => print(t));

print("\n=== Website Configs ===");
db.tenant_data.find({ key: "website_config" }).forEach(doc => {
  print("\nTenant: " + doc.tenantId);
  print("Carousels: " + (doc.data.carouselItems ? doc.data.carouselItems.length : 0));
  print("Campaigns: " + (doc.data.campaigns ? doc.data.campaigns.length : 0));
  print("Category Style: " + (doc.data.categorySectionStyle || "none"));
  print("Updated: " + doc.updatedAt);
});

print("\n=== Most Recent Update ===");
var recent = db.tenant_data.find({ key: "website_config" }).sort({ updatedAt: -1 }).limit(1).toArray()[0];
if (recent) {
  print("Tenant: " + recent.tenantId);
  print("Carousels: " + (recent.data.carouselItems ? recent.data.carouselItems.length : 0));
  print("Updated: " + recent.updatedAt);
}
