import mongoose from 'mongoose';
import { config } from 'dotenv';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { TrialSettings } from '../models/TrialSettings';

config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME;

if (!MONGO_URI) {
  console.error('Error: MONGODB_URI environment variable is required');
  process.exit(1);
}

// Default subscription plans
const defaultPlans = [
  {
    name: 'basic' as const,
    displayName: 'Basic',
    description: 'Perfect for small businesses just getting started',
    price: 999,
    billingCycle: 'monthly',
    currency: 'BDT',
    features: {
      maxProducts: 100,
      maxOrders: 100,
      maxUsers: 1,
      maxStorageGB: 1,
      customDomain: false,
      analyticsAccess: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      multiCurrency: false,
      advancedReports: false
    },
    isActive: true,
    isPopular: false
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'For growing businesses that need more features',
    price: 2999,
    billingCycle: 'monthly',
    currency: 'BDT',
    features: {
      maxProducts: 'unlimited' as const,
      maxOrders: 'unlimited' as const,
      maxUsers: 5,
      maxStorageGB: 10,
      customDomain: true,
      analyticsAccess: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: false,
      multiCurrency: true,
      advancedReports: true
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large businesses with advanced needs',
    price: 9999,
    billingCycle: 'monthly',
    currency: 'BDT',
    features: {
      maxProducts: 'unlimited' as const,
      maxOrders: 'unlimited' as const,
      maxUsers: 'unlimited' as const,
      maxStorageGB: 'unlimited' as const,
      customDomain: true,
      analyticsAccess: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: true,
      multiCurrency: true,
      advancedReports: true
    },
    isActive: true,
    isPopular: false
  }
];

// Default trial settings
const defaultTrialSettings = {
  defaultTrialDays: 14,
  autoExpireTrials: true,
  sendExpirationAlerts: true,
  alertDaysBeforeExpiry: [7, 3, 1],
  allowTrialExtension: false,
  maxTrialExtensionDays: 7,
  requirePaymentMethod: false,
  autoConvertToFreePlan: false
};

async function seedSubscriptionData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME
    });
    console.log('Connected to MongoDB');

    // Seed subscription plans
    console.log('\nSeeding subscription plans...');
    for (const planData of defaultPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        console.log(`Plan "${planData.name}" already exists, updating...`);
        await SubscriptionPlan.updateOne({ name: planData.name }, planData);
      } else {
        console.log(`Creating plan "${planData.name}"...`);
        await SubscriptionPlan.create(planData);
      }
    }
    console.log('✓ Subscription plans seeded successfully');

    // Seed trial settings
    console.log('\nSeeding trial settings...');
    const existingSettings = await TrialSettings.findOne();
    
    if (existingSettings) {
      console.log('Trial settings already exist, updating...');
      await TrialSettings.updateOne({}, defaultTrialSettings);
    } else {
      console.log('Creating trial settings...');
      await TrialSettings.create(defaultTrialSettings);
    }
    console.log('✓ Trial settings seeded successfully');

    console.log('\n✓ All subscription data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding subscription data:', error);
    process.exit(1);
  }
}

seedSubscriptionData();
