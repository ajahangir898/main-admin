import { ElementType } from 'react';

interface Props { icon: ElementType; label: string; active?: boolean; onClick?: () => void; collapsed?: boolean; badge?: number; }

const NavItem = ({ icon: Icon, label, active, onClick, collapsed, badge }: Props) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    <Icon className="w-5 h-5 flex-shrink-0"/>
    {!collapsed && <><span className="font-medium text-sm flex-1 text-left">{label}</span>{badge !== undefined && <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-700'}`}>{badge}</span>}</>}
  </button>
);

export default NavItem;
