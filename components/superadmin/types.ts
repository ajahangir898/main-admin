// Types for Super Admin Dashboard
import React from 'react';

export interface TenantStats {
  id: string;
  name: string;
  subdomain: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'trialing' | 'suspended';
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  lastActivity: string;
}

export interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  totalUsers: number;
  serverLoad: number;
  uptime: string;
  diskUsage: number;
  memoryUsage: number;
}

export interface PlatformConfig {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  maxTenantsPerUser: number;
  defaultTrialDays: number;
  platformLogo: string | null;
  platformFavicon: string | null;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
}

// Theme Configuration for Tenants
export interface TenantThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontColor: string;
  hoverColor: string;
  surfaceColor: string;
  darkMode: boolean;
  adminBgColor?: string;
  adminInputBgColor?: string;
  adminBorderColor?: string;
  adminFocusColor?: string;
}

// Chat Settings
export interface ChatConfig {
  enabled: boolean;
  whatsappNumber: string;
  messengerPageId: string;
  liveChatEnabled: boolean;
  supportHoursFrom: string;
  supportHoursTo: string;
  autoReplyMessage: string;
  offlineMessage: string;
}

// Notification for Admins
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetTenants: string[] | 'all';
  createdAt: string;
  expiresAt?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Website Config managed by SuperAdmin
export interface GlobalWebsiteConfig {
  defaultTheme: TenantThemeConfig;
  chatConfig: ChatConfig;
  allowCustomThemes: boolean;
  allowCustomChat: boolean;
  enforceSSL: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  defaultLanguage: string;
  supportedLanguages: string[];
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  time: string;
  icon: React.ElementType;
}

// Subscription & Billing Types
export interface FeatureLimits {
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

export interface SubscriptionPlan {
  _id?: string;
  name: 'basic' | 'pro' | 'enterprise';
  displayName: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  features: FeatureLimits;
  isActive: boolean;
  isPopular: boolean;
  stripePriceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingTransaction {
  _id: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'other';
  transactionId?: string;
  invoiceId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  refundedAt?: string;
  refundReason?: string;
  refundedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
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
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialSettings {
  _id?: string;
  defaultTrialDays: number;
  autoExpireTrials: boolean;
  sendExpirationAlerts: boolean;
  alertDaysBeforeExpiry: number[];
  allowTrialExtension: boolean;
  maxTrialExtensionDays: number;
  requirePaymentMethod: boolean;
  autoConvertToFreePlan: boolean;
  freePlanName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Bulk Announcement for system-wide communication
export interface BulkAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'maintenance' | 'feature';
  channel: 'notification' | 'email' | 'both';
  targetAudience: 'all' | 'active' | 'trialing' | 'suspended' | 'specific';
  targetTenantIds?: string[];
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  createdAt: string;
  createdBy: string;
  openRate?: number;
  clickRate?: number;
  template?: string;
}

// Support Ticket System
export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature_request' | 'billing' | 'technical' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  attachments?: string[];
  tags?: string[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'merchant' | 'support';
  message: string;
  createdAt: string;
  attachments?: string[];
}

// Merchant Health & Success Tracking
export interface MerchantHealth {
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  plan: 'starter' | 'growth' | 'enterprise';
  healthScore: number; // 0-100
  riskLevel: 'healthy' | 'at_risk' | 'critical';
  lastLoginAt: string;
  daysSinceLastLogin: number;
  salesTrend: 'growing' | 'stable' | 'declining' | 'inactive';
  salesChangePercent: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  totalOrders30Days: number;
  totalOrdersPrevious30Days: number;
  activeProducts: number;
  supportTicketsOpen: number;
  alerts: MerchantAlert[];
}

export interface MerchantAlert {
  id: string;
  type: 'no_login' | 'sales_drop' | 'no_orders' | 'subscription_expiring' | 'high_refund_rate' | 'low_inventory';
  severity: 'warning' | 'critical';
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AtRiskMerchant {
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  plan: 'starter' | 'growth' | 'enterprise';
  riskScore: number; // Higher = more at risk
  riskFactors: string[];
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string;
  status: 'needs_attention' | 'contacted' | 'recovered' | 'churned';
}

export type TabType = 
  | 'overview' 
  | 'tenants' 
  | 'users' 
  | 'orders' 
  | 'subscriptions' 
  | 'analytics' 
  | 'audit-logs'
  | 'system-health'
  | 'bulk-operations'
  | 'server' 
  | 'database' 
  | 'security' 
  | 'settings'
  | 'notifications'
  | 'theme-config'
  | 'chat-config'
  | 'website-config'
  | 'announcements'
  | 'support-tickets'
  | 'merchant-success'
  | 'tutorials';
