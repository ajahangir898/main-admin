# Subscription & Billing System Documentation

## Overview

The Subscription & Billing (SaaS Engine) system provides comprehensive subscription management, billing history, invoice generation, and trial management for the multi-tenant e-commerce platform.

## Features

### 1. Plan Builder
Create and manage subscription tiers with different features and pricing:
- **Basic Plan**: Entry-level plan for small businesses
- **Pro Plan**: Mid-tier plan with enhanced features
- **Enterprise Plan**: Full-featured plan for large businesses

### 2. Feature Gating
Define feature limits and access for each plan:
- Product limits (100, unlimited, etc.)
- Order limits per month
- User seats
- Storage limits
- Custom domain support
- Analytics access
- Priority support
- API access
- White-label branding
- Multi-currency support
- Advanced reports

### 3. Billing History
Track and manage all payment transactions:
- View all transactions
- Filter by status (pending, completed, failed, refunded)
- Filter by tenant
- Process refunds with reason tracking
- Support multiple payment methods (card, bank transfer, bKash, Nagad, Rocket)

### 4. Invoice Management
Generate and manage invoices:
- Automatic invoice number generation
- Line items with quantity and pricing
- Tax calculation
- Invoice status tracking (draft, sent, paid, overdue, cancelled)
- Due date management

### 5. Trial Management
Configure and automate trial periods:
- Set default trial duration (days)
- Auto-expire trials
- Send expiration alerts (configurable days before expiry)
- Allow trial extensions
- Require payment method for trials
- Auto-convert to free plan option

## Backend API

### Base URL
```
/api/subscriptions
```

### Endpoints

#### Subscription Plans

**List all plans**
```
GET /api/subscriptions/plans
```

**Get active plans**
```
GET /api/subscriptions/plans/active
```

**Get plan by ID**
```
GET /api/subscriptions/plans/:id
```

**Create plan**
```
POST /api/subscriptions/plans
Content-Type: application/json

{
  "name": "basic",
  "displayName": "Basic Plan",
  "description": "Perfect for small businesses",
  "price": 999,
  "billingCycle": "monthly",
  "currency": "BDT",
  "features": {
    "maxProducts": 100,
    "maxOrders": 100,
    "maxUsers": 1,
    "maxStorageGB": 1,
    "customDomain": false,
    "analyticsAccess": false,
    "prioritySupport": false,
    "apiAccess": false,
    "whiteLabel": false,
    "multiCurrency": false,
    "advancedReports": false
  },
  "isActive": true,
  "isPopular": false
}
```

**Update plan**
```
PUT /api/subscriptions/plans/:id
Content-Type: application/json

{
  "price": 1299,
  "isPopular": true
}
```

**Delete plan**
```
DELETE /api/subscriptions/plans/:id
```

#### Billing Transactions

**List transactions**
```
GET /api/subscriptions/transactions?status=completed&tenantId=xxx&limit=50&skip=0
```

**Create transaction**
```
POST /api/subscriptions/transactions
Content-Type: application/json

{
  "tenantId": "tenant123",
  "tenantName": "OPBD Fashion",
  "planName": "Pro",
  "amount": 2999,
  "currency": "BDT",
  "paymentMethod": "bkash",
  "billingPeriodStart": "2024-01-01",
  "billingPeriodEnd": "2024-01-31"
}
```

**Refund transaction**
```
POST /api/subscriptions/transactions/:id/refund
Content-Type: application/json

{
  "reason": "Customer requested refund",
  "refundedBy": "super_admin"
}
```

#### Invoices

**List invoices**
```
GET /api/subscriptions/invoices?status=paid&tenantId=xxx
```

**Create invoice**
```
POST /api/subscriptions/invoices
Content-Type: application/json

{
  "tenantId": "tenant123",
  "tenantName": "OPBD Fashion",
  "tenantEmail": "admin@opbd.com",
  "lineItems": [
    {
      "description": "Pro Plan - January 2024",
      "quantity": 1,
      "unitPrice": 2999
    }
  ],
  "taxRate": 15,
  "dueDate": "2024-01-15",
  "notes": "Payment due within 15 days"
}
```

