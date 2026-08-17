from app.rag.loader import extract_pages_from_pdf
from app.rag.chunker import chunk_text
from app.rag.embeddings import get_embedding
from app.rag.vector_store import add_chunks_to_db
from app.rag.retriever import retrieve_top_k
from app.llm.generator import generate_answer
import logging

logger = logging.getLogger(__name__)

def ingest_document(file_path: str) -> int:
    """
    Full pipeline to ingest a PDF document.
    1. Load PDF and extract text by page
    2. Chunk the text
    3. Generate embeddings
    4. Store in Vector DB
    
    Returns:
        int: Number of chunks processed and stored.
    """
    logger.info(f"Starting ingestion pipeline for {file_path}")
    
    # 1. Load PDF
    pages = extract_pages_from_pdf(file_path)
    logger.info(f"Extracted {len(pages)} pages.")
    
    # 2. Chunk text
    chunks = chunk_text(pages)
    logger.info(f"Generated {len(chunks)} chunks.")
    
    # 3. Generate embeddings
    # Using batching if possible, but Gemini API usually takes one at a time or lists
    texts = [chunk['text'] for chunk in chunks]
    
    # Gemini can embed multiple texts if passed as a list
    import google.generativeai as genai
    embeddings = []
    
    # Process in batches to avoid rate limits or large payload issues
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=batch_texts,
                task_type="retrieval_document"
            )
            # Depending on if batch_texts is 1 or many, result['embedding'] is a list of lists or just a list
            if isinstance(batch_texts, list) and len(batch_texts) > 1:
                embeddings.extend(result['embedding'])
            elif isinstance(batch_texts, list) and len(batch_texts) == 1:
                embeddings.append(result['embedding'])
        except Exception as e:
            logger.error(f"Error embedding batch: {e}")
            raise e
            
    logger.info(f"Generated {len(embeddings)} embeddings.")
    
    # 4. Store in Chroma
    add_chunks_to_db(chunks, embeddings)
    
    logger.info("Ingestion complete.")
    return len(chunks)

def query_pipeline(query: str) -> dict:
    """
    Full pipeline to answer a query.
    1. Retrieve relevant chunks from Vector DB
    2. Generate answer using LLM
    
    Returns:
        dict: Answer and sources.
    """
    logger.info(f"Processing query: {query}")
    
    # 1. Retrieve
    retrieved_chunks = retrieve_top_k(query)
    
    # 2. Generate
    answer = generate_answer(query, retrieved_chunks)
    
    # Format sources
    sources = []
    for chunk in retrieved_chunks:
        sources.append({
            "filename": chunk["metadata"]["filename"],
            "page": chunk["metadata"]["page"]
        })
    
    # Deduplicate sources preserving order
    seen = set()
    unique_sources = []
    for s in sources:
        identifier = f"{s['filename']}_{s['page']}"
        if identifier not in seen:
            seen.add(identifier)
            unique_sources.append(s)
            
    return {
        "answer": answer,
        "sources": unique_sources
    }
