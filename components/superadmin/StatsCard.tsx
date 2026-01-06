import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ElementType } from 'react';

interface Props { title: string; value: string | number; change: number; changeType: 'increase' | 'decrease'; icon: ElementType; iconBg: string; iconColor: string; subtitle: string; }

const StatsCard = ({ title, value, change, changeType, icon: Icon, iconBg, iconColor, subtitle }: Props) => (
  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">{value}</p>
        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
          <span className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ${changeType === 'increase' ? 'text-emerald-600' : 'text-red-500'}`}>
            {changeType === 'increase' ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>}{Math.abs(change)}%
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">{subtitle}</span>
        </div>
      </div>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${iconBg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}><Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`}/></div>
    </div>
  </div>
);

export default StatsCard;
