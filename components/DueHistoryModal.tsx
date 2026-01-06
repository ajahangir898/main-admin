import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { DueTransaction } from '../types';
import { dueListService } from '../services/DueListService';

interface Props { isOpen: boolean; onClose: () => void; }

const DueHistoryModal = ({ isOpen, onClose }: Props) => {
  const [transactions, setTransactions] = useState<DueTransaction[]>([]), [loading, setLoading] = useState(false), [filter, setFilter] = useState<'all' | 'Pending' | 'Paid' | 'Cancelled'>('all'), [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) fetchTransactions(); }, [isOpen]);

  const fetchTransactions = async () => {
    setLoading(true); setError(null);
    try { setTransactions(await dueListService.getTransactions(undefined, undefined, undefined, filter !== 'all' ? filter : undefined)); }
    catch (e) { setError('Failed to load transaction history'); console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => { try { await dueListService.updateTransactionStatus(id, status); fetchTransactions(); } catch (e) { setError('Failed to update transaction'); } };
  const handleDelete = async (id: string) => { if (!confirm('Are you sure you want to delete this transaction?')) return; try { await dueListService.deleteTransaction(id); fetchTransactions(); } catch (e) { setError('Failed to delete transaction'); } };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} className="text-gray-600"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2 border-b border-gray-200 pb-4">
            {(['all', 'Pending', 'Paid', 'Cancelled'] as const).map(s => <button key={s} onClick={() => { setFilter(s); setTransactions([]); }} className={`px-4 py-2 font-medium transition ${filter === s ? 'text-theme-primary border-b-2 border-theme-primary' : 'text-gray-600 hover:text-gray-900'}`}>{s === 'all' ? 'All Transactions' : s}</button>)}
          </div>
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {loading ? <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"/></div> : transactions.length === 0 ? <div className="flex items-center justify-center py-12 text-gray-500">No transactions found</div> : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700"><div className="col-span-2">Entity</div><div className="col-span-1">Type</div><div className="col-span-2">Amount</div><div className="col-span-2">Date</div><div className="col-span-2">Status</div><div className="col-span-1">Action</div></div>
              {transactions.map(t => (
                <div key={t._id} className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition items-center">
                  <div className="col-span-2"><p className="font-medium text-gray-900">{t.entityName}</p>{t.notes && <p className="text-sm text-gray-600 truncate">{t.notes}</p>}</div>
                  <div className="col-span-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${t.direction === 'INCOME' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{t.direction === 'INCOME' ? 'Get' : 'Give'}</span></div>
                  <div className="col-span-2"><p className={`font-semibold ${t.direction === 'INCOME' ? 'text-red-600' : 'text-green-600'}`}>{t.direction === 'INCOME' ? '+' : '-'}৳{t.amount.toLocaleString()}</p></div>
                  <div className="col-span-2"><p className="text-sm text-gray-600">{new Date(t.transactionDate).toLocaleDateString()}</p>{t.dueDate && <p className="text-xs text-gray-500">Due: {new Date(t.dueDate).toLocaleDateString()}</p>}</div>
                  <div className="col-span-2"><select value={t.status} onChange={e => handleStatusChange(t._id!, e.target.value)} className={`px-3 py-1 rounded text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer ${t.status === 'Paid' ? 'bg-green-100 text-green-700' : t.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Cancelled">Cancelled</option></select></div>
                  <div className="col-span-1 flex justify-center"><button onClick={() => handleDelete(t._id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete transaction"><Trash2 size={16}/></button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueHistoryModal;