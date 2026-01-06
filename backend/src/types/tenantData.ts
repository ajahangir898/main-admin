export interface TenantDataDocument<T = unknown> {
  tenantId: string;
  key: string;
  data: T;
  updatedAt: string;
}
