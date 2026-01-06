interface Props { label: string; value: number; color: 'violet' | 'blue' | 'emerald'; }
const colors: Record<string, string> = { violet: 'bg-emerald-500', blue: 'bg-emerald-400', emerald: 'bg-emerald-500' };

const ServerMetric = ({ label, value, color }: Props) => (
  <div>
    <div className="flex items-center justify-between mb-1.5 sm:mb-2"><span className="text-xs sm:text-sm text-slate-600">{label}</span><span className="text-xs sm:text-sm font-semibold text-slate-900">{value}%</span></div>
    <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${colors[color]} rounded-full transition-all duration-500`} style={{ width: `${value}%` }}/></div>
  </div>
);

export default ServerMetric;
