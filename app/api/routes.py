import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from app.models.schemas import QueryRequest, QueryResponse, UploadResponse, Source
from app.rag.pipeline import ingest_document, ingest_raw_text, query_pipeline
from app.rag.vector_store import reset_db, delete_document, list_documents
from app.rules.manager import get_business_rules, save_business_rules

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure the upload directory exists
UPLOAD_DIR = os.path.join(os.getcwd(), "data", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SUPPORTED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".webp",
    ".csv", ".xlsx", ".xls", ".docx", ".doc", ".txt", ".md"
}

# --- BUSINESS RULES ENDPOINTS ---
@router.get("/rules")
def get_rules():
    """
    Get current business rules and guardrail settings.
    """
    return get_business_rules()

@router.post("/rules")
def update_rules(rules: dict = Body(...)):
    """
    Update business rules and guardrails.
    """
    success = save_business_rules(rules)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save business rules.")
    return {"status": "success", "message": "Business rules updated successfully."}

# --- DOCUMENT MANAGEMENT ENDPOINTS ---
@router.get("/documents")
def get_documents():
    """
    Get the list of all ingested documents in the vector database.
    """
    files = list_documents()
    return {"documents": files, "count": len(files)}

@router.delete("/documents")
def clear_all_documents():
    """
    Clear all documents and vectors from the database.
    """
    reset_db()
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            fpath = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(fpath):
                try:
                    os.remove(fpath)
                except Exception:
                    pass
    return {"status": "success", "message": "All documents and vectors have been cleared."}

@router.delete("/documents/{filename}")
def remove_document(filename: str):
    """
    Delete a specific document and its chunks.
    """
    delete_document(filename)
    fpath = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(fpath):
        try:
            os.remove(fpath)
        except Exception:
            pass
    return {"status": "success", "message": f"Document '{filename}' removed."}

@router.post("/documents/raw-text", response_model=UploadResponse)
def upload_raw_text(payload: dict = Body(...)):
    """
    Endpoint for Admin/User to ingest handwritten/manual text directly.
    """
    title = payload.get("title", "manual_knowledge").strip()
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")
        
    try:
        chunks = ingest_raw_text(title, text)
        clean_title = f"{title}.txt" if not title.endswith(".txt") else title
        return UploadResponse(
            status="success",
            filename=clean_title,
            chunks=chunks
        )
    except Exception as e:
        logger.error(f"Error ingesting raw text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from app.models.schemas import QueryRequest, QueryResponse, UploadResponse, UserFileParseResponse, Source
from app.rag.loader import extract_pages_from_file

TEMP_USER_DIR = os.path.join(os.getcwd(), "data", "temp_user_uploads")
os.makedirs(TEMP_USER_DIR, exist_ok=True)

@router.post("/documents/parse-user-file", response_model=UserFileParseResponse)
async def parse_user_file(file: UploadFile = File(...)):
    """
    Endpoint for User Portal: Parses user attached files/images (via OCR or Native) 
    temporarily for conversation context WITHOUT saving into permanent system knowledge base.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )
        
    temp_path = os.path.join(TEMP_USER_DIR, f"temp_{os.getpid()}_{file.filename}")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Parsing temporary user document: {file.filename}")
        pages = extract_pages_from_file(temp_path)
        
        if not pages:
            raise ValueError(f"Could not extract readable text or image content from {file.filename}.")
            
        full_text = "\n\n".join([p["text"].strip() for p in pages if p.get("text", "").strip()])
        
        return UserFileParseResponse(
            status="success",
            filename=file.filename,
            text=full_text,
            pages=len(pages),
            char_count=len(full_text)
        )
    except Exception as e:
        logger.error(f"Error parsing user document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Admin Endpoint to permanently upload and ingest multi-format files into system vector store.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Admin saved uploaded file to {file_path}")
        
        # Process and ingest multi-format document into permanent system knowledge
        num_chunks = ingest_document(file_path)
        
        return UploadResponse(
            status="success",
            filename=file.filename,
            chunks=num_chunks
        )
    except Exception as e:
        logger.error(f"Error uploading and ingesting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Endpoint to query documents with support for:
    1. Active user attached document
    2. Cross-referencing with system knowledge vector DB
    """
    try:
        result = query_pipeline(
            request.question,
            filename=request.filename,
            user_document_text=request.user_document_text,
            user_document_name=request.user_document_name
        )
        
        sources = [Source(**s) for s in result["sources"]]
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources
        )
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
