# Subscription & Billing System - User Guide

## Quick Start Guide

### For Super Admins

#### 1. Accessing the Subscription Management

1. Login to the SuperAdmin dashboard at `superadmin.systemnextit.com`
2. Click on **Subscriptions** in the left sidebar (look for the credit card icon 💳)
3. You'll see four tabs at the top:
   - **Plans** - Manage subscription tiers
   - **Billing History** - View and manage transactions
   - **Invoices** - Generate and track invoices
   - **Trial Management** - Configure trial settings

---

## 📋 Plans Tab

### Creating a New Plan

1. Click the **"Create Plan"** button (green button, top right)
2. Fill in the plan details:
   - **Plan Type**: Choose Basic, Pro, or Enterprise
   - **Display Name**: User-facing name (e.g., "Pro Plan")
   - **Description**: Brief description (e.g., "For growing businesses")
   - **Price**: Amount in BDT or USD
   - **Billing Cycle**: Monthly or Yearly
   - **Currency**: BDT or USD

3. Configure **Features & Limits**:
   - **Max Products**: Enter a number (e.g., 100) or type "unlimited"
   - **Max Orders/Month**: Enter a number or type "unlimited"
   - **Max Users**: Number of admin users allowed
   - **Max Storage**: Storage limit in GB

4. Check the feature toggles:
   - ☑️ **Custom Domain** - Allow custom domain mapping
   - ☑️ **Analytics Access** - Access to analytics dashboard
   - ☑️ **Priority Support** - Faster support response
   - ☑️ **API Access** - REST API access
   - ☑️ **White Label** - Remove platform branding
   - ☑️ **Multi-Currency** - Support multiple currencies
   - ☑️ **Advanced Reports** - Advanced reporting features

5. Set plan status:
   - ☑️ **Active** - Plan is available for purchase
   - ☑️ **Mark as Popular** - Show "POPULAR" badge

6. Click **"Create Plan"** or **"Update Plan"**

### Editing an Existing Plan

1. Find the plan card
2. Click the **"Edit"** button (gray button with pencil icon)
3. Modify any fields
4. Click **"Update Plan"**

### Deleting a Plan

1. Find the plan card
2. Click the **trash icon** button (red)
3. Confirm deletion

---

## 💰 Billing History Tab

### Viewing Transactions

The billing history table shows:
- **Date**: When the transaction was created
- **Tenant**: Which merchant made the payment
- **Plan**: Which subscription plan
- **Amount**: Payment amount (৳ for BDT, $ for USD)
- **Status**: 
  - 🟢 **Completed** - Payment successful
  - 🟡 **Pending** - Awaiting payment
  - 🔴 **Failed** - Payment failed
  - ⚪ **Refunded** - Payment was refunded

### Processing a Refund

1. Find a **Completed** transaction
2. Click the **"Refund"** link in the Actions column
3. A modal will appear showing:
   - Transaction ID
   - Amount to be refunded
4. Enter a **Refund Reason** (required, minimum 5 characters)
5. Click **"Process Refund"**
6. The transaction status will change to "Refunded"

### Filtering Transactions

Use the URL query parameters:
- Filter by status: `?status=completed`
- Filter by tenant: `?tenantId=tenant123`
- Pagination: `?limit=50&skip=0`

---

## 📄 Invoices Tab

### Viewing Invoices

The invoices table shows:
- **Invoice #**: Auto-generated invoice number (INV-YEAR-XXXXX)
- **Tenant**: Merchant name
- **Amount**: Total invoice amount including tax
- **Due Date**: When payment is due
- **Status**:
  - ⚪ **Draft** - Not yet sent
  - 🔵 **Sent** - Sent to customer
  - 🟢 **Paid** - Payment received
  - 🔴 **Overdue** - Past due date
  - ⚪ **Cancelled** - Invoice cancelled

### Invoice Details

Each invoice includes:
- Invoice number and date
- Tenant information
- Line items with descriptions, quantities, and prices
- Subtotal, tax, and total calculations
- Payment status and dates

---

## ⏱️ Trial Management Tab

### Configuring Trial Settings

1. Navigate to the **Trial Management** tab
2. Configure the following settings:

#### Basic Settings
- **Default Trial Duration**: Number of days (1-365)
  - Example: 14 days

#### Automation Settings
- ☑️ **Automatically expire trials**: 
  - When checked, trials will automatically expire after the duration
  
- ☑️ **Send expiration alerts**: 
  - When checked, send email alerts before trial expires
  - Configure which days to send alerts (e.g., 7, 3, 1 days before)

- ☑️ **Allow trial extensions**: 
  - When checked, allow manual extension of trials
  - Set **Max Trial Extension** (0-30 days)

- ☑️ **Require payment method for trial**: 
  - When checked, users must add a payment method to start trial
  - Helps with auto-conversion after trial ends

3. Click **"Save Settings"** to apply changes

### Trial Alert Schedule

Configure when to send expiration alerts:
- Default: 7, 3, and 1 days before expiration
- Customize based on your needs (e.g., 14, 7, 3, 1 days)

---

## 💡 Best Practices

### Plan Design
- ✅ Start with 3 tiers: Basic, Pro, Enterprise
- ✅ Make the middle tier (Pro) most attractive - mark as "Popular"
- ✅ Use clear, descriptive names
- ✅ Price strategically - show value progression

### Feature Gating
- ✅ Reserve premium features for higher tiers
- ✅ Set realistic limits based on usage patterns
- ✅ Use "unlimited" sparingly for top tier
- ✅ Test limits with real merchant data

### Billing Management
- ✅ Review transactions regularly
- ✅ Process refunds promptly
- ✅ Document refund reasons clearly
- ✅ Monitor failed transactions

### Trial Strategy
- ✅ 14 days is a good default trial length
- ✅ Send multiple alerts before expiration
- ✅ Enable auto-expiration to prevent abuse
- ✅ Consider requiring payment method for serious trials

---

## 🔧 Troubleshooting

### Plans Not Showing
- Check if plans are marked as **Active**
- Verify database connection
- Check browser console for errors

### Refund Not Processing
- Ensure transaction status is **Completed**
- Only completed transactions can be refunded
- Check refund reason is at least 5 characters

### Trial Settings Not Saving
- Verify all required fields are filled
- Check trial duration is between 1-365 days
- Ensure extension days are between 0-30

---

## 📞 Support

For technical issues or questions:
- Email: support@systemnextit.com
- Phone: +880 1700-000000

---

## 🚀 Next Steps

After setup:
1. ✅ Create your subscription plans
2. ✅ Configure trial settings
3. ✅ Test the flow with a demo tenant
4. ✅ Monitor billing transactions
5. ✅ Adjust plans based on usage

---

## 📊 Metrics to Track

Monitor these key metrics:
- **Active Subscriptions**: Number of paying tenants per plan
- **Monthly Recurring Revenue (MRR)**: Total monthly subscription revenue
- **Churn Rate**: Percentage of cancelled subscriptions
- **Trial Conversion Rate**: Percentage of trials that convert to paid
- **Average Revenue Per User (ARPU)**: Average revenue per tenant

---

*For detailed API documentation, see `docs/SUBSCRIPTION_BILLING.md`*
