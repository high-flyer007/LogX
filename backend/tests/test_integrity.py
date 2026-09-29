from app.services.integrity import calculate_sha256, verify_sha256


def test_sha256_generation():
    data = "LogX security event"

    result = calculate_sha256(data)

    assert len(result) == 64
    assert result == calculate_sha256(data)


def test_sha256_verification():
    data = "LogX security event"

    hash_value = calculate_sha256(data)

    assert verify_sha256(data, hash_value)


def test_sha256_detects_tampering():
    original = "LogX security event"

    hash_value = calculate_sha256(original)

    modified = "Modified security event"

    assert not verify_sha256(modified, hash_value)