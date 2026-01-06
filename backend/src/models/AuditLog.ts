import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: 'tenant' | 'user' | 'subscription' | 'order' | 'product' | 'settings' | 'notification' | 'support_ticket' | 'other';
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['tenant', 'user', 'subscription', 'order', 'product', 'settings', 'notification', 'support_ticket', 'other'],
    index: true,
  },
  resourceId: {
    type: String,
    index: true,
  },
  resourceName: String,
  details: {
    type: String,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
