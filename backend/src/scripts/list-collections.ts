import { config } from 'dotenv';
config();

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

async function listCollections() {
  console.log('\n🔍 Listing all collections in MongoDB...\n');
  console.log(`📦 Database: ${MONGODB_DB_NAME}`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    // List all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('📚 Databases:');
    console.log('─────────────────────────────────────────');
    
    let totalCollections = 0;
    
    for (const dbInfo of databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      totalCollections += collections.length;
      
      console.log(`\n📁 ${dbInfo.name} (${collections.length} collections):`);
      
      if (collections.length > 0 && collections.length <= 20) {
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
      } else if (collections.length > 20) {
        // Show first 10 and last 5
        collections.slice(0, 10).forEach(col => {
          console.log(`   - ${col.name}`);
        });
        console.log(`   ... and ${collections.length - 15} more ...`);
        collections.slice(-5).forEach(col => {
          console.log(`   - ${col.name}`);
        });
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`📊 Total collections across all databases: ${totalCollections}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listCollections();
