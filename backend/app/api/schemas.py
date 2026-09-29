from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProcessEventRequest(BaseModel):

    raw_data: str = Field(
        min_length=1,
        description="Raw security telemetry"
    )


class ProcessEventResponse(BaseModel):

    status: str

    event_id: str

    ingest_id: str

    result: Dict[str, Any]


class HealthResponse(BaseModel):

    name: str
    version: str
    status: str
    components: Dict[str, str]


# class ReplayRequest(BaseModel):

#     raw_data: str = Field(
#         min_length=1
#     )

#     original_sha256: str = Field(
#         min_length=64,
#         max_length=64
#     )

#     reason: str = "manual replay"

class ReplayRequest(BaseModel):
    raw_data: str
    original_sha256: str
    reason: str = "manual replay"
    parser_id: str | None = None
    parser_version: str | None = None