from app.parsers.fortigate import FortiGateTrafficParser
from app.parsers.registry import ParserRegistry


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


def test_fortigate_can_parse():

    parser = FortiGateTrafficParser()

    assert parser.can_parse(
        FORTIGATE_LOG,
        "key_value",
    )


def test_fortigate_parse():

    parser = FortiGateTrafficParser()

    result = parser.parse(
        FORTIGATE_LOG
    )

    assert result["source"]["ip"] == "10.0.0.5"
    assert result["source"]["port"] == 51542

    assert result["destination"]["ip"] == "8.8.8.8"
    assert result["destination"]["port"] == 443

    assert result["event"]["action"] == "deny"

    assert result["device"]["vendor"] == "Fortinet"
    assert result["device"]["product"] == "FortiGate"


def test_registry_finds_fortigate_parser():

    registry = ParserRegistry()

    parser = registry.find_parser(
        FORTIGATE_LOG,
        "key_value",
        "fortigate",
    )

    assert parser is not None
    assert parser.parser_id == "fortigate.traffic"