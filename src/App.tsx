import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
        <h1 className="text-xl font-bold text-sky-400">Novexa AI</h1>
        <span className="px-3 py-1 bg-sky-900/60 text-sky-300 text-xs rounded-full border border-sky-700">
          Standalone Mode Active
        </span>
      </header>

      {/* Main Dashboard View */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to Novexa AI</h2>
          <p className="text-slate-400 text-sm mb-6">
            Authentication bypassed successfully. You are now in the primary application environment.
          </p>

          <div className="space-y-4">
            <textarea
              placeholder="Ask Novexa AI anything..."
              rows={4}
              className="w-full p-4 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500 transition resize-none"
            />
            <button
              onClick={() => alert('Novexa AI is active!')}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition shadow-lg"
            >
              Send Request
            </button>
          </div>
        </div>
      </main>
    </div>
  );
              }
