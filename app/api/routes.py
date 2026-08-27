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

@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to upload and ingest multi-format files (PDF, Images, CSV, Excel, Word, TXT).
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
            
        logger.info(f"Saved uploaded file to {file_path}")
        
        # Process and ingest multi-format document
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
    Endpoint to query the ingested documents (optionally filtered by filename).
    """
    try:
        result = query_pipeline(request.question, filename=request.filename)
        
        sources = [Source(**s) for s in result["sources"]]
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources
        )
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
