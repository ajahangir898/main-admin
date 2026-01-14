import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Boxes, AlertTriangle, ClipboardList, TrendingUp, Search, Settings, X, Loader2, BarChart3 } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';
import { MetricsSkeleton } from '../components/SkeletonLoaders';
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

    return { totalSkus, totalUnits, lowStockCount, outStockCount, totalValue, totalSaleValue };
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
      return 'bg-rose-50 text-rose-600';
    }
    if (stock <= lowStockThreshold) {
      return 'bg-amber-50 text-amber-600';
    }
    return 'bg-[#E6F7F5] text-[#2DD4BF]';
  };

  const getStatusLabel = (stock?: number) => {
    if (!stock || stock <= 0) return 'Out of stock';
    if (stock <= lowStockThreshold) return 'Low stock';
    return 'Publish';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
      </div>

      {isLoading ? (
        <MetricsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Products Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Products</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalSkus}</p>
                <p className="text-xs text-gray-400 mt-1">Stock Report</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Boxes size={20} className="text-gray-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Total Unit on Hand */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total unit on hand</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUnits.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Access entire shop</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <ClipboardList size={20} className="text-gray-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Low stock</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.lowStockCount + stats.outStockCount}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.outStockCount} out / {stats.lowStockCount} low ({'<'}{lowStockThreshold})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setTempThreshold(lowStockThreshold); setShowSettings(true); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                  title="Configure threshold"
                >
                  <Settings size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-gray-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>

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
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Value */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inventory value</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Reserve Price</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <BarChart3 size={20} className="text-gray-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Inventory Sale Value */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inventory sale value</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalSaleValue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Selling Price</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-gray-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Products Table Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 xl:col-span-2">
          {/* Search and Sort Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2DD4BF]/20 focus:border-[#2DD4BF] text-sm"
                  placeholder="Search Category"
                />
              </div>
              <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Search
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'stock' | 'name')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 focus:border-[#2DD4BF]"
              >
                <option value="stock">Stock low to high</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2DD4BF] text-white text-left">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">Stock</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{product.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{product.category || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-gray-700">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-gray-700">{product.stock ?? 0}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusBadge(product.stock)}`}>
                        {getStatusLabel(product.stock)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No products match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts Sidebar */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Inventory alerts</h3>
            <p className="text-sm text-gray-500 mt-1">Review the most critical SKUs and plan replenishment</p>
          </div>
          <div className="space-y-3">
            {alerts.map((product) => (
              <div key={product.id} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                  <p className="text-xs text-gray-400">Stock {product.stock ?? 0}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusBadge(product.stock)}`}>
                  {getStatusLabel(product.stock)}
                </span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-4 rounded-lg bg-[#E6F7F5] text-[#2DD4BF] text-sm font-medium">
                Inventory looks healthy: No low-stock items.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
