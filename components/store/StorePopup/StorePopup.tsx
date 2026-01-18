import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Popup } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { LazyImage } from '../../../utils/performanceOptimization';

export interface StorePopupProps {
  popup: Popup;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export const StorePopup = ({ popup: p, onClose, onNavigate }: StorePopupProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    if (!p.url) return;
    p.urlType === 'External' ? window.open(p.url, '_blank') : onNavigate?.(p.url);
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={close}
    >
      <div
        className={`relative w-full max-w-[95vw] sm:max-w-md md:max-w-lg transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10 p-1 sm:p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition touch-manipulation"
          aria-label="Close popup"
        >
          <X size={18} className="text-gray-700 dark:text-gray-300 sm:w-5 sm:h-5" />
        </button>
        <div
          className={`relative bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ${
            p.url ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
          }`}
          onClick={p.url ? handleClick : undefined}
        >
          <LazyImage
            src={normalizeImageUrl(p.image)}
            alt={p.name}
            className="w-full"
            imgClassName="w-full h-auto max-h-[70vh] sm:max-h-[65vh] md:max-h-[60vh] object-contain"
            size="large"
            optimizationOptions={{ width: 960, quality: 80 }}
          />
          {p.url && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4 text-center">
              <p className="text-white text-xs sm:text-sm font-medium">Tap to learn more</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
