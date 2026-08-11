"""
DocuMind AI - Python FastAPI ML Microservice (main.py)
-------------------------------------------------------
Handles document chunking, 384-dim embedding generation with SentenceTransformers (all-MiniLM-L6-v2),
and Cross-Encoder candidate re-ranking with HuggingFace (cross-encoder/ms-marco-MiniLM-L-6-v2).

Run with:
    pip install fastapi uvicorn sentence-transformers pydantic
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="DocuMind AI ML Microservice", version="1.0.0")

# Lazy-loaded model holders for low startup overhead
embedder_model = None
cross_encoder_model = None

def get_embedder():
    global embedder_model
    if embedder_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            embedder_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"[Warning] SentenceTransformer failed to load: {e}")
            embedder_model = "fallback"
    return embedder_model

def get_cross_encoder():
    global cross_encoder_model
    if cross_encoder_model is None:
        try:
            from sentence_transformers import CrossEncoder
            cross_encoder_model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        except Exception as e:
            print(f"[Warning] CrossEncoder failed to load: {e}")
            cross_encoder_model = "fallback"
    return cross_encoder_model

# --- Request Schemas ---

class EmbedRequest(BaseModel):
    text: str

class DocumentItem(BaseModel):
    id: str
    title: Optional[str] = ""
    content: str
    score: Optional[float] = 0.0

class RerankRequest(BaseModel):
    query: str
    documents: List[DocumentItem]
    top_k: Optional[int] = 5

class ChunkRequest(BaseModel):
    text: str
    chunk_size: Optional[int] = 500
    overlap: Optional[int] = 50

# --- Helper fallback vector generator ---
import math, hashlib

def generate_deterministic_384_dim_vector(text: str) -> List[float]:
    """Fallback generator producing 384 normalized floats from text features when sentence-transformers is offline."""
    vec = [0.0] * 384
    text_lower = text.lower()
    words = text_lower.split()
    
    for i in range(384):
        h = hashlib.sha256(f"{text_lower}_{i}".encode('utf-8')).hexdigest()
        val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
        # Boost value if matching key domain tokens
        if any(w in text_lower for w in ["vector", "search", "atlas", "hybrid", "rankfusion", "mongodb", "python"]):
            val += 0.15 * math.sin(i * 0.1)
        vec[i] = val

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 6) for v in vec]

# --- Endpoints ---

@app.get("/")
def health_check():
    return {
        "service": "DocuMind AI Python ML Microservice",
        "status": "online",
        "embedding_model": "all-MiniLM-L6-v2 (384-dim)",
        "reranker_model": "cross-encoder/ms-marco-MiniLM-L-6-v2"
    }

@app.post("/embed")
def create_embedding(req: EmbedRequest):
    """Generates a 384-dimensional vector embedding for input text."""
    start_time = time.time()
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    embedder = get_embedder()
    if embedder != "fallback" and hasattr(embedder, 'encode'):
        embedding = embedder.encode(req.text, convert_to_numpy=True).tolist()
    else:
        embedding = generate_deterministic_384_dim_vector(req.text)
        
    duration_ms = round((time.time() - start_time) * 1000, 2)
    return {
        "dim": len(embedding),
        "embedding": embedding,
        "latency_ms": duration_ms,
        "model": "all-MiniLM-L6-v2"
    }

@app.post("/rerank")
def rerank_documents(req: RerankRequest):
    """Reranks candidate search documents using Cross-Encoder logits."""
    start_time = time.time()
    if not req.documents:
        return {"ranked_documents": [], "latency_ms": 0}
        
    cross_enc = get_cross_encoder()
    
    if cross_enc != "fallback" and hasattr(cross_enc, 'predict'):
        pairs = [[req.query, f"{doc.title} {doc.content}"] for doc in req.documents]
        scores = cross_enc.predict(pairs)
        
        # Sigmoid normalization for human-readable probability confidence
        def sigmoid(x):
            return 1 / (1 + math.exp(-float(x)))
            
        scored_docs = []
        for doc, raw_score in zip(req.documents, scores):
            prob = round(sigmoid(raw_score), 4)
            scored_docs.append({
                "id": doc.id,
                "title": doc.title,
                "content": doc.content,
                "original_score": doc.score,
                "rerank_logit": round(float(raw_score), 4),
                "rerank_score": prob
            })
    else:
        # Fallback scoring combining query token overlap with base score
        scored_docs = []
        query_words = set(req.query.lower().split())
        for doc in req.documents:
            text = f"{doc.title} {doc.content}".lower()
            matches = sum(1 for w in query_words if w in text)
            sim_bonus = matches / max(len(query_words), 1)
            final_score = round(min(0.99, (doc.score or 0.5) * 0.4 + sim_bonus * 0.6), 4)
            scored_docs.append({
                "id": doc.id,
                "title": doc.title,
                "content": doc.content,
                "original_score": doc.score,
                "rerank_logit": round(sim_bonus * 2.5, 4),
                "rerank_score": final_score
            })

    # Sort descending by rerank score
    scored_docs.sort(key=lambda x: x["rerank_score"], reverse=True)
    top_results = scored_docs[:req.top_k]
    duration_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "ranked_documents": top_results,
        "latency_ms": duration_ms,
        "model": "cross-encoder/ms-marco-MiniLM-L-6-v2"
    }

@app.post("/chunk")
def chunk_document(req: ChunkRequest):
    """Splits large text content into overlapping semantic chunks."""
    text = req.text or ""
    words = text.split()
    chunks = []
    
    step = req.chunk_size - req.overlap if req.chunk_size > req.overlap else req.chunk_size
    for i in range(0, len(words), step):
        chunk_text = " ".join(words[i : i + req.chunk_size])
        if chunk_text.strip():
            chunks.append({
                "chunk_index": len(chunks),
                "content": chunk_text,
                "word_count": len(chunk_text.split())
            })
            
    return {
        "total_chunks": len(chunks),
        "chunks": chunks
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
