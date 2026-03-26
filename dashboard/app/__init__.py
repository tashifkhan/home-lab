from fastapi import FastAPI

from .routers import auth, dashboard


def create_app() -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None)
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    return app
