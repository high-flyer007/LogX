from app.services.format_detector import FormatDetector


detector = FormatDetector()


def test_detect_json():
    raw = '{"src_ip":"10.0.0.1","action":"deny"}'

    result = detector.detect(raw)

    assert result["format"] == "json"
    assert result["confidence"] > 0.9


def test_detect_cef():
    raw = (
        "CEF:0|SecurityVendor|Firewall|1.0|100|"
        "Connection Denied|8|src=10.0.0.1 dst=8.8.8.8"
    )

    result = detector.detect(raw)

    assert result["format"] == "cef"


def test_detect_leef():
    raw = (
        "LEEF:2.0|Vendor|Firewall|1.0|"
        "Connection|src=10.0.0.1\tdst=8.8.8.8"
    )

    result = detector.detect(raw)

    assert result["format"] == "leef"


def test_detect_syslog():
    raw = (
        "<134>Sep 19 18:20:00 firewall "
        "action=deny src=10.0.0.1 dst=8.8.8.8"
    )

    result = detector.detect(raw)

    assert result["format"] == "syslog"


def test_detect_key_value():
    raw = (
        "srcip=10.0.0.1 dstip=8.8.8.8 "
        "srcport=51542 dstport=443 action=deny"
    )

    result = detector.detect(raw)

    assert result["format"] == "key_value"


def test_detect_csv():
    raw = """timestamp,src_ip,dst_ip,action
2026-09-19T18:20:00Z,10.0.0.1,8.8.8.8,deny
2026-09-19T18:21:00Z,10.0.0.2,1.1.1.1,allow"""

    result = detector.detect(raw)

    assert result["format"] == "csv"


def test_unknown_format():
    raw = "This is some completely unknown security telemetry"

    result = detector.detect(raw)

    assert result["format"] == "unknown"
    assert result["confidence"] == 0.0