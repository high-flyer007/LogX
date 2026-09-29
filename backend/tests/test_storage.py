from sqlalchemy import delete

from app.core.database import (
    SessionLocal,
    engine,
    init_db,
)

from app.models.db import EventRecord

from app.services.event_store import (
    EventStore,
)


def setup_module():

    init_db()

    with SessionLocal() as session:
        session.execute(
            delete(EventRecord)
        )
        session.commit()


def teardown_module():

    engine.dispose()


def test_event_can_be_saved():

    store = EventStore()

    result = {
        "event_id": "event-storage-001",
        "ingest_id": "ingest-001",
        "status": "processed",

        "raw": {
            "data": "srcip=10.0.0.5",
            "format": "key_value",
            "sha256": "a" * 64,
        },

        "device": {
            "product": "FortiGate",
        },

        "event": {
            "action": "deny",
        },
    }

    record = store.save(
        result
    )

    assert record.event_id == (
        "event-storage-001"
    )

    assert record.raw_sha256 == (
        "a" * 64
    )


def test_event_can_be_retrieved():

    store = EventStore()

    result = {
        "event_id": "event-storage-002",
        "ingest_id": "ingest-002",
        "status": "processed",

        "raw": {
            "data": "test-event",
            "format": "syslog",
            "sha256": "b" * 64,
        },

        "device": {
            "product": "Cisco ASA",
        },
    }

    store.save(result)

    retrieved = store.get(
        "event-storage-002"
    )

    assert retrieved is not None

    assert retrieved.event_id == (
        "event-storage-002"
    )

    assert retrieved.raw_data == (
        "test-event"
    )


def test_event_count():

    store = EventStore()

    result = {
        "event_id": "event-storage-003",
        "ingest_id": "ingest-003",
        "status": "processed",

        "raw": {
            "data": "count-test",
            "format": "json",
            "sha256": "c" * 64,
        },

        "device": {
            "product": "Test",
        },
    }

    store.save(result)

    assert store.count() >= 1


def test_event_listing():

    store = EventStore()

    events = store.list_events(
        limit=10
    )

    assert len(events) >= 1