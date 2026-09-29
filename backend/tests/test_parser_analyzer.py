from app.services.parser_analyzer import ParserAnalyzer


def test_analyze_unknown_key_value_log():
    analyzer = ParserAnalyzer()

    raw = (
        "time=2026-09-23T11:40:00Z "
        "src=10.0.0.40 "
        "dst=172.16.0.20 "
        "sport=51234 "
        "dport=443 "
        "proto=TCP "
        "decision=deny "
        "account=ali"
    )

    result = analyzer.analyze(
        raw_data=raw,
        detected_format="key_value",
        detected_source="unknown",
    )

    assert result["format"] == "key_value"
    assert result["source"] == "unknown"

    assert "ipv4_address" in result["patterns"]
    assert "network_protocol" in result["patterns"]

    fields = {
        item["source_field"]: item["candidate"]
        for item in result["field_candidates"]
    }

    assert fields["src"] == "source.ip"
    assert fields["dst"] == "destination.ip"
    assert fields["proto"] == "network.protocol"