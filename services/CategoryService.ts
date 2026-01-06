// Resolve API base URL from Vite env

export interface CategoryDTO {
  id?: string;
  name: string;
  createdAt?: string;
}

const BASE = 'https://systemnextit.com';

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export const CategoryService = {
  async list() {
    const url = buildUrl('/api/expenses/categories/list');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json() as Promise<{ items: CategoryDTO[] }>;
  },

  async create(payload: { name: string }) {
    const res = await fetch(buildUrl('/api/expenses/categories/create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json() as Promise<CategoryDTO>;
  },

  async update(id: string, payload: { name: string }) {
    const res = await fetch(buildUrl(`/api/expenses/categories/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json() as Promise<CategoryDTO>;
  },

  async remove(id: string) {
    const res = await fetch(buildUrl(`/api/expenses/categories/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json() as Promise<{ success: boolean }>;
  },
};
