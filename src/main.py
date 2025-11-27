# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from .config import settings
from .auth.router import router as auth_router
from .users.router import router as users_router
from .collectives.router import router as collectives_router
from .surveys.router import router as surveys_router
from .negotiations.router import router as negotiations_router
from .suppliers.router import router as suppliers_router
from .users.router_admin import router as admin_users_router

# --- Optional routers (won't crash if missing) ---
try:
    from .bundles.router import router as bundles_router  # noqa: F401
except ImportError:
    bundles_router = None

try:
    from .procedures.router import router as procedures_router  # noqa: F401
except ImportError:
    procedures_router = None

try:
    from .dashboard.router import router as dashboard_router  # noqa: F401
except ImportError:
    dashboard_router = None
# --------------------------------------------------


app = FastAPI(
    title="Health Republic API",
    version="0.1.0",
    description="Backend for Health Republic: virtual collectives & supplier bidding",
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Health Republic API",
        routes=app.routes,
    )

    openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})[
        "BearerAuth"
    ] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

origins = [
    "http://localhost:5173",
    "http://198.58.119.187:5173",
]

app.openapi = custom_openapi

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, tags=["users"])
app.include_router(collectives_router, prefix="/collectives", tags=["collectives"])
app.include_router(surveys_router, prefix="/surveys", tags=["surveys"])
app.include_router(negotiations_router, prefix="/negotiations", tags=["negotiations"])
app.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])
app.include_router(admin_users_router)

# Optional routers (only mount if import succeeded)
if bundles_router:
    app.include_router(bundles_router, prefix="/bundles", tags=["bundles"])

if procedures_router:
    app.include_router(procedures_router, prefix="/procedures", tags=["procedures"])

if dashboard_router:
    app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": "health_republic"}
