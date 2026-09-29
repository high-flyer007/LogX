from typing import Any, Dict, List, Optional

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.db import EventRecord


class EventStore:

    def save(
        self,
        result: Dict[str, Any],
    ) -> EventRecord:

        raw = result.get(
            "raw",
            {},
        )

        record = EventRecord(
            event_id=result["event_id"],
            ingest_id=result["ingest_id"],
            status=result["status"],
            source_type=(
                result.get(
                    "device",
                    {},
                ).get(
                    "product",
                    "unknown",
                )
            ),
            raw_format=raw.get(
                "format",
                "unknown",
            ),
            raw_data=raw.get(
                "data",
                "",
            ),
            raw_sha256=raw.get(
                "sha256",
                "",
            ),
            normalized_event=result,
        )

        with SessionLocal() as session:

            session.add(record)

            session.commit()

            session.refresh(record)

            return record

    def get(
        self,
        event_id: str,
    ) -> Optional[EventRecord]:

        with SessionLocal() as session:

            statement = select(
                EventRecord
            ).where(
                EventRecord.event_id
                == event_id
            )

            return session.scalar(
                statement
            )

    def list_events(
        self,
        limit: int = 100,
    ) -> List[EventRecord]:

        with SessionLocal() as session:

            statement = (
                select(EventRecord)
                .order_by(
                    EventRecord.created_at.desc()
                )
                .limit(limit)
            )

            return list(
                session.scalars(
                    statement
                ).all()
            )

    def count(self) -> int:

        with SessionLocal() as session:

            statement = select(
                EventRecord
            )

            return len(
                session.scalars(
                    statement
                ).all()
            )