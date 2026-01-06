import { useState } from 'react';
import { Truck, X, CheckCircle } from 'lucide-react';
import { Order } from '../../types';

export interface TrackOrderModalProps { onClose: () => void; orders?: Order[]; }

export const TrackOrderModal = ({ onClose, orders }: TrackOrderModalProps) => {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = () => { setSearched(true); setResult(orders?.find(o => o.id === orderId) || null); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-1"><Truck size={28} className="text-purple-600" /><h2 className="text-2xl font-bold text-gray-800">Track Order</h2></div>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Enter Order ID (e.g. #0024)" className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={orderId} onChange={e => setOrderId(e.target.value)} />
            <button onClick={handleTrack} className="bg-purple-600 text-black-600 px-4 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-lg">Track</button>
          </div>
          {searched && <div className="bg-gray-50 rounded-lg p-4 text-center">
            {result ? (<div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600"><CheckCircle size={24} /></div>
              <p className="font-bold text-gray-800">Order Found!</p>
              <p className="text-sm text-gray-600">Status: <span className="font-bold text-purple-600">{result.status}</span></p>
              <p className="text-xs text-gray-500">Date: {result.date}</p>
              <p className="text-xs text-gray-500">Amount: ৳{result.amount}</p>
            </div>) : <div className="text-gray-500"><p>Order not found. Please check the ID.</p></div>}
          </div>}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderModal;
