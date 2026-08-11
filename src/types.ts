/**
 * DocuMind AI - Core Application Type Definitions
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface DocumentItem {
  _id: string;
  title: string;
  content: string;
  category: 'AI/ML' | 'MongoDB Atlas' | 'System Architecture' | 'Vector Search' | 'Database Triggers' | 'Security & Auth';
  embedding?: number[];
  contentHash?: string;
  embeddingModel?: string;
  embeddingDimension?: number;
  updatedAt: string;
  status: 'pending' | 'embedding_generated' | 'indexed' | 'stale' | 'failed' | 'repairing';
  lastRepairedAt?: string;
  retryCount?: number;
  lastError?: string;
  chunkCount?: number;
  source?: string;
}

export type SearchMode = 'hybrid' | 'vector' | 'keyword';

export interface SearchCandidate {
  _id: string;
  title: string;
  content: string;
  category: string;
  score: number;
  vectorScore?: number;
  keywordScore?: number;
  keywordScoreName?: string;
  rankFusionScore?: number;
  rerankScore?: number;
  rerankLogit?: number;
  vectorSimilarity?: number;
  matchedHighlights?: string[];
  embedding?: number[];
  x2D?: number; // 2D projection x coordinate (0 to 100)
  y2D?: number; // 2D projection y coordinate (0 to 100)
  matchType?: 'vector' | 'keyword' | 'both' | 'reranked';
}

export interface ExecutionTiming {
  embeddingMs: number;
  atlasVectorMs: number;
  atlasSearchMs: number;
  rankFusionMs: number;
  rerankMs: number;
  totalMs: number;
}

export interface PipelineStageInfo {
  stage: string;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  candidateCount?: number;
  timeMs: number;
}

export interface SearchDiagnostics {
  rawQuery: string;
  mode: SearchMode;
  engineName: string;
  isAtlasNative: boolean;
  queryVectorSample: number[];
  executionTiming: ExecutionTiming;
  pipelineStages: PipelineStageInfo[];
  candidateCountTotal: number;
  vectorCandidateCount: number;
  keywordCandidateCount: number;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  results: SearchCandidate[];
  diagnostics: SearchDiagnostics;
  groundedSynthesis?: {
    summary: string;
    citations: Array<{ docId: string; title: string; snippet: string }>;
  };
}

export interface TriggerLog {
  id: string;
  timestamp: string;
  documentId: string;
  documentTitle: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'REINDEX_ALL' | 'INDEX_REPAIR' | 'STALE_DETECTED';
  status: 'PENDING' | 'EMBEDDING_GENERATED' | 'INDEXED' | 'FAILED' | 'REPAIRED';
  durationMs: number;
  details: string;
  hashVerified?: boolean;
  isRealAtlasTrigger?: boolean;
}

export interface QueryLog {
  id: string;
  timestamp: string;
  query: string;
  mode: SearchMode;
  topResultTitle: string;
  topResultScore: number;
  latencyMs: number;
  resultCount: number;
  wasReranked: boolean;
  userEmail?: string;
}

export interface ServerStatus {
  mongodbConnected: boolean;
  pythonServiceOnline: boolean;
  atlasIndexesActive: boolean;
  activeDocumentsCount: number;
  vectorDimension: number;
  authSystemActive: boolean;
  indexIntegrityStatus: 'healthy' | 'stale_detected' | 'repairing';
  staleDocumentCount: number;
}
