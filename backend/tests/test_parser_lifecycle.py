from app.services.integrity import calculate_sha256
from app.services.pipeline import LogXPipeline
from app.services.replay import ReplayService


CUSTOM_LOG = (
    "time=2026-09-26T11:00:00Z "
    "src=10.0.0.40 "
    "dst=172.16.0.20 "
    "proto=TCP "
    "action=blocked"
)


def test_parser_lifecycle():
    pipeline = LogXPipeline()

    parser_id = "unknown.lifecycle_test"
    parser_version = "1.0.0"

    parser = pipeline.parser_registry.register_configurable(
        parser_id=parser_id,
        version=parser_version,
        vendor="Test Vendor",
        product="Lifecycle Firewall",
        supported_formats=("key_value",),
        required_fields=["src", "dst", "proto"],
        field_mappings={
            "src": "source.ip",
            "dst": "destination.ip",
            "proto": "network.protocol",
        },
    )

    assert parser.parser_id == parser_id
    assert parser.version == parser_version

    result = pipeline.process(CUSTOM_LOG)

    assert result["status"] == "processed"
    assert result["parser"]["id"] == parser_id
    assert result["parser"]["version"] == parser_version

    raw_sha256 = result["raw"]["sha256"]

    assert raw_sha256 == calculate_sha256(CUSTOM_LOG)

    replay_service = ReplayService(pipeline)

    replay = replay_service.replay(
        raw_data=CUSTOM_LOG,
        original_sha256=raw_sha256,
        parser_id=parser_id,
        parser_version=parser_version,
        reason="Lifecycle regression test",
    )

    assert replay["status"] == "processed"
    assert replay["parser"]["id"] == parser_id
    assert replay["parser"]["version"] == parser_version

    assert (
        replay["original_sha256"]
        == replay["replayed_sha256"]
    )

    assert replay["integrity_preserved"] is True