
import React from 'react';

export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'active' | 'trialing' | 'suspended' | 'inactive' | 'pending';

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface DomainMapping {
  id: string;
  tenantId: string;
  domain: string;
  type: 'subdomain' | 'custom';
  verified: boolean;
  isPrimary: boolean;
  sslEnabled: boolean;
  createdAt: string;
  verificationToken?: string;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
    verified: boolean;
  }[];
}

export interface Tenant {
  id: string;
  _id?: string; // MongoDB compatibility
  name: string;
  subdomain: string;
  customDomain?: string;
  customDomains?: DomainMapping[];
  contactEmail: string;
  contactName?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminAuthUid?: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  locale?: string;
  currency?: string;
  branding?: TenantBranding;
  settings?: Record<string, any>;
}

export interface CreateTenantPayload {
  name: string;
  contactEmail: string;
  contactName?: string;
  subdomain: string;
  plan?: TenantPlan;
  adminEmail: string;
  adminPassword: string;
}

export interface ProductVariantSelection {
  color: string;
  size: string;
}

export interface ProductVariantStock extends ProductVariantSelection {
  stock: number;
  sku?: string;
}

export interface Product {
  id: number;
  name: string;
  tenantId?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number; // Cost price for profit calculation
  sku?: string; // Stock Keeping Unit
  isWholesale?: boolean; // Wholesale product flag
  image: string;
  galleryImages?: string[];
  slug?: string;
  discount?: string;
  tag?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  subCategory?: string; // Added
  childCategory?: string; // Added
  brand?: string; // Added
  tags?: string[];
  searchTags?: string[]; // Deep search tags for advanced product search
  colors?: string[]; // Added: Array of color codes or names
  sizes?: string[]; // Added: Array of size strings (S, M, L, XL etc)
  status?: 'Active' | 'Draft'; // Added for filtering
  stock?: number;
  variantDefaults?: Partial<ProductVariantSelection>;
  variantStock?: ProductVariantStock[];
}

export interface Popup {
  id: number;
  name: string;
  image: string;
  url?: string;
  urlType?: 'Internal' | 'External';
  priority?: number;
  status: 'Draft' | 'Publish';
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  tenantId?: string;
  customer: string;
  location: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'On Hold' | 'Processing' | 'Shipped' | 'Sent to Courier' | 'Delivered' | 'Cancelled' | 'Return' | 'Refund' | 'Returned Receive';
  email?: string; // To link with registered user
  trackingId?: string; // Added for Courier Integration
  phone?: string;
  division?: string;
  variant?: ProductVariantSelection;
  productId?: number;
  productName?: string;
  quantity?: number;
  deliveryType?: 'Regular' | 'Express' | 'Free';
  deliveryCharge?: number;
  courierProvider?: 'Steadfast' | 'Pathao';
  courierMeta?: Record<string, any>;
  source?: 'store' | 'landing_page' | 'admin';
  landingPageId?: string;
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  tenantId?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: string; // ID of the custom role defined in AdminControl
  roleDetails?: Role;
  username?: string; // Added for admin profile
  image?: string; // Added for admin profile
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string; // Added for admin profile
  updatedAt?: string; // Added for admin profile
}

export type ResourceType = 
  | 'dashboard' | 'orders' | 'products' | 'customers' | 'inventory'
  | 'catalog' | 'landing_pages' | 'gallery' | 'reviews' | 'daily_target'
  | 'business_report' | 'expenses' | 'income' | 'due_book' | 'profit_loss'
  | 'notes' | 'customization' | 'settings' | 'admin_control' | 'tenants'
  | 'customers_reviews';

export type ActionType = 'read' | 'write' | 'edit' | 'delete';

export interface Permission {
  resource: ResourceType;
  actions: ActionType[];
}

