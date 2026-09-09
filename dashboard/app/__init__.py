from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .routers import auth, dashboard, go, health, tailscale


def create_app() -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None)
    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    app.include_router(health.router)
    app.include_router(tailscale.router)
    # last: owns the /{slug} catch-all, so every other route matches first
    app.include_router(go.router)
    return app
