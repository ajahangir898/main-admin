import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { User as UserType } from '../../types';

export interface LoginModalProps { onClose: () => void; onLogin: (e: string, p: string) => Promise<boolean>; onRegister: (u: UserType) => Promise<boolean>; onGoogleLogin?: () => Promise<boolean>; }

const GoogleIcon = () => <svg width="20" height="20" viewBox="0 0 18 18"><path d="M17.64 9.2045c0-.638-.0573-1.2517-.1636-1.8409H9v3.4818h4.8436c-.2091 1.125-.8436 2.0782-1.7968 2.7168v2.2582h2.9086c1.7018-1.5668 2.6846-3.8745 2.6846-6.6159z" fill="#4285F4"/><path d="M9 18c2.43 0 4.4673-.8063 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8377.8618-3.0478.8618-2.3445 0-4.3282-1.5832-5.0364-3.7105H.9573v2.3313C2.4382 15.9827 5.4818 18 9 18z" fill="#34A853"/><path d="M3.9636 10.7141c-.18-.54-.2823-1.1168-.2823-1.7141 0-.5973.1023-1.1741.2823-1.7141V4.9545H.9573C.3477 6.1745 0 7.5473 0 9s.3477 2.8255.9573 4.0455l3.0063-2.3314z" fill="#FBBC05"/><path d="M9 3.5455c1.3214 0 2.5073.4546 3.4405 1.345l2.5809-2.5809C13.4646.8973 11.4273 0 9 0 5.4818 0 2.4382 2.0177.9573 4.9545l3.0063 2.3314C4.6718 5.1286 6.6555 3.5455 9 3.5455z" fill="#EA4335"/></svg>;

export const LoginModal = ({ onClose, onLogin, onRegister, onGoogleLogin }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.4)]";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const ok = isLogin ? await onLogin(form.email.trim(), form.password) : await onRegister({ ...form, role: 'customer' });
      ok ? onClose() : setError(isLogin ? 'Invalid credentials.' : 'Unable to create account.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!onGoogleLogin) return; setError(null); setGLoading(true);
    try { (await onGoogleLogin()) && onClose(); }
    catch (err: any) { setError(err?.message || 'Unable to continue with Google.'); }
    finally { setGLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-500 mb-6 text-sm">{isLogin ? 'Login to continue shopping' : 'Sign up to get started'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <><input type="text" placeholder="Full Name" className={input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
              <input type="text" placeholder="Phone" className={input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required/></>}
            <input type="email" placeholder="Email Address" className={input} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
            <input type="password" placeholder="Password" className={input} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required/>
            <button type="submit" disabled={loading} className="w-full btn-order py-3 rounded-xl font-bold shadow-[0_18px_28px_rgba(var(--color-primary-rgb),0.25)] disabled:opacity-60">{loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}</button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </form>
          {onGoogleLogin && <div className="mt-6">
            <div className="relative flex items-center justify-center mb-3"><span className="px-3 text-xs text-gray-400 bg-white">OR</span><div className="absolute left-0 right-0 h-px bg-gray-200"/></div>
            <button type="button" onClick={handleGoogle} disabled={gLoading} className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"><GoogleIcon/>{gLoading ? 'Connecting...' : 'Continue with Google'}</button>
          </div>}
          <div className="mt-6 text-center text-sm text-gray-600">{isLogin ? "Don't have an account? " : "Already have an account? "}<button onClick={() => setIsLogin(!isLogin)} className="text-[rgb(var(--color-primary-rgb))] font-bold hover:underline">{isLogin ? 'Sign Up' : 'Login'}</button></div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
