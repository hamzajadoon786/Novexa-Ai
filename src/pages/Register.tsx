import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Terminal, AlertCircle, ShieldCheck } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearErrors } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearErrors();

    if (!form.name || !form.email || !form.password) {
      setValidationError('All core identity registration inputs are required.');
      return;
    }
    if (form.password.length < 8) {
      setValidationError('Password requires a minimum structural depth of 8 components.');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch {
      // Handled by store globally
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 select-none">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-900 bg-slate-900/40 p-8 backdrop-blur-xl animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/10 mb-4">
            <Terminal size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Identity</h2>
          <p className="text-sm text-slate-400 mt-1">Deploy an institutional account inside Novexa AI</p>
        </div>

        {(error || validationError) && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 text-sm text-rose-400">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Full Corporate Name</label>
            <input 
              type="text" 
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Alexander Wright"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Secure Email Point</label>
            <input 
              type="email" 
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="alex@enterprise.io"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Password Parameters</label>
            <input 
              type="password" 
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Min. 8 keys deep"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 disabled:bg-indigo-600/50 transition-all"
          >
            <ShieldCheck size={16} />
            <span>{submitting ? 'Provisioning Ledger Token...' : 'Initialize Core Vault'}</span>
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already verified inside the grid?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">Sign In Session</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
