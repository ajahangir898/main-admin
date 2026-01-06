import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  username?: string;
  image?: string;
  role: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: mongoose.Types.ObjectId;
  tenantId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  username: { type: String, trim: true },
  image: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'tenant_admin', 'super_admin', 'staff'],
    default: 'staff'
  },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
  tenantId: { type: String, index: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1, tenantId: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
