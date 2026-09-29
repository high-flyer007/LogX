from app.services.validator import EventValidator


validator = EventValidator()


def test_valid_event():

    event = {
        "source": {
            "ip": "10.0.0.5",
            "port": 51542,
        },
        "destination": {
            "ip": "8.8.8.8",
            "port": 443,
        },
        "network": {
            "protocol": "tcp",
        },
    }

    result = validator.validate(event)

    assert result.status == "valid"
    assert result.errors == []


def test_invalid_source_ip():

    event = {
        "source": {
            "ip": "999.999.999.999",
        },
    }

    result = validator.validate(event)

    assert result.status == "invalid"

    assert any(
        "source.ip" in error
        for error in result.errors
    )


def test_invalid_destination_port():

    event = {
        "destination": {
            "port": 70000,
        },
    }

    result = validator.validate(event)

    assert result.status == "invalid"

    assert any(
        "destination.port" in error
        for error in result.errors
    )


def test_unknown_protocol_warning():

    event = {
        "network": {
            "protocol": "custom-protocol",
        },
    }

    result = validator.validate(event)

    assert result.status == "warning"

    assert len(result.warnings) == 1