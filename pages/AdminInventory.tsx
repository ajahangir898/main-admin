import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Boxes, AlertTriangle, Package, TrendingUp, Search, ShieldCheck, Settings, X, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';
import { MetricsSkeleton, TableSkeleton } from '../components/SkeletonLoaders';
import { DataService } from '../services/DataService';

const dataService = DataService;

interface InventorySettings {
  lowStockThreshold: number;
}

interface AdminInventoryProps {
  products: Product[];
  lowStockThreshold?: number;
  tenantId?: string;
}

const AdminInventory: React.FC<AdminInventoryProps> = ({ products, lowStockThreshold: defaultThreshold = 5, tenantId }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'stock' | 'name'>('stock');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(defaultThreshold);
  const [tempThreshold, setTempThreshold] = useState(defaultThreshold);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await dataService.get<InventorySettings>('inventory_settings', { lowStockThreshold: defaultThreshold }, tenantId);
        if (settings?.lowStockThreshold) {
          setLowStockThreshold(settings.lowStockThreshold);
          setTempThreshold(settings.lowStockThreshold);
        }
      } catch (error) {
        console.warn('Failed to load inventory settings:', error);
      }
    };
    loadSettings();
  }, [tenantId, defaultThreshold]);

  const handleSaveThreshold = useCallback(async () => {
    setIsSaving(true);
    try {
      await dataService.save<InventorySettings>('inventory_settings', { lowStockThreshold: tempThreshold }, tenantId);
      setLowStockThreshold(tempThreshold);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save inventory settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [tempThreshold, tenantId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const totalSkus = products.length;
    const totalUnits = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    const lowStockCount = products.filter((product) => {
      const stock = product.stock ?? 0;
      return stock > 0 && stock <= lowStockThreshold;
    }).length;
    const outStockCount = products.filter((product) => (product.stock ?? 0) <= 0).length;
    const totalValue = products.reduce((sum, product) => sum + (product.stock ?? 0) * (product.costPrice ?? 0), 0);
    const totalSaleValue = products.reduce((sum, product) => sum + (product.stock ?? 0) * (product.price ?? 0), 0);
    const penalty = lowStockCount * 3 + outStockCount * 6;
    const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty / Math.max(1, totalSkus))));

    return { totalSkus, totalUnits, lowStockCount, outStockCount, totalValue, totalSaleValue, healthScore };
  }, [products, lowStockThreshold]);

  const alerts = useMemo(() => (
    [...products]
      .filter((product) => (product.stock ?? 0) <= lowStockThreshold)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 6)
  ), [products, lowStockThreshold]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let next = term
      ? products.filter((product) => product.name.toLowerCase().includes(term) || product.category?.toLowerCase().includes(term))
      : [...products];

    next.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return (a.stock ?? 0) - (b.stock ?? 0);
    });

    return next;
  }, [products, search, sortBy]);

  const getStatusBadge = (stock?: number) => {
    if (!stock || stock <= 0) {
      return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
    if (stock <= lowStockThreshold) {
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    }
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  };

  const getStatusLabel = (stock?: number) => {
    if (!stock || stock <= 0) return 'Out of stock';
    if (stock <= lowStockThreshold) return 'Low stock';
    return 'In stock';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500">Monitor stock health, forecast shortages, and stay ahead of fulfilment.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm ml-auto">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-xs font-semibold text-gray-600">Coverage score {stats.healthScore}%</span>
        </div>
      </div>

      {isLoading ? (
        <MetricsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Products</span>
              <Boxes size={18} className="text-indigo-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{stats.totalSkus}</p>
            <p className="text-xs text-gray-400 mt-1">Stock Report</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total units on hand</span>
              <Package size={18} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{stats.totalUnits.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Across entire shop</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Low Stock Warning</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setTempThreshold(lowStockThreshold); setShowSettings(true); }}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                  title="Configure threshold"
                >
                  <Settings size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{stats.lowStockCount + stats.outStockCount}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.outStockCount} out / {stats.lowStockCount} low (≤{lowStockThreshold})</p>

            {/* Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Low Stock Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-full">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Threshold
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Products with stock at or below this number will be marked as "Low Stock"
                      </p>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={tempThreshold}
                        onChange={(e) => setTempThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 text-lg font-semibold"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowSettings(false)}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveThreshold}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Inventory value</span>
              <TrendingUp size={18} className="text-orange-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">৳ {stats.totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Reserve Price</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Inventory Sale Value</span>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">৳ {stats.totalSaleValue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Selling Price</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-2/3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 text-sm"
                placeholder="Search products, categories, or tags"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'stock' | 'name')}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 focus:outline-none focus:ring"
              >
                <option value="stock">Stock level</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="py-3">Product</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-semibold text-gray-800 line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-400">#{product.id}</div>
                    </td>
                    <td className="py-3 text-gray-500">{product.category || 'Unassigned'}</td>
                    <td className="py-3 text-gray-700 font-semibold">৳ {formatCurrency(product.price)}</td>
                    <td className="py-3 font-bold text-gray-900">{product.stock ?? 0}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(product.stock)}`}>
                        {getStatusLabel(product.stock)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-gray-500">No products match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Inventory alerts</h3>
            <p className="text-sm text-gray-500">Review the most critical SKUs and plan replenishment.</p>
          </div>
          <div className="space-y-3">
            {alerts.map((product) => (
              <div key={product.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                  <p className="text-xs text-gray-400">Stock {product.stock ?? 0}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(product.stock)}`}>
                  {getStatusLabel(product.stock)}
                </span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-semibold">
                Inventory looks healthy. No low-stock items.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
