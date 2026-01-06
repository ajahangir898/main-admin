// Utility functions for Super Admin Dashboard

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('bn-BD', { 
    style: 'currency', 
    currency: 'BDT',
    minimumFractionDigits: 0 
  }).format(amount);
};

export const getPlanBadge = (plan: string): string => {
  const styles: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-700',
    growth: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700'
  };
  return styles[plan] || styles.starter;
};

export const getStatusBadge = (status: string): string => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trialing: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700'
  };
  return styles[status] || styles.active;
};
