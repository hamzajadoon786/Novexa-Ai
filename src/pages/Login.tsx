import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Terminal, AlertCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, clearErrors } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearErrors();

    if (!form.email || !form.password) {
      setValidationError('Please populate both email and credential parameters.');
      return;
    }

    setSubmitting(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch {
      // Handled globally by store catch
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-900 bg-slate-900/40 p-8 backdrop-blur-xl animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/10 mb-4">
            <Terminal size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Access the Novexa AI core matrix platform</p>
        </div>

        {/* Runtime Operational Error Injections */}
        {(error || validationError) && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 text-sm text-rose-400">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="name@enterprise.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Password Token</label>
              <a href="#forgot" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Forgot?</a>
            </div>
            <input 
              type="password" 
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 disabled:bg-indigo-600/50 transition-all group"
          >
            <span>{submitting ? 'Verifying Credentials...' : 'Sign In Engine'}</span>
            <ArrowRight size={16} className="text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-900"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-slate-600 uppercase tracking-wider">Or System Entry</span>
          <div className="flex-grow border-t border-slate-900"></div>
        </div>

        <button 
          onClick={() => useAuthStore.getState().loginWithGoogle('mock-oauth-payload')}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-950 py-3 text-sm font-medium text-slate-300 hover:bg-slate-900 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-2.6-4.53z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google Enterprise</span>
        </button>

        <p className="text-center text-sm text-slate-500">
          New to the collective?{' '}
          <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">Create Corporate Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
