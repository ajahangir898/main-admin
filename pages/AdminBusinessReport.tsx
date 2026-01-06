import React, { useState, useEffect, Suspense, lazy } from 'react';
import { FileText, DollarSign, TrendingUp, BookOpen, StickyNote, Receipt } from 'lucide-react';
import { Order, Product, User } from '../types';

const AdminExpenses = lazy(() => import('./AdminExpenses'));
const AdminIncome = lazy(() => import('./AdminIncome'));
const AdminProfitLoss = lazy(() => import('./AdminProfitLoss'));
const AdminDueList = lazy(() => import('./AdminDueList'));
const AdminNote = lazy(() => import('./AdminNote'));

interface AdminBusinessReportProps {
  initialTab?: string;
  orders?: Order[];
  products?: Product[];
  user?: User | null;
  onLogout?: () => void;
  tenantId?: string;
}

const AdminBusinessReport: React.FC<AdminBusinessReportProps> = ({
  initialTab = 'expense',
  orders = [],
  products = [],
  user,
  onLogout,
  tenantId,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with prop change (for sidebar navigation)
  useEffect(() => {
    // Extract the tab name from full ID like 'business_report_expense' -> 'expense'
    const tabName = initialTab.replace('business_report_', '');
    setActiveTab(tabName);
  }, [initialTab]);

  const tabs = [
    { id: 'expense', label: 'Expense', icon: <Receipt size={18} /> },
    { id: 'income', label: 'Income', icon: <DollarSign size={18} /> },
    { id: 'due_book', label: 'Due Book', icon: <BookOpen size={18} /> },
    { id: 'profit_loss', label: 'Profit / Loss', icon: <TrendingUp size={18} /> },
    { id: 'note', label: 'Note', icon: <StickyNote size={18} /> },
  ];

  const TabButton: React.FC<{ id: string; label: string; icon?: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
        activeTab === id
          ? 'border-emerald-500 text-emerald-600'
          : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="space-y-0 animate-fade-in bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white z-30 pt-4 pb-4 px-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-500" />
            Business Report
          </h2>
          <p className="text-sm text-gray-500">Track expenses, income, and profit/loss</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide bg-white px-2">
        {tabs.map((tab) => (
          <TabButton key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} />
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96 text-gray-400">Loading...</div>
          }
        >
          {activeTab === 'expense' && <AdminExpenses />}
          {activeTab === 'income' && <AdminIncome />}
          {activeTab === 'due_book' && <AdminDueList user={user} onLogout={onLogout} />}
          {activeTab === 'profit_loss' && <AdminProfitLoss orders={orders} products={products} />}
          {activeTab === 'note' && <AdminNote tenantId={tenantId} />}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminBusinessReport;
