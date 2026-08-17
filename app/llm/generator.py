import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

def build_prompt(query: str, retrieved_chunks: list[dict]) -> str:
    """
    Constructs the prompt for the LLM using the query and retrieved context.
    """
    context_text = ""
    for idx, chunk in enumerate(retrieved_chunks):
        context_text += f"--- Source {idx + 1} (File: {chunk['metadata']['filename']}, Page: {chunk['metadata']['page']}) ---\n"
        context_text += f"{chunk['text']}\n\n"
        
    prompt = f"""You are a helpful and accurate assistant answering questions based on the provided documents.

INSTRUCTIONS:
1. Answer the question using ONLY the provided context.
2. If the answer is not contained in the context, politely state that you cannot answer based on the provided documents. Do not guess or make up information.
3. Cite the sources you used to form your answer (e.g., "According to [filename], page [page number]...").

CONTEXT:
{context_text}

QUESTION:
{query}

ANSWER:
"""
    return prompt

def generate_answer(query: str, retrieved_chunks: list[dict]) -> str:
    """
    Generates an answer using the Gemini LLM based on the query and context.
    """
    if not retrieved_chunks:
        return "I could not find any relevant information in the uploaded documents to answer your question."
        
    prompt = build_prompt(query, retrieved_chunks)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating answer from LLM: {e}")
        return "An error occurred while generating the answer."
