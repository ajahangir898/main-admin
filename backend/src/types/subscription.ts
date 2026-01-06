export interface SubscriptionPlanPayload {
  name: 'basic' | 'pro' | 'enterprise';
  displayName: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  features: {
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
  };
  isActive?: boolean;
  isPopular?: boolean;
  stripePriceId?: string;
}

export interface BillingTransactionPayload {
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'other';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  transactionId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
}

export interface InvoicePayload {
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
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate?: number;
  dueDate: Date;
  notes?: string;
}

export interface RefundPayload {
  reason: string;
  refundedBy: string;
}