export interface Role {
  _id?: string;
  id?: string;
  tenantId?: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontColor: string;
  hoverColor: string;
  surfaceColor: string;
  darkMode: boolean;
  // Admin theme colors
  adminBgColor?: string;
  adminInputBgColor?: string;
  adminBorderColor?: string;
  adminFocusColor?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface ChatSupportHours {
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: number;
  customerName?: string;
  customerEmail?: string;
  authorName?: string;
  authorEmail?: string;
  authorRole?: User['role'];
  editedAt?: number;
}

export interface CarouselItem {
  id: string;
  image: string;
  mobileImage?: string;
  name: string;
  url: string;
  urlType: 'Internal' | 'External';
  serial: number;
  status: 'Publish' | 'Draft';
}

export interface Campaign {
  id: string;
  name: string;
  logo?: string;
  startDate: string;
  endDate: string;
  url?: string;
  status: 'Publish' | 'Draft';
  serial: number;
}

export interface WebsiteConfig {
  tenantId?: string;
  websiteName: string;
  shortDescription: string;
  whatsappNumber: string;
  favicon: string | null;
  headerLogo?: string | null;
  footerLogo?: string | null;
  addresses: string[];
  emails: string[];
  phones: string[];
  socialLinks: SocialLink[];
  footerQuickLinks: FooterLink[];
  footerUsefulLinks: FooterLink[];
  // Display Toggles
  showMobileHeaderCategory: boolean;
  showNewsSlider: boolean;
  headerSliderText: string;
  hideCopyright: boolean;
  hideCopyrightText: boolean;
  showPoweredBy: boolean;
  showFlashSaleCounter?: boolean;
  brandingText: string;
  // Visual Toggles
  bottomNavStyle?: string;
  footerStyle?: string;
  productCardStyle?: string;
  headerStyle?: string;
  categorySectionStyle?: string;
  showcaseSectionStyle?: string;
  brandSectionStyle?: string;
  productSectionStyle?: string;
  // New Additions
  carouselItems: CarouselItem[];
  searchHints?: string;
  orderLanguage?: 'English' | 'Bangla';
  chatEnabled?: boolean;
  chatGreeting?: string;
  chatOfflineMessage?: string;
  chatSupportHours?: ChatSupportHours;
  chatWhatsAppFallback?: boolean;
  chatAccentColor?: string;
  chatSurfaceColor?: string;
  chatBorderColor?: string;
  chatShadowColor?: string;
  // App Download Links
  androidAppUrl?: string;
  iosAppUrl?: string;
  // Admin Notice Ticker
  adminNoticeText?: string;
  // Campaigns
  campaigns?: Campaign[];
  // Popups
  popups?: Popup[];
}

export interface DeliveryConfig {
  type: 'Regular' | 'Express' | 'Free';
  isEnabled: boolean;
  division: string;
  insideCharge: number;
  outsideCharge: number;
  freeThreshold: number;
  note: string;
  tenantId?: string;
}

export interface CourierConfig {
  apiKey: string;
  secretKey: string;
  instruction?: string;
}

export interface FacebookPixelConfig {
  pixelId: string;
  accessToken: string;
  enableTestEvent: boolean;
  isEnabled: boolean;
}

// Catalog Types
export interface Category {
  slug: any;
  id: string;
  tenantId?: string;
  name: string;
  icon?: string;
  image?: string;
  status: 'Active' | 'Inactive';
}

export interface SubCategory {
  id: string;
  tenantId?: string;
  categoryId: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface ChildCategory {
  id: string;
  tenantId?: string;
  subCategoryId: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface Brand {
  id: string;
  tenantId?: string;
  name: string;
  logo: string;
  status: 'Active' | 'Inactive';
}

export interface Tag {
  id: string;
  tenantId?: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface GalleryItem {
  id: number;
  tenantId?: string;
  title: string;
  category: string;
  imageUrl: string;
  dateAdded: string;
}

export type LandingPageMode = 'ready' | 'custom';
export type LandingPageStatus = 'draft' | 'published';
export type LandingBlockType = 'hero' | 'features' | 'reviews' | 'faq' | 'cta';

export interface LandingBlockItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface LandingPageBlock {
  id: string;
  type: LandingBlockType;
  title?: string;
  subtitle?: string;
  description?: string;
  mediaUrl?: string;
  ctaLabel?: string;
  ctaLink?: string;
  items?: LandingBlockItem[];
  style?: {
    background?: string;
    textColor?: string;
    accentColor?: string;
    layout?: 'split' | 'stacked';
  };
}

export interface LandingPageSEO {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  keywords?: string[];
}

export interface LandingPageStyle {
  fontFamily?: string;
  primaryColor?: string;
  accentColor?: string;
  background?: string;
  buttonShape?: 'pill' | 'rounded' | 'square';
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  heroLayout: 'split' | 'center';
  featuresLayout: 'grid' | 'stacked';
  buttonShape: 'pill' | 'rounded' | 'square';
}

export interface LandingPage {
  id: string;
  tenantId?: string;
  name: string;
  mode: LandingPageMode;
  productId?: number;
  templateId?: string;
  status: LandingPageStatus;
  urlSlug: string;
  seo: LandingPageSEO;
  blocks: LandingPageBlock[];
  style: LandingPageStyle;
  customConfig?: Record<string, any>;
  onePageCheckout: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Due List Types
export type EntityType = 'Customer' | 'Supplier' | 'Employee';
export type TransactionDirection = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'Pending' | 'Paid' | 'Cancelled';

export interface DueEntity {
  _id?: string;
  name: string;
  phone: string;
  type: EntityType;
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DueTransaction {
  _id?: string;
  entityId: string;
  entityName: string;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  status: TransactionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDueTransactionPayload {
  entityId: string;
  entityName: string;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
}

export interface CreateEntityPayload {
  name: string;
  phone: string;
  type: EntityType;
}
