import { config } from 'dotenv';
config();

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

// Collections in CWS that might be unused/duplicates
const POTENTIALLY_UNUSED = [
  'preshops',      // might be temp data
  'otps',          // temp OTP data
  'otpadmins',     // temp OTP data
  'affiliates',    // if not using affiliates
  'affiliateproducts', // if not using affiliates
];

async function dropUnusedCollections() {
  console.log('\n🧹 Dropping unused collections in cws database...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB_NAME);
    
    // Check which collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`Current collections: ${collectionNames.length}`);
    
    let dropped = 0;
    for (const colName of POTENTIALLY_UNUSED) {
      if (collectionNames.includes(colName)) {
        try {
          // Check if empty first
          const count = await db.collection(colName).countDocuments();
          console.log(`   ${colName}: ${count} documents`);
          
          if (count === 0) {
            await db.collection(colName).drop();
            console.log(`   ✅ Dropped empty collection: ${colName}`);
            dropped++;
          }
        } catch (err: any) {
          console.log(`   ❌ Cannot drop ${colName}: ${err.message}`);
        }
      }
    }
    
    console.log(`\n📊 Dropped ${dropped} collections`);
    
    // Now try to create the needed collections
    console.log('\n📝 Testing if we can create new collections...');
    
    try {
      // Try inserting to a test collection
      await db.collection('_test_seed').insertOne({ test: true });
      await db.collection('_test_seed').drop();
      console.log('✅ We can create new collections! Running seed...\n');
      return true;
    } catch (err: any) {
      console.log(`❌ Still cannot create collections: ${err.message}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  } finally {
    await client.close();
  }
}

dropUnusedCollections().then(canCreate => {
  if (canCreate) {
    console.log('\n✅ Ready to seed! Run: npm run seed\n');
  } else {
    console.log('\n⚠️  You need to manually drop databases via MongoDB Atlas dashboard:');
    console.log('   1. Go to https://cloud.mongodb.com');
    console.log('   2. Select your cluster → Browse Collections');
    console.log('   3. Drop unused databases (alhamdayurvedic, informixtech, etc.)');
    console.log('   4. Then run: npm run seed\n');
  }
});
