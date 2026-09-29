from app.services.pipeline import LogXPipeline


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


def test_fortigate_field_lineage():

    pipeline = LogXPipeline()

    result = pipeline.process(
        FORTIGATE_LOG
    )

    lineage = result["lineage"]

    assert len(lineage) >= 8


def test_source_ip_lineage():

    pipeline = LogXPipeline()

    result = pipeline.process(
        FORTIGATE_LOG
    )

    source_ip = next(
        item
        for item in result["lineage"]
        if item["target_field"] == "source.ip"
    )

    assert source_ip["source_field"] == "srcip"

    assert source_ip["original_value"] == "10.0.0.5"

    assert source_ip["normalized_value"] == "10.0.0.5"

    assert source_ip["parser_id"] == (
        "fortigate.traffic"
    )

    assert source_ip["parser_version"] == "1.0.0"

    assert source_ip["raw_sha256"] == (
        result["raw"]["sha256"]
    )


def test_destination_port_lineage():

    pipeline = LogXPipeline()

    result = pipeline.process(
        FORTIGATE_LOG
    )

    destination_port = next(
        item
        for item in result["lineage"]
        if item["target_field"]
        == "destination.port"
    )

    assert destination_port[
        "source_field"
    ] == "dstport"

    assert destination_port[
        "original_value"
    ] == "443"

    assert destination_port[
        "normalized_value"
    ] == 443


def test_protocol_normalization():

    pipeline = LogXPipeline()

    result = pipeline.process(
        FORTIGATE_LOG
    )

    assert result["network"]["protocol"] == "tcp"