import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuthStore } from '../store/auth.store';
import { User, Shield, KeyRound, Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, syncProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await syncProfile({ name });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-0 md:pl-64 custom-scrollbar transition-all">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-8 space-y-8 mt-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase tracking-wider">Settings Panel</h1>
            <p className="text-xs text-slate-500 mt-1">Configure profile metadata and system access tokens.</p>
          </div>

          <div className="space-y-6">
            {/* Profile Config Component Section */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                <User size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Account Profile Metadata</h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Registered Identity Name</label>
                  <input 
                    type="text" 
                    className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:bg-indigo-600/50 transition-all"
                >
                  <Save size={14} />
                  <span>{updating ? 'Saving Configuration...' : 'Commit Core Mutator'}</span>
                </button>
              </form>
            </div>

            {/* Cryptographic Key Tokens Panel Segment */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                <Shield size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Access & Authorization Framework</h3>
              </div>
              <div className="space-y-4 text-xs text-slate-400">
                <div className="flex justify-between max-w-md border border-slate-900 p-3 rounded-lg bg-slate-950">
                  <span className="font-medium text-slate-500">Security Clearance Level</span>
                  <span className="font-bold text-indigo-400 uppercase tracking-widest">Root API Operator</span>
                </div>
                <div className="flex justify-between max-w-md border border-slate-900 p-3 rounded-lg bg-slate-950">
                  <span className="font-medium text-slate-500">Device Hardware Connection</span>
                  <span className="font-bold text-emerald-400 uppercase tracking-widest">Capacitor Native Interface Active</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
 
