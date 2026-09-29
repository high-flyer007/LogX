from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.db import QuarantineRecord


class QuarantineStore:

    def add(
        self,
        event_id: str,
        raw_data: str,
        raw_sha256: str,
        reason: str,
        validation_errors: List[str] | None = None,
        detection: Dict[str, Any] | None = None,
        analysis: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:

        with SessionLocal() as session:

            # Generate a stable quarantine identifier.
            existing_count = session.query(
                QuarantineRecord
            ).count()

            quarantine_id = (
                f"Q-{existing_count + 1:06d}"
            )

            record = QuarantineRecord(
                quarantine_id=quarantine_id,
                event_id=event_id,
                raw_data=raw_data,
                raw_sha256=raw_sha256,
                reason=reason,
                validation_errors=(
                    validation_errors or []
                ),
                detection=detection or {},
                analysis=analysis or {},
                status="quarantined",
                quarantined_at=datetime.now(
                    timezone.utc
                ),
            )

            session.add(record)
            session.commit()
            session.refresh(record)

            return self._to_dict(record)

    def list_all(self) -> List[Dict[str, Any]]:

        with SessionLocal() as session:

            statement = (
                select(QuarantineRecord)
                .order_by(
                    QuarantineRecord.quarantined_at.desc()
                )
            )

            records = session.scalars(
                statement
            ).all()

            return [
                self._to_dict(record)
                for record in records
            ]

    def get(
        self,
        quarantine_id: str,
    ) -> Dict[str, Any] | None:

        with SessionLocal() as session:

            statement = select(
                QuarantineRecord
            ).where(
                QuarantineRecord.quarantine_id
                == quarantine_id
            )

            record = session.scalar(statement)

            if record is None:
                return None

            return self._to_dict(record)

    def count(self) -> int:

        with SessionLocal() as session:

            statement = select(
                QuarantineRecord
            )

            return len(
                session.scalars(statement).all()
            )

    @staticmethod
    def _to_dict(
        record: QuarantineRecord,
    ) -> Dict[str, Any]:

        return {
            "quarantine_id": record.quarantine_id,
            "event_id": record.event_id,
            "raw_data": record.raw_data,
            "raw_sha256": record.raw_sha256,
            "reason": record.reason,
            "validation_errors": (
                record.validation_errors or []
            ),
            "detection": record.detection or {},
            "analysis": record.analysis or {},
            "quarantined_at": (
                record.quarantined_at.isoformat()
                if record.quarantined_at
                else None
            ),
            "status": record.status,
        }