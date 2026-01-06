import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission, ResourceType, ActionType } from '../models/Permission';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'cws';

// All available resources
const ALL_RESOURCES: ResourceType[] = [
  'dashboard',
  'orders',
  'products',
  'customers',
  'inventory',
  'catalog',
  'landing_pages',
  'gallery',
  'reviews',
  'daily_target',
  'business_report',
  'expenses',
  'income',
  'due_book',
  'profit_loss',
  'notes',
  'customization',
  'settings',
  'admin_control',
  'tenants'
];

// All available actions
const ALL_ACTIONS: ActionType[] = ['read', 'write', 'edit', 'delete'];

// Define role configurations
const ROLE_CONFIGS = [
  {
    name: 'Super Admin',
    description: 'Full access to all features including tenant management',
    isSystem: true,
    resources: ALL_RESOURCES,
    actions: ALL_ACTIONS
  },
  {
    name: 'Admin',
    description: 'Full access to store management features',
    isSystem: true,
    resources: ALL_RESOURCES.filter(r => r !== 'tenants'),
    actions: ALL_ACTIONS
  },
  {
    name: 'Manager',
    description: 'Can manage orders, products, inventory, and view reports',
    isSystem: false,
    resources: [
      'dashboard',
      'orders',
      'products',
      'customers',
      'inventory',
      'catalog',
      'gallery',
      'reviews',
      'daily_target',
      'business_report',
      'notes'
    ] as ResourceType[],
    actions: ALL_ACTIONS
  },
  {
    name: 'Sales Staff',
    description: 'Can manage orders and customers',
    isSystem: false,
    resources: ['dashboard', 'orders', 'customers', 'products', 'notes'] as ResourceType[],
    actions: ['read', 'write', 'edit'] as ActionType[]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to dashboard and reports',
    isSystem: false,
    resources: ['dashboard', 'orders', 'products', 'daily_target', 'business_report'] as ResourceType[],
    actions: ['read'] as ActionType[]
  }
];

// Default users to create
const DEFAULT_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@admin.com',
    password: 'admin123',
    role: 'super_admin' as const
  },
  {
    name: 'Demo Admin',
    email: 'demo@admin.com',
    password: 'demo123',
    role: 'admin' as const
  }
];

async function seedRolesAndPermissions() {
  console.log('🔧 Seeding roles and permissions...');
  
  for (const roleConfig of ROLE_CONFIGS) {
    // Check if role already exists
    let role = await Role.findOne({ name: roleConfig.name, tenantId: { $exists: false } });
    
    if (!role) {
      role = new Role({
        name: roleConfig.name,
        description: roleConfig.description,
        isSystem: roleConfig.isSystem
      });
      await role.save();
      console.log(`  ✅ Created role: ${roleConfig.name}`);
    } else {
      console.log(`  ⏭️  Role already exists: ${roleConfig.name}`);
    }
    
    // Create permissions for this role
    for (const resource of roleConfig.resources) {
      const existingPermission = await Permission.findOne({
        roleId: role._id,
        resource: resource,
        tenantId: { $exists: false }
      });
      
      if (!existingPermission) {
        const permission = new Permission({
          roleId: role._id,
          resource: resource,
          actions: roleConfig.actions
        });
        await permission.save();
      }
    }
    console.log(`  ✅ Permissions set for role: ${roleConfig.name}`);
  }
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  
  const superAdminRole = await Role.findOne({ name: 'Super Admin' });
  const adminRole = await Role.findOne({ name: 'Admin' });
  
  for (const userData of DEFAULT_USERS) {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const roleId = userData.role === 'super_admin' ? superAdminRole?._id : adminRole?._id;
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        roleId: roleId,
        isActive: true
      });
      
      await user.save();
      console.log(`  ✅ Created user: ${userData.email} (password: ${userData.password})`);
    } else {
      console.log(`  ⏭️  User already exists: ${userData.email}`);
    }
  }
}

async function main() {
  console.log('\n🚀 Starting database seed...\n');
  console.log(`📦 Database: ${MONGODB_DB_NAME}`);
  console.log(`🔗 URI: ${MONGODB_URI.substring(0, 30)}...\n`);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Run seeders
    await seedRolesAndPermissions();
    console.log('');
    await seedUsers();
    
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Default Login Credentials:');
    console.log('  ───────────────────────────');
    console.log('  Super Admin: admin@admin.com / admin123');
    console.log('  Demo Admin:  demo@admin.com / demo123');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

main();
