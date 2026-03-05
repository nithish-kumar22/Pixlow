"""
FastAPI application for Prompt to App.
M03: Minimal app with Clerk webhook for user sync.
M04: Adds auth dependency, projects, versions, generation.
"""
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import generation, projects, versions
from app.webhooks import router as webhooks_router

app = FastAPI(title="Prompt to App API", version="0.1.0")


def _error_code(status_code: int) -> str:
    if status_code == 400:
        return "BAD_REQUEST"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 404:
        return "NOT_FOUND"
    return "ERROR"


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Return consistent error JSON with detail and code for HTTP errors."""
    detail = exc.detail
    if isinstance(detail, list):
        detail = [{"msg": str(x.get("msg", x))} for x in detail]
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail, "code": _error_code(exc.status_code)},
    )

# CORS for Next.js frontend
origins = [
    "http://localhost:3000",
]
if os.getenv("NEXT_PUBLIC_APP_URL"):
    origins.append(os.getenv("NEXT_PUBLIC_APP_URL").rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(versions.router, tags=["versions"])
app.include_router(generation.router, tags=["generation"])
