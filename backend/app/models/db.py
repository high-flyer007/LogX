from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EventRecord(Base):

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    event_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
    )

    ingest_id: Mapped[str] = mapped_column(
        String(64),
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String(64),
        default="unknown",
    )

    raw_format: Mapped[str] = mapped_column(
        String(32),
        default="unknown",
    )

    raw_data: Mapped[str] = mapped_column(
        Text,
    )

    raw_sha256: Mapped[str] = mapped_column(
        String(64),
        index=True,
    )

    normalized_event: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


class QuarantineRecord(Base):

    __tablename__ = "quarantine_events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    quarantine_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
    )

    event_id: Mapped[str] = mapped_column(
        String(64),
        index=True,
    )

    raw_data: Mapped[str] = mapped_column(
        Text,
    )

    raw_sha256: Mapped[str] = mapped_column(
        String(64),
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        String(255),
    )

    validation_errors: Mapped[list[Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
    )

    detection: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
    )

    analysis: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        default="quarantined",
        index=True,
    )

    quarantined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


class ReplayRecord(Base):
    __tablename__ = "replay_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    original_sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    replayed_sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        String(255),
        default="manual replay",
    )

    status: Mapped[str] = mapped_column(
        String(32),
        index=True,
    )

    integrity_preserved: Mapped[bool] = mapped_column(
        default=False,
    )

    result: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


class ParserDefinition(Base):
    __tablename__ = "parser_definitions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    parser_id: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    vendor: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    product: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    supported_formats: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
    )

    required_fields: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
    )

    field_mappings: Mapped[dict[str, str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )