import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { CreateDueTransactionPayload, TransactionDirection, DueEntity } from '../types';
import { dueListService } from '../services/DueListService';

interface AddNewDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDueTransactionPayload) => void;
}

const AddNewDueModal: React.FC<AddNewDueModalProps> = ({ isOpen, onClose, onSave }) => {
  const [direction, setDirection] = useState<TransactionDirection | null>(null);
  const [entities, setEntities] = useState<DueEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<DueEntity | null>(null);
  const [searchEntity, setSearchEntity] = useState('');
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityData, setNewEntityData] = useState({ name: '', phone: '' });
  const [formData, setFormData] = useState({
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch entities
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const entityType = direction === 'INCOME' ? 'Customer' : 'Supplier';
        const data = await dueListService.getEntities(entityType);
        setEntities(data);
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };
    if (direction) {
      fetchEntities();
    }
  }, [direction]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEntityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddEntity = async () => {
    if (!newEntityData.name || !newEntityData.phone) {
      setErrors({ entity: 'Please fill in name and phone' });
      return;
    }

    try {
      const newEntity = await dueListService.createEntity({
        name: newEntityData.name,
        phone: newEntityData.phone,
        type: direction === 'INCOME' ? 'Customer' : 'Supplier',
      });

      setEntities([...entities, newEntity]);
      setSelectedEntity(newEntity);
      setNewEntityData({ name: '', phone: '' });
      setShowAddEntity(false);
      setErrors({});
    } catch (error) {
      setErrors({ entity: 'Error creating entity: ' + (error as any).message });
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!direction) newErrors.direction = 'Please select transaction type';
    if (!selectedEntity) newErrors.entity = 'Please select an entity';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!formData.transactionDate) newErrors.date = 'Please select a transaction date';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: CreateDueTransactionPayload = {
      entityId: selectedEntity!._id || '',
      entityName: selectedEntity!.name,
      amount: parseFloat(formData.amount),
      direction: direction!,
      transactionDate: formData.transactionDate,
      dueDate: formData.dueDate || undefined,
      notes: formData.notes || undefined,
    };

    onSave(payload);
  };

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchEntity.toLowerCase()) ||
    e.phone.includes(searchEntity)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Due</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Type Selection */}
          {!direction ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Transaction Type</label>
              <div className="space-y-2">
                <button
                  onClick={() => setDirection('INCOME')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900">You Will Get</p>
                  <p className="text-sm text-gray-600">Money owed by a customer</p>
                </button>
                <button
                  onClick={() => setDirection('EXPENSE')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900">You Will Give</p>
                  <p className="text-sm text-gray-600">Money owed to a supplier</p>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Back to Type Selection */}
              <button
                onClick={() => {
                  setDirection(null);
                  setSelectedEntity(null);
                  setErrors({});
                }}
                className="text-theme-primary text-sm font-medium hover:underline"
              >
                ← Change transaction type
              </button>

              {/* Entity Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {direction === 'INCOME' ? 'Customer' : 'Supplier'}
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  >
                    {selectedEntity ? selectedEntity.name : 'Select or search...'}
                  </button>
                  
                  {showEntityDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchEntity}
                        onChange={e => setSearchEntity(e.target.value)}
                        className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {filteredEntities.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No {direction === 'INCOME' ? 'customers' : 'suppliers'} found
                          </div>
                        ) : (
                          filteredEntities.map(entity => (
                            <button
                              key={entity._id}
                              onClick={() => {
                                setSelectedEntity(entity);
                                setShowEntityDropdown(false);
                                setSearchEntity('');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900">{entity.name}</p>
                              <p className="text-sm text-gray-600">{entity.phone}</p>
                            </button>
                          ))
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowAddEntity(true);
                          setShowEntityDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-theme-primary font-medium hover:bg-theme-primary/10 transition border-t border-gray-200 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add New
                      </button>
                    </div>
                  )}
                </div>
                {errors.entity && <p className="text-sm text-red-600">{errors.entity}</p>}
              </div>

              {/* Add New Entity Form */}
              {showAddEntity && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newEntityData.name}
                    onChange={e => setNewEntityData({ ...newEntityData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newEntityData.phone}
                    onChange={e => setNewEntityData({ ...newEntityData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddEntity}
                      className="flex-1 px-3 py-2 btn-theme-primary rounded-lg transition font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEntity(false);
                        setNewEntityData({ name: '', phone: '' });
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Amount (in ৳)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
                />
                {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
              </div>

              {/* Transaction Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Transaction Date</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
                />
                {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* Due Date (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Details/Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Invoice #101 for 5kg coffee beans"
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary resize-none h-20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedEntity || !formData.amount}
                  className="flex-1 px-4 py-2 btn-theme-primary rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Transaction
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewDueModal;
