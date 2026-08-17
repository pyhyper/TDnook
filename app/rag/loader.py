import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file using PyMuPDF.
    
    Args:
        file_path (str): The path to the PDF file.
        
    Returns:
        str: The extracted text from the entire document.
    """
    text = ""
    try:
        # Open the PDF file
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text() + "\n\n"
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        raise e

def extract_pages_from_pdf(file_path: str) -> list[dict]:
    """
    Extracts text from a PDF file page by page.
    
    Args:
        file_path (str): The path to the PDF file.
        
    Returns:
        list[dict]: A list of dictionaries containing page number and text.
    """
    pages = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text().strip()
            if text:
                pages.append({
                    "page_num": page_num + 1,  # 1-indexed for humans
                    "text": text,
                    "filename": file_path.split("/")[-1].split("\\")[-1] # basic filename extraction
                })
        doc.close()
        return pages
    except Exception as e:
        logger.error(f"Error extracting pages from PDF {file_path}: {e}")
        raise e
