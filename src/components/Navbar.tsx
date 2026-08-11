import React from 'react';
import { Database, Cpu, Zap, Activity, ShieldCheck, Sparkles, User as UserIcon, LogOut, LogIn, Shield } from 'lucide-react';
import { ServerStatus, User } from '../types';

interface NavbarProps {
  status: ServerStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="bg-[#11141B] border-b border-[#2D333F] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('search')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00ED64] via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-[#00ED64]/10">
            <div className="w-full h-full bg-[#0A0C10] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00ED64] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                DocuMind <span className="text-[#00ED64] font-extrabold">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 rounded-full">
                Atlas v8.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
              Event-Driven Hybrid Intelligence Engine
            </p>
          </div>
        </div>

        {/* Real-time System Status Badges */}
        <div className="hidden lg:flex items-center space-x-2.5 text-xs font-mono">
          {/* MongoDB Atlas Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
            status?.mongodbConnected 
              ? 'bg-emerald-950/40 text-[#00ED64] border-emerald-800/50' 
              : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB: {status?.mongodbConnected ? 'Atlas Live' : 'Fallback Engine'}</span>
            <span className={`w-2 h-2 rounded-full ${status?.mongodbConnected ? 'bg-[#00ED64] animate-pulse' : 'bg-amber-400'}`} />
          </div>

          {/* Index Integrity Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
            status?.indexIntegrityStatus === 'healthy'
              ? 'bg-[#1A1F29] text-[#00ED64] border-[#2D333F]'
              : 'bg-amber-950/50 text-amber-300 border-amber-700/50'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ED64]" />
            <span>Index Integrity: {status?.indexIntegrityStatus === 'healthy' ? 'Healthy' : 'Stale Detected'}</span>
          </div>

          {/* Python ML Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border bg-[#1A1F29] text-indigo-300 border-[#2D333F]">
            <Cpu className="w-3.5 h-3.5" />
            <span>384-dim Dense</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
        </div>

        {/* Auth System Widget */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-[#1A1F29] border border-[#2D333F] rounded-xl px-3 py-1.5">
              <div className="flex items-center space-x-2">
                {currentUser.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>ADMIN</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
                    <UserIcon className="w-3 h-3" />
                    <span>USER</span>
                  </span>
                )}
                <span className="text-white font-bold hidden sm:inline truncate max-w-[120px]">
                  {currentUser.name}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-[#00ED64]/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / JWT Auth</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
