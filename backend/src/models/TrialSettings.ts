import mongoose, { Schema, Document } from 'mongoose';

export interface ITrialSettings extends Document {
  defaultTrialDays: number;
  autoExpireTrials: boolean;
  sendExpirationAlerts: boolean;
  alertDaysBeforeExpiry: number[];
  allowTrialExtension: boolean;
  maxTrialExtensionDays: number;
  requirePaymentMethod: boolean;
  autoConvertToFreePlan: boolean;
  freePlanName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrialSettingsSchema = new Schema<ITrialSettings>({
  defaultTrialDays: { 
    type: Number, 
    required: true,
    default: 14,
    min: 1,
    max: 365
  },
  autoExpireTrials: { 
    type: Boolean, 
    default: true 
  },
  sendExpirationAlerts: { 
    type: Boolean, 
    default: true 
  },
  alertDaysBeforeExpiry: { 
    type: [Number], 
    default: [7, 3, 1]
  },
  allowTrialExtension: { 
    type: Boolean, 
    default: false 
  },
  maxTrialExtensionDays: { 
    type: Number, 
    default: 7,
    min: 0,
    max: 30
  },
  requirePaymentMethod: { 
    type: Boolean, 
    default: false 
  },
  autoConvertToFreePlan: { 
    type: Boolean, 
    default: false 
  },
  freePlanName: { 
    type: String 
  }
}, {
  timestamps: true
});

export const TrialSettings = mongoose.model<ITrialSettings>('TrialSettings', TrialSettingsSchema);
