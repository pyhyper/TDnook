from pydantic import BaseModel

class QueryRequest(BaseModel):
    question: str

class Source(BaseModel):
    filename: str
    page: int

class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]

class UploadResponse(BaseModel):
    status: str
    filename: str
    chunks: int
