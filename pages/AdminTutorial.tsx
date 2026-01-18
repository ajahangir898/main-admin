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
    <div className="space-y-6 sm:space-y-8 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <BookOpen size={16} className="sm:hidden" />
              <BookOpen size={20} className="hidden sm:block" />
            </div>
            Tutorials
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Learn how to make the most of your dashboard with video tutorials</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2 flex-wrap overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.icon}
                <span className="hidden xs:inline">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-4xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative aspect-video bg-black flex-shrink-0">
              {selectedVideo.youtubeUrl ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.youtubeUrl)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Video size={28} className="text-white/60 sm:hidden" />
                    <Video size={40} className="text-white/60 hidden sm:block" />
                  </div>
                  <p className="text-base sm:text-lg font-medium text-center">Video Coming Soon</p>
                  <p className="text-xs sm:text-sm text-white/60 mt-1 text-center">This tutorial will be available shortly</p>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{selectedVideo.title}</h2>
              <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">{selectedVideo.description}</p>
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <Clock size={14} className="sm:hidden" />
                    <Clock size={16} className="hidden sm:block" />
                    {selectedVideo.duration}
                  </span>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r ${CATEGORY_CONFIG[selectedVideo.category]?.color || 'from-gray-500 to-gray-600'} text-white`}>
                    {CATEGORY_CONFIG[selectedVideo.category]?.label || selectedVideo.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-200 transition-all text-sm w-full xs:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTutorials.map((tutorial) => {
          const categoryConfig = CATEGORY_CONFIG[tutorial.category] || { label: tutorial.category, icon: <Video size={18} />, color: 'from-gray-500 to-gray-600' };
          const thumbnail = tutorial.thumbnailUrl || getYouTubeThumbnail(tutorial.youtubeUrl);
          
          return (
            <div
              key={tutorial.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer active:scale-[0.98]"
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
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${categoryConfig.color} flex items-center justify-center text-white shadow-lg`}>
                      {categoryConfig.icon}
                    </div>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={24} className="text-violet-600 ml-1 sm:hidden" fill="currentColor" />
                    <Play size={28} className="text-violet-600 ml-1 hidden sm:block" fill="currentColor" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/80 text-white text-[10px] sm:text-xs font-medium rounded-md flex items-center gap-1">
                  <Clock size={10} className="sm:hidden" />
                  <Clock size={12} className="hidden sm:block" />
                  {tutorial.duration}
                </div>

                {/* Category Badge */}
                <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r ${categoryConfig.color} text-white shadow-md`}>
                  {categoryConfig.label}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-5">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-lg mb-1 sm:mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                  {tutorial.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                    <Lightbulb size={14} className="text-amber-500 sm:hidden" />
                    <Lightbulb size={16} className="text-amber-500 hidden sm:block" />
                    Quick tip
                  </div>
                  <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-violet-600 group-hover:gap-2 transition-all">
                    Watch now
                    <ChevronRight size={14} className="sm:hidden" />
                    <ChevronRight size={16} className="hidden sm:block" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTutorials.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Video size={32} className="text-gray-400 sm:hidden" />
            <Video size={40} className="text-gray-400 hidden sm:block" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No tutorials found</h3>
          <p className="text-gray-500 text-sm sm:text-base">
            {searchQuery ? 'Try adjusting your search or filters' : 'Tutorials will appear here once added'}
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Need more help?</h3>
            <p className="text-white/80 text-sm sm:text-base">
              Can't find what you're looking for? Our support team is here to help you 24/7.
            </p>
          </div>
          <a
            href="#"
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-violet-600 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            Contact Support
            <ExternalLink size={16} className="sm:hidden" />
            <ExternalLink size={18} className="hidden sm:block" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminTutorial;
