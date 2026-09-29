import pytest

from fastapi.testclient import TestClient

from app.main import app


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


@pytest.fixture
def client():

    with TestClient(app) as test_client:

        yield test_client


def test_health_endpoint(client):

    response = client.get(
        "/api/v1/health"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "LogX"

    assert data["status"] == "online"

    assert (
        data["components"]["pipeline"]
        == "online"
    )


def test_process_event_endpoint(client):

    response = client.post(
        "/api/v1/events/process",
        json={
            "raw_data": FORTIGATE_LOG
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "processed"

    assert data["result"]["parser"]["id"] == (
        "fortigate.traffic"
    )


def test_event_list_endpoint(client):

    response = client.get(
        "/api/v1/events"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["count"] >= 1


def test_parser_endpoint(client):

    response = client.get(
        "/api/v1/parsers"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["count"] >= 1

    parser_ids = [
        parser["id"]
        for parser in data["parsers"]
    ]

    assert (
        "fortigate.traffic"
        in parser_ids
    )


def test_unknown_event_endpoint(client):

    response = client.post(
        "/api/v1/events/process",
        json={
            "raw_data": (
                "mystery telemetry "
                "unknown_device=true"
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "quarantined"


def test_event_not_found(client):

    response = client.get(
        "/api/v1/events/nonexistent-event"
    )

    assert response.status_code == 404