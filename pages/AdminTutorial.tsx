import React, { useState, useEffect } from 'react';
import {
  Play,
  BookOpen,
  Clock,
  Search,
  ChevronRight,
  ExternalLink,
  Video,
  Lightbulb,
  Target,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  Users,
  Palette
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration: string;
  category: string;
  order: number;
}

interface AdminTutorialProps {
  tutorials?: Tutorial[];
}

// Default tutorials with placeholders - will be populated from super admin
const DEFAULT_TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'Getting Started with Your Dashboard',
    description: 'Learn the basics of navigating your admin dashboard and understanding key features.',
    youtubeUrl: '',
    duration: '5:30',
    category: 'getting-started',
    order: 1
  },
  {
    id: '2',
    title: 'Adding Your First Product',
    description: 'Step-by-step guide to adding products, setting prices, and managing inventory.',
    youtubeUrl: '',
    duration: '8:45',
    category: 'products',
    order: 2
  },
  {
    id: '3',
    title: 'Managing Orders & Shipping',
    description: 'Learn how to process orders, update status, and configure shipping options.',
    youtubeUrl: '',
    duration: '7:20',
    category: 'orders',
    order: 3
  },
  {
    id: '4',
    title: 'Customizing Your Store Design',
    description: 'Personalize your store with themes, colors, and branding elements.',
    youtubeUrl: '',
    duration: '10:15',
    category: 'customization',
    order: 4
  },
  {
    id: '5',
    title: 'Understanding Analytics & Reports',
    description: 'Track your sales, customer behavior, and business performance.',
    youtubeUrl: '',
    duration: '6:50',
    category: 'analytics',
    order: 5
  },
  {
    id: '6',
    title: 'Managing Customers & Reviews',
    description: 'Handle customer accounts, respond to reviews, and build relationships.',
    youtubeUrl: '',
    duration: '5:40',
    category: 'customers',
    order: 6
  }
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'getting-started': { label: 'Getting Started', icon: <Target size={18} />, color: 'from-emerald-500 to-teal-500' },
  'products': { label: 'Products', icon: <Package size={18} />, color: 'from-blue-500 to-cyan-500' },
  'orders': { label: 'Orders', icon: <ShoppingCart size={18} />, color: 'from-violet-500 to-purple-500' },
  'customization': { label: 'Customization', icon: <Palette size={18} />, color: 'from-pink-500 to-rose-500' },
  'analytics': { label: 'Analytics', icon: <BarChart3 size={18} />, color: 'from-amber-500 to-orange-500' },
  'customers': { label: 'Customers', icon: <Users size={18} />, color: 'from-indigo-500 to-blue-500' },
  'settings': { label: 'Settings', icon: <Settings size={18} />, color: 'from-gray-500 to-slate-500' }
};

const AdminTutorial: React.FC<AdminTutorialProps> = ({ tutorials = DEFAULT_TUTORIALS }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);

  const categories = [...new Set(tutorials.map(t => t.category))];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = !searchQuery || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.order - b.order);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const getYouTubeThumbnail = (url: string) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            Tutorials
          </h1>
          <p className="text-gray-500 mt-2">Learn how to make the most of your dashboard with video tutorials</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory
                ? 'bg-violet-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat] || { label: cat, icon: <Video size={18} />, color: 'from-gray-500 to-gray-600' };
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="relative aspect-video bg-black">
              {selectedVideo.youtubeUrl ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.youtubeUrl)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Video size={40} className="text-white/60" />
                  </div>
                  <p className="text-lg font-medium">Video Coming Soon</p>
                  <p className="text-sm text-white/60 mt-1">This tutorial will be available shortly</p>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h2>
              <p className="text-gray-500 mt-2">{selectedVideo.description}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={16} />
                    {selectedVideo.duration}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${CATEGORY_CONFIG[selectedVideo.category]?.color || 'from-gray-500 to-gray-600'} text-white`}>
                    {CATEGORY_CONFIG[selectedVideo.category]?.label || selectedVideo.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => {
          const categoryConfig = CATEGORY_CONFIG[tutorial.category] || { label: tutorial.category, icon: <Video size={18} />, color: 'from-gray-500 to-gray-600' };
          const thumbnail = tutorial.thumbnailUrl || getYouTubeThumbnail(tutorial.youtubeUrl);
          
          return (
            <div
              key={tutorial.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedVideo(tutorial)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={tutorial.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${categoryConfig.color} flex items-center justify-center text-white shadow-lg`}>
                      {categoryConfig.icon}
                    </div>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={28} className="text-violet-600 ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded-md flex items-center gap-1">
                  <Clock size={12} />
                  {tutorial.duration}
                </div>

                {/* Category Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryConfig.color} text-white shadow-md`}>
                  {categoryConfig.label}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                  {tutorial.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lightbulb size={16} className="text-amber-500" />
                    Quick tip
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:gap-2 transition-all">
                    Watch now
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTutorials.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Video size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No tutorials found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search or filters' : 'Tutorials will appear here once added'}
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Need more help?</h3>
            <p className="text-white/80">
              Can't find what you're looking for? Our support team is here to help you 24/7.
            </p>
          </div>
          <a
            href="#"
            className="px-6 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Contact Support
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminTutorial;
