from typing import Any, Dict

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.db import (
    EventRecord,
    QuarantineRecord,
    ParserDefinition,
)

from fastapi import APIRouter, HTTPException

from app.api.schemas import (
    HealthResponse,
    ProcessEventRequest,
    ProcessEventResponse,
    ReplayRequest,
)

from app.services.event_store import EventStore
from app.services.pipeline import LogXPipeline
from app.services.replay import ReplayService

from app.core.database import init_db

router = APIRouter(
    prefix="/api/v1"
)

init_db()

pipeline = LogXPipeline()

event_store = EventStore()

replay_service = ReplayService(
    pipeline
)


@router.get(
    "/health",
    response_model=HealthResponse,
)
def health():

    return {
        "name": "LogX",
        "version": "0.1.0",
        "status": "online",
        "components": {
            "pipeline": "online",
            "parser_registry": "online",
            "validation": "online",
            "quarantine": "online",
            "storage": "online",
        },
    }


@router.post(
    "/events/process",
    response_model=ProcessEventResponse,
)
def process_event(
    request: ProcessEventRequest,
):

    result = pipeline.process(
        request.raw_data
    )

    # Persist both successful and quarantined
    # processing results.
    event_store.save(
        result
    )

    return {
        "status": result["status"],
        "event_id": result["event_id"],
        "ingest_id": result["ingest_id"],
        "result": result,
    }


@router.get(
    "/events"
)
def list_events(
    limit: int = 100,
):

    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="limit must be between 1 and 500",
        )

    events = event_store.list_events(
        limit=limit
    )

    return {
        "count": len(events),
        "events": [
            {
                "event_id": event.event_id,
                "ingest_id": event.ingest_id,
                "status": event.status,
                "source": event.source_type,
                "format": event.raw_format,
                "sha256": event.raw_sha256,
                "created_at": event.created_at,
                "data": event.normalized_event,
            }
            for event in events
        ],
    }


@router.get(
    "/events/{event_id}"
)
def get_event(
    event_id: str,
):

    event = event_store.get(
        event_id
    )

    if event is None:

        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    return {
        "event_id": event.event_id,
        "ingest_id": event.ingest_id,
        "status": event.status,
        "source": event.source_type,
        "format": event.raw_format,
        "raw_data": event.raw_data,
        "sha256": event.raw_sha256,
        "data": event.normalized_event,
        "created_at": event.created_at,
    }


@router.get(
    "/quarantine"
)
def list_quarantine():

    records = pipeline.quarantine_store.list_all()

    return {
        "count": len(records),
        "events": records,
    }

