import React from 'react';

const Bone = ({ className = '' }: React.HTMLAttributes<HTMLDivElement>) => <div className={`bg-gray-200 animate-pulse rounded ${className}`}/>;
const arr = (n: number) => Array.from({ length: n });

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <Bone className="aspect-square"/><div className="p-4 space-y-3"><Bone className="h-4 w-3/4"/><Bone className="h-4 w-1/2"/><div className="flex gap-2 pt-2"><Bone className="h-9 flex-1 rounded-md"/><Bone className="h-9 flex-1 rounded-md"/></div></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="w-full">
    <div className="flex gap-4 p-4 border-b border-gray-200">{arr(cols).map((_, i) => <Bone key={i} className="h-4 flex-1"/>)}</div>
    {arr(rows).map((_, r) => <div key={r} className="flex gap-4 p-4 border-b border-gray-100">{arr(cols).map((_, c) => <Bone key={c} className="h-4 flex-1"/>)}</div>)}
  </div>
);

export const MetricsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{arr(count).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5"><Bone className="h-3 w-20 mb-3"/><Bone className="h-8 w-24 mb-2"/><Bone className="h-3 w-16"/></div>)}</div>
);

export const ImageGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{arr(count).map((_, i) => <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden"><Bone className="aspect-square"/><div className="p-3 space-y-2"><Bone className="h-3 w-3/4"/><Bone className="h-3 w-1/2"/></div></div>)}</div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 p-6"><div className="flex justify-between items-center"><Bone className="h-8 w-48"/><Bone className="h-10 w-32 rounded-lg"/></div><MetricsSkeleton count={4}/><div className="bg-white rounded-xl border border-gray-100 overflow-hidden"><TableSkeleton rows={6} cols={5}/></div></div>
);

export const HeroSkeleton = () => <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"><Bone className="w-full aspect-[5/2] sm:aspect-[3/1] md:aspect-[7/2] lg:aspect-[4/1] rounded-xl"/></div>;
export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{arr(count).map((_, i) => <ProductCardSkeleton key={i}/>)}</div>;
export const CategorySkeleton = ({ count = 8 }: { count?: number }) => <div className="flex gap-3 overflow-hidden py-2">{arr(count).map((_, i) => <Bone key={i} className="h-10 w-24 rounded-full shrink-0"/>)}</div>;

export const ProductDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex flex-col lg:flex-row gap-8"><div className="flex-1"><div className="bg-white rounded-xl p-6 flex flex-col md:flex-row gap-8"><div className="w-full md:w-1/2 space-y-4"><Bone className="aspect-square rounded-2xl"/><div className="flex gap-2">{arr(4).map((_, i) => <Bone key={i} className="w-16 h-16 rounded-lg"/>)}</div></div><div className="w-full md:w-1/2 space-y-4"><Bone className="h-8 w-3/4"/><Bone className="h-4 w-1/4"/><Bone className="h-10 w-1/3"/><div className="space-y-2 pt-4"><Bone className="h-4 w-full"/><Bone className="h-4 w-full"/><Bone className="h-4 w-2/3"/></div><div className="flex gap-3 pt-4"><Bone className="h-12 flex-1 rounded-lg"/><Bone className="h-12 flex-1 rounded-lg"/></div></div></div></div><div className="w-full lg:w-80 space-y-4"><Bone className="h-48 rounded-xl"/><Bone className="h-32 rounded-xl"/></div></div></div>
);

// Lightweight inline skeletons for store - no external deps, instant render
export const StoreHeaderSkeleton = () => (
  <div className="bg-white shadow-sm sticky top-0 z-50 px-4 py-3">
    <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
      <Bone className="h-10 w-32 rounded"/>
      <Bone className="h-10 flex-1 max-w-xl rounded-full hidden md:block"/>
      <div className="flex gap-3">
        <Bone className="h-10 w-10 rounded-full"/>
        <Bone className="h-10 w-10 rounded-full"/>
        <Bone className="h-10 w-20 rounded-lg hidden md:block"/>
      </div>
    </div>
  </div>
);

export const StoreHeroSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
    <Bone className="w-full aspect-[2.5/1] md:aspect-[3.5/1] rounded-2xl"/>
  </div>
);

export const StoreCategorySkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 pt-4">
    <div className="flex gap-3 overflow-hidden py-2">
      {arr(10).map((_, i) => (
        <Bone key={i} className="h-10 w-28 rounded-full shrink-0"/>
      ))}
    </div>
  </div>
);

