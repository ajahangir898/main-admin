import React, { useState, useEffect } from 'react';
import { Play, Youtube, Clock, Eye, Sparkles, X } from 'lucide-react';
import { DataService } from '../services/DataService';
import toast from 'react-hot-toast';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // YouTube URL or video ID
  duration: string;
  views: number;
  category: string;
  thumbnail?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface TutorialVideoSectionProps {
  tenantId: string;
}

export const TutorialVideoSection: React.FC<TutorialVideoSectionProps> = ({ tenantId }) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadTutorials();
  }, [tenantId]);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const data = await DataService.getTutorials(tenantId);
      setTutorials(data.filter((t: Tutorial) => t.isActive).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to load tutorials:', error);
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url: string): string => {
    // Extract YouTube video ID from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url;
  };

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeId(url);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const playVideo = async (tutorial: Tutorial) => {
    setSelectedVideo(tutorial);
    setShowPlayer(true);
    
    // Increment view count
    try {
      await DataService.incrementTutorialViews(tutorial.id, tenantId);
      setTutorials(prev => prev.map(t => 
        t.id === tutorial.id ? { ...t, views: t.views + 1 } : t
      ));
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Tutorial Videos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tutorials.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Tutorial Videos</h2>
        </div>
        <div className="text-center py-8">
          <Youtube className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No tutorials available yet</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for helpful guides</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tutorial Videos</h2>
            <p className="text-xs text-gray-500">Learn how to use the platform</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              {tutorials.length} {tutorials.length === 1 ? 'Video' : 'Videos'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="group bg-white rounded-xl overflow-hidden border border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => playVideo(tutorial)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                <img
                  src={tutorial.thumbnail || getYouTubeThumbnail(tutorial.videoUrl)}
                  alt={tutorial.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getYouTubeThumbnail(tutorial.videoUrl);
                  }}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 fill-red-600 ml-1" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs font-semibold rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {tutorial.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{tutorial.views.toLocaleString()} views</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 font-medium rounded">
                    {tutorial.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlayer(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{selectedVideo.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{selectedVideo.description}</p>
              </div>
              <button
                onClick={() => setShowPlayer(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.videoUrl)}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-gray-50 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedVideo.views.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedVideo.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">{selectedVideo.category}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
