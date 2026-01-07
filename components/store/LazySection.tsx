import { useEffect, useRef, useState, ReactNode } from 'react';
import { useIntersectionObserver } from '../../utils/performanceHelpers';

interface Props { 
  fallback: ReactNode; 
  children: ReactNode; 
  className?: string; 
  rootMargin?: string; 
  threshold?: number;
  minHeight?: string;
}

export const LazySection = ({ fallback, children, className, rootMargin = '0px 0px 200px', threshold = 0.05, minHeight }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) setVisible(true); }, []);
  useIntersectionObserver(ref, v => v && setVisible(true), { rootMargin, threshold });

  return (
    <div ref={ref} className={className} style={minHeight && !visible ? { minHeight } : undefined}>
      {visible ? children : fallback}
    </div>
  );
};

export default LazySection;
