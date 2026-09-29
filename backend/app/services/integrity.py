import hashlib


def calculate_sha256(data: str) -> str:
    """
    Calculate SHA-256 fingerprint of the exact raw event.
    """

    return hashlib.sha256(
        data.encode("utf-8")
    ).hexdigest()


def verify_sha256(data: str, expected_hash: str) -> bool:
    """
    Verify that raw data has not changed.
    """

    actual_hash = calculate_sha256(data)

    return actual_hash == expected_hash