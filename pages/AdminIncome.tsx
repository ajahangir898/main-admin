import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Calendar, Printer, Image as ImageIcon, Edit2, Trash2, ChevronLeft, ChevronRight, X, TrendingUp, DollarSign, RefreshCw, Download } from 'lucide-react';
import { IncomeService, IncomeDTO } from '../services/IncomeService';
import { CategoryService } from '../services/CategoryService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface IncomeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

interface IncomeCategoryDTO {
  id: string;
  name: string;
}

const AdminIncome: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'All'|'Published'|'Draft'|'Trash'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<{from?: string; to?: string}>({});
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [categories, setCategories] = useState<IncomeCategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<IncomeItem>>({ status: 'Draft' });
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Default income categories
  const defaultCategories: IncomeCategoryDTO[] = [
    { id: '1', name: 'Investment Return' },
    { id: '2', name: 'Interest Income' },
    { id: '3', name: 'Rental Income' },
    { id: '4', name: 'Commission' },
    { id: '5', name: 'Refund' },
    { id: '6', name: 'Other Income' },
  ];

  const filtered = useMemo(() => {
    return items.filter(i =>
      (statusTab === 'All' || i.status === statusTab) &&
      (!selectedCategory || i.category === selectedCategory) &&
      (!query || i.name.toLowerCase().includes(query.toLowerCase())) &&
      (!dateRange.from || new Date(i.date) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(i.date) <= new Date(dateRange.to))
    );
  }, [items, statusTab, selectedCategory, query, dateRange]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalAmount = useMemo(() => filtered.reduce((sum, i) => sum + i.amount, 0), [filtered]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [incomeRes, catRes] = await Promise.all([
          IncomeService.list({
            query,
            status: statusTab === 'All' ? undefined : statusTab,
            category: selectedCategory || undefined,
            from: dateRange.from,
            to: dateRange.to,
            page,
            pageSize,
          }),
          CategoryService.list().catch(() => ({ items: [] })),
        ]);
        setItems(incomeRes.items as any);
        // Use categories from API if available, otherwise use defaults
        const apiCategories = catRes.items.map((c: any) => ({ id: c.id || String(Math.random()), name: c.name }));
        setCategories(apiCategories.length > 0 ? apiCategories : defaultCategories);
      } catch (e: any) {
        setError(e?.message || 'Failed to load incomes');
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [query, statusTab, selectedCategory, dateRange.from, dateRange.to, page]);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount || !newItem.date) return;
    const payload: IncomeDTO = {
      name: newItem.name!,
      category: newItem.category!,
      amount: Number(newItem.amount!),
      date: newItem.date!,
      status: (newItem.status as any) || 'Draft',
      note: newItem.note,
      imageUrl: newItem.imageUrl,
    };
    try {
      if (editingIncomeId) {
        const updated = await IncomeService.update(editingIncomeId, payload);
        setItems(prev => prev.map(item => item.id === editingIncomeId ? { ...(updated as any), id: updated.id || editingIncomeId } : item));
      } else {
        const created = await IncomeService.create(payload);
        setItems(prev => [{ ...(created as any), id: created.id || String(Date.now()) }, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingIncomeId(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to save income');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income entry?')) return;
    try {
      await IncomeService.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete income');
    }
  };

  const handleEdit = (item: IncomeItem) => {
    setNewItem(item);
    setEditingIncomeId(item.id);
    setIsAddOpen(true);
  };

  const formatCurrency = (amount: number) =>
    `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 bg-[#0a0a0f] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-green-500" />
            Income
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your other income sources</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setNewItem({ status: 'Draft', date: new Date().toISOString().split('T')[0] }); setEditingIncomeId(null); setIsAddOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 mb-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-400 text-sm">Total Income</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
            <p className="text-slate-400 text-xs mt-1">{filtered.length} transactions</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#12121a] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search incomes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
            />
            <span className="text-slate-500">—</span>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4">
          {(['All', 'Published', 'Draft', 'Trash'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${
                statusTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-[#12121a] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No income entries found
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img src={normalizeImageUrl(item.imageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            {item.note && <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.note}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-semibold">
                        +{formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-400">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= filtered.length}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-xl border border-white/10 w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">
                {editingIncomeId ? 'Edit Income' : 'Add New Income'}
              </h2>
              <button
                onClick={() => { setIsAddOpen(false); setEditingIncomeId(null); setNewItem({ status: 'Draft' }); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Income description"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category *</label>
                  <select
                    value={newItem.category || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={newItem.amount || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newItem.date || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={newItem.status || 'Draft'}
                    onChange={(e) => setNewItem(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Note</label>
                <textarea
                  value={newItem.note || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => { setIsAddOpen(false); setEditingIncomeId(null); setNewItem({ status: 'Draft' }); }}
                className="px-4 py-2 text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newItem.name || !newItem.category || !newItem.amount || !newItem.date}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {editingIncomeId ? 'Update' : 'Add'} Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncome;
