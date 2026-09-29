from typing import Any, Dict, List

from app.core.database import SessionLocal
from app.models.db import EventRecord, ReplayRecord


class ReplayService:

    def __init__(self, pipeline):
        self.pipeline = pipeline

    @staticmethod
    def _compare_results(
        before: Dict[str, Any],
        after: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compare normalized event data before and after replay.

        Raw evidence and processing metadata are excluded from the
        normalized field comparison because evidence integrity is
        verified separately using SHA-256.
        """

        ignored_keys = {
            "raw",
            "lineage",
            "provenance",
            "quality",
            "parse_warnings",
        }

        before_fields: Dict[str, Any] = {}
        after_fields: Dict[str, Any] = {}

        for section, value in (before or {}).items():
            if section in ignored_keys:
                continue

            if isinstance(value, dict):
                for field, field_value in value.items():
                    before_fields[f"{section}.{field}"] = field_value
            else:
                before_fields[section] = value

        for section, value in (after or {}).items():
            if section in ignored_keys:
                continue

            if isinstance(value, dict):
                for field, field_value in value.items():
                    after_fields[f"{section}.{field}"] = field_value
            else:
                after_fields[section] = value

        all_fields = sorted(
            set(before_fields) | set(after_fields)
        )

        changed = []
        added = []
        removed = []
        unchanged = []

        for field in all_fields:

            if field not in before_fields:
                added.append(
                    {
                        "field": field,
                        "before": None,
                        "after": after_fields[field],
                    }
                )

            elif field not in after_fields:
                removed.append(
                    {
                        "field": field,
                        "before": before_fields[field],
                        "after": None,
                    }
                )

            elif before_fields[field] != after_fields[field]:
                changed.append(
                    {
                        "field": field,
                        "before": before_fields[field],
                        "after": after_fields[field],
                    }
                )

            else:
                unchanged.append(
                    {
                        "field": field,
                        "value": before_fields[field],
                    }
                )

        return {
            "changed": changed,
            "added": added,
            "removed": removed,
            "unchanged": unchanged,
            "summary": {
                "changed": len(changed),
                "added": len(added),
                "removed": len(removed),
                "unchanged": len(unchanged),
            },
        }

    def replay(
        self,
        raw_data: str,
        original_sha256: str,
        reason: str = "manual replay",
        parser_id: str | None = None,
        parser_version: str | None = None,
    ) -> Dict[str, Any]:

        # ---------------------------------------------------------
        # 1. Retrieve the original persisted event
        # ---------------------------------------------------------
        with SessionLocal() as session:
            original_event = (
                session.query(EventRecord)
                .filter(
                    EventRecord.raw_sha256 == original_sha256
                )
                .order_by(
                    EventRecord.created_at.desc()
                )
                .first()
            )

            before_result = (
                original_event.normalized_event
                if original_event
                else {}
            )

        # ---------------------------------------------------------
        # 2. Replay the raw evidence
        # ---------------------------------------------------------
        try:
            result = self.pipeline.process(
                raw_data,
                parser_id=parser_id,
                parser_version=parser_version,
            )

        except ValueError as exc:
            result = {
                "status": "failed",
                "reason": str(exc),
                "parser": {
                    "id": parser_id,
                    "version": parser_version,
                },
            }

        # ---------------------------------------------------------
        # 3. Extract replay metadata
        # ---------------------------------------------------------
        replayed_sha256 = (
            result.get("raw", {}).get("sha256")
        )

        status = result.get("status")

        selected_parser = result.get("parser") or {
            "id": parser_id,
            "version": parser_version,
        }

        # ---------------------------------------------------------
        # 4. Compare original normalized event vs replay result
        # ---------------------------------------------------------
        comparison = self._compare_results(
            before_result,
            result,
        )

        # ---------------------------------------------------------
        # 5. Verify evidence integrity
        # ---------------------------------------------------------
        integrity_preserved = (
            original_sha256 == replayed_sha256
        )

        # ---------------------------------------------------------
        # 6. Persist replay record
        # ---------------------------------------------------------
        replay_result = {
            **result,
            "replay_comparison": comparison,
        }

        with SessionLocal() as session:
            record = ReplayRecord(
                original_sha256=original_sha256,
                replayed_sha256=replayed_sha256 or "",
                reason=reason,
                status=status or "failed",
                integrity_preserved=integrity_preserved,
                result=replay_result,
            )

            session.add(record)
            session.commit()
            session.refresh(record)

            replay_id = record.id

        # ---------------------------------------------------------
        # 7. Return replay response
        # ---------------------------------------------------------
        return {
            "status": status,
            "replay_id": replay_id,
            "original_sha256": original_sha256,
            "replayed_sha256": replayed_sha256,
            "integrity_preserved": integrity_preserved,
            "parser": selected_parser,
            "comparison": comparison,
            "result": result,
        }

    def list_history(
        self,
    ) -> List[Dict[str, Any]]:

        with SessionLocal() as session:

            records = (
                session.query(ReplayRecord)
                .order_by(
                    ReplayRecord.created_at.desc()
                )
                .all()
            )

            history = []

            for record in records:

                parser = (
                    record.result.get("parser")
                    if record.result
                    else None
                )

                history.append(
                    {
                        "id": record.id,
                        "original_sha256": (
                            record.original_sha256
                        ),
                        "replayed_sha256": (
                            record.replayed_sha256
                        ),
                        "reason": record.reason,
                        "status": record.status,
                        "integrity_preserved": (
                            record.integrity_preserved
                        ),
                        "parser": parser,
                        "result": record.result,
                        "created_at": (
                            record.created_at.isoformat()
                            if record.created_at
                            else None
                        ),
                    }
                )

            return history

    def count(self) -> int:

        with SessionLocal() as session:
            return session.query(
                ReplayRecord
            ).count()