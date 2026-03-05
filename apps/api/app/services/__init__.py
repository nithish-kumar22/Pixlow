"""Backend services (LLM, version creation, etc.)."""
from app.services.llm import generate_ir

__all__ = ["generate_ir"]
