import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Filter } from 'lucide-react';
import { DueEntity, DueTransaction, EntityType } from '../types';
import AddNewDueModal from '../components/AddNewDueModal';
import DueHistoryModal from '../components/DueHistoryModal';
import { dueListService } from '../services/DueListService';




interface AdminDueListProps {
  user?: any;
  onLogout?: () => void;
}

const AdminDueList: React.FC<AdminDueListProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<EntityType>('Customer');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [entities, setEntities] = useState<DueEntity[]>([]);
  const [transactions, setTransactions] = useState<DueTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [selectedEntity, setSelectedEntity] = useState<DueEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Calculate totals
  const totalWillGet = entities.reduce((sum, e) => sum + (e.totalOwedToMe || 0), 0);
  const totalWillGive = entities.reduce((sum, e) => sum + (e.totalIOweThemNumber || 0), 0);

  // Fetch entities
  const fetchEntities = async () => {
    setLoading(true);
    try {
      const data = await dueListService.getEntities(activeTab, searchQuery);
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions for selected entity
  const fetchTransactions = async () => {
    if (!selectedEntity) {
      setTransactions([]);
      return;
    }
    setTransactionLoading(true);
    try {
      const data = await dueListService.getTransactions(
        selectedEntity._id,
        dateRange.from,
        dateRange.to
      );
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
    setSelectedEntity(null);
    setTransactions([]);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [selectedEntity, dateRange]);

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Due List</h1>
          <div className="flex items-center gap-4">
            {/* You Will Get */}
            <div className="text-center">
              <p className="text-sm text-gray-600">You Will Get</p>
              <p className="text-2xl font-bold text-red-600">৳{totalWillGet.toLocaleString()}</p>
            </div>

            {/* You Will Give */}
            <div className="text-center">
              <p className="text-sm text-gray-600">You Will Give</p>
              <p className="text-2xl font-bold text-green-600">৳{totalWillGive.toLocaleString()}</p>
            </div>

            {/* Due History Button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Due History
            </button>

            {/* Add New Due Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 btn-theme-primary rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus size={18} /> New Due
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {['Customer', 'Supplier', 'Employee'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as EntityType)}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or phone number"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Entity List */}
            <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col bg-white">
              {filteredEntities.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  You have no transactions
                </div>
              ) : (
                <div className="overflow-y-auto">
                  {filteredEntities.map(entity => (
                    <button
                      key={entity._id}
                      onClick={() => setSelectedEntity(entity)}
                      className={`w-full p-4 border-b border-gray-100 text-left transition ${
                        selectedEntity?._id === entity._id
                          ? 'bg-theme-primary/10 border-l-4 border-theme-primary'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{entity.name}</div>
                      <div className="text-sm text-gray-600">{entity.phone}</div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-red-600">Get: ৳{entity.totalOwedToMe}</span>
                        <span className="text-green-600">Give: ৳{entity.totalIOweThemNumber}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Date Filter */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
              <Filter size={18} className="text-gray-600" />
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-gray-600">-</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition">
                <RefreshCw size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Transaction List */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
              {!selectedEntity ? (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  Select an entity to view transactions
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  You have no transactions
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.notes || 'Transaction'}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.transactionDate).toLocaleDateString()}</p>
                      </div>
                      <div className={`text-lg font-bold ${transaction.direction === 'INCOME' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.direction === 'INCOME' ? '+' : '-'}৳{transaction.amount.toLocaleString()}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ml-4 ${
                        transaction.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'Cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Due Modal */}
      {showAddModal && (
        <AddNewDueModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              await dueListService.createTransaction(data);
              setShowAddModal(false);
              fetchEntities();
              if (selectedEntity?.name === data.entityName) {
                fetchTransactions();
              }
            } catch (error) {
              console.error('Error saving transaction:', error);
              alert('Failed to save transaction');
            }
          }}
        />
      )}

      {/* Due History Modal */}
      {showHistoryModal && (
        <DueHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDueList;
