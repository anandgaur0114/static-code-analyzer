"""
main.py - FastAPI Application for Static Code Analyzer & Quality Scorer
"""

import sys
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analyzer_engine import analyze_code
from samples import SAMPLES

# Maximum allowable code size: 500 KB (~10,000 lines of code)
MAX_CODE_SIZE_BYTES = 500 * 1024

app = FastAPI(
    title="C++ Static Code Analyzer API",
    description="Compiler Design Static Analysis, McCabe Cyclomatic Complexity & Quality Scorer",
    version="2.0.0"
)

# Enable CORS for React/Vite development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    code: str = Field(..., description="C or C++ source code to analyze")
    language: Optional[str] = Field("cpp", description="Target language (e.g. cpp, c)")

class TokenItem(BaseModel):
    type: str
    value: str
    line: int
    col: int

class SymbolItem(BaseModel):
    name: str
    type: str
    scope: str
    line: int

class IssueItem(BaseModel):
    line: int
    col: int
    severity: str
    type: str
    message: str
    suggestion: str

class MetricsData(BaseModel):
    lines: int
    functions: int
    cyclomatic_complexity: float
    quality_score: float
    grade: Optional[str] = None
    description: Optional[str] = None
    risk_level: Optional[str] = None
    function_metrics: Optional[List[Dict[str, Any]]] = None
    deductions: Optional[List[Dict[str, Any]]] = None

class AnalyzeResponse(BaseModel):
    tokens: List[TokenItem]
    symbol_table: List[SymbolItem]
    issues: List[IssueItem]
    metrics: MetricsData
    ast: Optional[Dict[str, Any]] = None

@app.get("/")
def root():
    return {
        "name": "C++ Static Code Analyzer API",
        "status": "online",
        "docs": "/docs",
        "endpoints": ["/analyze", "/samples", "/health"]
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/samples")
def get_samples():
    """Returns sample programs for testing, including ones with deliberate bugs."""
    return {"samples": SAMPLES}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    """
    Accepts source code, runs full lexical, syntactic, semantic, complexity,
    and security analysis passes, and returns structured JSON diagnostics.
    """
    code = payload.code
    if not code or not code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source code cannot be empty. Please enter or paste C/C++ code."
        )

    # Size limit validation
    code_bytes = len(code.encode("utf-8"))
    if code_bytes > MAX_CODE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Code size ({code_bytes // 1024} KB) exceeds the maximum allowed limit of {MAX_CODE_SIZE_BYTES // 1024} KB."
        )

    try:
        result = analyze_code(code)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Static analysis failed unexpectedly: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
