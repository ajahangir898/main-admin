import React from 'react';
import { SectionSkeleton, FooterSkeleton } from './StoreSectionSkeletons';

export const StoreHomeSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
    {/* Skeleton for StoreHeader */}
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-[1408px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>

    {/* Skeleton for HeroSection */}
    <div className="bg-gray-200 animate-pulse">
      <div className="max-w-[1408px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="aspect-[16/7]"></div>
      </div>
    </div>

    {/* Skeleton for CategoriesSection */}
    <section className="max-w-[1408px] mx-auto px-4 sm:px-6 lg:px-8 pt-1 py-6">
        <div className="flex justify-center space-x-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                    <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
            ))}
        </div>
    </section>

    {/* Skeletons for Product Grids */}
    <main className="max-w-[1408px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-4">
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </main>

    {/* Skeleton for Footer */}
    <FooterSkeleton />
  </div>
);

export default StoreHomeSkeleton;
