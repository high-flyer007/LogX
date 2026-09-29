from app.services.quarantine import QuarantineStore


def test_quarantine_preserves_raw_event():

    store = QuarantineStore()

    raw = (
        "invalid telemetry "
        "srcip=999.999.999.999"
    )

    record = store.add(
        event_id="event-001",
        raw_data=raw,
        raw_sha256="abc123",
        reason="Validation failed",
        validation_errors=[
            "Invalid source.ip"
        ],
    )

    assert record["status"] == "quarantined"

    assert record["raw_data"] == raw

    assert record["raw_sha256"] == "abc123"

    assert record["validation_errors"] == [
        "Invalid source.ip"
    ]


def test_quarantine_retrieval():

    store = QuarantineStore()

    record = store.add(
        event_id="event-002",
        raw_data="bad event",
        raw_sha256="hash123",
        reason="Unsupported event",
    )

    result = store.get(
        record["quarantine_id"]
    )

    assert result is not None

    assert result["event_id"] == "event-002"


def test_quarantine_count():

    store = QuarantineStore()

    store.add(
        event_id="event-001",
        raw_data="bad 1",
        raw_sha256="hash1",
        reason="test",
    )

    store.add(
        event_id="event-002",
        raw_data="bad 2",
        raw_sha256="hash2",
        reason="test",
    )

    assert store.count() == 2