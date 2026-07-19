import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAiStore } from '../store/ai.store';
import { Send, Upload, Shield, Info, Mic, Paperclip } from 'lucide-react';

const FeaturesContainer: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const { conversations, currentChatId, sendChatMessage, isProcessing } = useAiStore();
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeHistory = currentChatId ? conversations[currentChatId] || [] : [];

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const prompt = input;
    setInput('');
    await sendChatMessage(prompt, { model: featureId });
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col pl-0 md:pl-64 transition-all">
        
        {/* Dynamic Context Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950 px-6 flex items-center justify-between z-10">
          <div className="pl-12 md:pl-0">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              System Core Routing Target: <span className="text-indigo-400">/{featureId}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 border border-slate-800 text-[11px] font-medium text-slate-400">
            <Shield size={12} className="text-indigo-400" />
            <span>Proxy Encryption Guard Pipeline Enabled</span>
          </div>
        </header>

        {/* Dynamic Execution Canvas Block */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-slate-950">
          {activeHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                <Info size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Workspace Sandbox Empty</h3>
                <p className="text-xs text-slate-500 mt-1">Pass context instructions or parameters via the secure container controller below to generate runtime output matrix models.</p>
              </div>
            </div>
          ) : (
            activeHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 p-5 rounded-2xl border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900/30 border-slate-900 ml-auto max-w-[85%]' 
                    : 'bg-indigo-950/10 border-indigo-900/20 max-w-[90%]'
                }`}
              >
                <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold border ${
                  msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-indigo-600 border-indigo-500 text-white'
                }`}>
                  {msg.role === 'user' ? 'UR' : 'NV'}
                </div>
                <div className="space-y-1 overflow-x-auto custom-scrollbar w-full">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {msg.role === 'user' ? 'Operator Payload' : 'Novexa Response Engine'}
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}

          {isProcessing && (
            <div className="flex items-center gap-3 bg-slate-900/20 border border-slate-900 p-4 rounded-xl max-w-[200px]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">Processing Token Stream...</span>
            </div>
          )}
        </div>

        {/* Input Dock Panel */}
        <footer className="p-4 border-t border-slate-900 bg-slate-950">
          <form onSubmit={handleDispatch} className="mx-auto max-w-4xl relative flex items-center rounded-xl border border-slate-800 bg-slate-900/30 p-2 focus-within:border-indigo-500 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={() => console.log('Matrix Binary Context Loaded')} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            >
              <Paperclip size={18} />
            </button>
            <button 
              type="button"
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            >
              <Mic size={18} />
            </button>
            <input 
              type="text" 
              className="flex-1 bg-transparent px-4 text-sm text-slate-100 focus:outline-none placeholder:text-slate-600"
              placeholder={`Send payload configuration to system module: /${featureId}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isProcessing}
              className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-slate-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>

      </main>
    </div>
  );
};

export default FeaturesContainer;