@router.get(
    "/analytics/summary"
)
def analytics_summary():
    """
    Return backend-derived operational analytics.

    Analytics are calculated from persisted LogX event and
    quarantine records rather than from frontend mock data.
    """

    with SessionLocal() as session:
        events = (
            session.query(EventRecord)
            .order_by(EventRecord.created_at.asc())
            .all()
        )

        quarantine_count = (
            session.query(QuarantineRecord).count()
        )

    total = len(events)

    processed = sum(
        1
        for event in events
        if event.status == "processed"
    )

    valid = sum(
        1
        for event in events
        if (
            isinstance(event.normalized_event, dict)
            and (
                event.normalized_event
                .get("quality", {})
                .get("status")
                == "valid"
            )
        )
    )

    success_rate = (
        round((processed / total) * 100, 1)
        if total
        else 0.0
    )

    source_counts = {}
    format_counts = {}
    action_counts = {}
    parser_counts = {}
    timeline_counts = {}

    for event in events:

        normalized = (
            event.normalized_event
            if isinstance(event.normalized_event, dict)
            else {}
        )

        # -------------------------
        # Source distribution
        # -------------------------

        source = (
            event.source_type
            or normalized.get("device", {}).get("vendor")
            or normalized.get("source", {}).get("name")
            or "Unknown"
        )

        if isinstance(source, dict):
            source = (
                source.get("name")
                or source.get("vendor")
                or source.get("type")
                or "Unknown"
            )

        source = str(source)

        source_counts[source] = (
            source_counts.get(source, 0) + 1
        )

        # -------------------------
        # Format distribution
        # -------------------------

        raw = normalized.get("raw", {})

        event_format = (
            event.raw_format
            or raw.get("format")
            or "Unknown"
        )

        event_format = str(event_format)

        format_counts[event_format] = (
            format_counts.get(event_format, 0) + 1
        )

        # -------------------------
        # Action distribution
        # -------------------------

        event_section = normalized.get(
            "event",
            {}
        )

        action = (
            event_section.get("action")
            if isinstance(event_section, dict)
            else None
        ) or "unknown"

        action = str(action)

        action_counts[action] = (
            action_counts.get(action, 0) + 1
        )

        # -------------------------
        # Parser distribution
        # -------------------------

        parser_section = normalized.get(
            "parser",
            {}
        )

        parser_id = (
            parser_section.get("id")
            if isinstance(parser_section, dict)
            else None
        ) or "unknown"

        parser_id = str(parser_id)

        parser_counts[parser_id] = (
            parser_counts.get(parser_id, 0) + 1
        )

        # -------------------------
        # Timeline
        # -------------------------

        if event.created_at:
            timestamp = event.created_at.strftime(
                "%H:00"
            )

            timeline_counts[timestamp] = (
                timeline_counts.get(timestamp, 0) + 1
            )

    def sorted_counts(
        counts,
        name_key="name",
    ):
        return [
            {
                name_key: name,
                "value": value,
            }
            for name, value in sorted(
                counts.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ]

    timeline = [
        {
            "time": time,
            "events": count,
        }
        for time, count in sorted(
            timeline_counts.items()
        )
    ]

    return {
        "overview": {
            "total_events": total,
            "processed": processed,
            "quarantined": quarantine_count,
            "valid": valid,
            "success_rate": success_rate,
        },
        "sources": sorted_counts(
            source_counts
        ),
        "formats": sorted_counts(
            format_counts
        ),
        "actions": sorted_counts(
            action_counts
        ),
        "parsers": sorted_counts(
            parser_counts
        ),
        "timeline": timeline,
    }

@router.get(
    "/parsers"
)
def list_parsers():

    return {
        "count": len(
            pipeline.parser_registry.list_parsers()
        ),
        "parsers": (
            pipeline.parser_registry.list_parsers()
        ),
    }

@router.post(
    "/parsers/analyze"
)
def analyze_parser(
    request: dict,
):
    raw_data = request.get("raw_data", "")

    if not raw_data:
        raise HTTPException(
            status_code=400,
            detail="raw_data is required",
        )

    detected_format = request.get(
        "detected_format"
    )

    detected_source = request.get(
        "detected_source"
    )

    # Use LogX's existing detectors when the
    # frontend does not provide detection results.
    if not detected_format:
        detected_format = pipeline.format_detector.detect(
            raw_data
        )

    if not detected_source:
        detected_source = pipeline.source_detector.detect(
            raw_data,
            detected_format
        )

    analysis = pipeline.parser_analyzer.analyze(
        raw_data=raw_data,
        detected_format=detected_format,
        detected_source=detected_source,
    )

    return {
        "status": "success",
        "detected_format": detected_format,
        "detected_source": detected_source,
        "analysis": analysis,
    }

@router.post(
    "/parsers/register"
)
def register_parser(
    request: dict,
):
    parser_id = request.get("parser_id")
    version = request.get("version", "1.0.0")
    vendor = request.get("vendor", "Unknown")
    product = request.get("product", "Unknown")

    supported_formats = request.get(
        "supported_formats",
        ["key_value"],
    )

    required_fields = request.get(
        "required_fields",
        [],
    )

    field_mappings = request.get(
        "field_mappings",
        {},
    )

    if not parser_id:
        raise HTTPException(
            status_code=400,
            detail="parser_id is required",
        )

    if not required_fields:
        raise HTTPException(
            status_code=400,
            detail="required_fields must not be empty",
        )

    if not field_mappings:
        raise HTTPException(
            status_code=400,
            detail="field_mappings must not be empty",
        )

    if not supported_formats:
        raise HTTPException(
            status_code=400,
            detail="supported_formats must not be empty",
        )

    # Register/update the in-memory parser immediately.
    parser = pipeline.parser_registry.register_configurable(
        parser_id=parser_id,
        version=version,
        vendor=vendor,
        product=product,
        supported_formats=tuple(
            supported_formats
        ),
        required_fields=list(
            required_fields
        ),
        field_mappings=dict(
            field_mappings
        ),
    )

    # Persist the definition.
    with SessionLocal() as session:

        existing = session.scalar(
            select(ParserDefinition).where(
                ParserDefinition.parser_id
                == parser_id
            )
        )

        if existing:

            existing.version = version
            existing.vendor = vendor
            existing.product = product
            existing.supported_formats = (
                list(supported_formats)
            )
            existing.required_fields = (
                list(required_fields)
            )
            existing.field_mappings = (
                dict(field_mappings)
            )
            existing.status = "active"

            session.commit()
            session.refresh(existing)

            definition = existing

        else:

            definition = ParserDefinition(
                parser_id=parser_id,
                version=version,
                vendor=vendor,
                product=product,
                supported_formats=list(
                    supported_formats
                ),
                required_fields=list(
                    required_fields
                ),
                field_mappings=dict(
                    field_mappings
                ),
                status="active",
            )

            session.add(definition)
            session.commit()
            session.refresh(definition)

    return {
        "status": "registered",
        "parser": {
            "id": parser.parser_id,
            "version": parser.version,
            "vendor": parser.vendor,
            "product": parser.product,
            "formats": parser.supported_formats,
        },
        "definition": {
            "id": definition.id,
            "parser_id": definition.parser_id,
            "version": definition.version,
            "vendor": definition.vendor,
            "product": definition.product,
            "supported_formats": (
                definition.supported_formats
            ),
            "required_fields": (
                definition.required_fields
            ),
            "field_mappings": (
                definition.field_mappings
            ),
            "status": definition.status,
        },
    }
@router.post(
    "/parsers/test"
)
def test_parser(
    request: dict,
):
    parser_id = request.get("parser_id")
    raw_data = request.get("raw_data", "")
    detected_format = request.get(
        "detected_format",
        "key_value",
    )

    if not parser_id:
        return {
            "status": "error",
            "message": "parser_id is required",
        }

    if not raw_data:
        return {
            "status": "error",
            "message": "raw_data is required",
        }

    parser = pipeline.parser_registry.get(
        parser_id
    )

    if parser is None:
        return {
            "status": "error",
            "message": f"Parser not found: {parser_id}",
        }

    can_parse = parser.can_parse(
        raw_data,
        detected_format,
    )

    if not can_parse:
        return {
            "status": "rejected",
            "parser": {
                "id": parser.parser_id,
                "version": parser.version,
                "vendor": parser.vendor,
                "product": parser.product,
                "formats": parser.supported_formats,
            },
            "can_parse": False,
            "message": (
                "The selected parser "
                "does not recognize this sample."
            ),
        }

    parsed = parser.parse(
        raw_data
    )

    return {
        "status": "success",
        "can_parse": True,
        "parser": {
            "id": parser.parser_id,
            "version": parser.version,
            "vendor": parser.vendor,
            "product": parser.product,
            "formats": parser.supported_formats,
        },
        "detected_format": detected_format,
        "raw_length": len(raw_data),
        "parsed": parsed,
    }

@router.post(
    "/replay"
)
def replay_event(
    request: ReplayRequest,
):

    result = replay_service.replay(
        raw_data=request.raw_data,
        original_sha256=request.original_sha256,
        reason=request.reason,
        parser_id=request.parser_id,
        parser_version=request.parser_version,
    )

    # Store successful replay result.
    if result["status"] == "processed":

        event_store.save(
            result["result"]
        )

    return result

@router.post(
    "/parsers/replay"
)
def replay_registered_parser(
    request: dict,
):
    quarantine_id = request.get(
        "quarantine_id"
    )

    parser_id = request.get(
        "parser_id"
    )

    if not quarantine_id:
        raise HTTPException(
            status_code=400,
            detail="quarantine_id is required",
        )

    if not parser_id:
        raise HTTPException(
            status_code=400,
            detail="parser_id is required",
        )

    # Verify the parser exists.
    parser = pipeline.parser_registry.get(
        parser_id
    )

    if parser is None:
        raise HTTPException(
            status_code=404,
            detail=f"Parser not found: {parser_id}",
        )

    # Retrieve the preserved raw evidence.
    quarantine = pipeline.quarantine_store.get(
        quarantine_id
    )

    if quarantine is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Quarantine event not found: "
                f"{quarantine_id}"
            ),
        )

    # Replay the exact preserved raw event.
    result = replay_service.replay(
        raw_data=quarantine["raw_data"],
        original_sha256=quarantine["raw_sha256"],
        reason=(
            f"Parser Studio replay using "
            f"{parser_id}"
        ),
    )

    # Successful replay becomes a normal event.
    if result["status"] == "processed":
        event_store.save(
            result["result"]
        )

    return {
        "status": result["status"],
        "quarantine_id": quarantine_id,
        "parser_id": parser_id,
        "original_sha256": (
            quarantine["raw_sha256"]
        ),
        "replay": result,
    }

@router.get(
    "/replay/history"
)
def replay_history():

    history = replay_service.list_history()

    return {
        "count": len(history),
        "history": history,
    }