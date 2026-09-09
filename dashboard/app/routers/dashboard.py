from pathlib import Path
from fastapi import APIRouter, Cookie, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.data.services import SERVICES, get_pinned_folders, get_sections
from app.deps.auth import verify_token

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="templates")
STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "static"


@router.get("/")
async def index(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    if not verify_token(access_token):
        return RedirectResponse("/login", status_code=303)

    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "sections":       get_sections(),
            "pinned_folders": get_pinned_folders(),
            "total":          len(SERVICES),
        },
    )


@router.get("/manifest.webmanifest", include_in_schema=False)
@router.get("/manifest.json", include_in_schema=False)
async def manifest():
    return FileResponse(
        STATIC_DIR / "manifest.webmanifest",
        media_type="application/manifest+json",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/sw.js", include_in_schema=False)
async def service_worker():
    return FileResponse(
        STATIC_DIR / "sw.js",
        media_type="application/javascript; charset=utf-8",
        headers={
            "Service-Worker-Allowed": "/",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )
