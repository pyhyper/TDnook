def chunk_text(pages: list[dict], chunk_size: int = 1000, chunk_overlap: int = 200) -> list[dict]:
    """
    Splits text from pages into smaller chunks with overlap.
    
    Args:
        pages (list[dict]): List of dictionaries containing page_num, text, and filename.
        chunk_size (int): The maximum size of each chunk (in characters).
        chunk_overlap (int): The number of overlapping characters between chunks.
        
    Returns:
        list[dict]: List of chunks with metadata.
    """
    chunks = []
    chunk_id_counter = 1
    
    for page in pages:
        text = page["text"]
        filename = page["filename"]
        page_num = page["page_num"]
        
        # Simple character-based chunking
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            
            # Try to avoid splitting words if possible, but keep it simple for now
            if end < len(text) and not chunk_text.endswith(" ") and not chunk_text.endswith("\n"):
                # Find the last space to avoid breaking a word
                last_space = chunk_text.rfind(" ")
                if last_space != -1:
                    chunk_text = chunk_text[:last_space]
                    end = start + last_space + 1
            
            if chunk_text.strip():
                chunks.append({
                    "text": chunk_text.strip(),
                    "metadata": {
                        "filename": filename,
                        "page": page_num,
                        "chunk_id": chunk_id_counter
                    }
                })
                chunk_id_counter += 1
            
            # Move the start pointer forward, accounting for overlap
            start = end - chunk_overlap
            # Ensure we always make progress even if overlap is larger than end-start
            if start <= end - chunk_size:
                 start = end # prevent infinite loop if overlap >= chunk_size
                 
    return chunks
