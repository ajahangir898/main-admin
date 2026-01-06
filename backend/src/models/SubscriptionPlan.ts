import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureLimits {
  maxProducts: number | 'unlimited';
  maxOrders: number | 'unlimited';
  maxUsers: number | 'unlimited';
  maxStorageGB: number | 'unlimited';
  customDomain: boolean;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  multiCurrency: boolean;
  advancedReports: boolean;
}

export interface ISubscriptionPlan extends Document {
  name: string;
  displayName: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  features: IFeatureLimits;
  isActive: boolean;
  isPopular: boolean;
  stripePriceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['basic', 'pro', 'enterprise']
  },
  displayName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  billingCycle: { 
    type: String, 
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currency: { 
    type: String, 
    required: true,
    default: 'BDT'
  },
  features: {
    maxProducts: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    maxOrders: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    maxUsers: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    maxStorageGB: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    customDomain: { 
      type: Boolean, 
      default: false 
    },
    analyticsAccess: { 
      type: Boolean, 
      default: false 
    },
    prioritySupport: { 
      type: Boolean, 
      default: false 
    },
    apiAccess: { 
      type: Boolean, 
      default: false 
    },
    whiteLabel: { 
      type: Boolean, 
      default: false 
    },
    multiCurrency: { 
      type: Boolean, 
      default: false 
    },
    advancedReports: { 
      type: Boolean, 
      default: false 
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isPopular: { 
    type: Boolean, 
    default: false 
  },
  stripePriceId: { 
    type: String 
  }
}, {
  timestamps: true
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
