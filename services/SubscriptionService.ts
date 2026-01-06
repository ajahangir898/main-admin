import type { 
  SubscriptionPlan, 
  BillingTransaction, 
  Invoice, 
  TrialSettings 
} from '../components/superadmin/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class SubscriptionService {
  // ========== SUBSCRIPTION PLANS ==========
  
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    const data = await response.json();
    return data.data;
  }

  static async getActivePlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans/active`);
    if (!response.ok) throw new Error('Failed to fetch active plans');
    const data = await response.json();
    return data.data;
  }

  static async getPlanById(id: string): Promise<SubscriptionPlan> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans/${id}`);
    if (!response.ok) throw new Error('Failed to fetch plan');
    const data = await response.json();
    return data.data;
  }

  static async createPlan(plan: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create plan');
    }
    const data = await response.json();
    return data.data;
  }

  static async updatePlan(id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update plan');
    }
    const data = await response.json();
    return data.data;
  }

  static async deletePlan(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete plan');
  }

  // ========== BILLING TRANSACTIONS ==========

  static async getTransactions(params?: {
    status?: string;
    tenantId?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ data: BillingTransaction[]; pagination: { total: number; limit: number; skip: number } }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.tenantId) query.append('tenantId', params.tenantId);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());

    const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions?${query}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  static async getTransactionById(id: string): Promise<BillingTransaction> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch transaction');
    const data = await response.json();
    return data.data;
  }

  static async createTransaction(transaction: {
    tenantId: string;
    tenantName: string;
    planName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    transactionId?: string;
    invoiceId?: string;
  }): Promise<BillingTransaction> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transaction');
    }
    const data = await response.json();
    return data.data;
  }

  static async completeTransaction(id: string): Promise<BillingTransaction> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions/${id}/complete`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to complete transaction');
    const data = await response.json();
    return data.data;
  }

  static async refundTransaction(id: string, reason: string, refundedBy: string = 'super_admin'): Promise<BillingTransaction> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, refundedBy })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refund transaction');
    }
    const data = await response.json();
    return data.data;
  }

  // ========== INVOICES ==========

  static async getInvoices(params?: {
    status?: string;
    tenantId?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ data: Invoice[]; pagination: { total: number; limit: number; skip: number } }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.tenantId) query.append('tenantId', params.tenantId);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());

    const response = await fetch(`${API_BASE_URL}/api/subscriptions/invoices?${query}`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  }

  static async getInvoiceById(id: string): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/invoices/${id}`);
    if (!response.ok) throw new Error('Failed to fetch invoice');
    const data = await response.json();
    return data.data;
  }

  static async createInvoice(invoice: {
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    taxRate?: number;
    dueDate: string;
    notes?: string;
  }): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invoice');
    }
    const data = await response.json();
    return data.data;
  }

  static async updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update invoice status');
    const data = await response.json();
    return data.data;
  }

  // ========== TRIAL SETTINGS ==========

  static async getTrialSettings(): Promise<TrialSettings> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/trial-settings`);
    if (!response.ok) throw new Error('Failed to fetch trial settings');
    const data = await response.json();
    return data.data;
  }

  static async updateTrialSettings(settings: Partial<TrialSettings>): Promise<TrialSettings> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/trial-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update trial settings');
    }
    const data = await response.json();
    return data.data;
  }

  // ========== STATISTICS ==========

  static async getStats(): Promise<{
    transactions: { total: number; completed: number };
    revenue: { total: number; monthly: number };
    invoices: { total: number; paid: number; overdue: number };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/stats`);
    if (!response.ok) throw new Error('Failed to fetch statistics');
    const data = await response.json();
    return data.data;
  }
}
