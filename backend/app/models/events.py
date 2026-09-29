from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class FieldLineage(BaseModel):
    """
    Forensic trace showing how a normalized field was produced.
    """

    target_field: str

    source_field: str

    original_value: Any = None

    normalized_value: Any = None

    extraction_method: str = "parser"

    parser_id: str

    parser_version: str

    confidence: float = 1.0

    raw_sha256: str


class RawEvent(BaseModel):
    """
    Immutable representation of the original security log.
    """

    event_id: str

    ingest_id: str

    received_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    raw_data: str

    raw_format: str = "unknown"

    source_type: str = "unknown"

    sha256: str

    byte_length: int


class LogXEvent(BaseModel):
    """
    Canonical LogX security event.

    The original raw evidence is retained alongside
    normalized security telemetry.
    """

    model_config = ConfigDict(
    populate_by_name=True
    )

    schema_: Dict[str, str] = Field(
    default_factory=lambda: {
        "name": "LogX Event",
        "version": "1.0",
    },
    alias="schema",
    )

    event: Dict[str, Any] = Field(
        default_factory=dict
    )

    source: Dict[str, Any] = Field(
        default_factory=dict
    )

    destination: Dict[str, Any] = Field(
        default_factory=dict
    )

    network: Dict[str, Any] = Field(
        default_factory=dict
    )

    user: Dict[str, Any] = Field(
        default_factory=dict
    )

    device: Dict[str, Any] = Field(
        default_factory=dict
    )

    threat: Dict[str, Any] = Field(
        default_factory=dict
    )

    raw: Dict[str, Any] = Field(
        default_factory=dict
    )

    parser: Dict[str, Any] = Field(
        default_factory=dict
    )

    quality: Dict[str, Any] = Field(
        default_factory=dict
    )

    lineage: List[FieldLineage] = Field(
        default_factory=list
    )

    provenance: Dict[str, Any] = Field(
        default_factory=dict
    )

    unmapped: Dict[str, Any] = Field(
        default_factory=dict
    )

    parse_warnings: List[str] = Field(
        default_factory=list
    )