import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingTransaction extends Document {
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'other';
  transactionId?: string;
  invoiceId?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  refundedAt?: Date;
  refundReason?: string;
  refundedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BillingTransactionSchema = new Schema<IBillingTransaction>({
  tenantId: { 
    type: String, 
    required: true,
    index: true
  },
  tenantName: { 
    type: String, 
    required: true 
  },
  planName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    required: true,
    default: 'BDT'
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['card', 'bank_transfer', 'bkash', 'nagad', 'rocket', 'other']
  },
  transactionId: { 
    type: String,
    unique: true,
    sparse: true
  },
  invoiceId: { 
    type: String 
  },
  billingPeriodStart: { 
    type: Date, 
    required: true 
  },
  billingPeriodEnd: { 
    type: Date, 
    required: true 
  },
  refundedAt: { 
    type: Date 
  },
  refundReason: { 
    type: String 
  },
  refundedBy: { 
    type: String 
  },
  metadata: { 
    type: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BillingTransactionSchema.index({ status: 1 });
BillingTransactionSchema.index({ createdAt: -1 });
BillingTransactionSchema.index({ tenantId: 1, createdAt: -1 });

export const BillingTransaction = mongoose.model<IBillingTransaction>('BillingTransaction', BillingTransactionSchema);
