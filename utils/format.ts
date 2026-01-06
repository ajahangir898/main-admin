export const formatCurrency = (
  value?: number | null,
  fallback: string | null = '—'
): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  return fallback;
};
