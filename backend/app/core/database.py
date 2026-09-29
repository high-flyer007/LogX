import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
# from app.models.db import EventRecord


DATABASE_URL = os.getenv(
    "LOGX_DATABASE_URL",
    "sqlite:///./logx.db",
)


class Base(DeclarativeBase):
    pass


connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False
    }


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def init_db() -> None:
    from app.models.db import (
        EventRecord,
        QuarantineRecord,
        ReplayRecord,
        ParserDefinition,
    )

    Base.metadata.create_all(
        bind=engine
    )