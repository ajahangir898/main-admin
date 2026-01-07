import React from 'react';

// Lightweight skeleton for lazy components (search results, category products)
export const SectionSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 py-4">
    <div className="h-6 w-40 bg-gray-200 rounded" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Footer skeleton to reserve space and prevent CLS
export const FooterSkeleton: React.FC = () => (
  <footer className="mt-auto bg-white border-t border-gray-100" style={{ minHeight: '400px' }}>
    <div className="animate-pulse p-6 space-y-4">
      <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </footer>
);
