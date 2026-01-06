import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Calendar, Printer, Filter, Image as ImageIcon, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ExpenseService, ExpenseDTO } from '../services/ExpenseService';
import { CategoryService, CategoryDTO } from '../services/CategoryService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string; // ISO date
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

const AdminExpenses: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'All'|'Published'|'Draft'|'Trash'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<{from?: string; to?: string}>({});
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ExpenseItem>>({ status: 'Draft' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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
        const [expRes, catRes] = await Promise.all([
          ExpenseService.list({
            query,
            status: statusTab === 'All' ? undefined : statusTab,
            category: selectedCategory || undefined,
            from: dateRange.from,
            to: dateRange.to,
            page,
            pageSize,
          }),
          CategoryService.list(),
        ]);
        setItems(expRes.items as any);
        setCategories(catRes.items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusTab, selectedCategory, dateRange.from, dateRange.to, page, pageSize]);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount || !newItem.date) return;
    const payload: ExpenseDTO = {
      name: newItem.name!,
      category: newItem.category!,
      amount: Number(newItem.amount!),
      date: newItem.date!,
      status: (newItem.status as any) || 'Draft',
      note: newItem.note,
      imageUrl: newItem.imageUrl,
    };
    try {
      if (editingExpenseId) {
        // Update existing expense
        const updated = await ExpenseService.update(editingExpenseId, payload);
        setItems(prev => prev.map(item => item.id === editingExpenseId ? { ...(updated as any), id: updated.id || editingExpenseId } : item));
      } else {
        // Create new expense
        const created = await ExpenseService.create(payload);
        setItems(prev => [{ ...(created as any), id: created.id || Math.random().toString(36).slice(2) }, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingExpenseId(null);
    } catch (e) {
      // Fall back to local update/add if API not ready
      if (editingExpenseId) {
        setItems(prev => prev.map(item => item.id === editingExpenseId ? (newItem as ExpenseItem) : item));
      } else {
        const fallback = { id: Math.random().toString(36).slice(2), ...(payload as any) } as ExpenseItem;
        setItems(prev => [fallback, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingExpenseId(null);
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setNewItem(expense);
    setEditingExpenseId(expense.id);
    setIsAddOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategoryId) {
        const updated = await CategoryService.update(editingCategoryId, { name: newCategoryName });
        setCategories(prev => prev.map(c => c.id === editingCategoryId ? updated : c));
      } else {
        const created = await CategoryService.create({ name: newCategoryName });
        setCategories(prev => [...prev, created]);
      }
      setNewCategoryName('');
      setEditingCategoryId(null);
      setIsCategoryModalOpen(false);
    } catch (e) {
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await CategoryService.remove(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Failed to delete category');
    }
  };

  const handlePrintInvoice = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 40px; }
          header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0f766e; padding-bottom: 20px; }
          .logo { font-size: 32px; font-weight: bold; color: #0f766e; margin-bottom: 10px; }
          .subtitle { color: #888; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .info-label { font-weight: bold; color: #0f766e; font-size: 12px; text-transform: uppercase; }
          .info-value { margin-top: 5px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          thead { background: #0f766e; color: white; }
          th { padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          tr:hover { background: #fafafa; }
          .text-right { text-align: right; }
          .amount { font-weight: bold; color: #0f766e; }
          .total-row { font-weight: bold; font-size: 16px; background: #f0f0f0; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
          .summary-card { padding: 20px; background: #0f766e; color: white; border-radius: 8px; text-align: center; }
          .summary-label { font-size: 12px; opacity: 0.9; }
          .summary-value { font-size: 24px; font-weight: bold; margin-top: 10px; }
          footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px; }
          @media print { body { margin: 0; padding: 0; } .container { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="logo">OP-BD.COM</div>
            <div class="subtitle">Professional Expense Report</div>
          </header>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Report Date</div>
              <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Total Expenses</div>
              <div class="info-value amount">BDT ${totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">BDT ${totalAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Categories</div>
              <div class="summary-value">${new Set(filtered.map(i => i.category)).size}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Transactions</div>
              <div class="summary-value">${filtered.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(i => `
                <tr>
                  <td>${new Date(i.date).toLocaleDateString()}</td>
                  <td>${i.name}</td>
                  <td>${i.category}</td>
                  <td>${i.status}</td>
                  <td class="text-right amount">BDT ${i.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">TOTAL</td>
                <td class="text-right" style="color: #0f766e;">BDT ${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <footer>
            <p>This is an automatically generated expense report. Generated on ${new Date().toLocaleString()}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    
    // write into the opened window's document (document.write exists, window.write does not)
    doc.document?.open();
    doc.document?.write(htmlContent);
    doc.document?.close();
    setTimeout(() => doc.print(), 500);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="space-y-4 h-full overflow-auto">
      {/* Summary Header */}
      <div className="bg-[#0a0e12] rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Expense Summary</h2>
            <p className="text-sm text-slate-400">Total expenses overview for the selected period.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-300" />
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search" className="bg-transparent text-slate-200 text-sm outline-none ml-2" />
            </div>
            <button onClick={()=>setIsAddOpen(true)} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <div className="col-span-1 md:col-span-2 bg-emerald-600/20 rounded-lg p-3">
            <div className="text-2xl md:text-3xl font-black text-emerald-300">BDT{totalAmount.toFixed(2)}</div>
            <div className="text-xs text-slate-300">Total Expense • {filtered.length} transactions</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-slate-300 text-xs">Summary</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-white">{new Set(items.map(i=>i.category)).size}</div>
                <div className="text-[11px] text-slate-400">Categories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{items.length}</div>
                <div className="text-[11px] text-slate-400">Total Transactions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{filtered.length}</div>
                <div className="text-[11px] text-slate-400">Filtered</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-slate-300 text-xs mb-2">Actions</div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setNewCategoryName(''); setEditingCategoryId(null); setIsCategoryModalOpen(true); }} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-semibold"><Plus className="w-4 h-4" /> Category</button>
              <button onClick={handlePrintInvoice} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-semibold"><Printer className="w-4 h-4" /> Print</button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Filter className="w-4 h-4 text-slate-300" />
              <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="bg-transparent text-slate-200 text-xs rounded-md px-2 py-1">
                <option value="">Filter by Category</option>
                {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table & Tabs */}
      <div className="bg-[#0a0e12] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            {(['All','Published','Draft','Trash'] as const).map(t => (
              <button key={t} onClick={()=>setStatusTab(t)} className={`font-semibold ${statusTab===t? 'text-emerald-300':'text-slate-400'} hover:text-white`}>{t}{t==='All'? ` (${filtered.length})`: ''}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setNewCategoryName(''); setEditingCategoryId(null); setIsCategoryModalOpen(true); }} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md">+ Add Category</button>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <button disabled className="px-2 py-1 bg-white/10 rounded-md">1</button>
              <span>of {totalPages}</span>
              <button onClick={()=>setPage(Math.max(1,page-1))} className="px-2 py-1 bg-white/10 rounded-md"><ChevronLeft className="w-3 h-3"/></button>
              <button onClick={()=>setPage(Math.min(totalPages,page+1))} className="px-2 py-1 bg-white/10 rounded-md"><ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          {error ? (
            <div className="py-10 text-center text-red-400">{error}</div>
          ) : paged.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="w-10 h-10 mb-2" />
                <div className="font-semibold">No Data Found!</div>
                <div className="text-xs">Please add some data to show here.</div>
              </div>
            </div>
          ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300 border-b border-white/10">
                <th className="p-2"><input type="checkbox" disabled/></th>
                <th className="p-2">Image</th>
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((i, idx) => (
                  <tr key={i.id || `expense-${idx}`} className="border-b border-white/5">
                    <td className="p-2"><input type="checkbox" /></td>
                    <td className="p-2">
                      {i.imageUrl ? <img src={normalizeImageUrl(i.imageUrl)} alt="receipt" className="w-10 h-10 rounded object-cover"/> : <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400"/></div>}
                    </td>
                    <td className="p-2 text-white">{i.name}</td>
                    <td className="p-2 text-slate-300">{i.category}</td>
                    <td className="p-2 text-emerald-300 font-semibold">BDT{i.amount.toFixed(2)}</td>
                    <td className="p-2 text-slate-300">{new Date(i.date).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i.status==='Published'? 'bg-emerald-600/20 text-emerald-300':'bg-white/10 text-slate-300'}`}>{i.status}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <button className="p-1 hover:text-white" onClick={() => handleEditExpense(i)}><Edit2 className="w-4 h-4"/></button>
                        <button className="p-1 hover:text-red-400" onClick={()=>setItems(prev=>prev.filter(x=>x.id!==i.id))}><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0e12] rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={()=>{setIsAddOpen(false); setNewItem({ status: 'Draft' }); setEditingExpenseId(null);}} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Expense Name</label>
                <input className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.name||''} onChange={e=>setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <select className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.category||''} onChange={e=>setNewItem({...newItem, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Amount</label>
                  <input type="number" className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.amount as any || ''} onChange={e=>setNewItem({...newItem, amount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Date</label>
                  <input type="date" className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.date||''} onChange={e=>setNewItem({...newItem, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Image Upload (URL)</label>
                <input className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.imageUrl||''} onChange={e=>setNewItem({...newItem, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-slate-400">Status</label>
                <select className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.status as any || 'Draft'} onChange={e=>setNewItem({...newItem, status: e.target.value as any})}>
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Note</label>
                <textarea className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" value={newItem.note||''} onChange={e=>setNewItem({...newItem, note: e.target.value})} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={()=>{setIsAddOpen(false); setNewItem({ status: 'Draft' }); setEditingExpenseId(null);}} className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-md">Cancel</button>
                <button onClick={handleAdd} className="px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold">{editingExpenseId ? 'Update Expense' : 'Save Expense'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0e12] rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={()=>setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4 mb-4">
              <input 
                type="text" 
                placeholder="Category name" 
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold">{editingCategoryId ? 'Update' : 'Add'}</button>
                <button onClick={()=>setIsCategoryModalOpen(false)} className="flex-1 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-md">Cancel</button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-white text-sm font-semibold mb-3">All Categories</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-white/5 p-2 rounded-md">
                    <span className="text-sm text-white">{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewCategoryName(cat.name); setEditingCategoryId(cat.id!); }} className="p-1 text-emerald-300 hover:text-emerald-200"><Edit2 className="w-3 h-3"/></button>
                      <button onClick={() => handleDeleteCategory(cat.id!)} className="p-1 text-red-300 hover:text-red-200"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
