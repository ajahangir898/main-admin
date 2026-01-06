import mongoose, { Schema, Document } from 'mongoose';

// Resource types that can be controlled
export type ResourceType = 
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'catalog'
  | 'landing_pages'
  | 'gallery'
  | 'reviews'
  | 'daily_target'
  | 'business_report'
  | 'expenses'
  | 'income'
  | 'due_book'
  | 'profit_loss'
  | 'notes'
  | 'customization'
  | 'settings'
  | 'admin_control'
  | 'tenants';

// Action types (CRUD operations)
export type ActionType = 'read' | 'write' | 'edit' | 'delete';

export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  resource: ResourceType;
  actions: ActionType[];
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>({
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
  resource: { 
    type: String, 
    required: true,
    enum: [
      'dashboard', 'orders', 'products', 'customers', 'inventory',
      'catalog', 'landing_pages', 'gallery', 'reviews', 'daily_target',
      'business_report', 'expenses', 'income', 'due_book', 'profit_loss',
      'notes', 'customization', 'settings', 'admin_control', 'tenants'
    ]
  },
  actions: [{
    type: String,
    enum: ['read', 'write', 'edit', 'delete']
  }],
  tenantId: { type: String, index: true }
}, {
  timestamps: true
});

// Compound index to ensure unique resource per role
PermissionSchema.index({ roleId: 1, resource: 1 }, { unique: true });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);

// Resource list for frontend reference
export const RESOURCES: ResourceType[] = [
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

export const ACTIONS: ActionType[] = ['read', 'write', 'edit', 'delete'];