export const StoreProductSectionSkeleton = ({ title, count = 5 }: { title?: string; count?: number }) => (
  <div className="py-4">
    {title && <Bone className="h-6 w-40 mb-4 rounded"/>}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {arr(count).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <Bone className="aspect-square"/>
          <div className="p-3 space-y-2">
            <Bone className="h-4 w-full rounded"/>
            <Bone className="h-4 w-2/3 rounded"/>
            <div className="flex gap-2 pt-2">
              <Bone className="h-8 flex-1 rounded-lg"/>
              <Bone className="h-8 flex-1 rounded-lg"/>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StorePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <StoreHeaderSkeleton />
    <StoreHeroSkeleton />
    <StoreCategorySkeleton />
    <div className="max-w-7xl mx-auto px-4 space-y-6 pb-8">
      <StoreProductSectionSkeleton title="Flash Sale" count={5} />
      <StoreProductSectionSkeleton title="Best Products" count={5} />
      <StoreProductSectionSkeleton title="Our Products" count={10} />
    </div>
  </div>
);

export { Bone };

export const SuperAdminDashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50 flex">
    <div className="hidden lg:block w-72 bg-white border-r border-slate-200 p-6"><Bone className="h-8 w-32 mb-8"/><div className="space-y-2">{arr(8).map((_, i) => <Bone key={i} className="h-10 w-full rounded-lg"/>)}</div></div>
    <div className="flex-1"><div className="bg-white border-b border-slate-200 p-4"><div className="flex items-center justify-between"><Bone className="h-10 w-64 rounded-lg"/><div className="flex gap-3"><Bone className="h-10 w-10 rounded-full"/><Bone className="h-10 w-10 rounded-full"/></div></div></div><div className="p-6"><MetricsSkeleton count={4}/><div className="mt-6 space-y-4"><Bone className="h-64 w-full rounded-xl"/><Bone className="h-96 w-full rounded-xl"/></div></div></div>
  </div>
);

export const SuperAdminTabSkeleton = () => (
  <div className="p-6 space-y-6"><div className="flex justify-between items-center"><Bone className="h-8 w-48"/><Bone className="h-10 w-32 rounded-lg"/></div><div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="p-6 space-y-4"><Bone className="h-6 w-64"/><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Bone className="h-32 rounded-lg"/><Bone className="h-32 rounded-lg"/></div></div></div><div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><TableSkeleton rows={5} cols={4}/></div></div>
);

// Lightweight registration page skeleton - minimal for fast display
export const RegistrationPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <Bone className="h-12 w-12 rounded-xl mx-auto"/>
        <Bone className="h-8 w-48 mx-auto"/>
        <Bone className="h-4 w-64 mx-auto"/>
      </div>
      <div className="space-y-4">
        {arr(5).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-4 w-24"/>
            <Bone className="h-12 w-full rounded-lg"/>
          </div>
        ))}
      </div>
      <Bone className="h-12 w-full rounded-lg"/>
    </div>
  </div>
);

// Data fetching skeleton for admin pages
export const AdminDataSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <Bone className="h-8 w-48" />
      <Bone className="h-10 w-32 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {arr(4).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
          <Bone className="h-3 w-20 mb-3" />
          <Bone className="h-8 w-24 mb-2" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <TableSkeleton rows={8} cols={6} />
    </div>
  </div>
);

// Activity log skeleton
export const ActivityLogSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Bone className="h-8 w-48 mb-2" />
          <Bone className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Bone className="h-10 w-32 rounded-lg" />
          <Bone className="h-10 w-32 rounded-lg" />
          <Bone className="h-10 w-24 rounded-lg" />
          <Bone className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <TableSkeleton rows={10} cols={6} />
    </div>
  </div>
);

// Inventory skeleton
export const InventorySkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <Bone className="h-8 w-48" />
      <div className="flex gap-3">
        <Bone className="h-10 w-48 rounded-lg" />
        <Bone className="h-10 w-32 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {arr(3).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <Bone className="h-4 w-32 mb-2" />
          <Bone className="h-10 w-20" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-gray-100">
      <TableSkeleton rows={10} cols={7} />
    </div>
  </div>
);

// Orders skeleton
export const OrdersSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <Bone className="h-8 w-32" />
      <div className="flex gap-3">
        <Bone className="h-10 w-48 rounded-lg" />
        <Bone className="h-10 w-32 rounded-lg" />
        <Bone className="h-10 w-32 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {arr(4).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <Bone className="h-3 w-20 mb-2" />
          <Bone className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-gray-100">
      <TableSkeleton rows={10} cols={8} />
    </div>
  </div>
);

// Products skeleton
export const ProductsSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <Bone className="h-8 w-32" />
      <div className="flex gap-3">
        <Bone className="h-10 w-48 rounded-lg" />
        <Bone className="h-10 w-32 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {arr(10).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  </div>
);

// Customers skeleton
export const CustomersSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <Bone className="h-8 w-48" />
      <Bone className="h-10 w-48 rounded-lg" />
    </div>
    <div className="bg-white rounded-xl border border-gray-100">
      <TableSkeleton rows={10} cols={5} />
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <Bone className="h-8 w-32" />
      <Bone className="h-10 w-32 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {arr(4).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
          <Bone className="h-3 w-20 mb-3" />
          <Bone className="h-8 w-24 mb-2" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Bone className="h-6 w-32 mb-4" />
        <Bone className="h-64 w-full rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Bone className="h-6 w-32 mb-4" />
        <Bone className="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

// Carousel skeleton (for quick loading)
export const CarouselSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
    <Bone className="w-full aspect-[2.5/1] md:aspect-[3.5/1] rounded-2xl" />
  </div>
);

// Generic loading spinner inline
export const InlineSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`${sizeClass} border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin`} />
  );
};

// Data loading overlay
export const DataLoadingOverlay = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
    <div className="flex flex-col items-center gap-3">
      <InlineSpinner size="lg" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  </div>
);

// Compact card skeleton for quick lists
export const CompactCardSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {arr(count).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
        <Bone className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
        <Bone className="w-16 h-6 rounded" />
      </div>
    ))}
  </div>
);
