import React, { useState, useEffect } from 'react';
import { History, Download, RefreshCw, Activity, Search, ShieldCheck, Zap, User as UserIcon } from 'lucide-react';
import { QueryLog } from '../types';

interface QueryLogsTabProps {
  authToken: string | null;
}

export const QueryLogsTab: React.FC<QueryLogsTabProps> = ({ authToken }) => {
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQueryLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/query-logs', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setQueryLogs(data.queryLogs || []);
      }
    } catch (e) {
      console.error('Fetch query logs error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueryLogs();
  }, [authToken]);

  const handleExportCsv = () => {
    window.open('/api/export-logs', '_blank');
  };

  const avgLatency = queryLogs.length > 0
    ? Math.round(queryLogs.reduce((acc, curr) => acc + curr.latencyMs, 0) / queryLogs.length)
    : 0;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Header Bento Banner */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#00ED64]/10 border border-[#00ED64]/30 rounded-xl text-[#00ED64]">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Search Query Logs & Telemetry Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Audit query latencies, top search matches, mode distributions, and user authentication emails.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto font-mono">
          <button
            onClick={fetchQueryLogs}
            disabled={isLoading}
            className="p-2.5 bg-[#1A1F29] border border-[#2D333F] hover:border-[#00ED64] text-[#00ED64] rounded-xl transition-all"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-[#00ED64]/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Telemetry CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-[#11141B] border border-[#2D333F] p-5 rounded-2xl">
          <div className="text-xs text-slate-400">Total Logged Queries</div>
          <div className="text-2xl font-bold text-white mt-1">{queryLogs.length}</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-5 rounded-2xl">
          <div className="text-xs text-slate-400">Average Execution Latency</div>
          <div className="text-2xl font-bold text-[#00ED64] mt-1">{avgLatency} ms</div>
        </div>

        <div className="bg-[#11141B] border border-[#2D333F] p-5 rounded-2xl">
          <div className="text-xs text-slate-400">Pipeline Re-Ranking Rate</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">100%</div>
        </div>
      </div>

      {/* Query Logs Table */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
          <h3 className="text-sm font-bold text-white">Execution Logs Directory</h3>
          <span className="text-slate-400 text-[11px]">Real-time telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0A0C10] text-slate-400 border-b border-[#2D333F]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Query</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Top Result Title</th>
                <th className="p-3">Score</th>
                <th className="p-3">Latency</th>
                <th className="p-3">User Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D333F]">
              {queryLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No query execution logs recorded yet. Run a search query in the Live Search console!
                  </td>
                </tr>
              ) : (
                queryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A1F29]/60 text-slate-300">
                    <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold text-white max-w-xs truncate">{log.query}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 uppercase font-bold">
                        {log.mode}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">{log.topResultTitle}</td>
                    <td className="p-3 font-bold text-[#00ED64]">{log.topResultScore.toFixed(4)}</td>
                    <td className="p-3 text-indigo-300 font-bold">{log.latencyMs} ms</td>
                    <td className="p-3 text-slate-400 text-[11px]">{log.userEmail || 'anonymous'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
