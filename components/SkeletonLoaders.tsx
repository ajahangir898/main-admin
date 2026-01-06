import React from 'react';

const Bone = ({ className = '' }: React.HTMLAttributes<HTMLDivElement>) => <div className={`bg-gray-200 dark:bg-slate-700 animate-pulse rounded ${className}`}/>;
const arr = (n: number) => Array.from({ length: n });

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <Bone className="aspect-square"/><div className="p-4 space-y-3"><Bone className="h-4 w-3/4"/><Bone className="h-4 w-1/2"/><div className="flex gap-2 pt-2"><Bone className="h-9 flex-1 rounded-md"/><Bone className="h-9 flex-1 rounded-md"/></div></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="w-full">
    <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-slate-700">{arr(cols).map((_, i) => <Bone key={i} className="h-4 flex-1"/>)}</div>
    {arr(rows).map((_, r) => <div key={r} className="flex gap-4 p-4 border-b border-gray-100 dark:border-slate-800">{arr(cols).map((_, c) => <Bone key={c} className="h-4 flex-1"/>)}</div>)}
  </div>
);

export const MetricsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{arr(count).map((_, i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"><Bone className="h-3 w-20 mb-3"/><Bone className="h-8 w-24 mb-2"/><Bone className="h-3 w-16"/></div>)}</div>
);

export const ImageGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{arr(count).map((_, i) => <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden"><Bone className="aspect-square"/><div className="p-3 space-y-2"><Bone className="h-3 w-3/4"/><Bone className="h-3 w-1/2"/></div></div>)}</div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 p-6"><div className="flex justify-between items-center"><Bone className="h-8 w-48"/><Bone className="h-10 w-32 rounded-lg"/></div><MetricsSkeleton count={4}/><div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden"><TableSkeleton rows={6} cols={5}/></div></div>
);

export const HeroSkeleton = () => <div className="max-w-7xl mx-auto px-4 mt-4"><Bone className="w-full aspect-[5/2] sm:aspect-[3/1] md:aspect-[7/2] lg:aspect-[4/1] rounded-xl"/></div>;
export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{arr(count).map((_, i) => <ProductCardSkeleton key={i}/>)}</div>;
export const CategorySkeleton = ({ count = 8 }: { count?: number }) => <div className="flex gap-3 overflow-hidden py-2">{arr(count).map((_, i) => <Bone key={i} className="h-10 w-24 rounded-full shrink-0"/>)}</div>;

export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8"><div className="flex flex-col lg:flex-row gap-8"><div className="flex-1"><div className="bg-white rounded-xl p-6 flex flex-col md:flex-row gap-8"><div className="w-full md:w-1/2 space-y-4"><Bone className="aspect-square rounded-2xl"/><div className="flex gap-2">{arr(4).map((_, i) => <Bone key={i} className="w-16 h-16 rounded-lg"/>)}</div></div><div className="w-full md:w-1/2 space-y-4"><Bone className="h-8 w-3/4"/><Bone className="h-4 w-1/4"/><Bone className="h-10 w-1/3"/><div className="space-y-2 pt-4"><Bone className="h-4 w-full"/><Bone className="h-4 w-full"/><Bone className="h-4 w-2/3"/></div><div className="flex gap-3 pt-4"><Bone className="h-12 flex-1 rounded-lg"/><Bone className="h-12 flex-1 rounded-lg"/></div></div></div></div><div className="w-full lg:w-80 space-y-4"><Bone className="h-48 rounded-xl"/><Bone className="h-32 rounded-xl"/></div></div></div>
);

// Lightweight inline skeletons for store - no external deps, instant render
export const StoreHeaderSkeleton = () => (
  <div className="bg-white shadow-sm sticky top-0 z-50 px-4 py-3">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
  <div className="max-w-7xl mx-auto px-4 mt-4">
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
