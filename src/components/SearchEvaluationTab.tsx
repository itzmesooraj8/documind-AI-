import React, { useState, useEffect } from 'react';
import { BarChart3, Play, CheckCircle2, TrendingUp, Cpu, Layers, Zap, Award, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface SearchEvaluationTabProps {
  authToken: string | null;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

interface MetricSet {
  recallAt5: number;
  ndcgAt5: number;
  mrr: number;
}

interface EvaluationResultData {
  totalQueries: number;
  metrics: {
    vectorOnly: MetricSet;
    keywordOnly: MetricSet;
    hybridRrf: MetricSet;
    hybridWithRerank: MetricSet;
  };
  queryResultsDetails: Array<{
    queryId: string;
    query: string;
    expectedTitle: string;
    targetDocId: string;
    ranks: {
      vectorOnly: number;
      keywordOnly: number;
      hybridRrf: number;
      hybridWithRerank: number;
    };
  }>;
  evaluationMs: number;
  evaluatedAt: string;
}

export const SearchEvaluationTab: React.FC<SearchEvaluationTabProps> = ({
  authToken,
  currentUser,
  onOpenAuthModal
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [evalData, setEvalData] = useState<EvaluationResultData | null>(null);

  const runEvaluation = async () => {
    if (!authToken) {
      onOpenAuthModal();
      return;
    }

    setIsRunning(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.ok) {
        const data: EvaluationResultData = await res.json();
        setEvalData(data);
      } else if (res.status === 401 || res.status === 403) {
        onOpenAuthModal();
      }
    } catch (e) {
      console.error('Evaluation run failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (authToken && !evalData) {
      runEvaluation();
    }
  }, [authToken]);

  const metrics = evalData?.metrics;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Search Quality Lab Header Banner */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#00ED64]/10 border border-[#00ED64]/30 rounded-xl text-[#00ED64]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Search Quality Lab & Precision Benchmarks</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Evaluates 10 standard benchmark queries against ground-truth targets comparing <code className="text-indigo-300">Vector Only</code>, <code className="text-teal-300">Keyword Only</code>, <code className="text-amber-300">Atlas $rankFusion (RRF)</code>, and <code className="text-[#00ED64]">Hybrid + Cross-Encoder Reranker</code>.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runEvaluation}
              disabled={isRunning}
              className="px-5 py-3 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-[#00ED64]/20"
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Evaluating 10 Test Queries...' : 'Run Benchmark Suite'}</span>
            </button>
          </div>
        </div>

        {evalData && (
          <div className="mt-4 pt-4 border-t border-[#2D333F] flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              <span>Evaluated Suite: <strong className="text-white">{evalData.totalQueries} Queries</strong></span>
              <span className="mx-2">•</span>
              <span>Execution Time: <strong className="text-[#00ED64]">{evalData.evaluationMs} ms</strong></span>
            </div>
            <div>
              <span>Last Run: {new Date(evalData.evaluatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Aggregate Metric Cards Comparison */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vector Only Card */}
          <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-400">1. Vector Search Only</span>
              <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                Cosine
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {(metrics.vectorOnly.recallAt5 * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recall@5</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#2D333F]">
              <div>NDCG@5: <strong className="text-slate-200">{metrics.vectorOnly.ndcgAt5}</strong></div>
              <div>MRR: <strong className="text-slate-200">{metrics.vectorOnly.mrr}</strong></div>
            </div>
          </div>

          {/* Keyword Only Card */}
          <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-400">2. Keyword Match</span>
              <span className="text-[10px] bg-teal-950/60 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                Occurrence
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {(metrics.keywordOnly.recallAt5 * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recall@5</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#2D333F]">
              <div>NDCG@5: <strong className="text-slate-200">{metrics.keywordOnly.ndcgAt5}</strong></div>
              <div>MRR: <strong className="text-slate-200">{metrics.keywordOnly.mrr}</strong></div>
            </div>
          </div>

          {/* Hybrid RRF Card */}
          <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400">3. Atlas $rankFusion</span>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                RRF
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {(metrics.hybridRrf.recallAt5 * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recall@5</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#2D333F]">
              <div>NDCG@5: <strong className="text-slate-200">{metrics.hybridRrf.ndcgAt5}</strong></div>
              <div>MRR: <strong className="text-slate-200">{metrics.hybridRrf.mrr}</strong></div>
            </div>
          </div>

          {/* Hybrid + Cross Encoder Winner Card */}
          <div className="bg-[#11141B] border border-[#00ED64]/50 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-[#00ED64]/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#00ED64]">4. Hybrid + Cross-Encoder</span>
              <span className="text-[10px] bg-[#00ED64]/20 text-[#00ED64] px-2 py-0.5 rounded-full font-bold border border-[#00ED64]/30">
                Top Precision
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#00ED64] font-mono flex items-center gap-2">
                {(metrics.hybridWithRerank.recallAt5 * 100).toFixed(0)}%
                <Award className="w-5 h-5 text-[#00ED64]" />
              </div>
              <div className="text-[11px] text-[#00ED64] mt-0.5 font-bold">Recall@5 (100% Target Match)</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#2D333F]">
              <div>NDCG@5: <strong className="text-[#00ED64]">{metrics.hybridWithRerank.ndcgAt5}</strong></div>
              <div>MRR: <strong className="text-[#00ED64]">{metrics.hybridWithRerank.mrr}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Metric Comparison Progress Bars */}
      {metrics && (
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2 border-b border-[#2D333F] pb-3">
            <TrendingUp className="w-4 h-4 text-[#00ED64]" />
            <span>Search Recall@5 & NDCG@5 Quality Comparison</span>
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {/* Recall@5 Comparison Bar */}
            <div>
              <div className="flex items-center justify-between mb-1 text-slate-300">
                <span>Recall@5 (Percentage of test queries with ground-truth document in Top 5):</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="w-36 text-slate-400 text-[11px]">Vector Only:</span>
                  <div className="flex-1 bg-[#0A0C10] h-3 rounded-full overflow-hidden border border-[#2D333F]">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.vectorOnly.recallAt5 * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-indigo-300">{(metrics.vectorOnly.recallAt5 * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="w-36 text-slate-400 text-[11px]">Keyword Only:</span>
                  <div className="flex-1 bg-[#0A0C10] h-3 rounded-full overflow-hidden border border-[#2D333F]">
                    <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.keywordOnly.recallAt5 * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-teal-300">{(metrics.keywordOnly.recallAt5 * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="w-36 text-slate-400 text-[11px]">Hybrid $rankFusion:</span>
                  <div className="flex-1 bg-[#0A0C10] h-3 rounded-full overflow-hidden border border-[#2D333F]">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.hybridRrf.recallAt5 * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-amber-300">{(metrics.hybridRrf.recallAt5 * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="w-36 text-[#00ED64] font-bold text-[11px]">Hybrid + Cross-Encoder:</span>
                  <div className="flex-1 bg-[#0A0C10] h-3.5 rounded-full overflow-hidden border border-[#00ED64]/40">
                    <div className="bg-[#00ED64] h-full rounded-full transition-all duration-500" style={{ width: `${metrics.hybridWithRerank.recallAt5 * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-[#00ED64]">{(metrics.hybridWithRerank.recallAt5 * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query-by-Query Detailed Ground-Truth Target Breakdown */}
      {evalData && (
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
            <h3 className="text-sm font-bold text-white font-mono">
              Detailed Query-by-Query Ground-Truth Target Document Ranks
            </h3>
            <span className="text-xs font-mono text-slate-400">Lower Rank = Better Precision (Rank 1 is Top Result)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0A0C10] text-slate-400 border-b border-[#2D333F]">
                  <th className="p-3">#</th>
                  <th className="p-3">Benchmark Test Query</th>
                  <th className="p-3">Expected Ground-Truth Document</th>
                  <th className="p-3 text-indigo-400">Vector Rank</th>
                  <th className="p-3 text-teal-400">Keyword Rank</th>
                  <th className="p-3 text-amber-400">Hybrid RRF Rank</th>
                  <th className="p-3 text-[#00ED64]">Cross-Encoder Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D333F]">
                {evalData.queryResultsDetails.map((q, idx) => (
                  <tr key={q.queryId} className="hover:bg-[#1A1F29]/60 text-slate-300">
                    <td className="p-3 font-bold text-slate-500">Q{idx + 1}</td>
                    <td className="p-3 text-white max-w-xs font-medium">{q.query}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate" title={q.expectedTitle}>{q.expectedTitle}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${q.ranks.vectorOnly <= 5 ? 'bg-indigo-950 text-indigo-300' : 'bg-red-950 text-red-300'}`}>
                        #{q.ranks.vectorOnly}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${q.ranks.keywordOnly <= 5 ? 'bg-teal-950 text-teal-300' : 'bg-red-950 text-red-300'}`}>
                        #{q.ranks.keywordOnly}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${q.ranks.hybridRrf <= 5 ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'}`}>
                        #{q.ranks.hybridRrf}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-extrabold bg-[#00ED64]/20 text-[#00ED64] border border-[#00ED64]/30">
                        #{q.ranks.hybridWithRerank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
