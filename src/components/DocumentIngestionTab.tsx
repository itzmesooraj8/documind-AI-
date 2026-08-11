import React, { useState, useEffect } from 'react';
import { FileUp, Zap, RefreshCw, Trash2, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Plus, FileText, Database, ShieldAlert, Sparkles, Check, ArrowRight, UploadCloud } from 'lucide-react';
import { DocumentItem, TriggerLog, User } from '../types';

interface DocumentIngestionTabProps {
  onDocumentAdded?: () => void;
  currentUser: User | null;
  authToken: string | null;
  onOpenAuthModal: () => void;
}

export const DocumentIngestionTab: React.FC<DocumentIngestionTabProps> = ({
  onDocumentAdded,
  currentUser,
  authToken,
  onOpenAuthModal
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [triggerLogs, setTriggerLogs] = useState<TriggerLog[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);

  // File Drop / Preview Confirmation State
  const [dragOver, setDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState<{
    fileName: string;
    fileSize: number;
    title: string;
    content: string;
    category: DocumentItem['category'];
    wordCount: number;
    charCount: number;
  } | null>(null);

  // Manual Compose State
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualCategory, setManualCategory] = useState<DocumentItem['category']>('MongoDB Atlas');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error('Fetch docs error:', e);
    }
  };

  const fetchTriggerLogs = async () => {
    try {
      const res = await fetch('/api/trigger-logs', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTriggerLogs(data.triggerLogs || []);
      }
    } catch (e) {
      console.error('Fetch trigger logs error:', e);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchTriggerLogs();

    const interval = setInterval(() => {
      fetchDocuments();
      fetchTriggerLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;

      setStagedFile({
        fileName: file.name,
        fileSize: file.size,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
        content: text,
        category: 'MongoDB Atlas',
        wordCount: words,
        charCount: text.length
      });
    };
    reader.readAsText(file);
  };

  // Confirm and ingest staged document
  const handleConfirmIngest = async () => {
    if (!stagedFile || !authToken) return;

    if (currentUser?.role !== 'admin') {
      alert('Administrative role ("admin") is required to ingest documents.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: stagedFile.title,
          content: stagedFile.content,
          category: stagedFile.category,
          source: stagedFile.fileName
        })
      });

      if (res.ok) {
        setStagedFile(null);
        await fetchDocuments();
        await fetchTriggerLogs();
        if (onDocumentAdded) onDocumentAdded();
      } else {
        const data = await res.json();
        alert(`Ingestion Error: ${data.error}`);
      }
    } catch (e: any) {
      console.error('Ingest error:', e);
    } finally {
      setIsUploading(false);
    }
  };

  // Manual Ingest
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent || !authToken) return;

    if (currentUser?.role !== 'admin') {
      alert('Administrative role ("admin") is required to ingest documents.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: manualTitle,
          content: manualContent,
          category: manualCategory,
          source: 'manual-entry.txt'
        })
      });

      if (res.ok) {
        setManualTitle('');
        setManualContent('');
        await fetchDocuments();
        await fetchTriggerLogs();
        if (onDocumentAdded) onDocumentAdded();
      }
    } catch (e) {
      console.error('Create doc error:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!authToken || currentUser?.role !== 'admin') return;
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      await fetchDocuments();
      await fetchTriggerLogs();
    } catch (e) {
      console.error('Delete doc error:', e);
    }
  };

  // Repair single stale index
  const handleRepairDoc = async (id: string) => {
    if (!authToken || currentUser?.role !== 'admin') return;
    setRepairingId(id);
    try {
      await fetch(`/api/documents/${id}/repair`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      await fetchDocuments();
      await fetchTriggerLogs();
    } catch (e) {
      console.error('Repair error:', e);
    } finally {
      setRepairingId(null);
    }
  };

  // Corrupt single document to simulate stale index hash mismatch
  const handleCorruptDoc = async (id: string) => {
    if (!authToken || currentUser?.role !== 'admin') return;
    try {
      await fetch(`/api/documents/${id}/corrupt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      await fetchDocuments();
      await fetchTriggerLogs();
    } catch (e) {
      console.error('Corrupt error:', e);
    }
  };

  const handleBatchReindex = async () => {
    if (!authToken || currentUser?.role !== 'admin') return;
    setIsReindexing(true);
    try {
      await fetch('/api/reindex-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      await fetchDocuments();
      await fetchTriggerLogs();
    } catch (e) {
      console.error('Reindex error:', e);
    } finally {
      setIsReindexing(false);
    }
  };

  const staleDocsCount = documents.filter(d => d.status === 'stale' || d.status === 'failed').length;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Header Bento Banner */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#00ED64]/10 border border-[#00ED64]/30 rounded-xl text-[#00ED64]">
              <FileUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Document Ingestion & Index Integrity Monitor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Drag and drop enterprise documents. API Webhook Event Worker target <code className="text-[#00ED64] font-mono bg-[#1A1F29] px-1.5 py-0.5 rounded border border-[#2D333F]">/api/webhooks/atlas-trigger</code> to generate 384-dim vector embeddings and verify SHA-256 index integrity hashes.
          </p>
        </div>

        {/* Batch Integrity Repair Action Button */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          {currentUser?.role === 'admin' ? (
            <button
              onClick={handleBatchReindex}
              disabled={isReindexing}
              className="px-4 py-2.5 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-[#00ED64]/20"
            >
              <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
              <span>{isReindexing ? 'Repairing Index Hashes...' : 'Repair All Index Hashes'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 bg-[#1A1F29] border border-[#2D333F] text-[#00ED64] font-bold text-xs rounded-xl transition-all flex items-center space-x-2 hover:border-[#00ED64]/40"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Sign In as Admin to Ingest/Repair</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Bento: Drag & Drop Ingestion Zone + Preview Workflow */}
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-[#2D333F] pb-3">
            <Plus className="w-4 h-4 text-[#00ED64]" />
            <span>Document Drag & Drop Ingestion</span>
          </h3>

          {/* Drag and Drop Zone */}
          {!stagedFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#00ED64] bg-[#00ED64]/10'
                  : 'border-[#2D333F] bg-[#0A0C10] hover:border-[#00ED64]/50'
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                accept=".pdf,.txt,.docx,.json,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1F29] border border-[#2D333F] mx-auto flex items-center justify-center text-[#00ED64]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Drag & drop files here</div>
                  <div className="text-[11px] text-slate-400 mt-1">Supports PDF, TXT, DOCX, JSON & Markdown</div>
                </div>
                <div className="inline-block px-3 py-1 bg-[#1A1F29] border border-[#2D333F] rounded-lg text-[11px] font-mono text-[#00ED64]">
                  Browse File
                </div>
              </label>
            </div>
          ) : (
            /* Staged File Content Preview & Explicit Ingest Confirmation Panel */
            <div className="bg-[#0A0C10] border border-[#00ED64]/40 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2D333F] pb-2">
                <span className="text-xs font-mono font-bold text-[#00ED64] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Staged Document Preview
                </span>
                <button
                  onClick={() => setStagedFile(null)}
                  className="text-[11px] font-mono text-slate-400 hover:text-white"
                >
                  Cancel / Clear
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 text-[11px]">Title:</label>
                  <input
                    type="text"
                    value={stagedFile.title}
                    onChange={(e) => setStagedFile({ ...stagedFile, title: e.target.value })}
                    className="w-full bg-[#11141B] border border-[#2D333F] rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-[#00ED64] focus:outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px]">Category:</label>
                  <select
                    value={stagedFile.category}
                    onChange={(e) => setStagedFile({ ...stagedFile, category: e.target.value as any })}
                    className="w-full bg-[#11141B] border border-[#2D333F] rounded-lg px-2.5 py-1.5 text-white focus:border-[#00ED64] focus:outline-none mt-1"
                  >
                    <option value="MongoDB Atlas">MongoDB Atlas</option>
                    <option value="Vector Search">Vector Search</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Database Triggers">Database Triggers</option>
                    <option value="System Architecture">System Architecture</option>
                    <option value="Security & Auth">Security & Auth</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-[#11141B] p-2 rounded-lg border border-[#2D333F]">
                  <div>Words: <span className="text-white font-bold">{stagedFile.wordCount}</span></div>
                  <div>Chars: <span className="text-white font-bold">{stagedFile.charCount}</span></div>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px]">Content Snippet Preview:</label>
                  <div className="bg-[#11141B] p-2.5 rounded-lg border border-[#2D333F] text-[11px] font-sans text-slate-300 max-h-32 overflow-y-auto leading-relaxed mt-1">
                    {stagedFile.content.substring(0, 500)}
                    {stagedFile.content.length > 500 ? '...' : ''}
                  </div>
                </div>

                {/* Explicit Ingestion Confirmation Button */}
                <button
                  type="button"
                  onClick={handleConfirmIngest}
                  disabled={isUploading}
                  className="w-full py-2.5 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-[#00ED64]/20"
                >
                  {isUploading ? (
                    <span>Processing & Embedding...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Confirm & Ingest Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Manual Entry Collapsible Form */}
          <details className="bg-[#0A0C10] border border-[#2D333F] rounded-xl p-3 text-xs font-mono">
            <summary className="cursor-pointer font-bold text-slate-300 hover:text-[#00ED64] flex items-center justify-between">
              <span>Or compose manual document text</span>
              <Plus className="w-4 h-4" />
            </summary>

            <form onSubmit={handleManualIngest} className="space-y-3 mt-3 pt-3 border-t border-[#2D333F]">
              <div>
                <label className="block text-slate-400 mb-1">Title:</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. MongoDB Atlas $rankFusion Integration Specs"
                  className="w-full bg-[#11141B] border border-[#2D333F] rounded-lg px-3 py-1.5 text-white focus:border-[#00ED64] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Content:</label>
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={4}
                  placeholder="Paste documentation text..."
                  className="w-full bg-[#11141B] border border-[#2D333F] rounded-lg p-2.5 text-white focus:border-[#00ED64] focus:outline-none text-xs font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-[#1A1F29] hover:bg-[#2D333F] border border-[#2D333F] text-[#00ED64] font-bold rounded-lg transition-all"
              >
                Submit Manual Document
              </button>
            </form>
          </details>
        </div>

        {/* Right Bento: Index Integrity Monitor & Live Trigger Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Index Integrity Monitor Card */}
          <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#00ED64]" />
                <h3 className="text-base font-bold text-white">Index Integrity Monitor</h3>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Status:</span>
                {staleDocsCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{staleDocsCount} Stale Vector(s)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-[#00ED64] border border-emerald-500/30 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All Hashes Verified</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Integrity Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#0A0C10] text-slate-400 border-b border-[#2D333F]">
                    <th className="p-3">Document Title</th>
                    <th className="p-3">SHA-256 Hash</th>
                    <th className="p-3">Model & Dim</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Self-Healing Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D333F]">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-[#1A1F29]/60 text-slate-300">
                      <td className="p-3 font-semibold text-white max-w-xs truncate">{doc.title}</td>
                      <td className="p-3 text-[11px] text-slate-400 truncate max-w-[120px]" title={doc.contentHash}>
                        {doc.contentHash ? `${doc.contentHash.substring(0, 12)}...` : 'N/A'}
                      </td>
                      <td className="p-3 text-indigo-300 text-[11px]">all-MiniLM (384-d)</td>
                      <td className="p-3">
                        {doc.status === 'indexed' ? (
                          <span className="px-2 py-0.5 rounded bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 font-bold">
                            Indexed
                          </span>
                        ) : doc.status === 'stale' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                            Stale / Out-of-sync
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                            {doc.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 flex items-center space-x-2">
                        {/* Auto-repair button */}
                        {doc.status === 'stale' && (
                          <button
                            onClick={() => handleRepairDoc(doc._id)}
                            disabled={repairingId === doc._id}
                            className="px-2.5 py-1 bg-[#00ED64] text-slate-950 font-bold rounded text-[10px] hover:bg-[#00ED64]/90 flex items-center space-x-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${repairingId === doc._id ? 'animate-spin' : ''}`} />
                            <span>Repair Index</span>
                          </button>
                        )}

                        {/* Corrupt button (Demo simulation) */}
                        <button
                          onClick={() => handleCorruptDoc(doc._id)}
                          className="px-2 py-1 bg-[#1A1F29] border border-[#2D333F] text-slate-400 hover:text-amber-300 rounded text-[10px]"
                          title="Simulate direct text edit without vector update to test hash detection"
                        >
                          Simulate Stale
                        </button>

                        <button
                          onClick={() => handleDeleteDoc(doc._id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Webhook Event Feed */}
          <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#00ED64]" />
                <h3 className="text-base font-bold text-white">Live Event Worker Log Feed</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
                <span>Listening on /api/webhooks/atlas-trigger</span>
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {triggerLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#0A0C10] border border-[#2D333F] rounded-xl p-3 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ED64]/20 text-[#00ED64] border border-[#00ED64]/30">
                        {log.eventType}
                      </span>
                      <span className="text-slate-200 font-bold truncate max-w-xs">{log.documentTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{log.details}</div>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <span className="text-[#00ED64] font-bold">{log.durationMs}ms</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
