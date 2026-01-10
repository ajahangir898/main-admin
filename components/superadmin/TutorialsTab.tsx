import React, { useState } from 'react';
import {
  Play,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  GripVertical,
  Video,
  BookOpen,
  Settings,
  ShoppingCart,
  BarChart3,
  Users,
  Globe,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

// Tutorial type for Super Admin management
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  category: string;
  duration: string;
  order: number;
  isPublished: boolean;
  language: 'en' | 'bn';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

// Category configuration
const CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen, color: 'emerald' },
  { id: 'products', name: 'Product Management', icon: ShoppingCart, color: 'blue' },
  { id: 'orders', name: 'Order Management', icon: Settings, color: 'purple' },
  { id: 'analytics', name: 'Analytics & Reports', icon: BarChart3, color: 'orange' },
  { id: 'customers', name: 'Customer Management', icon: Users, color: 'pink' },
  { id: 'settings', name: 'Store Settings', icon: Globe, color: 'teal' },
];

// Mock tutorials data - will be replaced with API calls
const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'Getting Started with Your Dashboard',
    description: 'Learn the basics of navigating your admin dashboard and understanding the key features.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'getting-started',
    duration: '5:30',
    order: 1,
    isPublished: true,
    language: 'en',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    viewCount: 1250
  },
  {
    id: '2',
    title: 'Adding Your First Product',
    description: 'Step-by-step guide to adding products with images, pricing, and inventory.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'products',
    duration: '8:45',
    order: 2,
    isPublished: true,
    language: 'en',
    createdAt: '2025-01-02',
    updatedAt: '2025-01-16',
    viewCount: 980
  },
  {
    id: '3',
    title: 'Processing Orders Efficiently',
    description: 'How to manage orders, update statuses, and handle customer communications.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'orders',
    duration: '12:20',
    order: 3,
    isPublished: true,
    language: 'en',
    createdAt: '2025-01-03',
    updatedAt: '2025-01-17',
    viewCount: 750
  },
  {
    id: '4',
    title: 'Understanding Your Analytics',
    description: 'Deep dive into analytics reports and how to use data to grow your business.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'analytics',
    duration: '15:00',
    order: 4,
    isPublished: false,
    language: 'en',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-18',
    viewCount: 0
  },
];

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (url: string): string => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/placeholder-video.jpg';
};

