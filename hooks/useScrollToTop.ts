import { useEffect } from 'react';

export const useScrollToTop = (deps: any[] = []) => {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, deps);
};
