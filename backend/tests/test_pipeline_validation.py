from app.services.pipeline import LogXPipeline


VALID_FORTIGATE_LOG = (
    'date=2026-09-19 '
    'time=18:30:00 '
    'devname="FGT-01" '
    'devid="FG123" '
    'logid="0000000013" '
    'type="traffic" '
    'subtype="forward" '
    'srcip=10.0.0.5 '
    'srcport=51542 '
    'dstip=8.8.8.8 '
    'dstport=443 '
    'proto=6 '
    'sentbyte=1024 '
    'action="deny" '
    'policyid=10'
)


INVALID_FORTIGATE_LOG = (
    'date=2026-09-19 '
    'time=18:30:00 '
    'devname="FGT-01" '
    'devid="FG123" '
    'logid="0000000013" '
    'type="traffic" '
    'subtype="forward" '
    'srcip=999.999.999.999 '
    'srcport=51542 '
    'dstip=8.8.8.8 '
    'dstport=443 '
    'proto=6 '
    'action="deny" '
    'policyid=10'
)


def test_valid_event_passes_validation():

    pipeline = LogXPipeline()

    result = pipeline.process(
        VALID_FORTIGATE_LOG
    )

    assert result["status"] == "processed"

    assert result["validation"]["status"] == "valid"

    assert result["quality"]["status"] == "valid"


def test_invalid_event_goes_to_quarantine():

    pipeline = LogXPipeline()

    result = pipeline.process(
        INVALID_FORTIGATE_LOG
    )

    assert result["status"] == "quarantined"

    assert result["validation"]["status"] == "invalid"

    assert result["quarantine"]["status"] == (
        "quarantined"
    )

    assert result["quarantine"]["raw_data"] == (
        INVALID_FORTIGATE_LOG
    )


def test_quarantine_preserves_hash():

    pipeline = LogXPipeline()

    result = pipeline.process(
        INVALID_FORTIGATE_LOG
    )

    assert result["raw"]["sha256"] == (
        result["quarantine"]["raw_sha256"]
    )


def test_quarantine_store_contains_event():

    pipeline = LogXPipeline()

    pipeline.process(
        INVALID_FORTIGATE_LOG
    )

    assert (
        pipeline.quarantine_store.count()
        == 1
    )