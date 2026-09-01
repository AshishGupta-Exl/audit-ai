"""FastAPI application exposing the audit-ai engine."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import __version__
from app.audit_engine import audit_text, enrich_with_llm, list_rules

app = FastAPI(
    title="audit-ai",
    version=__version__,
    description="AI-assisted risk and compliance auditing for documents, code, and config.",
)

# The dev frontend runs on a different origin (Vite on :5173), so allow CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditRequest(BaseModel):
    content: str = Field(..., description="Raw text to audit.")
    filename: str | None = Field(default=None, description="Optional source filename.")
    use_llm: bool = Field(
        default=False,
        description="Enrich the result with an LLM summary when an API key is configured.",
    )


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/api/rules")
def rules() -> dict:
    active = list_rules()
    return {"count": len(active), "rules": active}


@app.post("/api/audit")
def audit(request: AuditRequest) -> dict:
    result = audit_text(request.content, filename=request.filename)
    if request.use_llm:
        result = enrich_with_llm(result, request.content)
    return result.as_dict()
