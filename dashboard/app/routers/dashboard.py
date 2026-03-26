from fastapi import APIRouter, Cookie, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

from app.data.services import SERVICES, get_sections
from app.deps.auth import verify_token

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="templates")


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
            "sections": get_sections(),
            "total": len(SERVICES),
        },
    )
