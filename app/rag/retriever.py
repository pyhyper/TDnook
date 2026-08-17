from app.rag.vector_store import get_collection
from app.rag.embeddings import get_query_embedding
import os
import logging

logger = logging.getLogger(__name__)

def retrieve_top_k(query: str, k: int = None, collection_name="docurag_collection") -> list[dict]:
    """
    Retrieves the top K most similar chunks for a given query.
    
    Args:
        query (str): The search query.
        k (int): Number of results to return. Defaults to TOP_K env var or 5.
        collection_name (str): Name of the collection to search.
        
    Returns:
        list[dict]: List of retrieved documents with their metadata and distances.
    """
    if k is None:
        k = int(os.getenv("TOP_K", 5))
        
    try:
        # Generate embedding for the query
        query_embedding = get_query_embedding(query)
        
        # Search the database
        collection = get_collection(collection_name)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        # Format results
        formatted_results = []
        if results and results['documents'] and len(results['documents']) > 0:
            for i in range(len(results['documents'][0])):
                formatted_results.append({
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if 'distances' in results and results['distances'] else None
                })
                
        return formatted_results
    except Exception as e:
        logger.error(f"Error retrieving from DB: {e}")
        raise e
