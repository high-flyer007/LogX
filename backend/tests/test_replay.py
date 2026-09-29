from app.services.pipeline import LogXPipeline
from app.services.replay import ReplayService


FORTIGATE_LOG = (
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


def test_replay_preserves_integrity():

    pipeline = LogXPipeline()

    replay_service = ReplayService(
        pipeline
    )

    original = pipeline.process(
        FORTIGATE_LOG
    )

    result = replay_service.replay(
        raw_data=FORTIGATE_LOG,
        original_sha256=(
            original["raw"]["sha256"]
        ),
        reason="parser reprocessing",
    )

    assert result[
        "integrity_preserved"
    ] is True


def test_replay_success():

    pipeline = LogXPipeline()

    replay_service = ReplayService(
        pipeline
    )

    original = pipeline.process(
        FORTIGATE_LOG
    )

    result = replay_service.replay(
        raw_data=FORTIGATE_LOG,
        original_sha256=(
            original["raw"]["sha256"]
        ),
    )

    assert result["status"] == "processed"

    assert result["result"]["parser"]["id"] == (
        "fortigate.traffic"
    )


def test_replay_history():

    pipeline = LogXPipeline()

    replay_service = ReplayService(
        pipeline
    )

    original = pipeline.process(
        FORTIGATE_LOG
    )

    replay_service.replay(
        raw_data=FORTIGATE_LOG,
        original_sha256=(
            original["raw"]["sha256"]
        ),
    )

    assert replay_service.count() == 1

    assert len(
        replay_service.list_history()
    ) == 1

def test_replay_comparison_detects_field_changes():
    before = {
        "event": {
            "action": "allow",
        },
        "source": {
            "ip": "10.0.0.10",
        },
        "destination": {
            "ip": "172.16.0.10",
        },
        "network": {
            "protocol": "TCP",
        },
        "raw": {
            "sha256": "original",
        },
    }

    after = {
        "event": {
            "action": "deny",
        },
        "source": {
            "ip": "10.0.0.10",
        },
        "destination": {
            "ip": "172.16.0.10",
        },
        "network": {
            "protocol": "TCP",
        },
        "threat": {
            "severity": "high",
        },
        "raw": {
            "sha256": "same-evidence",
        },
    }

    comparison = ReplayService._compare_results(
        before,
        after,
    )

    assert comparison["summary"]["changed"] == 1
    assert comparison["summary"]["added"] == 1
    assert comparison["summary"]["removed"] == 0
    assert comparison["summary"]["unchanged"] == 3

    assert comparison["changed"] == [
        {
            "field": "event.action",
            "before": "allow",
            "after": "deny",
        }
    ]

    assert comparison["added"] == [
        {
            "field": "threat.severity",
            "before": None,
            "after": "high",
        }
    ]