**Update invoice status**
```
PATCH /api/subscriptions/invoices/:id/status
Content-Type: application/json

{
  "status": "paid"
}
```

#### Trial Settings

**Get trial settings**
```
GET /api/subscriptions/trial-settings
```

**Update trial settings**
```
PUT /api/subscriptions/trial-settings
Content-Type: application/json

{
  "defaultTrialDays": 14,
  "autoExpireTrials": true,
  "sendExpirationAlerts": true,
  "alertDaysBeforeExpiry": [7, 3, 1],
  "allowTrialExtension": false,
  "maxTrialExtensionDays": 7,
  "requirePaymentMethod": false
}
```

#### Statistics

**Get subscription statistics**
```
GET /api/subscriptions/stats
```

Returns:
```json
{
  "data": {
    "transactions": {
      "total": 1250,
      "completed": 1180
    },
    "revenue": {
      "total": 4250000,
      "monthly": 485000
    },
    "invoices": {
      "total": 1200,
      "paid": 1150,
      "overdue": 25
    }
  }
}
```

## Frontend Components

### SubscriptionsTab
Main component that provides tabs for:
- Plans management
- Billing history
- Invoice management
- Trial settings

Located at: `components/superadmin/SubscriptionsTab.tsx`

### SubscriptionService
Service class for API calls.

Located at: `services/SubscriptionService.ts`

## Database Models

### SubscriptionPlan
```typescript
{
  name: 'basic' | 'pro' | 'enterprise',
  displayName: string,
  description: string,
  price: number,
  billingCycle: 'monthly' | 'yearly',
  currency: string,
  features: FeatureLimits,
  isActive: boolean,
  isPopular: boolean,
  stripePriceId?: string
}
```

### BillingTransaction
```typescript
{
  tenantId: string,
  tenantName: string,
  planName: string,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  paymentMethod: string,
  transactionId?: string,
  invoiceId?: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  refundedAt?: Date,
  refundReason?: string
}
```

### Invoice
```typescript
{
  invoiceNumber: string,
  tenantId: string,
  tenantName: string,
  tenantEmail: string,
  lineItems: Array<LineItem>,
  subtotal: number,
  tax: number,
  taxRate: number,
  total: number,
  currency: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  dueDate: Date,
  paidDate?: Date
}
```

### TrialSettings
```typescript
{
  defaultTrialDays: number,
  autoExpireTrials: boolean,
  sendExpirationAlerts: boolean,
  alertDaysBeforeExpiry: number[],
  allowTrialExtension: boolean,
  maxTrialExtensionDays: number,
  requirePaymentMethod: boolean,
  autoConvertToFreePlan: boolean,
  freePlanName?: string
}
```

## Seeding Default Data

To seed default subscription plans and trial settings:

```bash
cd backend
npm run seed:subscriptions
```

This will create:
- Basic Plan: ৳999/month (100 products, 100 orders)
- Pro Plan: ৳2,999/month (unlimited products & orders, marked as popular)
- Enterprise Plan: ৳9,999/month (unlimited everything, white-label)
- Default trial settings (14 days trial)

## Usage in SuperAdmin Dashboard

1. Navigate to the SuperAdmin Dashboard
2. Click on "Subscriptions" in the sidebar
3. Use the tabs to:
   - Create/edit subscription plans
   - View billing history
   - Manage invoices
   - Configure trial settings

## Security Considerations

- All endpoints should be protected with super admin authentication
- Refunds should require approval and logging
- Payment information should be encrypted
- Sensitive data should not be exposed in API responses

## Future Enhancements

- Integration with payment gateways (Stripe, bKash, Nagad)
- Automated billing cycles
- Email notifications for invoices and expiring trials
- Subscription upgrade/downgrade flows
- Proration calculations
- Payment retry logic
- Webhook handlers for payment events
