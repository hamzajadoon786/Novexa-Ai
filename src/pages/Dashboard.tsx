import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuthStore } from '../store/auth.store';
import { Sparkles, Zap, BrainCircuit, Activity, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const metrics = [
    { title: 'AI Processing Nodes', value: '99.98%', desc: 'Operational Capacity', icon: Activity, color: 'text-emerald-400' },
    { title: 'Neural Vector Index', value: '4,102 items', desc: 'Sync Active', icon: BrainCircuit, color: 'text-indigo-400' },
    { title: 'Compute Status', value: 'Tier 1 Enterprise', desc: 'Uncapped Engine API', icon: Zap, color: 'text-amber-400' }
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-0 md:pl-64 custom-scrollbar transition-all">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-8 space-y-8 mt-6">
          
          {/* Header Title Banner */}
          <div className="rounded-2xl border border-slate-900 bg-gradient-to-r from-slate-900/60 to-indigo-950/20 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Systems Active <Sparkles className="text-indigo-400" size={24} />
              </h1>
              <p className="text-sm text-slate-400 mt-1">Secure session initialized for root operator: <span className="text-slate-200 font-medium">{user?.name}</span></p>
            </div>
            <button 
              onClick={() => navigate('/features/chat')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1 group"
            >
              <span>Launch AI Workspace</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Operational Metrics Grids */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.title}</span>
                    <Icon size={18} className={m.color} />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white mt-2">{m.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{m.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Feature Quick Launcher Matrices */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Core Workspaces</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div 
                onClick={() => navigate('/features/chat')}
                className="group cursor-pointer rounded-xl border border-slate-900 bg-slate-900/20 p-6 hover:border-slate-800 transition-all"
              >
                <div className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">Multimodal Chat Matrix</div>
                <p className="text-xs text-slate-400 mt-1">Orchestrate complex conversational logic across sub-engines, analyze live uploads, and generate system configurations inside a singular portal workspace.</p>
              </div>
              <div 
                onClick={() => navigate('/features/studio')}
                className="group cursor-pointer rounded-xl border border-slate-900 bg-slate-900/20 p-6 hover:border-slate-800 transition-all"
              >
                <div className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">Creative Studio Module</div>
                <p className="text-xs text-slate-400 mt-1">Access generative media tools. Compile cinematic image patterns, synthesize audio stems, or export raw contextual vector scripts from vision models.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