interface TutorialModalProps {
  tutorial: Tutorial | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tutorial: Partial<Tutorial>) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ tutorial, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Tutorial>>(
    tutorial || {
      title: '',
      description: '',
      youtubeUrl: '',
      category: 'getting-started',
      duration: '',
      isPublished: false,
      language: 'en'
    }
  );

  React.useEffect(() => {
    if (tutorial) {
      setFormData(tutorial);
    } else {
      setFormData({
        title: '',
        description: '',
        youtubeUrl: '',
        category: 'getting-started',
        duration: '',
        isPublished: false,
        language: 'en'
      });
    }
  }, [tutorial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700">
        <div className="sticky top-0 bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            {tutorial ? 'Edit Tutorial' : 'Add New Tutorial'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tutorial Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Enter tutorial title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              placeholder="Brief description of the tutorial"
              rows={3}
              required
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">YouTube URL *</label>
            <input
              type="url"
              value={formData.youtubeUrl || ''}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            {formData.youtubeUrl && getYouTubeVideoId(formData.youtubeUrl) && (
              <div className="mt-3 rounded-xl overflow-hidden">
                <img
                  src={getYouTubeThumbnail(formData.youtubeUrl)}
                  alt="Video thumbnail"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
          </div>

          {/* Category and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
              <select
                value={formData.category || 'getting-started'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g., 5:30"
              />
            </div>
          </div>

          {/* Language and Published */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
              <select
                value={formData.language || 'en'}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'bn' })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="en">English</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <label className="flex items-center gap-3 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl cursor-pointer hover:bg-slate-600 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPublished || false}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-500 bg-slate-600 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white">Published</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {tutorial ? 'Save Changes' : 'Add Tutorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TutorialsTab: React.FC = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>(MOCK_TUTORIALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  // Filter tutorials
  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort by order
  const sortedTutorials = [...filteredTutorials].sort((a, b) => a.order - b.order);

  // Handle save
  const handleSaveTutorial = (tutorialData: Partial<Tutorial>) => {
    if (editingTutorial) {
      // Update existing tutorial
      setTutorials(tutorials.map((t) =>
        t.id === editingTutorial.id
          ? { ...t, ...tutorialData, updatedAt: new Date().toISOString() }
          : t
      ));
    } else {
      // Add new tutorial
      const newTutorial: Tutorial = {
        id: Date.now().toString(),
        title: tutorialData.title || '',
        description: tutorialData.description || '',
        youtubeUrl: tutorialData.youtubeUrl || '',
        category: tutorialData.category || 'getting-started',
        duration: tutorialData.duration || '',
        order: tutorials.length + 1,
        isPublished: tutorialData.isPublished || false,
        language: tutorialData.language || 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0
      };
      setTutorials([...tutorials, newTutorial]);
    }
    setEditingTutorial(null);
  };

  // Handle delete
  const handleDeleteTutorial = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tutorial?')) {
      setTutorials(tutorials.filter((t) => t.id !== id));
    }
  };

  // Toggle publish status
  const togglePublish = (id: string) => {
    setTutorials(tutorials.map((t) =>
      t.id === id ? { ...t, isPublished: !t.isPublished, updatedAt: new Date().toISOString() } : t
    ));
  };

  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  };

  // Statistics
  const stats = {
    total: tutorials.length,
    published: tutorials.filter((t) => t.isPublished).length,
    draft: tutorials.filter((t) => !t.isPublished).length,
    totalViews: tutorials.reduce((acc, t) => acc + t.viewCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-7 h-7 text-emerald-500" />
            Tutorial Management
          </h1>
          <p className="text-slate-400 mt-1">Create and manage tutorials for your tenants</p>
        </div>
        <button
          onClick={() => {
            setEditingTutorial(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Tutorial
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Tutorials</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.published}</p>
              <p className="text-xs text-slate-400">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.draft}</p>
              <p className="text-xs text-slate-400">Draft</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tutorials List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tutorial
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sortedTutorials.map((tutorial) => {
                const category = getCategoryInfo(tutorial.category);
                const CategoryIcon = category.icon;
                
                return (
                  <tr key={tutorial.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
                        <span className="text-slate-400 text-sm font-medium">{tutorial.order}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 group cursor-pointer"
                          onClick={() => setPreviewVideoId(getYouTubeVideoId(tutorial.youtubeUrl))}
                        >
                          <img
                            src={getYouTubeThumbnail(tutorial.youtubeUrl)}
                            alt={tutorial.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 text-white" fill="white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-medium text-sm truncate">{tutorial.title}</h3>
                          <p className="text-slate-400 text-xs truncate max-w-xs">{tutorial.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-${category.color}-500/20 text-${category.color}-400`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                        {category.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-300 text-sm">{tutorial.duration || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-300 text-sm">{tutorial.viewCount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => togglePublish(tutorial.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          tutorial.isPublished
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-600/50 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {tutorial.isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(tutorial.youtubeUrl, '_blank')}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="Open in YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTutorial(tutorial);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTutorial(tutorial.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedTutorials.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tutorials found</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {searchQuery || selectedCategory !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Click "Add Tutorial" to create your first tutorial'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Overview */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          Tutorials by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((category) => {
            const count = tutorials.filter((t) => t.category === category.id).length;
            const publishedCount = tutorials.filter((t) => t.category === category.id && t.isPublished).length;
            const CategoryIcon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedCategory === category.id
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                }`}
              >
                <CategoryIcon className={`w-6 h-6 mb-2 ${
                  selectedCategory === category.id ? 'text-emerald-400' : 'text-slate-400'
                }`} />
                <p className="text-white font-medium text-sm truncate">{category.name}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {count} total • {publishedCount} live
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        tutorial={editingTutorial}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTutorial(null);
        }}
        onSave={handleSaveTutorial}
      />

      {/* Video Preview Modal */}
      {previewVideoId && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewVideoId(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewVideoId(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialsTab;
