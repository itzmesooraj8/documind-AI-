# DocuMind AI — Event-Driven Hybrid Intelligence Search Architecture

> **Production-grade MERN + Python FastAPI hybrid search engine powered by MongoDB Atlas v8.0 `$rankFusion`, Sentence Transformers (`all-MiniLM-L6-v2`), Cross-Encoder Re-Ranking (`ms-marco-MiniLM-L-6-v2`), and Gemini AI Grounded Synthesis (`gemini-3.6-flash`).**

Developed in collaboration with **SmartBridge**.

---

## 🌟 Executive Summary & Problem Statement

Enterprise search applications frequently fail due to the trade-offs of single-modality retrieval engines:
- **Keyword Search (BM25)** catches exact model numbers, acronyms, and product IDs, but completely misses semantic intent and context.
- **Vector Search (k-NN)** captures conceptual meaning, but struggles with exact term matching and specific technical codes.

**DocuMind AI** bridges this gap by unifying dense vector similarity and full-text keyword relevance at the database layer using **MongoDB Atlas v8.0 native `$rankFusion` aggregation**. It pairs initial database-level candidate retrieval with a high-precision Python Cross-Encoder attention re-ranking stage and grounds answers using Gemini AI with explicit inline citations.

---

## 🏗️ End-to-End System Architecture

```text
[ User Query ]
       │
       ▼
[ Express Node.js API Gateway (JWT Authentication & RBAC) ]
       │
       ├──> [ Python FastAPI ML Microservice (Port 8000) ]
       │      ├── sentence-transformers/all-MiniLM-L6-v2 (384-dim Embeddings)
       │      └── cross-encoder/ms-marco-MiniLM-L-6-v2 (Attention Logit Re-Scoring)
       │
       ▼
[ MongoDB Atlas v8.0 $rankFusion Aggregation Engine ]
       ├── $vectorSearch (HNSW Vector Index / Cosine Similarity)
       └── $search (Atlas Lucene Full-Text BM25 Index)
       │
       ▼
[ Candidate Re-Ranking Stage (Cross-Encoder Attention Logits) ]
       │
       ▼
[ Gemini 3.6 Flash Grounded Answer Generator ] ──> Inline Citations [Doc 1], [Doc 2]
       │
       ▼
[ Diagnostic Lens & 2D Spatial Projection (x: BM25, y: Vector Similarity) ]
```

---

## 🔥 Key Differentiators & Features

### 1. MongoDB Atlas v8.0 `$rankFusion` Native Hybrid Engine
Combines `$vectorSearch` and `$search` pipelines directly within MongoDB Atlas without requiring custom application-level normalization algorithms. When running offline, DocuMind AI gracefully degrades to an in-memory Reciprocal Rank Fusion (RRF) algorithm ($k=60$).

### 2. Diagnostic Lens & 2D Projection Scatter Plot
Visually projects search results onto a 2D interactive canvas:
- **X-Axis**: Keyword / BM25 Relevance Score
- **Y-Axis**: Dense Vector Cosine Similarity
Allows engineers and judges to visually inspect why candidate documents scored high in vector space vs keyword space.

### 3. Self-Healing Index Integrity Monitor
Tracks SHA-256 content hashes for every document. If raw text is modified out-of-band without regenerating its embedding vector, the system flags the document as **Stale / Out of Sync**. An automated Atlas Database Trigger webhook dispatches a re-embedding worker to repair index integrity on demand.

### 4. Search Quality Lab & Benchmark Suite
Provides a built-in evaluation laboratory that executes automated test suites across 4 search strategies:
- **Vector Search Only**
- **Keyword Search Only**
- **Hybrid RRF**
- **Hybrid RRF + Cross-Encoder Re-Ranking**

Measures precision metrics in real time: **Recall@5**, **NDCG@5**, and **Mean Reciprocal Rank (MRR)**.

### 5. Gemini AI Grounded Answers
Synthesizes concise, executive-level summaries based **only** on top retrieved search candidates, with strict inline citations (`[Doc 1]`, `[Doc 2]`) to eliminate hallucinations.

---

## ⚡ Quick Start & Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+) with `uvicorn` and `fastapi` installed
- MongoDB Atlas Cluster (v8.0+)

### 1. Environment Configuration
Create a `.env` file in the root directory:

```env
MONGODB_URI="mongodb+srv://brokeinside06_db_user:sooraj2006@hackathon.osjnfin.mongodb.net/documind?retryWrites=true&w=majority"
PYTHON_SERVICE_URL="http://localhost:8000"
JWT_SECRET="documind_enterprise_jwt_secret_key_2026_prod_secure"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 2. MongoDB Atlas Search Index Definitions

Create the following indexes in your MongoDB Atlas cluster under database `documind_db` and collection `documents`:

#### **Vector Search Index (`vector_index`)**
```json
{
  "fields": [
    {
      "numDimensions": 384,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

#### **Atlas Search Index (`default`)**
```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "title": { "type": "string" },
      "content": { "type": "string" }
    }
  }
}
```

### 3. Running the Stack

Install Node dependencies and start both microservices in parallel:

```bash
npm install
npm run dev:all
```

- **Express Server**: `http://localhost:3000`
- **Python ML Service**: `http://localhost:8000`

---

## 🛡️ Role-Based Access Control (RBAC)

- **User Role**: Full access to Live Hybrid Search, Diagnostic Lens, Search Quality Lab, and Query Logs.
- **Admin Role**: Unlocks Document Ingestion, Batch Index Repair, and Stale Index Corruption Simulation.
  - Demo Admin Credentials: `admin@documind.ai` / `admin123`

---

## 📄 License & Acknowledgments

This project is licensed under the [MIT License](LICENSE).

Developed in collaboration with **SmartBridge**.
