import { MongoClient } from 'mongodb';

async function check() {
  const client = new MongoClient('mongodb+srv://kamalmojumdar698_db_user:7qXvaLGRw6BItks1@cluster0.rqhicza.mongodb.net/');
  await client.connect();
  const db = client.db('seven_days');
  
  // Check all tenants and their carousels
  console.log('=== All Tenants ===');
  const tenants = await db.collection('tenants').find({}).toArray();
  
  for (const tenant of tenants) {
    const id = tenant._id.toString();
    console.log(`\nTenant: ${tenant.name} (${tenant.slug || tenant.subdomain})`);
    console.log(`  ID: ${id}`);
    
    const websiteConfig = await db.collection('tenant_data').findOne({ tenantId: id, key: 'website_config' });
    console.log(`  Carousel items: ${websiteConfig?.data?.carouselItems?.length || 0}`);
    
    const products = await db.collection('tenant_data').findOne({ tenantId: id, key: 'products' });
    console.log(`  Products: ${products?.data?.length || 0}`);
  }
  
  // Also check data with string tenant ID from logs
  console.log('\n=== Checking specific tenant ID ===');
  const specificId = '695d12eba327aa48196200fa';
  const config = await db.collection('tenant_data').findOne({ tenantId: specificId, key: 'website_config' });
  console.log(`Tenant ${specificId}:`);
  console.log(`  Carousel items: ${config?.data?.carouselItems?.length || 0}`);
  
  if (config?.data?.carouselItems?.length > 0) {
    config.data.carouselItems.forEach((item, i) => {
      console.log(`    ${i + 1}. "${item.name}" - ${item.status} - ${item.image?.substring(0, 60)}...`);
    });
  }
  
  await client.close();
}

check().catch(console.error);
