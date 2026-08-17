from fastapi import FastAPI
from app.api.routes import router
from app.rag.embeddings import init_gemini
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Load environment variables
load_dotenv()

app = FastAPI(
    title="DocuRAG API",
    description="API for Document Q&A using RAG",
    version="1.0.0"
)

# Include API routes
app.include_router(router)

@app.on_event("startup")
async def startup_event():
    # Initialize Gemini API
    try:
        init_gemini()
        logging.info("Gemini API initialized successfully.")
    except ValueError as e:
        logging.warning(f"Gemini API initialization failed: {e}")

@app.get("/")
def root():
    return {"message": "Welcome to DocuRAG API. Use /docs for documentation."}
