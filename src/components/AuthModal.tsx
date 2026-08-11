import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, User as UserIcon, X, Check, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login'
      ? { email, password }
      : { email, password, name, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAdmin = () => {
    setEmail('admin@documind.ai');
    setPassword('admin123');
    setActiveTab('login');
    setError(null);
  };

  const fillQuickUser = () => {
    setEmail('user@documind.ai');
    setPassword('user123');
    setActiveTab('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-slate-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A1F29] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#00ED64]/10 border border-[#00ED64]/30 text-[#00ED64]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">DocuMind JWT Authentication</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-based access control (RBAC) for search and document ingestion
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#1A1F29] p-1 rounded-xl border border-[#2D333F]">
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-[#00ED64] text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'register'
                ? 'bg-[#00ED64] text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Quick evaluation preset buttons */}
        <div className="p-3 bg-[#1A1F29] rounded-xl border border-[#2D333F] space-y-2 text-xs">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00ED64]" />
            <span>Quick Evaluation Demo Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillQuickAdmin}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[#00ED64] font-mono text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Login as Admin</span>
            </button>
            <button
              type="button"
              onClick={fillQuickUser}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
            >
              <UserIcon className="w-3 h-3" />
              <span>Login as User</span>
            </button>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {activeTab === 'register' && (
            <div>
              <label className="block text-slate-400 mb-1">Full Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Sooraj Sudheer"
                className="w-full bg-[#0A0C10] border border-[#2D333F] rounded-xl px-3 py-2.5 text-white focus:border-[#00ED64] focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Email Address:</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@documind.ai"
                className="w-full bg-[#0A0C10] border border-[#2D333F] rounded-xl pl-9 pr-3 py-2.5 text-white focus:border-[#00ED64] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password:</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0C10] border border-[#2D333F] rounded-xl pl-9 pr-3 py-2.5 text-white focus:border-[#00ED64] focus:outline-none"
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="p-3 bg-[#1A1F29] border border-[#2D333F] rounded-xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[#00ED64] font-bold font-mono">
                <span>Account Role: User</span>
                <Shield className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[11px] font-sans">
                Standard user accounts get full hybrid search and diagnostic privileges. Administrative capabilities (ingestion, batch re-indexing, index repair) are restricted to pre-provisioned system credentials (e.g. <span className="text-emerald-400 font-mono">admin@documind.ai</span>).
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#00ED64]/20 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <span>{activeTab === 'login' ? 'Authenticate & Issue JWT' : 'Register New User'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
