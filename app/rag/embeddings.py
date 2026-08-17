import os
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

# Initialize the Gemini API client
def init_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY environment variable is not set correctly.")
    genai.configure(api_key=api_key)

def get_embedding(text: str) -> list[float]:
    """
    Generates an embedding for a given text using Gemini.
    
    Args:
        text (str): The text to embed.
        
    Returns:
        list[float]: The embedding vector.
    """
    try:
        # Use the recommended embedding model for text
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise e

def get_query_embedding(text: str) -> list[float]:
    """
    Generates an embedding for a query using Gemini.
    
    Args:
        text (str): The query text to embed.
        
    Returns:
        list[float]: The embedding vector.
    """
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query",
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Error generating query embedding: {e}")
        raise e
