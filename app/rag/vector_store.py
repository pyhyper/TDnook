import os
import chromadb
from chromadb.config import Settings
import logging

logger = logging.getLogger(__name__)

# Global variable to store the Chroma client
_chroma_client = None

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        db_path = os.getenv("VECTOR_DB_PATH", "./data/vector_db")
        os.makedirs(db_path, exist_ok=True)
        # Initialize persistent client
        _chroma_client = chromadb.PersistentClient(path=db_path)
    return _chroma_client

def get_collection(name="docurag_collection"):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)

def add_chunks_to_db(chunks: list[dict], embeddings: list[list[float]], collection_name="docurag_collection"):
    """
    Adds text chunks and their embeddings to the Chroma vector database.
    
    Args:
        chunks (list[dict]): List of dictionaries containing text and metadata.
        embeddings (list[list[float]]): List of embedding vectors.
        collection_name (str): Name of the collection to use.
    """
    try:
        collection = get_collection(collection_name)
        
        ids = [f"{chunk['metadata']['filename']}_{chunk['metadata']['chunk_id']}" for chunk in chunks]
        documents = [chunk['text'] for chunk in chunks]
        metadatas = [chunk['metadata'] for chunk in chunks]
        
        collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Added {len(chunks)} chunks to vector database.")
    except Exception as e:
        logger.error(f"Error adding chunks to DB: {e}")
        raise e
