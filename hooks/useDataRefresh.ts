import { useEffect, useCallback, useRef } from 'react';
import { onDataRefresh } from '../services/DataService';

type Handler = (key: string, tenantId?: string) => void;

export const useDataRefresh = (handler: Handler, keys?: string[], tenantId?: string) => {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => onDataRefresh((key, tid) => {
    if (keys?.length && !keys.includes(key)) return;
    if (tenantId && tid && tid !== tenantId) return;
    ref.current(key, tid);
  }), [keys?.join(','), tenantId]);
};

export const useDataRefreshDebounced = (handler: Handler, debounceMs = 500, keys?: string[], tenantId?: string) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ key: string | null; tid?: string }>({ key: null });

  const debounced = useCallback((key: string, tid?: string) => {
    pending.current = { key, tid };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current.key && handler(pending.current.key, pending.current.tid);
      timer.current = null; pending.current.key = null;
    }, debounceMs);
  }, [handler, debounceMs]);

  useDataRefresh(debounced, keys, tenantId);
  useEffect(() => () => { timer.current && clearTimeout(timer.current); }, []);
};
