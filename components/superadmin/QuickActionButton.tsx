import { ElementType } from 'react';

interface Props { icon: ElementType; label: string; color: string; onClick?: () => void; }
const colors: Record<string, string> = { violet: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', blue: 'bg-slate-700 text-slate-200 hover:bg-slate-600', emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100', pink: 'bg-slate-700 text-slate-200 hover:bg-slate-600', red: 'bg-red-50 text-red-600 hover:bg-red-100' };

const QuickActionButton = ({ icon: Icon, label, color, onClick }: Props) => (
  <button onClick={onClick} className={`p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl ${colors[color]} transition-colors flex flex-col items-center gap-1 sm:gap-2`}>
    <Icon className="w-4 h-4 sm:w-5 sm:h-5"/><span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{label}</span>
  </button>
);

export default QuickActionButton;
