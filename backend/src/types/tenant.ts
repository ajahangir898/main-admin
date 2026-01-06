import type { ObjectId } from 'mongodb';

export interface BaseModel {
  _id?: string | ObjectId;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant extends BaseModel {
  id: any;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  contactEmail: string;
  contactName?: string;
  adminEmail: string;
  // NOTE: adminPassword should NOT be stored in tenant document
  // It's only used during creation to create the admin user
  adminAuthUid?: string;
  plan: 'starter' | 'growth' | 'enterprise' | string;
  status: 'trialing' | 'active' | 'suspended' | 'archived' | string;
  onboardingCompleted: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
    [key: string]: unknown;
  };
}

export interface CreateTenantPayload {
  name: string;
  subdomain: string;
  contactEmail: string;
  contactName?: string;
  adminEmail: string;
  adminPassword: string; // Used only for creating admin user, not stored
  plan?: Tenant['plan'];
}