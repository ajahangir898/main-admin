import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tenantId?: string;
  isSystem: boolean; // Built-in roles like Super Admin, Admin cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tenantId: { type: String, index: true },
  isSystem: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Compound index to ensure unique role names per tenant
RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
