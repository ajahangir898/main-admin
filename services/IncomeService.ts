// Income Service for Business Reports
// Manages other income sources besides sales

export interface IncomeDTO {
  id?: string;
  name: string;
  category: string;
  amount: number;
  date: string; // ISO
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

export interface IncomeSummary {
  totalAmount: number;
  totalTransactions: number;
  categories: number;
}

const API_BASE = 'https://systemnextit.com';

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export const IncomeService = {
  async list(opts: { query?: string; status?: string; category?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) {
    const url = buildUrl('/api/incomes', opts);
    const res = await fetch(url);
    if (!res.ok) {
      return { items: [], total: 0 };
    }
    return res.json() as Promise<{ items: IncomeDTO[]; total: number }>;
  },
  
  async summary(opts: { from?: string; to?: string } = {}) {
    const url = buildUrl('/api/incomes/summary', opts);
    const res = await fetch(url);
    if (!res.ok) {
      return { totalAmount: 0, totalTransactions: 0, categories: 0 };
    }
    return res.json() as Promise<IncomeSummary>;
  },
  
  async create(payload: IncomeDTO) {
    const res = await fetch(buildUrl('/api/incomes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create income');
    return res.json() as Promise<IncomeDTO>;
  },
  
  async update(id: string, payload: Partial<IncomeDTO>) {
    const res = await fetch(buildUrl(`/api/incomes/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update income');
    return res.json() as Promise<IncomeDTO>;
  },
  
  async remove(id: string) {
    const res = await fetch(buildUrl(`/api/incomes/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete income');
    return res.json() as Promise<{ success: boolean }>;
  },
};
