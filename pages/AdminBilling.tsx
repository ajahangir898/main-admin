import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  Receipt,
  TrendingUp,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  ArrowUpRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { Tenant } from '../types';

interface AdminBillingProps {
  tenant?: Tenant | null;
  onUpgrade?: () => void;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

const PLAN_FEATURES: Record<string, { name: string; price: number; features: string[]; color: string; icon: React.ReactNode }> = {
  starter: {
    name: 'Starter',
    price: 0,
    features: ['Up to 50 products', 'Basic analytics', 'Email support', '1 Admin user'],
    color: 'from-gray-500 to-gray-600',
    icon: <Package size={24} />
  },
  growth: {
    name: 'Growth',
    price: 999,
    features: ['Up to 500 products', 'Advanced analytics', 'Priority support', '5 Admin users', 'Custom domain'],
    color: 'from-blue-500 to-cyan-500',
    icon: <TrendingUp size={24} />
  },
  enterprise: {
    name: 'Enterprise',
    price: 2999,
    features: ['Unlimited products', 'Full analytics suite', '24/7 support', 'Unlimited users', 'Multiple domains', 'API access'],
    color: 'from-purple-500 to-pink-500',
    icon: <Crown size={24} />
  }
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  trialing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  pending: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
};

const AdminBilling: React.FC<AdminBillingProps> = ({ tenant, onUpgrade }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock payment history - replace with API call
  const [paymentHistory] = useState<PaymentHistory[]>([
    { id: '1', date: '2026-01-01', amount: 999, status: 'paid', description: 'Growth Plan - January 2026' },
    { id: '2', date: '2025-12-01', amount: 999, status: 'paid', description: 'Growth Plan - December 2025' },
    { id: '3', date: '2025-11-01', amount: 999, status: 'paid', description: 'Growth Plan - November 2025' },
  ]);

  // Calculate days left in subscription
  const getDaysLeft = () => {
    if (!tenant?.createdAt) return 0;
    const trialDays = 14;
    const createdDate = new Date(tenant.createdAt);
    const endDate = new Date(createdDate);
    endDate.setDate(endDate.getDate() + 30); // Monthly subscription
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const currentPlan = PLAN_FEATURES[tenant?.plan || 'starter'] || PLAN_FEATURES.starter;
  const statusStyle = STATUS_STYLES[tenant?.status || 'pending'] || STATUS_STYLES.pending;
  const daysLeft = getDaysLeft();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your subscription plan and billing details</p>
        </div>
        <button
          onClick={() => setIsLoading(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all w-full sm:w-auto justify-center sm:justify-start"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Plan Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${currentPlan.color}`} />
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${currentPlan.color} flex items-center justify-center text-white`}>
                {currentPlan.icon}
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1 sm:gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {tenant?.status === 'trialing' ? 'Trial' : tenant?.status || 'Pending'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Current Plan</h3>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{currentPlan.name}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {currentPlan.price === 0 ? 'Free' : `${formatCurrency(currentPlan.price)}/month`}
            </p>
          </div>
        </div>

        {/* Billing Cycle Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <Calendar size={20} className="sm:hidden" />
              <Calendar size={24} className="hidden sm:block" />
            </div>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Next Billing Date</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {tenant?.createdAt ? formatDate(new Date(new Date(tenant.createdAt).setDate(new Date(tenant.createdAt).getDate() + 30)).toISOString()) : 'N/A'}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Monthly billing cycle</p>
        </div>

        {/* Days Left Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${daysLeft <= 7 ? 'from-red-500 to-orange-500' : 'from-violet-500 to-purple-500'} flex items-center justify-center text-white`}>
              <Clock size={20} className="sm:hidden" />
              <Clock size={24} className="hidden sm:block" />
            </div>
            {daysLeft <= 7 && (
              <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full flex items-center gap-1">
                <AlertCircle size={12} />
                Low
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Days Remaining</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{daysLeft} days</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${daysLeft <= 7 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
              style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plan Features & Upgrade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Plan Features */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${currentPlan.color} flex items-center justify-center text-white`}>
              <Shield size={16} className="sm:hidden" />
              <Shield size={20} className="hidden sm:block" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Plan Features</h2>
              <p className="text-xs sm:text-sm text-gray-500">What's included in your {currentPlan.name} plan</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={12} className="text-emerald-600 sm:hidden" />
                  <CheckCircle size={14} className="text-emerald-600 hidden sm:block" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center mb-3 sm:mb-4">
              <Zap size={20} className="text-white sm:hidden" />
              <Zap size={24} className="text-white hidden sm:block" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Upgrade Your Plan</h3>
            <p className="text-xs sm:text-sm text-white/80 mb-4 sm:mb-6">
              Unlock more features and grow your business faster with our premium plans.
            </p>
            <button
              onClick={onUpgrade}
              className="w-full py-2.5 sm:py-3 px-4 bg-white text-violet-600 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              View Plans
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <Receipt size={16} className="sm:hidden" />
                <Receipt size={20} className="hidden sm:block" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Payment History</h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden xs:block">Your recent transactions and invoices</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-50">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => (
              <div key={payment.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      payment.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                      payment.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle size={18} /> :
                       payment.status === 'pending' ? <Clock size={18} /> :
                       <AlertCircle size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{payment.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(payment.date)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(payment.amount)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Receipt size={28} className="text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm">No payment history</h3>
              <p className="text-xs text-gray-500">Your payment transactions will appear here</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block divide-y divide-gray-50">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      payment.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                      payment.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle size={20} /> :
                       payment.status === 'pending' ? <Clock size={20} /> :
                       <AlertCircle size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Receipt size={32} className="text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No payment history</h3>
              <p className="text-sm text-gray-500">Your payment transactions will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <CreditCard size={16} className="sm:hidden" />
              <CreditCard size={20} className="hidden sm:block" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Payment Method</h2>
              <p className="text-xs sm:text-sm text-gray-500 hidden xs:block">Manage your payment information</p>
            </div>
          </div>
          <button className="px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all w-full xs:w-auto">
            Add Method
          </button>
        </div>
        
        <div className="p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-200 text-center">
          <CreditCard size={28} className="mx-auto text-gray-300 mb-2 sm:hidden" />
          <CreditCard size={32} className="mx-auto text-gray-300 mb-2 hidden sm:block" />
          <p className="text-xs sm:text-sm text-gray-500">No payment method added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a payment method to enable automatic renewals</p>
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;
