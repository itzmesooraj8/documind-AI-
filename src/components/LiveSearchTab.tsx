import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Sparkles, Zap, ArrowRight, BookOpen, Layers, CheckCircle2, ChevronRight, Hash, Filter, ShieldAlert, LogIn } from 'lucide-react';
import { SearchMode, SearchResponse, SearchCandidate, User } from '../types';

interface LiveSearchTabProps {
  onSearchExecuted: (response: SearchResponse) => void;
  cachedResponse: SearchResponse | null;
  onSelectDocForDiagnostic?: (doc: SearchCandidate) => void;
  currentUser: User | null;
  authToken: string | null;
  onOpenAuthModal: () => void;
}

export const LiveSearchTab: React.FC<LiveSearchTabProps> = ({
  onSearchExecuted,
  cachedResponse,
  onSelectDocForDiagnostic,
  currentUser,
  authToken,
  onOpenAuthModal
}) => {
  const [query, setQuery] = useState('How does $rankFusion combine vector and full-text search in MongoDB Atlas?');
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(cachedResponse);
  const [aiAnswer, setAiAnswer] = useState<{ summary: string; citations: any[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCitationDocId, setActiveCitationDocId] = useState<string | null>(null);

  const categories = ['All', 'MongoDB Atlas', 'Vector Search', 'AI/ML', 'Database Triggers', 'System Architecture', 'Security & Auth'];

  const executeSearch = async (overrideQuery?: string, overrideMode?: SearchMode) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const m = overrideMode !== undefined ? overrideMode : searchMode;

    if (!q.trim()) return;

    if (!authToken) {
      onOpenAuthModal();
      return;
    }

    setIsLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: q,
          mode: m,
          topK: 10,
          filterCategory: selectedCategory
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          onOpenAuthModal();
        }
        return;
      }

      const data: SearchResponse = await res.json();
      setResponse(data);
      onSearchExecuted(data);

      if (data.results && data.results.length > 0) {
        generateAiSynthesis(q, data.results);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiSynthesis = async (q: string, docs: SearchCandidate[]) => {
    if (!authToken) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/grounded-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: q,
          documents: docs.slice(0, 5)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data);
      }
    } catch (e) {
      console.error('Gemini synthesis error:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (authToken && !cachedResponse) {
      executeSearch();
    }
  }, [authToken]);

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    executeSearch(query, mode);
  };

  const isAtlasNative = response?.diagnostics.isAtlasNative ?? false;
  const [inspectDoc, setInspectDoc] = useState<{ doc: SearchCandidate; rank: number } | null>(null);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* ATLAS OFFLINE BANNER */}
      {!isAtlasNative && response && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
            <span>ATLAS OFFLINE — REAL ATLAS SEARCH DISABLED. Running in resilient in-memory fallback engine.</span>
          </div>
          <span className="text-[11px] text-amber-200/80 bg-amber-900/50 px-2.5 py-1 rounded border border-amber-700/50">
            Keyword score labeled as Keyword Occurrence Score
          </span>
        </div>
      )}

      {/* Authentication Notice Banner if Unauthenticated */}
      {!currentUser && (
        <div className="bg-[#11141B] border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-amber-300">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>JWT Authentication required to execute searches and view protected documents.</span>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Continue</span>
          </button>
        </div>
      )}

      {/* Search Console Header Card */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#00ED64]" />
                <h2 className="text-xl font-bold text-white">Live Hybrid Search Console</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Executes native MongoDB Atlas <code className="text-[#00ED64] font-mono bg-[#1A1F29] px-1.5 py-0.5 rounded border border-[#2D333F]">$rankFusion</code> combining <code className="text-indigo-300 font-mono bg-[#1A1F29] px-1.5 py-0.5 rounded border border-[#2D333F]">$vectorSearch</code> and <code className="text-teal-300 font-mono bg-[#1A1F29] px-1.5 py-0.5 rounded border border-[#2D333F]">$search</code>.
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center bg-[#0A0C10] p-1 rounded-xl border border-[#2D333F] self-start md:self-auto font-mono">
              <button
                onClick={() => handleModeChange('hybrid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'hybrid'
                    ? 'bg-[#00ED64] text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>DocuMind Hybrid ($rankFusion)</span>
              </button>

              <button
                onClick={() => handleModeChange('vector')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'vector'
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pure Vector ($vectorSearch)</span>
              </button>

              <button
                onClick={() => handleModeChange('keyword')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'keyword'
                    ? 'bg-teal-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Keyword Match</span>
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask or search anything across enterprise docs..."
                className="w-full bg-[#0A0C10] border border-[#2D333F] focus:border-[#00ED64] rounded-xl pl-12 pr-36 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00ED64]/20 shadow-inner"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 px-4 py-2 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-[#00ED64]/20"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-1 font-mono">
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </span>
                ) : (
                  <>
                    <span>Execute Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Category Filter Pills & Pre-made Queries */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2D333F] text-xs">
            <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-400 text-[11px] flex-shrink-0">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); executeSearch(query, searchMode); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#00ED64]/20 text-[#00ED64] border border-[#00ED64]/40 font-semibold'
                      : 'bg-[#1A1F29] text-slate-400 hover:text-slate-200 border border-[#2D333F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Sample Queries */}
            <div className="hidden lg:flex items-center space-x-2 font-mono text-[11px]">
              <span className="text-slate-500">Sample Queries:</span>
              <button
                onClick={() => { setQuery("How does $rankFusion combine vector and full-text search in MongoDB Atlas?"); executeSearch("How does $rankFusion combine vector and full-text search in MongoDB Atlas?"); }}
                className="text-[#00ED64] hover:underline"
              >
                $rankFusion Guide
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => { setQuery("Explain Python Cross-Encoder ms-marco re-ranking"); executeSearch("Explain Python Cross-Encoder ms-marco re-ranking"); }}
                className="text-teal-400 hover:underline"
              >
                Cross-Encoder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Graph & Execution Latency Bar */}
      {response && (
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-5 shadow-lg space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D333F]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-ping" />
              <span className="text-slate-300 font-bold uppercase tracking-wider">
                Engine: {response.diagnostics.engineName}
              </span>
            </div>

            <div className="flex items-center space-x-2 bg-[#0A0C10] px-3 py-1.5 rounded-lg border border-[#2D333F]">
              <span className="text-slate-400">Total Latency:</span>
              <span className="text-[#00ED64] font-bold text-sm">
                {response.diagnostics.executionTiming.totalMs} ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-[#0A0C10] p-3 rounded-xl border border-[#2D333F] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#00ED64] font-bold uppercase">Step 1: Vector Embed</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">Python FastAPI (all-MiniLM)</div>
                <div className="text-[10px] text-slate-400">384-dimensional dense array</div>
              </div>
              <span className="text-xs bg-[#1A1F29] text-[#00ED64] px-2 py-1 rounded border border-[#2D333F]">
                {response.diagnostics.executionTiming.embeddingMs}ms
              </span>
            </div>

            <div className="bg-[#0A0C10] p-3 rounded-xl border border-[#2D333F] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Step 2: $rankFusion</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">{isAtlasNative ? 'Atlas Native' : 'In-Memory Fusion'}</div>
                <div className="text-[10px] text-slate-400">$vectorSearch + full-text search</div>
              </div>
              <span className="text-xs bg-[#1A1F29] text-indigo-300 px-2 py-1 rounded border border-[#2D333F]">
                {response.diagnostics.executionTiming.rankFusionMs || 12}ms
              </span>
            </div>

            <div className="bg-[#0A0C10] p-3 rounded-xl border border-[#2D333F] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-teal-400 font-bold uppercase">Step 3: Cross-Encoder</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">ms-marco Re-Ranker</div>
                <div className="text-[10px] text-slate-400">Attention logit scoring</div>
              </div>
              <span className="text-xs bg-[#1A1F29] text-teal-300 px-2 py-1 rounded border border-[#2D333F]">
                {response.diagnostics.executionTiming.rerankMs}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gemini Grounded AI Synthesis Card */}
      {(isAiLoading || aiAnswer) && (
        <div className="bg-[#11141B] border border-[#00ED64]/30 rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between border-b border-[#2D333F] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#00ED64]/10 border border-[#00ED64]/30 text-[#00ED64]">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Gemini Grounded AI Synthesis
                <span className="text-[10px] font-mono bg-[#00ED64]/20 text-[#00ED64] px-2 py-0.5 rounded-full border border-[#00ED64]/30">
                  Grounded in Hybrid Top Candidates
                </span>
              </h3>
            </div>
          </div>

          {isAiLoading ? (
            <div className="flex items-center space-x-3 py-6 text-slate-400 text-xs font-mono">
              <div className="w-4 h-4 border-2 border-[#00ED64] border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing grounded multi-document answer with inline citations...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {aiAnswer?.summary}
              </p>

              {/* Citations & Source Linkage */}
              {aiAnswer?.citations && aiAnswer.citations.length > 0 && (
                <div className="pt-3 border-t border-[#2D333F]">
                  <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#00ED64]" />
                    <span>Retrieved Source Citations (Click to inspect in Diagnostic Lens):</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {aiAnswer.citations.map((cite: any, i: number) => (
                      <button
                        key={cite.docId}
                        onClick={() => {
                          setActiveCitationDocId(cite.docId);
                          const matchedDoc = response?.results.find(r => r._id === cite.docId);
                          if (matchedDoc && onSelectDocForDiagnostic) {
                            onSelectDocForDiagnostic(matchedDoc);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 border ${
                          activeCitationDocId === cite.docId
                            ? 'bg-[#00ED64] text-slate-950 border-[#00ED64] font-bold'
                            : 'bg-[#0A0C10] text-[#00ED64] border-[#2D333F] hover:border-[#00ED64]/50'
                        }`}
                      >
                        <span className="font-bold">[Doc {i + 1}]</span>
                        <span className="truncate max-w-[180px]">{cite.title}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Results Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>Found {response?.results.length || 0} candidate documents</span>
          <span>Ranked by {searchMode === 'hybrid' ? '$rankFusion + CrossEncoder' : searchMode === 'vector' ? 'Cosine Distance' : 'Keyword Match'}</span>
        </div>

        {response?.results.map((doc, index) => {
          const confidencePct = Math.min(99, Math.round((doc.score || 0.5) * 100));

          return (
            <div
              key={doc._id}
              className={`bg-[#11141B] border rounded-2xl p-5 shadow-lg transition-all hover:border-[#2D333F] relative group ${
                activeCitationDocId === doc._id
                  ? 'border-[#00ED64] ring-2 ring-[#00ED64]/20'
                  : 'border-[#2D333F]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-[#1A1F29] text-slate-300 text-xs font-mono font-bold flex items-center justify-center border border-[#2D333F]">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#00ED64] bg-[#00ED64]/10 px-2.5 py-0.5 rounded-full border border-[#00ED64]/20">
                    {doc.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Match Confidence:</span>
                    <span className="text-[#00ED64] font-bold">{confidencePct}%</span>
                  </div>
                  <div className="w-20 bg-[#0A0C10] h-2 rounded-full overflow-hidden border border-[#2D333F]">
                    <div
                      className="bg-[#00ED64] h-full rounded-full"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-[#00ED64] transition-colors">
                {doc.title}
              </h3>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-normal">
                {doc.content}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#2D333F] text-[11px] font-mono">
                <div className="bg-[#0A0C10] px-2.5 py-1 rounded border border-[#2D333F] text-slate-300">
                  <span className="text-slate-500">$rankFusion Score: </span>
                  <span className="text-[#00ED64] font-bold">{(doc.rankFusionScore || doc.score || 0).toFixed(4)}</span>
                </div>

                <div className="bg-[#0A0C10] px-2.5 py-1 rounded border border-[#2D333F] text-slate-300">
                  <span className="text-slate-500">Vector Cosine: </span>
                  <span className="text-indigo-400 font-bold">{(doc.vectorSimilarity || doc.vectorScore || 0).toFixed(4)}</span>
                </div>

                <div className="bg-[#0A0C10] px-2.5 py-1 rounded border border-[#2D333F] text-slate-300">
                  <span className="text-slate-500">{doc.keywordScoreName || 'Keyword Score'}: </span>
                  <span className="text-teal-400 font-bold">{(doc.keywordScore || 0).toFixed(4)}</span>
                </div>

                <div className="bg-[#0A0C10] px-2.5 py-1 rounded border border-[#2D333F] text-slate-300">
                  <span className="text-slate-500">CrossEncoder Logit: </span>
                  <span className="text-teal-300 font-bold">{(doc.rerankLogit || 1.2).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => setInspectDoc({ doc, rank: index + 1 })}
                  className="ml-auto px-2.5 py-1 rounded bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 hover:bg-[#00ED64]/20 font-bold flex items-center space-x-1 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why This Result?</span>
                </button>

                {onSelectDocForDiagnostic && (
                  <button
                    onClick={() => onSelectDocForDiagnostic(doc)}
                    className="text-[#00ED64] hover:underline flex items-center space-x-1 text-xs"
                  >
                    <span>Inspect Diagnostic Lens</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why This Result?" Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141B] border border-[#00ED64]/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl font-mono text-xs text-slate-100 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded bg-[#00ED64]/20 text-[#00ED64] font-extrabold border border-[#00ED64]/30 text-sm">
                  Rank #{inspectDoc.rank}
                </span>
                <h3 className="text-sm font-bold text-white">WHY THIS RESULT?</h3>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1 text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[11px] text-slate-400">DOCUMENT TITLE</div>
                <div className="text-sm font-bold text-white mt-0.5 font-sans">{inspectDoc.doc.title}</div>
              </div>

              {/* Score Breakdown Bar Visualizers */}
              <div className="space-y-3 bg-[#0A0C10] p-4 rounded-xl border border-[#2D333F]">
                {/* Semantic Relevance */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Semantic Relevance (Vector Cosine):</span>
                    <span className="text-indigo-400 font-bold">{Math.round((inspectDoc.doc.vectorSimilarity || 0.8) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#1A1F29] h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.round((inspectDoc.doc.vectorSimilarity || 0.8) * 100)}%` }} />
                  </div>
                </div>

                {/* Keyword Relevance */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Keyword Match ({inspectDoc.doc.keywordScoreName || 'Score'}):</span>
                    <span className="text-teal-400 font-bold">{Math.round((inspectDoc.doc.keywordScore || 0.6) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#1A1F29] h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.round((inspectDoc.doc.keywordScore || 0.6) * 100)}%` }} />
                  </div>
                </div>

                {/* RRF Contribution */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">$rankFusion RRF Contribution:</span>
                    <span className="text-amber-400 font-bold">{Math.min(99, Math.round((inspectDoc.doc.rankFusionScore || 0.03) * 2000))}%</span>
                  </div>
                  <div className="w-full bg-[#1A1F29] h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(99, Math.round((inspectDoc.doc.rankFusionScore || 0.03) * 2000))}%` }} />
                  </div>
                </div>

                {/* Cross Encoder */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Cross-Encoder Precision Logit:</span>
                    <span className="text-[#00ED64] font-bold">{(inspectDoc.doc.rerankLogit || 1.45).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#1A1F29] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#00ED64] h-full rounded-full" style={{ width: `${Math.min(99, Math.round(((inspectDoc.doc.rerankLogit || 1.2) + 2) * 20))}%` }} />
                  </div>
                </div>
              </div>

              {/* Highlighted Evidence */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1">MATCHED EVIDENCE EXCERPT</div>
                <div className="bg-[#0A0C10] p-3 rounded-xl border border-[#2D333F] text-slate-200 font-sans text-xs leading-relaxed">
                  "{inspectDoc.doc.matchedHighlights?.[0] || inspectDoc.doc.content}"
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 bg-[#1A1F29] hover:bg-[#2D333F] text-white font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
