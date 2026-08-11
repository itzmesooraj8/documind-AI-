import { DocumentItem } from '../types';

// Simple deterministic hash generator for sample documents
function computeSimpleHash(text: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 16777619);
    hash2 ^= char;
    hash2 = Math.imul(hash2, 33554435);
  }
  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `sha256_${h1}${h2}`;
}

// Deterministic 384-dimensional normalized vector generator for sample data
function createSampleVector(text: string, category: string): number[] {
  const vec = new Array(384).fill(0);
  const textLower = text.toLowerCase();
  
  // Categorical frequency distribution bases
  const catSeed = category === 'MongoDB Atlas' ? 0.8 :
                  category === 'Vector Search' ? 0.6 :
                  category === 'AI/ML' ? 0.4 :
                  category === 'Database Triggers' ? 0.2 : 0.5;

  for (let i = 0; i < 384; i++) {
    const charCode = textLower.charCodeAt(i % textLower.length) || 65;
    const wave = Math.sin((i + 1) * 0.15) * Math.cos(charCode * 0.2) + catSeed * 0.25;
    vec[i] = wave;
  }

  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => Number((v / mag).toFixed(6)));
}

const doc1Text = 'MongoDB Atlas v8.0 introduces $rankFusion for native reciprocal rank fusion across $vectorSearch and full-text $search pipelines. $rankFusion combines vector similarity cosine distance and BM25 keyword relevance into a unified score without requiring custom application-level normalization.';
const doc2Text = 'Atlas Vector Search enables k-NN cosine distance indexing for 384-dimensional dense embeddings. Defining vector_index with similarity: cosine allows dense semantic queries to execute with sub-10ms latency at high scale using HNSW index graphs.';
const doc3Text = 'While bi-encoder embeddings generate fast candidate retrieval sets, Cross-Encoder models like cross-encoder/ms-marco-MiniLM-L-6-v2 process query and document text simultaneously to compute exact attention logits and dramatically boost precision for long-tail queries.';
const doc4Text = 'Atlas Database Triggers monitor collection INSERT and UPDATE events. When a document is modified without an embedding vector, the event triggers an HTTP webhook targeting /api/webhooks/atlas-trigger, which requests vectors from Python FastAPI and updates MongoDB using $set.';
const doc5Text = 'DocuMind AI combines Express Node.js backend controllers, Python FastAPI sentence transformer microservices, MongoDB Atlas $rankFusion aggregation, and Gemini AI search grounding into a resilient event-driven search pipeline with real-time diagnostic telemetry.';
const doc6Text = 'Ensuring strict TLS 1.3 encryption in transit, connection pooling with retryable writes, and role-based access control (RBAC) across Express middleware API endpoints and Python ML worker microservices.';

export const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    _id: 'doc_atlas_rankfusion_01',
    title: 'MongoDB Atlas v8.0 $rankFusion Native Hybrid Search Guide',
    content: doc1Text,
    category: 'MongoDB Atlas',
    contentHash: computeSimpleHash(doc1Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 3,
    source: 'atlas-docs-v8.pdf',
    embedding: createSampleVector(doc1Text, 'MongoDB Atlas')
  },
  {
    _id: 'doc_vector_index_02',
    title: 'Configuring Vector Index and Cosine Similarity in Atlas Vector Search',
    content: doc2Text,
    category: 'Vector Search',
    contentHash: computeSimpleHash(doc2Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 2,
    source: 'vector-search-specs.md',
    embedding: createSampleVector(doc2Text, 'Vector Search')
  },
  {
    _id: 'doc_cross_encoder_03',
    title: 'Python Cross-Encoder Re-Ranking Pipeline with ms-marco-MiniLM',
    content: doc3Text,
    category: 'AI/ML',
    contentHash: computeSimpleHash(doc3Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 4,
    source: 'python-ml-pipeline.py',
    embedding: createSampleVector(doc3Text, 'AI/ML')
  },
  {
    _id: 'doc_triggers_autoembed_04',
    title: 'Automated Atlas Database Triggers for Event-Driven Embeddings',
    content: doc4Text,
    category: 'Database Triggers',
    contentHash: computeSimpleHash(doc4Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 2,
    source: 'atlas-trigger-webhook.json',
    embedding: createSampleVector(doc4Text, 'Database Triggers')
  },
  {
    _id: 'doc_hybrid_arch_05',
    title: 'Event-Driven Hybrid Intelligence Search Architecture Overview',
    content: doc5Text,
    category: 'System Architecture',
    contentHash: computeSimpleHash(doc5Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 5,
    source: 'architecture-whitepaper.pdf',
    embedding: createSampleVector(doc5Text, 'System Architecture')
  },
  {
    _id: 'doc_security_06',
    title: 'Enterprise Security, Connection Pooling and RBAC in MongoDB Atlas',
    content: doc6Text,
    category: 'Security & Auth',
    contentHash: computeSimpleHash(doc6Text),
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    status: 'indexed',
    retryCount: 0,
    chunkCount: 2,
    source: 'security-compliance.txt',
    embedding: createSampleVector(doc6Text, 'Security & Auth')
  }
];
