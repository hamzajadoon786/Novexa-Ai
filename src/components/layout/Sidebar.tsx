
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { 
  MessageSquare, Mic, Image, Video, Music, FileText, Code, 
  Globe, GraduationCap, Briefcase, Settings, LogOut, Menu, X, Terminal
} from 'lucide-react';

const sidebarItems = [
  { id: 'chat', label: 'AI Core Chat', icon: MessageSquare, category: 'Core' },
  { id: 'voice', label: 'Voice Workspace', icon: Mic, category: 'Core' },
  { id: 'studio', label: 'Image Engine', icon: Image, category: 'Creative' },
  { id: 'video', label: 'Video Synthesizer', icon: Video, category: 'Creative' },
  { id: 'music', label: 'Music Composer', icon: Music, category: 'Creative' },
  { id: 'docs', label: 'Document Suite', icon: FileText, category: 'Productivity' },
  { id: 'dev', label: 'Coding Matrix', icon: Code, category: 'Productivity' },
  { id: 'intel', label: 'Research Node', icon: GraduationCap, category: 'Productivity' },
  { id: 'biz', label: 'Business Suite', icon: Briefcase, category: 'Productivity' },
  { id: 'lingo', label: 'Global Translator', icon: Globe, category: 'Productivity' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { featureId } = useParams<{ featureId: string }>();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { logout, user } = useAuthStore();

  return (
    <>
      {/* Mobile Toggle Trigger Box */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-50 rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white md:hidden border border-slate-800"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Primary Sidebar Panel Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-900 bg-slate-950 px-4 py-6 transition-transform duration-300
        md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <Terminal size={18} className="text-white" />
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-white">Novexa AI</span>
        </div>

        {/* Dynamic Items Navigation Block */}
        <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
          <div>
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</div>
            <button
              onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}
              className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                !featureId ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={18} />
              <span>Central Dashboard</span>
            </button>
          </div>

          <div>
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">AI Modules</div>
            <div className="mt-2 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = featureId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(`/features/${item.id}`); setSidebarOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? 'bg-slate-900 text-indigo-400 border border-slate-800' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Anchored Core Account Footprint Area */}
        <div className="mt-auto border-t border-slate-900 pt-4 space-y-1">
          <button
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          >
            <Settings size={18} />
            <span>Settings Panel</span>
          </button>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-950/20"
          >
            <LogOut size={18} />
            <span>Sign Out Session</span>
          </button>

          {/* Connected User ID Card badge */}
          <div className="flex items-center gap-3 px-3 pt-4 border-t border-slate-900 mt-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
