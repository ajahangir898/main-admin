import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Youtube, Save, X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { DataService } from '../services/DataService';
import toast from 'react-hot-toast';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  views: number;
  category: string;
  thumbnail?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface TutorialManagementProps {
  tenantId: string;
}

const CATEGORIES = ['Getting Started', 'Products', 'Orders', 'Settings', 'Advanced'];

export const TutorialManagement: React.FC<TutorialManagementProps> = ({ tenantId }) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    category: 'Getting Started',
    thumbnail: ''
  });

  useEffect(() => {
    loadTutorials();
  }, [tenantId]);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const data = await DataService.getTutorials(tenantId);
      setTutorials(data.sort((a: Tutorial, b: Tutorial) => a.order - b.order));
    } catch (error) {
      console.error('Failed to load tutorials:', error);
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
      category: 'Getting Started',
      thumbnail: ''
    });
    setEditingTutorial(null);
    setShowForm(false);
  };

  const handleEdit = (tutorial: Tutorial) => {
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      videoUrl: tutorial.videoUrl,
      duration: tutorial.duration,
      category: tutorial.category,
      thumbnail: tutorial.thumbnail || ''
    });
    setEditingTutorial(tutorial);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toast.error('Title and video URL are required');
      return;
    }

    try {
      if (editingTutorial) {
        await DataService.updateTutorial(editingTutorial.id, formData, tenantId);
        toast.success('Tutorial updated successfully!');
      } else {
        await DataService.createTutorial(formData, tenantId);
        toast.success('Tutorial created successfully!');
      }
      
      await loadTutorials();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save tutorial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      await DataService.deleteTutorial(id, tenantId);
      toast.success('Tutorial deleted successfully');
      await loadTutorials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tutorial');
    }
  };

  const handleToggleActive = async (tutorial: Tutorial) => {
    try {
      await DataService.updateTutorial(tutorial.id, { isActive: !tutorial.isActive }, tenantId);
      toast.success(tutorial.isActive ? 'Tutorial hidden' : 'Tutorial published');
      await loadTutorials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tutorial');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = tutorials.findIndex(t => t.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tutorials.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTutorials = [...tutorials];
    [newTutorials[index], newTutorials[newIndex]] = [newTutorials[newIndex], newTutorials[index]];
    
    // Update order property
    const updatedTutorials = newTutorials.map((t, i) => ({ ...t, order: i }));
    
    try {
      await DataService.reorderTutorials(updatedTutorials.map(t => ({ id: t.id, order: t.order })), tenantId);
      setTutorials(updatedTutorials);
      toast.success('Order updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reorder');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-600" />
            Tutorial Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage video tutorials for your users</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Tutorial
        </button>
      </div>

      {/* Tutorial Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTutorial ? 'Edit Tutorial' : 'Add New Tutorial'}
              </h3>
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Video Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="e.g., How to Add Your First Product"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors resize-none"
                  placeholder="Brief description of what users will learn..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube Video URL *</label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Paste full YouTube URL or just the video ID</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="e.g., 5:24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Thumbnail URL (Optional)</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="https://... (leave blank to use YouTube thumbnail)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingTutorial ? 'Update Tutorial' : 'Create Tutorial'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorials List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-12">
          <Youtube className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No tutorials yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Tutorial" to create your first video guide</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tutorials.map((tutorial, index) => (
            <div
              key={tutorial.id}
              className={`bg-gray-50 rounded-xl p-4 border-2 ${tutorial.isActive ? 'border-transparent' : 'border-gray-300 border-dashed'}`}
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={tutorial.thumbnail || `https://img.youtube.com/vi/${tutorial.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || tutorial.videoUrl}/mqdefault.jpg`}
                    alt={tutorial.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{tutorial.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{tutorial.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${tutorial.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {tutorial.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{tutorial.category}</span>
                    <span>⏱ {tutorial.duration}</span>
                    <span>👁 {tutorial.views} views</span>
                    <span>Order: #{tutorial.order + 1}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReorder(tutorial.id, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleReorder(tutorial.id, 'down')}
                      disabled={index === tutorials.length - 1}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleActive(tutorial)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      title={tutorial.isActive ? 'Hide' : 'Publish'}
                    >
                      {tutorial.isActive ? <EyeOff className="w-3.5 h-3.5 text-gray-600" /> : <Eye className="w-3.5 h-3.5 text-gray-600" />}
                    </button>
                    <button
                      onClick={() => handleEdit(tutorial)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(tutorial.id)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
