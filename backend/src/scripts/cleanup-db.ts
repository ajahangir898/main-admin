import { config } from 'dotenv';
config();

import { MongoClient } from 'mongodb';
import * as readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Databases to keep - add any databases you want to preserve
const DATABASES_TO_KEEP = ['cws', 'admin', 'local'];

async function cleanup() {
  console.log('\n🧹 MongoDB Cleanup Script\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    // List all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    // Filter databases that can be dropped
    const dropCandidates = databases.filter(db => !DATABASES_TO_KEEP.includes(db.name));
    
    console.log('📚 Databases to DROP:');
    console.log('─────────────────────────────────────────');
    
    let collectionsToFree = 0;
    for (const dbInfo of dropCandidates) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      collectionsToFree += collections.length;
      console.log(`   ❌ ${dbInfo.name} (${collections.length} collections)`);
    }
    
    console.log('\n📚 Databases to KEEP:');
    console.log('─────────────────────────────────────────');
    for (const keepDb of DATABASES_TO_KEEP) {
      const found = databases.find(d => d.name === keepDb);
      if (found) {
        const db = client.db(keepDb);
        const collections = await db.listCollections().toArray();
        console.log(`   ✅ ${keepDb} (${collections.length} collections)`);
      }
    }
    
    console.log(`\n📊 This will free up ${collectionsToFree} collections\n`);
    
    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>(resolve => {
      rl.question('⚠️  Are you sure you want to DROP these databases? (yes/no): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() === 'yes') {
      console.log('\n🗑️  Dropping databases...');
      
      for (const dbInfo of dropCandidates) {
        try {
          await client.db(dbInfo.name).dropDatabase();
          console.log(`   ✅ Dropped: ${dbInfo.name}`);
        } catch (err) {
          console.log(`   ❌ Failed to drop ${dbInfo.name}:`, err);
        }
      }
      
      console.log('\n✅ Cleanup complete! You can now run the seed script.\n');
    } else {
      console.log('\n❌ Cleanup cancelled.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

cleanup();
