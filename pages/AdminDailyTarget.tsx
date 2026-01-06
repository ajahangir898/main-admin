import React, { useState } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';

type DailyTarget = {
  id: string;
  title?: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  createdAt: string;
};

const AdminDailyTarget: React.FC = () => {
  const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([]);
  const [targetTitle, setTargetTitle] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleCreateTarget = () => {
    if (!targetStartDate || !targetEndDate || !targetAmount) {
      alert('Please fill in all required fields');
      return;
    }
    const newTarget: DailyTarget = {
      id: `T-${Date.now()}`,
      title: targetTitle || undefined,
      startDate: targetStartDate,
      endDate: targetEndDate,
      targetAmount: Number(targetAmount),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDailyTargets([...dailyTargets, newTarget]);
    setTargetTitle('');
    setTargetStartDate('');
    setTargetEndDate('');
    setTargetAmount('');
  };

  const handleDeleteTarget = (id: string) => {
    setDailyTargets(dailyTargets.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
       
          <p className="text-sm text-gray-500">Set and track your daily revenue targets with ease.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <Target size={16} className="text-violet-500" />
          <span className="font-semibold text-gray-600">Active targets: {dailyTargets.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
            <input 
              type="text" 
              placeholder="Title (optional)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Start date *</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              value={targetStartDate}
              onChange={(e) => setTargetStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">End date *</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Target amount *</label>
            <input 
              type="number" 
              placeholder="Target amount*"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleCreateTarget}
          className="w-full bg-violet-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-violet-700 transition flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Create Target
        </button>
      </div>

      {dailyTargets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Active Targets</h3>
          <div className="space-y-3">
            {dailyTargets.map((target) => (
              <div key={target.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{target.title || 'Unnamed Target'}</p>
                    <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {target.startDate} to {target.endDate}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">৳ {target.targetAmount.toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTarget(target.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete target"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {dailyTargets.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
          <p className="text-gray-500">No targets yet.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDailyTarget;
