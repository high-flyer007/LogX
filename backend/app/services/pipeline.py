from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4

from app.parsers.registry import ParserRegistry
from app.services.format_detector import FormatDetector
from app.services.integrity import calculate_sha256
from app.services.source_detector import SourceDetector
from app.services.parser_analyzer import ParserAnalyzer

from app.models.events import LogXEvent
# from app.services.lineage import create_fortigate_lineage
from app.services.lineage import (
    create_fortigate_lineage,
    create_json_lineage,
    create_syslog_lineage,
    create_csv_lineage,
    create_cef_lineage,
    create_leef_lineage,
    create_suricata_lineage,
    create_zeek_lineage,
    create_cisco_asa_lineage,
    create_palo_alto_lineage,
    create_configurable_lineage,
)
from app.services.quarantine import QuarantineStore
from app.services.validator import EventValidator

class LogXPipeline:

    def __init__(self) -> None:

        self.format_detector = FormatDetector()
        self.source_detector = SourceDetector()
        self.parser_registry = ParserRegistry()
        self.validator = EventValidator()
        self.quarantine_store = QuarantineStore()
        self.parser_analyzer = ParserAnalyzer()

    def process(
        self,
        raw_data: str,
        parser_id: str | None = None,
        parser_version: str | None = None,
    ) -> Dict[str, Any]:

        ingest_id = str(uuid4())
        event_id = str(uuid4())

        received_at = datetime.now(
            timezone.utc
        ).isoformat()

        # -------------------------------------------------
        # STEP 1 — RAW PRESERVATION
        # -------------------------------------------------

        raw_hash = calculate_sha256(
            raw_data
        )

        # -------------------------------------------------
        # STEP 2 — FORMAT DETECTION
        # -------------------------------------------------

        format_result = self.format_detector.detect(
            raw_data
        )

        detected_format = format_result["format"]

        # -------------------------------------------------
        # STEP 3 — SOURCE DETECTION
        # -------------------------------------------------

        source_result = self.source_detector.detect(
            raw_data,
            detected_format,
        )

        detected_source = source_result["source"]

        # -------------------------------------------------
        # STEP 4 — PARSER SELECTION
        # -------------------------------------------------

        if parser_id:
            parser = self.parser_registry.get(parser_id)

            if parser is None:
                raise ValueError(
                    f"Parser not found: {parser_id}"
                )

            if parser_version and parser.version != parser_version:
                raise ValueError(
                    f"Parser version mismatch: "
                    f"requested {parser_id}@{parser_version}, "
                    f"available {parser.version}"
                )

            if not parser.can_parse(
                raw_data,
                detected_format,
            ):
                raise ValueError(
                    f"Parser {parser_id}@{parser.version} "
                    f"cannot parse detected format "
                    f"{detected_format}"
                )

        else:
            parser = self.parser_registry.find_parser(
                raw_data,
                detected_format,
                detected_source,
            )


        # -------------------------------------------------
        # UNKNOWN / UNSUPPORTED
        # -------------------------------------------------

        if parser is None:

            analysis = self.parser_analyzer.analyze(
                raw_data=raw_data,
                detected_format=detected_format,
                detected_source=detected_source,
            )

            quarantine_record = self.quarantine_store.add(
                event_id=event_id,
                raw_data=raw_data,
                raw_sha256=raw_hash,
                reason="No compatible parser found",
                detection={
                    "format": format_result,
                    "source": source_result,
                },
                analysis=analysis,
            )

            return {
                "status": "quarantined",

                "event_id": event_id,

                "ingest_id": ingest_id,

                "raw": {
                    "data": raw_data,
                    "format": detected_format,
                    "sha256": raw_hash,
                },

                "detection": {
                    "format": format_result,
                    "source": source_result,
                },

                "parser": None,

                "reason": "No compatible parser found",

                "analysis": analysis,

                "quarantine": quarantine_record,

                "provenance": {
                    "received_at": received_at,
                    "pipeline_version": "0.1.0",
                    "trace_id": ingest_id,
                },
            }
                # -------------------------------------------------
        # STEP 5 — PARSING
        # -------------------------------------------------

        parsed = parser.parse(
            raw_data
        )

        # -------------------------------------------------
        # STEP 6 — BUILD CANONICAL EVENT
        # -------------------------------------------------

        lineage = []

        if parser.parser_id == "fortigate.traffic":
            lineage = create_fortigate_lineage(
            parsed_fields=parsed.get("metadata", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "generic.json":
            lineage = create_json_lineage(
            parsed_fields=parsed.get("lineage_source", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "generic.syslog":
            lineage = create_syslog_lineage(
            parsed_fields=parsed.get("lineage_source", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "generic.csv":
            lineage = create_csv_lineage(
            parsed_fields=parsed.get("lineage_source", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "generic.cef":
            lineage = create_cef_lineage(
            parsed_fields=parsed.get("lineage_source", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "generic.leef":
            lineage = create_leef_lineage(
            parsed_fields=parsed.get("lineage_source", {}),
            raw_sha256=raw_hash,
            parser_id=parser.parser_id,
            parser_version=parser.version,
        )

        elif parser.parser_id == "suricata.eve":
            lineage = create_suricata_lineage(
                parsed_fields=parsed.get(
                    "lineage_source",
                    {},
                ),
                raw_sha256=raw_hash,
                parser_id=parser.parser_id,
                parser_version=parser.version,
        )

        elif parser.parser_id == "zeek.conn":
            lineage = create_zeek_lineage(
                parsed_fields=parsed.get(
                    "lineage_source",
                    {},
                ),
                raw_sha256=raw_hash,
                parser_id=parser.parser_id,
                parser_version=parser.version,
        )

        elif parser.parser_id == "cisco_asa.syslog":
            lineage = create_cisco_asa_lineage(
                parsed_fields=parsed.get("lineage_source", {}),
                raw_sha256=raw_hash,
                parser_id=parser.parser_id,
                parser_version=parser.version,
            )

        elif parser.parser_id == "palo_alto.traffic":
            lineage = create_palo_alto_lineage(
                parsed_fields=parsed.get("lineage_source", {}),
                raw_sha256=raw_hash,
                parser_id=parser.parser_id,
                parser_version=parser.version,
            )

        elif hasattr(parser, "field_mappings"):
            lineage = create_configurable_lineage(
                parsed_fields=parsed.get(
                    "lineage_source",
                    {},
                ),
                field_mappings=parser.field_mappings,
                raw_sha256=raw_hash,
                parser_id=parser.parser_id,
                parser_version=parser.version,
            )
        logx_event = LogXEvent(
            event=parsed.get(
                "event",
                {},
            ),

            source=parsed.get(
                "source",
                {},
            ),

            destination=parsed.get(
                "destination",
                {},
            ),

            network=parsed.get(
                "network",
                {},
            ),

             user=parsed.get(
                "user",
                {},
            ),

            device=parsed.get(
                "device",
                {},
            ),

            threat=parsed.get(
                "threat",
                {},
            ),

            raw={
                "data": raw_data,
                "format": detected_format,
                "sha256": raw_hash,
            },

            parser={
                "id": parser.parser_id,
                "version": parser.version,
                "vendor": parser.vendor,
                "product": parser.product,
            },

            quality={
                "status": "valid",
                "format_confidence": format_result[
                    "confidence"
                ],
                "source_confidence": source_result[
                    "confidence"
                ],
                "warnings": [],
            },

            lineage=lineage,

            provenance={
                "received_at": received_at,
                "pipeline_version": "0.1.0",
                "trace_id": ingest_id,
            },

            unmapped={
                "metadata": parsed.get(
                    "metadata",
                    {},
                )
            },
        )

        # -------------------------------------------------
        # STEP 7 — VALIDATION
        # -------------------------------------------------

        validation_result = self.validator.validate(
            logx_event.model_dump(
                by_alias=True
            )
        )

        # -------------------------------------------------
        # STEP 8 — QUARANTINE INVALID EVENTS
        # -------------------------------------------------

        if validation_result.status == "invalid":

            quarantine_record = (
                self.quarantine_store.add(
                    event_id=event_id,
                    raw_data=raw_data,
                    raw_sha256=raw_hash,
                    reason="Validation failed",
                    validation_errors=(
                        validation_result.errors
                    ),
                    detection={
                        "format": format_result,
                        "source": source_result,
                        "parser": {
                            "id": parser.parser_id,
                            "version": parser.version,
                        },
                    },
                )
            )

            return {
                "status": "quarantined",

                "event_id": event_id,

                "ingest_id": ingest_id,

                "raw": {
                    "data": raw_data,
                    "format": detected_format,
                    "sha256": raw_hash,
                },

                "validation": (
                    validation_result.to_dict()
                ),

                "quarantine": quarantine_record,

                "parser": {
                    "id": parser.parser_id,
                    "version": parser.version,
                },

                "provenance": {
                    "received_at": received_at,
                    "pipeline_version": "0.1.0",
                    "trace_id": ingest_id,
                },
            }

        # -------------------------------------------------
        # STEP 9 — VALID / WARNING EVENT
        # -------------------------------------------------

        quality = logx_event.quality

        quality["status"] = (
            validation_result.status
        )

        quality["validation_errors"] = (
            validation_result.errors
        )

        quality["warnings"] = (
            validation_result.warnings
        )

        logx_event.quality = quality

        return {
            "status": "processed",

            **logx_event.model_dump(
                by_alias=True
            ),

            "event_id": event_id,

            "ingest_id": ingest_id,

            "validation": (
                validation_result.to_dict()
            ),
        }