from fastapi import APIRouter, Cookie, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

from app.deps.auth import check_password, create_token, verify_token

router = APIRouter(tags=["auth"])
templates = Jinja2Templates(directory="templates")

_COOKIE = "access_token"
_COOKIE_MAX_AGE = 30 * 24 * 3600  # 30 days in seconds


def _safe_next(target: str | None) -> str:
    """Only allow same-site paths, so ?next= can't bounce off to another host."""
    if not target or not target.startswith("/") or target.startswith("//"):
        return "/"
    return target


@router.get("/login")
async def login_page(
    request: Request,
    next: str | None = None,
    access_token: str | None = Cookie(default=None),
):
    target = _safe_next(next)
    if verify_token(access_token):
        return RedirectResponse(target, status_code=303)
    return templates.TemplateResponse(request, "login.html", {"next": target})


@router.post("/login")
async def login(
    request: Request,
    password: str = Form(...),
    next: str = Form(default="/"),
):
    target = _safe_next(next)

    if not check_password(password):
        return templates.TemplateResponse(
            request,
            "login.html",
            {
                "error": "Incorrect password.",
                "next": target,
            },
            status_code=401,
        )

    response = RedirectResponse(target, status_code=303)
    response.set_cookie(
        key=_COOKIE,
        value=create_token(),
        httponly=True,
        max_age=_COOKIE_MAX_AGE,
        samesite="lax",
    )
    return response


@router.post("/logout")
async def logout():
    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie(_COOKIE)
    return response
