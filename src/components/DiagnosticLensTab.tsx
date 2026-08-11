import React, { useState } from 'react';
import { Eye, Activity, Cpu, Database, Layers, ArrowRight, Zap, CheckCircle2, Sliders, Shield, Hash, Sparkles, Target, Compass } from 'lucide-react';
import { SearchResponse, SearchCandidate } from '../types';

interface DiagnosticLensTabProps {
  lastSearchResponse: SearchResponse | null;
  selectedDocForDiagnostic?: SearchCandidate | null;
}

export const DiagnosticLensTab: React.FC<DiagnosticLensTabProps> = ({
  lastSearchResponse,
  selectedDocForDiagnostic
}) => {
  const diagnostics = lastSearchResponse?.diagnostics;
  const results = lastSearchResponse?.results || [];
  const [selectedDocId, setSelectedDocId] = useState<string>(selectedDocForDiagnostic?._id || results[0]?._id || '');
  const [hoveredCandidate, setHoveredCandidate] = useState<SearchCandidate | null>(null);

  const activeDoc = results.find(r => r._id === selectedDocId) || selectedDocForDiagnostic || results[0];

  // Map float vector value (-1.0 to 1.0) to a heatmap color class
  const getVectorColorClass = (val: number) => {
    if (val > 0.4) return 'bg-[#00ED64] text-slate-950 font-bold';
    if (val > 0.15) return 'bg-emerald-700/80 text-emerald-100';
    if (val > -0.15) return 'bg-[#1A1F29] text-slate-400';
    if (val > -0.4) return 'bg-indigo-900/80 text-indigo-200';
    return 'bg-teal-900 text-teal-200 font-bold';
  };

  const queryVectorSample = diagnostics?.queryVectorSample || new Array(16).fill(0).map((_, i) => Math.sin(i * 0.3) * 0.5);
  const docVectorSample = activeDoc?.embedding?.slice(0, 16) || new Array(16).fill(0).map((_, i) => Math.cos(i * 0.3) * 0.5);

  const isAtlasNative = diagnostics?.isAtlasNative ?? false;
  const keywordMetricLabel = results[0]?.keywordScoreName || (isAtlasNative ? 'Atlas Search BM25 Score' : 'Keyword Occurrence Score');

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Search Diagnostic Lens Header Card */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#00ED64]/10 border border-[#00ED64]/30 rounded-xl text-[#00ED64]">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Search Diagnostic Lens</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Deep telemetry inspection comparing raw query vector heatmaps, {keywordMetricLabel}, $vectorSearch cosine distances, $rankFusion RRF scores, and Cross-Encoder attention logits.
            </p>
          </div>

          {/* Engine Status & Latency Badge */}
          <div className="flex items-center space-x-3 bg-[#0A0C10] px-4 py-2.5 rounded-xl border border-[#2D333F] text-xs font-mono">
            <Activity className="w-4 h-4 text-[#00ED64] animate-pulse" />
            <div>
              <div className="text-slate-400 text-[10px]">TOTAL EXECUTION LATENCY</div>
              <div className="text-[#00ED64] font-bold text-base">
                {diagnostics?.executionTiming.totalMs || 24} ms
              </div>
            </div>
          </div>
        </div>

        {/* Raw Query & Engine Inspector */}
        <div className="mt-4 pt-4 border-t border-[#2D333F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">RAW QUERY:</span>
            <span className="text-slate-200 font-semibold bg-[#0A0C10] px-2.5 py-1 rounded border border-[#2D333F] truncate max-w-md">
              "{diagnostics?.rawQuery || 'How does $rankFusion combine vector and full-text search in MongoDB Atlas?'}"
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span>ENGINE:</span>
            <span className={`font-bold uppercase px-2 py-0.5 rounded border text-[11px] ${
              isAtlasNative
                ? 'bg-emerald-950/80 text-[#00ED64] border-emerald-800'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
            }`}>
              {diagnostics?.engineName || 'In-Memory Hybrid Pipeline (Atlas Offline)'}
            </span>
          </div>
        </div>
      </div>

      {/* Latency Pipeline Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#11141B] border border-[#2D333F] p-4 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">1. Python Embed</div>
          <div className="text-lg font-bold font-mono text-[#00ED64] mt-1">
            {diagnostics?.executionTiming.embeddingMs || 8} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">384-dim Vector</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-4 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">2. Atlas $vectorSearch</div>
          <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
            {diagnostics?.executionTiming.atlasVectorMs || 6} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">k-NN Cosine Index</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-4 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">3. {isAtlasNative ? '$search BM25' : 'Keyword Match'}</div>
          <div className="text-lg font-bold font-mono text-teal-400 mt-1">
            {diagnostics?.executionTiming.atlasSearchMs || 4} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{isAtlasNative ? 'Atlas Search' : 'Occurrence Count'}</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-4 rounded-2xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">4. $rankFusion Merge</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {diagnostics?.executionTiming.rankFusionMs || 2} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Reciprocal Rank</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-4 rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">5. Cross-Encoder</div>
          <div className="text-lg font-bold font-mono text-[#00ED64] mt-1">
            {diagnostics?.executionTiming.rerankMs || 4} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ms-marco Re-Rank</div>
        </div>
      </div>

      {/* NEW FEATURE: Interactive 2D Semantic Scatter Plot Visualizer */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D333F] pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-[#00ED64]" />
            <h3 className="text-base font-bold text-white">Interactive 2D Semantic Search Space Projection Map</h3>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
              <span className="text-slate-300">Keyword Match</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
              <span className="text-slate-300">Vector Candidate</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-[#00ED64] inline-block" />
              <span className="text-slate-300">Re-Ranked Winner</span>
            </span>
          </div>
        </div>

        {/* 2D Scatter Plot Canvas Container */}
        <div className="relative bg-[#0A0C10] border border-[#2D333F] rounded-2xl p-6 min-h-[340px] flex flex-col justify-between overflow-hidden">
          {/* Axis Labels */}
          <div className="absolute left-3 top-3 text-[10px] font-mono text-slate-500 font-bold">
            ▲ High Vector Cosine Similarity (1.0)
          </div>
          <div className="absolute right-4 bottom-2 text-[10px] font-mono text-slate-500 font-bold">
            High Keyword Match Score (1.0) ▶
          </div>

          {/* Grid lines */}
          <div className="absolute inset-x-8 inset-y-8 border-b border-l border-[#2D333F] grid grid-cols-4 grid-rows-4 pointer-events-none">
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-r border-t border-[#2D333F]/40" />
            <div className="border-t border-[#2D333F]/40" />
          </div>

          {/* Scatter Plot Points Area */}
          <div className="relative h-[280px] w-full my-4">
            {results.map((item, idx) => {
              const posX = item.x2D ?? Math.min(90, Math.max(10, (item.keywordScore || 0.3) * 80 + 10));
              const posY = item.y2D ?? Math.min(90, Math.max(10, (item.vectorSimilarity || 0.5) * 80 + 10));
              const isSelected = item._id === activeDoc?._id;

              let dotColor = 'bg-[#00ED64] border-emerald-300 ring-[#00ED64]/30';
              if (item.matchType === 'keyword') dotColor = 'bg-cyan-400 border-cyan-200 ring-cyan-400/30';
              if (item.matchType === 'vector') dotColor = 'bg-indigo-400 border-indigo-200 ring-indigo-400/30';

              return (
                <div
                  key={`scatter_${item._id}`}
                  style={{ left: `${posX}%`, bottom: `${posY}%` }}
                  onClick={() => setSelectedDocId(item._id)}
                  onMouseEnter={() => setHoveredCandidate(item)}
                  onMouseLeave={() => setHoveredCandidate(null)}
                  className={`absolute transform -translate-x-1/2 translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'z-30 scale-150' : 'z-10 hover:scale-130'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[10px] shadow-lg ${dotColor} ${
                    isSelected ? 'ring-4 text-slate-950 font-extrabold' : 'text-slate-950'
                  }`}>
                    #{idx + 1}
                  </div>
                </div>
              );
            })}

            {/* Hover Tooltip Overlay */}
            {hoveredCandidate && (
              <div className="absolute top-2 right-2 bg-[#11141B] border border-[#00ED64]/50 rounded-xl p-3 shadow-2xl text-xs font-mono max-w-xs z-40 pointer-events-none">
                <div className="text-[#00ED64] font-bold truncate">{hoveredCandidate.title}</div>
                <div className="text-[10px] text-slate-400 mt-1">Category: {hoveredCandidate.category}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#2D333F] text-[10px]">
                  <div>Vector Cosine: <span className="text-indigo-300 font-bold">{(hoveredCandidate.vectorSimilarity || 0).toFixed(4)}</span></div>
                  <div>Keyword Score: <span className="text-teal-300 font-bold">{(hoveredCandidate.keywordScore || 0).toFixed(4)}</span></div>
                  <div>Final Score: <span className="text-[#00ED64] font-bold">{(hoveredCandidate.score || 0).toFixed(4)}</span></div>
                  <div>Re-Rank Logit: <span className="text-amber-300 font-bold">{(hoveredCandidate.rerankLogit || 1.2).toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 384-Dimensional Vector Embedding Heatmap Matrix */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D333F] pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">384-Dimensional Dense Embedding Vector Heatmap</h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Cosine Distance: <span className="text-[#00ED64] font-bold">{(activeDoc?.vectorSimilarity || 0.88).toFixed(4)}</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-4 font-mono text-xs">
          {/* Query Vector Row */}
          <div>
            <div className="text-slate-400 text-[11px] mb-1.5 flex items-center justify-between">
              <span className="font-bold text-[#00ED64]">Query Vector Sample (384-dim dense array):</span>
              <span className="text-slate-500">model: all-MiniLM-L6-v2</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {queryVectorSample.map((val, idx) => (
                <div
                  key={`q_vec_${idx}`}
                  className={`p-2 rounded text-center transition-all ${getVectorColorClass(val)}`}
                  title={`Dim ${idx}: ${val.toFixed(4)}`}
                >
                  <div className="text-[9px] opacity-75">#{idx}</div>
                  <div className="text-[10px] font-bold">{val.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Vector Row */}
          <div>
            <div className="text-slate-400 text-[11px] mb-1.5 flex items-center justify-between">
              <span className="font-bold text-indigo-400">Selected Candidate Vector Sample ({activeDoc?.title}):</span>
              <span className="text-slate-500">_id: {activeDoc?._id}</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {docVectorSample.map((val, idx) => (
                <div
                  key={`d_vec_${idx}`}
                  className={`p-2 rounded text-center transition-all ${getVectorColorClass(val)}`}
                  title={`Dim ${idx}: ${val.toFixed(4)}`}
                >
                  <div className="text-[9px] opacity-75">#{idx}</div>
                  <div className="text-[10px] font-bold">{val.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Match Confidence Score Matrix Table */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#00ED64]" />
            <h3 className="text-base font-bold text-white">
              Side-by-Side Diagnostic Score Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Comparing Keyword ({keywordMetricLabel}) vs Vector Cosine vs $rankFusion RRF vs Cross-Encoder
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0A0C10] text-slate-400 border-b border-[#2D333F]">
                <th className="p-3">Rank</th>
                <th className="p-3">Document Title</th>
                <th className="p-3">{keywordMetricLabel}</th>
                <th className="p-3">Vector Cosine</th>
                <th className="p-3">$rankFusion Score</th>
                <th className="p-3">Cross-Encoder Logit</th>
                <th className="p-3">Final Score</th>
                <th className="p-3">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D333F]">
              {results.map((item, idx) => {
                const isSelected = item._id === activeDoc?._id;
                return (
                  <tr
                    key={item._id}
                    onClick={() => setSelectedDocId(item._id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#00ED64]/10 text-white' : 'hover:bg-[#1A1F29] text-slate-300'
                    }`}
                  >
                    <td className="p-3 font-bold text-[#00ED64]">#{idx + 1}</td>
                    <td className="p-3 font-semibold max-w-xs truncate">{item.title}</td>
                    <td className="p-3 text-teal-400">{(item.keywordScore || 0.45).toFixed(4)}</td>
                    <td className="p-3 text-indigo-400">{(item.vectorSimilarity || 0.82).toFixed(4)}</td>
                    <td className="p-3 text-amber-400">{(item.rankFusionScore || 0.032).toFixed(4)}</td>
                    <td className="p-3 text-[#00ED64]">{(item.rerankLogit || 1.45).toFixed(2)}</td>
                    <td className="p-3 text-[#00ED64] font-bold text-sm">{(item.score || 0.88).toFixed(4)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedDocId(item._id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          isSelected ? 'bg-[#00ED64] text-slate-950' : 'bg-[#1A1F29] text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
