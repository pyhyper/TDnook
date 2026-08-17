from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import QueryRequest, QueryResponse, UploadResponse, Source
from app.rag.pipeline import ingest_document, query_pipeline
import os
import shutil
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure the upload directory exists
UPLOAD_DIR = os.path.join(os.getcwd(), "data", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF document and ingest it into the RAG system.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Saved uploaded file to {file_path}")
        
        # Process and ingest
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
    Endpoint to query the ingested documents.
    """
    try:
        result = query_pipeline(request.question)
        
        sources = [Source(**s) for s in result["sources"]]
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources
        )
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
