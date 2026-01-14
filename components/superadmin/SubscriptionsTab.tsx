import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, DollarSign, TrendingUp, FileText, 
  Settings, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { 
  SubscriptionPlan, 
  BillingTransaction, 
  Invoice, 
  TrialSettings 
} from './types';

interface SubscriptionsTabProps {
  onLoadPlans: () => Promise<SubscriptionPlan[]>;
  onCreatePlan: (plan: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePlan: (id: string, plan: Partial<SubscriptionPlan>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onLoadTransactions: () => Promise<BillingTransaction[]>;
  onRefundTransaction: (id: string, reason: string) => Promise<void>;
  onLoadInvoices: () => Promise<Invoice[]>;
  onLoadTrialSettings: () => Promise<TrialSettings>;
  onUpdateTrialSettings: (settings: Partial<TrialSettings>) => Promise<void>;
}

const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  onLoadPlans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onLoadTransactions,
  onRefundTransaction,
  onLoadInvoices,
  onLoadTrialSettings,
  onUpdateTrialSettings
}) => {
  const [activeView, setActiveView] = useState<'plans' | 'billing' | 'invoices' | 'trials'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trialSettings, setTrialSettings] = useState<TrialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState<BillingTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'plans') {
        const plansData = await onLoadPlans();
        setPlans(plansData);
      } else if (activeView === 'billing') {
        const transactionsData = await onLoadTransactions();
        setTransactions(transactionsData);
      } else if (activeView === 'invoices') {
        const invoicesData = await onLoadInvoices();
        setInvoices(invoicesData);
      } else if (activeView === 'trials') {
        const settings = await onLoadTrialSettings();
        setTrialSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePlan = async (planData: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPlan?._id) {
        await onUpdatePlan(editingPlan._id, planData);
        toast.success('Plan updated successfully');
      } else {
        await onCreatePlan(planData);
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      loadData();
    } catch (error) {
      toast.error(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await onDeletePlan(id);
      toast.success('Plan deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const handleRefund = async (reason: string) => {
    if (!refundingTransaction?._id) return;
    
    try {
      await onRefundTransaction(refundingTransaction._id, reason);
      toast.success('Transaction refunded successfully');
      setShowRefundModal(false);
      setRefundingTransaction(null);
      loadData();
    } catch (error) {
      toast.error('Failed to refund transaction');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    return `${currency === 'BDT' ? '৳' : '$'}${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Subscriptions & Billing</h1>
        <p className="text-slate-600">Manage subscription plans, billing history, and trial settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveView('plans')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'plans'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Plans
        </button>
        <button
          onClick={() => setActiveView('billing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'billing'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Billing History
        </button>
        <button
          onClick={() => setActiveView('invoices')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'invoices'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Invoices
        </button>
        <button
          onClick={() => setActiveView('trials')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'trials'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Trial Management
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Plans View */}
          {activeView === 'plans' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Subscription Plans</h2>
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setShowPlanModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                      plan.isPopular ? 'border-emerald-500' : 'border-slate-200'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                        POPULAR
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.displayName}</h3>
                    <p className="text-slate-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-slate-800">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                      <span className="text-slate-600 ml-2">/ {plan.billingCycle}</span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>
                          {plan.features.maxProducts === 'unlimited' 
                            ? 'Unlimited products' 
                            : `${plan.features.maxProducts} products`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>
                          {plan.features.maxOrders === 'unlimited' 
                            ? 'Unlimited orders' 
                            : `${plan.features.maxOrders} orders/month`}
                        </span>
                      </div>
                      {plan.features.customDomain && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Custom domain</span>
                        </div>
                      )}
                      {plan.features.prioritySupport && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Priority support</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setShowPlanModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => plan._id && handleDeletePlan(plan._id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing History View */}
          {activeView === 'billing' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Billing History</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {transaction.tenantName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {transaction.planName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transaction.status === 'completed' && (
                            <button
                              onClick={() => {
                                setRefundingTransaction(transaction);
                                setShowRefundModal(true);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices View */}
          {activeView === 'invoices' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Invoices</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {invoice.tenantName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trial Management View */}
          {activeView === 'trials' && trialSettings && (
            <TrialManagement
              settings={trialSettings}
              onUpdate={async (updates) => {
                await onUpdateTrialSettings(updates);
                toast.success('Trial settings updated');
                loadData();
              }}
            />
          )}
        </>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }}
          onSave={handleCreateOrUpdatePlan}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && refundingTransaction && (
        <RefundModal
          transaction={refundingTransaction}
          onClose={() => {
            setShowRefundModal(false);
            setRefundingTransaction(null);
          }}
          onRefund={handleRefund}
        />
      )}
    </div>
  );
};

// Plan Modal Component
const PlanModal: React.FC<{
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (plan: Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt'>>(
    plan || {
      name: 'basic',
      displayName: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      currency: 'BDT',
      features: {
        maxProducts: 100,
        maxOrders: 100,
        maxUsers: 1,
        maxStorageGB: 1,
        customDomain: false,
        analyticsAccess: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        multiCurrency: false,
        advancedReports: false
      },
      isActive: true,
      isPopular: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plan Type
              </label>
              <select
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value as 'basic' | 'pro' | 'enterprise' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="BDT">BDT</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Features & Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Products
                </label>
                <input
                  type="text"
                  value={formData.features.maxProducts}
                  onChange={(e) => {
                    const value = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      features: { ...formData.features, maxProducts: value }
                    });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100 or 'unlimited'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Orders/Month
                </label>
                <input
                  type="text"
                  value={formData.features.maxOrders}
                  onChange={(e) => {
                    const value = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      features: { ...formData.features, maxOrders: value }
                    });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100 or 'unlimited'"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.customDomain}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, customDomain: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Custom Domain</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.prioritySupport}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, prioritySupport: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Priority Support</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.features.analyticsAccess}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, analyticsAccess: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Analytics</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Mark as Popular</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
            >
              {plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Refund Modal Component
const RefundModal: React.FC<{
  transaction: BillingTransaction;
  onClose: () => void;
  onRefund: (reason: string) => void;
}> = ({ transaction, onClose, onRefund }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRefund(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Refund Transaction</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Transaction ID</p>
            <p className="font-medium text-slate-800">{transaction._id}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Amount</p>
            <p className="font-medium text-slate-800">
              {transaction.currency === 'BDT' ? '৳' : '$'}{transaction.amount.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Refund Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              required
              placeholder="Please provide a reason for this refund..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Process Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Trial Management Component
const TrialManagement: React.FC<{
  settings: TrialSettings;
  onUpdate: (settings: Partial<TrialSettings>) => void;
}> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Trial Management Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Trial Duration (Days)
          </label>
          <input
            type="number"
            value={formData.defaultTrialDays}
            onChange={(e) => setFormData({ ...formData, defaultTrialDays: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min="1"
            max="365"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoExpireTrials}
              onChange={(e) => setFormData({ ...formData, autoExpireTrials: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Automatically expire trials</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.sendExpirationAlerts}
              onChange={(e) => setFormData({ ...formData, sendExpirationAlerts: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Send expiration alerts</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.allowTrialExtension}
              onChange={(e) => setFormData({ ...formData, allowTrialExtension: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Allow trial extensions</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requirePaymentMethod}
              onChange={(e) => setFormData({ ...formData, requirePaymentMethod: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Require payment method for trial</span>
          </label>
        </div>

        {formData.allowTrialExtension && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Trial Extension (Days)
            </label>
            <input
              type="number"
              value={formData.maxTrialExtensionDays}
              onChange={(e) => setFormData({ ...formData, maxTrialExtensionDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              max="30"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default SubscriptionsTab;
