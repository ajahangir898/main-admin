const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://mdshimul:mdshimul@cluster0.7uvsa.mongodb.net/seven_days?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('seven_days');
    
    // Find landing pages
    const landingPagesDoc = await db.collection('tenant_data').findOne({
      tenantId: '695d12eba327aa48196200fa',
      key: 'landing_pages'
    });
    
    console.log('Landing Pages Document:');
    console.log('Count:', landingPagesDoc?.data?.length || 0);
    if (landingPagesDoc?.data) {
      console.log('Pages:', landingPagesDoc.data.map(p => ({ id: p.id, name: p.name })));
    }
    
    // Find orders
    const ordersDoc = await db.collection('tenant_data').findOne({
      tenantId: '695d12eba327aa48196200fa',
      key: 'orders'
    });
    
    console.log('\nOrders Document:');
    console.log('Count:', ordersDoc?.data?.length || 0);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
