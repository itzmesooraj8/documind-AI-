import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveSearchTab } from './components/LiveSearchTab';
import { DocumentIngestionTab } from './components/DocumentIngestionTab';
import { DiagnosticLensTab } from './components/DiagnosticLensTab';
import { AtlasSetupTab } from './components/AtlasSetupTab';
import { QueryLogsTab } from './components/QueryLogsTab';
import { SearchEvaluationTab } from './components/SearchEvaluationTab';
import { AuthModal } from './components/AuthModal';
import { ServerStatus, SearchResponse, SearchCandidate, User } from './types';
import { Search, FileUp, Eye, Database, History, Shield, Sparkles, BarChart3 } from 'lucide-react';

export function App() {

  const [activeTab, setActiveTab] = useState<string>('search');
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [lastSearchResponse, setLastSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedDocForDiagnostic, setSelectedDocForDiagnostic] = useState<SearchCandidate | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('documind_jwt_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Fetch Server Health
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          mongodbConnected: data.mongodbConnected,
          pythonServiceOnline: data.pythonServiceOnline,
          atlasIndexesActive: data.atlasIndexesActive,
          activeDocumentsCount: data.activeDocumentsCount,
          vectorDimension: data.vectorDimension,
          indexIntegrityStatus: data.indexIntegrityStatus
        });
      }
    } catch (e) {
      console.error('Health check failed:', e);
    }
  };

  // Check initial token and validate user session
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);

    const validateToken = async () => {
      const token = localStorage.getItem('documind_jwt_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setAuthToken(token);
          } else {
            // Invalid token, auto-login as demo admin for instant UX
            autoLoginDefaultAdmin();
          }
        } catch (e) {
          autoLoginDefaultAdmin();
        }
      } else {
        autoLoginDefaultAdmin();
      }
    };

    validateToken();
    return () => clearInterval(interval);
  }, []);

  const autoLoginDefaultAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@documind.ai', password: 'admin123' })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem('documind_jwt_token', data.token);
      }
    } catch (e) {}
  };

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('documind_jwt_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('documind_jwt_token');
  };

  const handleSelectDocForDiagnostic = (doc: SearchCandidate) => {
    setSelectedDocForDiagnostic(doc);
    setActiveTab('diagnostic');
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E0E2E7] font-sans flex flex-col selection:bg-[#00ED64] selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        status={serverStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area with Bento Grid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs - Bento Pill Header */}
        <div className="bg-[#11141B] border border-[#2D333F] p-1.5 rounded-2xl mb-6 shadow-xl flex items-center justify-between overflow-x-auto scrollbar-none font-mono text-xs">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Live Hybrid Search</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'diagnostic'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Diagnostic Lens & 2D Projection</span>
            </button>

            <button
              onClick={() => setActiveTab('ingestion')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'ingestion'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Ingestion & Index Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab('atlas-setup')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'atlas-setup'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Atlas Deployment</span>
            </button>

            <button
              onClick={() => setActiveTab('search-eval')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'search-eval'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Search Quality Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('query-logs')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'query-logs'
                  ? 'bg-[#00ED64] text-slate-950 shadow-lg shadow-[#00ED64]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1A1F29]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Query Logs</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center space-x-2 pr-3 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
            <span>384-dim Dense Vector Active</span>
          </div>
        </div>

        {/* Dynamic Tab Views */}
        {activeTab === 'search' && (
          <LiveSearchTab
            onSearchExecuted={setLastSearchResponse}
            cachedResponse={lastSearchResponse}
            onSelectDocForDiagnostic={handleSelectDocForDiagnostic}
            currentUser={currentUser}
            authToken={authToken}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'search-eval' && (
          <SearchEvaluationTab
            authToken={authToken}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'diagnostic' && (
          <DiagnosticLensTab
            lastSearchResponse={lastSearchResponse}
            selectedDocForDiagnostic={selectedDocForDiagnostic}
          />
        )}

        {activeTab === 'ingestion' && (
          <DocumentIngestionTab
            currentUser={currentUser}
            authToken={authToken}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'atlas-setup' && <AtlasSetupTab />}

        {activeTab === 'query-logs' && <QueryLogsTab authToken={authToken} />}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="bg-[#11141B] border-t border-[#2D333F] py-6 text-xs text-slate-400 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#00ED64]" />
            <span>DocuMind AI — Production-Grade Event-Driven Hybrid Search Architecture</span>
          </div>
          <div>
            <span>MongoDB Atlas v8.0 $rankFusion • Sentence Transformers all-MiniLM-L6-v2 (384-dim)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
