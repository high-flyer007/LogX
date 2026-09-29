import pytest
from sqlalchemy import delete

from app.core.database import SessionLocal, init_db
from app.models.db import QuarantineRecord, ReplayRecord


@pytest.fixture(autouse=True)
def clean_test_records():
    """
    Keep tests isolated for persistent secondary records.

    EventRecord is intentionally preserved because existing
    API/storage tests rely on events created by previous tests.
    """

    init_db()

    with SessionLocal() as session:
        session.execute(delete(QuarantineRecord))
        session.execute(delete(ReplayRecord))
        session.commit()

    yield