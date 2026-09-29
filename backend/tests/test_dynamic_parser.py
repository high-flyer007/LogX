from pathlib import Path

from app.services.pipeline import LogXPipeline


GOLDEN_DIR = Path(__file__).parent / "fixtures" / "golden"


def test_dynamic_parser_registration_and_processing():
    pipeline = LogXPipeline()

    fixture = GOLDEN_DIR / "custom_keyvalue.log"
    raw_data = fixture.read_text(encoding="utf-8").strip()

    # ---------------------------------------------------------
    # 1. Before registration: parser should not exist
    # ---------------------------------------------------------
    before = pipeline.process(raw_data)

    assert before["status"] == "quarantined"
    assert before["raw"]["data"] == raw_data
    assert before["raw"]["sha256"]

    # ---------------------------------------------------------
    # 2. Register a configurable parser
    # ---------------------------------------------------------
    parser_definition = {
        "parser_id": "custom.firewall",
        "version": "1.0.0",
        "vendor": "Custom",
        "product": "Custom Firewall",
        "supported_formats": ["key_value"],
        "required_fields": ["src", "dst", "proto"],
        "field_mappings": {
            "src": "source.ip",
            "dst": "destination.ip",
            "proto": "network.protocol",
        },
    }

    pipeline.parser_registry.register_configurable(
    "custom.firewall",
    "1.0.0",
    "Custom",
    "Custom Firewall",
    ["key_value"],
    ["src", "dst", "proto"],
    {
        "src": "source.ip",
        "dst": "destination.ip",
        "proto": "network.protocol",
    },
)

    # ---------------------------------------------------------
    # 3. Process the same telemetry again
    # ---------------------------------------------------------
    after = pipeline.process(
        raw_data,
        parser_id="custom.firewall",
        parser_version="1.0.0",
    )

    # ---------------------------------------------------------
    # 4. Verify successful processing
    # ---------------------------------------------------------
    assert after["status"] == "processed"

    assert after["parser"]["id"] == "custom.firewall"
    assert after["parser"]["version"] == "1.0.0"

    # ---------------------------------------------------------
    # 5. Raw evidence must remain intact
    # ---------------------------------------------------------
    assert after["raw"]["data"] == raw_data
    assert after["raw"]["sha256"]

    # ---------------------------------------------------------
    # 6. Verify normalized fields
    # ---------------------------------------------------------
    assert after["source"]["ip"] == "10.0.0.100"
    assert after["destination"]["ip"] == "172.16.0.100"
    assert after["network"]["protocol"] == "TCP"

    # ---------------------------------------------------------
    # 7. Verify quality
    # ---------------------------------------------------------
    assert after["quality"]["status"] == "valid"

    # ---------------------------------------------------------
    # 8. Verify field lineage
    # ---------------------------------------------------------
    assert isinstance(after["lineage"], list)
    assert len(after["lineage"]) >= 3

    lineage_targets = {
        item["target_field"]
        for item in after["lineage"]
    }

    assert "source.ip" in lineage_targets
    assert "destination.ip" in lineage_targets
    assert "network.protocol" in lineage_targets