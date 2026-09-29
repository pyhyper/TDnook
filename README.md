# TDnook — Minimalist Paper Document Reader & AI Assistant

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange.svg)](https://www.trychroma.com/)
[![OCR](https://img.shields.io/badge/OCR-EasyOCR%20(vi%2Fen)-brightgreen.svg)](https://github.com/JaidedAI/EasyOCR)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**TDnook** is an intelligent, minimalist document reader and AI assistant powered by **Retrieval-Augmented Generation (RAG)**. 

Inspired by dedicated e-readers (Kindle, Nook) and tactile paper stationery, TDnook transforms the tedious task of reading long reports, books, and corporate dossiers into a serene, eye-friendly paper canvas experience—backed by an accurate local AI librarian ready to summarize, cross-reference, and answer questions with page-level citations.

---

## Key Highlights

- **Paper & E-Ink Aesthetic UX**: 
  - Real tactile paper textures (*Kindle Micro-Grain, Book Parchment / Giấy Dó, Woven Linen, Smooth Matte*).
  - Soothing tone palettes (*Warm Sepia, Neutral E-Ink, Dark Ink*).
  - Book-grade typography using *Literata* and *Newsreader*.
- **Universal Multi-Format Ingestion**:
  - Native & scanned **PDF** (with automatic **EasyOCR** fallback for bilingual Vietnamese & English).
  - Image files (**PNG, JPG, JPEG, BMP, WebP**).
  - Spreadsheets (**Excel `.xlsx`, `.xls`, CSV**).
  - Documents (**Word `.docx`, `.doc`, TXT, Markdown**).
- **Enterprise Guardrails & Business Rules Engine**:
  - **Strict Mode**: Restricts answers strictly to supplied documents, preventing AI hallucinations.
  - **Direct FAQ & Keyword Routing**: Instant rule-based answers for common inquiries (hotline, working hours, company policy).
  - **Security Filter**: Built-in guardrail blocking malicious prompt injections, jailbreaks, and unauthorized queries.
- **Local-First & Offline Privacy**:
  - Native support for Apple Silicon Metal acceleration (`mlx_lm`), GGUF quantizations (`llama-cpp-python`), or `ctransformers`.
  - ChromaDB vector store running 100% locally to ensure confidential documents never leave your machine.
  - Support for Google Gemini API as an optional cloud engine.
- **Dual Workspaces**:
  - **User Reading & Chat**: Full-bleed paper canvas, multi-conversation session history, live document attachment, and clickable citation cards.
  - **Admin Control Center**: Manage corporate policies, guardrails, manual knowledge injection, and document vector management.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             TDnook Paper Web Interface                 │
│      (Kindle / Sepia / E-Ink Canvas + Reader)          │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Document Ingestion          User Question
                │                        │
                ▼                        ▼
     ┌──────────────────────┐  ┌──────────────────┐
     │ Multi-Format Loader  │  │ Admin Guardrails │
     │ (PyMuPDF + EasyOCR)  │  │ & Direct FAQ     │
     └──────────┬───────────┘  └────────┬─────────┘
                │                       │
                ▼                       ▼
     ┌──────────────────────┐  ┌──────────────────┐
     │ Recursive Chunker    │  │ Query Embedding  │
     └──────────┬───────────┘  └────────┬─────────┘
                │                       │
                ▼                       │
     ┌──────────────────────┐           │
     │ Embedding Generator  │           │
     └──────────┬───────────┘           │
                │                       │
                ▼                       ▼
     ┌────────────────────────────────────────────┐
     │             ChromaDB Vector Store          │
     │          (Semantic Similarity Search)      │
     └──────────────────────┬─────────────────────┘
                            │
                            ▼
                    Top-K Context Chunks
                            │
                            ▼
     ┌────────────────────────────────────────────┐
     │          LLM Generation Engine             │
     │  (mlx_lm / llama.cpp GGUF / Gemini API)    │
     └──────────────────────┬─────────────────────┘
                            │
                            ▼
              Grounded Answer + Page Sources
```

---

## Project Structure

```text
TDnook/
├── app/
│   ├── main.py              # FastAPI application entrypoint
│   ├── api/
│   │   └── routes.py        # REST API endpoints (upload, query, rules, documents)
│   ├── rag/
│   │   ├── loader.py        # Multi-format document parser & OCR extraction
│   │   ├── chunker.py       # Recursive text splitting & window sliding
│   │   ├── embeddings.py    # Local sentence-transformers / embedding models
│   │   ├── vector_store.py  # ChromaDB persistent collection management
│   │   ├── retriever.py     # Top-K semantic retrieval & similarity filtering
│   │   └── pipeline.py      # End-to-end ingestion and query pipelines
│   ├── llm/
│   │   └── generator.py     # Multi-backend LLM inference (MLX, llama-cpp, Gemini)
│   ├── rules/
│   │   └── manager.py       # Business policies, guardrails & FAQ rules
│   ├── models/
│   │   └── schemas.py       # Pydantic request & response models
│   ├── static/              # Minimalist Paper Web App (HTML, CSS, JS)
│   │   ├── index.html       # Full-bleed reader & portal interface
│   │   ├── style.css        # Paper textures, Kindle themes & typography
│   │   └── app.js           # Multi-conversation management & client logic
│   └── streamlit_app.py     # Alternative Streamlit dashboard
├── data/                    # Local storage (documents, vector db, rules)
│   └── business_rules.json  # Configurable business policies
├── tests/                   # Unit & integration tests
├── .env.example             # Environment variable template
├── .gitignore               # Strict gitignore rules protecting private files
├── requirements.txt         # Python project dependencies
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10 or higher.
- (Optional) C/C++ compiler or Xcode Command Line Tools if building `llama-cpp-python` locally.
- (Optional) Apple Silicon Mac with macOS 13+ for Metal-accelerated `mlx-lm`.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/TDnook.git
cd TDnook
```

### 3. Create a Virtual Environment
```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your preferred backend:
```env
# Cloud LLM (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Local LLM Inference (GGUF or MLX model path)
LOCAL_MODEL_PATH=./models/gemma-model.gguf
MODEL_N_CTX=2048
MODEL_N_BATCH=512
MODEL_N_GPU_LAYERS=0
MODEL_N_THREADS=4

# Vector DB & Retrieval
VECTOR_DB_PATH=./data/vector_db
TOP_K=5
EMBEDDING_BATCH_SIZE=32

# OCR Settings
OCR_LANGUAGES=vi,en
```

---

## Running the Application

### 1. Launch the Main Paper Web Application
Start the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open your browser and navigate to:
```text
http://localhost:8000
```

### 2. Launch the Alternative Streamlit Interface
If you prefer a standard data dashboard view:
```bash
streamlit run app/streamlit_app.py
```

---

## REST API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/documents/upload` | Upload and ingest a document (PDF, DOCX, XLSX, Image, TXT) |
| `POST` | `/documents/raw-text` | Ingest manual notes / raw text snippet into vector store |
| `GET` | `/documents` | List all indexed documents in ChromaDB |
| `DELETE` | `/documents/{filename}` | Delete a specific document and its vector embeddings |
| `DELETE` | `/documents` | Clear all documents and reset the vector database |
| `POST` | `/query` | Ask a question against the indexed documents |
| `GET` | `/rules` | Fetch current business guardrails and FAQ rules |
| `POST` | `/rules` | Update business policies, forbidden keywords, and FAQs |

---

## Security & Privacy Guidelines

TDnook is built with privacy and confidentiality in mind:
- **No Private Data in VCS**: Model weights (`*.gguf`), user uploaded files (`data/documents/*`), databases (`data/vector_db/*`), and environment keys (`.env`) are strictly excluded via `.gitignore`.
- **Zero Cloud Leakage in Local Mode**: When using local models (`mlx_lm` or `llama.cpp`), all OCR, embeddings, and inference execute entirely offline on your local hardware.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
