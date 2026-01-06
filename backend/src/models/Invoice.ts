import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { 
    type: String, 
    required: true,
    unique: true
  },
  tenantId: { 
    type: String, 
    required: true,
    index: true
  },
  tenantName: { 
    type: String, 
    required: true 
  },
  tenantEmail: { 
    type: String, 
    required: true 
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  lineItems: [{
    description: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    unitPrice: { 
      type: Number, 
      required: true,
      min: 0
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0
    }
  }],
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  tax: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  taxRate: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  total: { 
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
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  paidDate: { 
    type: Date 
  },
  transactionId: { 
    type: String 
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ tenantId: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
