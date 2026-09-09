from fastapi import APIRouter, Cookie, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.data.services import get_shortcuts, resolve_shortcut
from app.deps.auth import verify_token

router = APIRouter(tags=["shortcuts"])
templates = Jinja2Templates(directory="templates")


def _redirect(key: str, access_token: str | None):
    svc = resolve_shortcut(key)
    if not svc:
        return None

    if not verify_token(access_token):
        return RedirectResponse(f"/login?next={svc['short_path']}", status_code=303)

    # Public hostname wins; Tailscale address is the fallback.
    return RedirectResponse(svc["target_url"], status_code=302)


@router.get("/go")
async def shortcut_index(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    if not verify_token(access_token):
        return RedirectResponse("/login?next=/go", status_code=303)

    return templates.TemplateResponse(
        request,
        "shortcuts.html",
        {"shortcuts": get_shortcuts()},
    )


@router.get("/api/shortcuts")
async def shortcut_api(access_token: str | None = Cookie(default=None)):
    if not verify_token(access_token):
        return JSONResponse({"error": "unauthorized"}, status_code=401)

    return {
        "shortcuts": [
            {
                "slug": s["slug"],
                "aliases": s["aliases"],
                "path": s["short_path"],
                "name": s["name"],
                "app": s["app"],
                "target": s["target_url"],
                "kind": s["target_kind"],
            }
            for s in get_shortcuts()
        ]
    }


@router.api_route("/go/{key}", methods=["GET", "HEAD"], include_in_schema=False)
async def go(key: str, access_token: str | None = Cookie(default=None)):
    response = _redirect(key, access_token)
    if response is None:
        return JSONResponse({"error": f"unknown shortcut: {key}"}, status_code=404)
    return response


# Registered last in create_app() so it never shadows a real dashboard route.
@router.api_route("/{key}", methods=["GET", "HEAD"], include_in_schema=False)
async def go_root(key: str, access_token: str | None = Cookie(default=None)):
    response = _redirect(key, access_token)
    if response is None:
        return JSONResponse({"error": f"not found: /{key}"}, status_code=404)
    return response
