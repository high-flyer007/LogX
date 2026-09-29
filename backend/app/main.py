from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.core.database import init_db
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(
    app: FastAPI,
):

    init_db()

    yield


app = FastAPI(
    title="LogX",
    description=(
        "Universal Security Telemetry "
        "Pre-processing Platform"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    router
)


@app.get("/")
def root():

    return {
        "name": "LogX",
        "version": "0.1.0",
        "status": "online",
        "message": (
            "Universal Security Telemetry "
            "Pre-processing Platform"
        ),
    }