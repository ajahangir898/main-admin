import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  tenantId: string;
  type: 'order' | 'review' | 'customer' | 'inventory' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { 
      type: String, 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      enum: ['order', 'review', 'customer', 'inventory', 'system'],
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    data: { 
      type: Schema.Types.Mixed 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index for efficient querying of unread notifications per tenant
NotificationSchema.index({ tenantId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);