from pathlib import Path

import pytest

from app.services.pipeline import LogXPipeline


GOLDEN_DIR = Path(__file__).parent / "fixtures" / "golden"


GOLDEN_CASES = [
    ("fortigate.log", "fortigate.traffic"),
    ("syslog.log", "syslog"),
    ("generic.json", "generic.json"),
    ("generic.csv", "generic.csv"),
    ("cef.log", "generic.cef"),
    ("leef.log", "generic.leef"),
    ("suricata.json", "suricata.eve"),
    ("zeek.log", "zeek.conn"),
    ("cisco_asa.log", "cisco.asa"),
    ("palo_alto.log", "paloalto.traffic"),
]


@pytest.fixture
def pipeline():
    return LogXPipeline()


@pytest.mark.parametrize(
    "filename,expected_parser",
    GOLDEN_CASES,
)
def test_golden_fixture_processing(
    pipeline,
    filename,
    expected_parser,
):
    fixture_path = GOLDEN_DIR / filename

    assert fixture_path.exists(), (
        f"Golden fixture missing: {fixture_path}"
    )

    raw_data = fixture_path.read_text(
        encoding="utf-8"
    )

    result = pipeline.process(raw_data)

    assert result["status"] == "processed", (
        f"{filename} was not processed successfully: "
        f"{result}"
    )

    assert result["parser"]["id"] == expected_parser, (
        f"{filename} selected parser "
        f"{result['parser']['id']} instead of "
        f"{expected_parser}"
    )

    assert result["raw"]["data"] == raw_data

    assert result["raw"]["sha256"]

    assert result["quality"]["status"] == "valid"

    assert "lineage" in result

    assert isinstance(
        result["lineage"],
        list,
    )