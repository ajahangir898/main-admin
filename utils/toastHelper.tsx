import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
const iconMap = { success: <CheckCircle2 size={20} className="text-emerald-500"/>, error: <AlertCircle size={20} className="text-rose-500"/>, info: <Info size={20} className="text-blue-500"/>, warning: <AlertTriangle size={20} className="text-amber-500"/> };
const bgMap = { success: 'bg-emerald-50 border-emerald-200', error: 'bg-rose-50 border-rose-200', info: 'bg-blue-50 border-blue-200', warning: 'bg-amber-50 border-amber-200' };
const txtMap = { success: 'text-emerald-800', error: 'text-rose-800', info: 'text-blue-800', warning: 'text-amber-800' };

interface Config { type: ToastType; message: string; details?: string; action?: { label: string; onClick: () => void; }; }

export const showToast = (c: Config) => toast.custom((t) => (
  <div className={`flex items-start gap-3 rounded-xl border ${bgMap[c.type]} p-4 shadow-lg max-w-md animate-in fade-in slide-in-from-right-full`} style={{ opacity: t.visible ? 1 : 0, transition: 'opacity 0.3s' }}>
    <div className="flex-shrink-0 mt-0.5">{iconMap[c.type]}</div>
    <div className="flex-1 min-w-0"><p className={`font-semibold ${txtMap[c.type]}`}>{c.message}</p>{c.details && <p className={`text-sm mt-1 opacity-75 ${txtMap[c.type]}`}>{c.details}</p>}</div>
    {c.action && <button onClick={c.action.onClick} className={`flex-shrink-0 font-semibold ${txtMap[c.type]} hover:opacity-75 transition`}>{c.action.label}</button>}
    <button onClick={() => t.dismiss()} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><X size={16}/></button>
  </div>
), { duration: 4000 });

export const showSuccessToast = (message: string, details?: string) => showToast({ type: 'success', message, details });
export const showErrorToast = (message: string, details?: string) => showToast({ type: 'error', message, details });
export const showInfoToast = (message: string, details?: string) => showToast({ type: 'info', message, details });
export const showWarningToast = (message: string, details?: string) => showToast({ type: 'warning', message, details });
