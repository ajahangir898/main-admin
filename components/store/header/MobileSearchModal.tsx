import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MobileSearchBar } from './HeaderSearchBar';
import type { HeaderSearchProps } from './headerTypes';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchProps: HeaderSearchProps;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
  searchProps,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed top-0 left-0 right-0 bg-white p-4 shadow-lg z-[100] transform transition-transform duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Search Products</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close search"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        <MobileSearchBar {...searchProps} />
      </div>
    </div>
  );
};

export default MobileSearchModal;
