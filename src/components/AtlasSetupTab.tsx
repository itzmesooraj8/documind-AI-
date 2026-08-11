import React, { useState } from 'react';
import { Database, Code, Check, Copy, ExternalLink, ShieldCheck, Zap, Layers, Sparkles, Server } from 'lucide-react';

export const AtlasSetupTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [copiedTrigger, setCopiedTrigger] = useState(false);

  const vectorIndexJson = `{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}`;

  const triggerJs = `exports = async function(changeEvent) {
  const doc = changeEvent.fullDocument;
  if (!doc || !doc.content) return;

  // Triggered on collection INSERT or UPDATE when content is modified
  const serviceUrl = "https://your-api-domain.com/api/webhooks/atlas-trigger";
  
  const response = await context.http.post({
    url: serviceUrl,
    body: JSON.stringify({
      eventType: changeEvent.operationType,
      documentId: doc._id.toString(),
      documentTitle: doc.title,
      content: doc.content
    }),
    headers: { "Content-Type": ["application/json"] }
  });
  
  return response;
};`;

  const copyToClipboard = (text: string, isTrigger: boolean) => {
    navigator.clipboard.writeText(text);
    if (isTrigger) {
      setCopiedTrigger(true);
      setTimeout(() => setCopiedTrigger(false), 2000);
    } else {
      setCopiedIndex(true);
      setTimeout(() => setCopiedIndex(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Header Bento Banner */}
      <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#00ED64]/10 border border-[#00ED64]/30 rounded-xl text-[#00ED64]">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">MongoDB Atlas Setup & Deployment Instructions</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Step-by-step index definitions and database trigger JS scripts to connect a real MongoDB Atlas cluster to DocuMind AI.
          </p>
        </div>

        <a
          href="https://cloud.mongodb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-[#00ED64] hover:bg-[#00ED64]/90 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-[#00ED64]/20 self-start md:self-auto"
        >
          <span>Open MongoDB Atlas Console</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
        {/* 1. Vector Search Index Definition */}
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#00ED64]" />
              <h3 className="text-sm font-bold text-white">1. Atlas Vector Index Definition</h3>
            </div>
            <button
              onClick={() => copyToClipboard(vectorIndexJson, false)}
              className="px-2.5 py-1 bg-[#1A1F29] border border-[#2D333F] hover:border-[#00ED64] text-[#00ED64] rounded text-xs flex items-center space-x-1"
            >
              {copiedIndex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Create an Atlas Vector Search index named <code className="text-[#00ED64]">vector_index</code> on collection <code className="text-slate-200">documind_db.documents</code> for 384-dimensional vectors using Cosine similarity.
          </p>

          <pre className="bg-[#0A0C10] border border-[#2D333F] p-4 rounded-xl text-xs text-emerald-300 overflow-x-auto leading-relaxed">
            {vectorIndexJson}
          </pre>
        </div>

        {/* 2. Atlas Database Trigger Function */}
        <div className="bg-[#11141B] border border-[#2D333F] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D333F] pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#00ED64]" />
              <h3 className="text-sm font-bold text-white">2. Atlas Database Trigger Script</h3>
            </div>
            <button
              onClick={() => copyToClipboard(triggerJs, true)}
              className="px-2.5 py-1 bg-[#1A1F29] border border-[#2D333F] hover:border-[#00ED64] text-[#00ED64] rounded text-xs flex items-center space-x-1"
            >
              {copiedTrigger ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTrigger ? 'Copied' : 'Copy JS'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Add an Atlas Database Trigger listening to <code className="text-[#00ED64]">INSERT</code> and <code className="text-[#00ED64]">UPDATE</code> events on collection <code className="text-slate-200">documents</code> targeting the webhook endpoint.
          </p>

          <pre className="bg-[#0A0C10] border border-[#2D333F] p-4 rounded-xl text-xs text-indigo-300 overflow-x-auto leading-relaxed max-h-[220px]">
            {triggerJs}
          </pre>
        </div>
      </div>
    </div>
  );
};
