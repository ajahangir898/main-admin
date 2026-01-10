import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'wave'
}) => {
  const baseClass = 'enhanced-skeleton';
  const variantClass = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }[variant];

  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  );
};

export const EnhancedProductCardSkeleton: React.FC = () => (
  <div className="enhanced-skeleton-product-card">
    <Skeleton className="enhanced-skeleton-product-image" variant="rectangular" />
    <div className="enhanced-skeleton-product-content">
      <Skeleton className="enhanced-skeleton-line" width="100%" />
      <Skeleton className="enhanced-skeleton-line medium" width="80%" />
      <div className="flex gap-2 mt-2">
        <Skeleton width="50%" height="2rem" variant="rectangular" />
        <Skeleton width="50%" height="2rem" variant="rectangular" />
      </div>
    </div>
  </div>
);

export const EnhancedHeroSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="space-y-6">
        <Skeleton width="40%" height="2rem" variant="rectangular" />
        <Skeleton width="100%" height="4rem" />
        <Skeleton width="90%" height="4rem" />
        <Skeleton width="80%" height="2rem" />
        <div className="flex gap-4 mt-6">
          <Skeleton width="150px" height="3rem" variant="rectangular" />
          <Skeleton width="150px" height="3rem" variant="rectangular" />
        </div>
      </div>
      <Skeleton className="aspect-[4/3]" variant="rectangular" />
    </div>
  </div>
);

export const EnhancedCheckoutSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-4">
          <Skeleton width="40%" height="2rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
        <div className="space-y-4">
          <Skeleton width="40%" height="2rem" />
          <Skeleton width="100%" height="6rem" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="space-y-4">
        <Skeleton width="60%" height="2rem" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton width="4rem" height="4rem" variant="rectangular" />
            <div className="flex-1 space-y-2">
              <Skeleton width="100%" height="1rem" />
              <Skeleton width="60%" height="1rem" />
            </div>
          </div>
        ))}
        <Skeleton width="100%" height="3rem" variant="rectangular" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <EnhancedProductCardSkeleton key={i} />
    ))}
  </div>
);

export const CategoryMenuSkeleton: React.FC = () => (
  <div className="flex gap-3 overflow-hidden py-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} width="7rem" height="2.5rem" variant="rectangular" className="shrink-0 rounded-full" />
    ))}
  </div>
);

export const HeaderSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm px-4 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <Skeleton width="10rem" height="2.5rem" variant="rectangular" />
      <Skeleton className="hidden md:block flex-1 max-w-xl" height="2.5rem" variant="rectangular" />
      <div className="flex gap-3">
        <Skeleton width="2.5rem" height="2.5rem" variant="circular" />
        <Skeleton width="2.5rem" height="2.5rem" variant="circular" />
        <Skeleton width="5rem" height="2.5rem" variant="rectangular" className="hidden md:block" />
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image gallery skeleton */}
      <div className="space-y-4">
        <Skeleton className="aspect-square" variant="rectangular" />
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-square" variant="rectangular" />
          ))}
        </div>
      </div>

      {/* Product info skeleton */}
      <div className="space-y-6">
        <Skeleton width="80%" height="3rem" />
        <Skeleton width="40%" height="2rem" />
        <div className="space-y-2">
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
        </div>
        <div className="flex gap-4">
          <Skeleton width="50%" height="3rem" variant="rectangular" />
          <Skeleton width="50%" height="3rem" variant="rectangular" />
        </div>
        <Skeleton width="100%" height="12rem" variant="rectangular" />
      </div>
    </div>
  </div>
);

export const MegaMenuSkeleton: React.FC = () => (
  <div className="grid grid-cols-4 gap-8 p-8">
    {[1, 2, 3, 4].map((col) => (
      <div key={col} className="space-y-4">
        <Skeleton width="60%" height="1rem" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <Skeleton width="2rem" height="2rem" variant="rectangular" />
            <Skeleton width="70%" height="1rem" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default {
  Skeleton,
  EnhancedProductCardSkeleton,
  EnhancedHeroSkeleton,
  EnhancedCheckoutSkeleton,
  ProductGridSkeleton,
  CategoryMenuSkeleton,
  HeaderSkeleton,
  ProductDetailSkeleton,
  MegaMenuSkeleton
};
