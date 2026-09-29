from typing import Any, List

from app.models.events import FieldLineage


def create_lineage(
    source_field: str,
    target_field: str,
    original_value: Any,
    normalized_value: Any,
    parser_id: str,
    parser_version: str,
    raw_sha256: str,
    confidence: float = 1.0,
    extraction_method: str = "key_value",
) -> FieldLineage:

    return FieldLineage(
        target_field=target_field,
        source_field=source_field,
        original_value=original_value,
        normalized_value=normalized_value,
        extraction_method=extraction_method,
        parser_id=parser_id,
        parser_version=parser_version,
        confidence=confidence,
        raw_sha256=raw_sha256,
    )


def create_fortigate_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "srcip": "source.ip",
        "srcport": "source.port",
        "dstip": "destination.ip",
        "dstport": "destination.port",
        "proto": "network.protocol",
        "action": "event.action",
        "devname": "device.name",
        "devid": "device.id",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[
            source_field
        ]

        normalized_value = original_value

        if source_field in {
            "srcport",
            "dstport",
        }:

            try:
                normalized_value = int(
                    original_value
                )
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
            )
        )

    return lineage
def create_json_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "bytes": "network.bytes",
        "action": "event.action",
        "hostname": "device.name",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
            "bytes",
        }:
            try:
                normalized_value = int(original_value)
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="json",
            )
        )

    return lineage

def create_syslog_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "action": "event.action",
        "hostname": "device.name",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
        }:
            try:
                normalized_value = int(original_value)
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="syslog",
            )
        )

    return lineage

def create_csv_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "bytes": "network.bytes",
        "action": "event.action",
        "hostname": "device.name",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
            "bytes",
        }:
            try:
                normalized_value = int(original_value)
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="csv",
            )
        )

    return lineage

def create_cef_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "bytes": "network.bytes",
        "action": "event.action",
        "hostname": "device.name",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
            "bytes",
        }:
            try:
                normalized_value = int(original_value)
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="cef",
            )
        )

    return lineage

def create_leef_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "bytes": "network.bytes",
        "action": "event.action",
        "hostname": "device.name",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
            "bytes",
        }:
            try:
                normalized_value = int(original_value)
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="leef",
            )
        )

    return lineage

def create_suricata_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "action": "event.action",
        "hostname": "device.name",
        "user": "user.name",
        "signature": "threat.signature",
        "category": "threat.category",
        "severity": "threat.severity",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
        }:
            try:
                normalized_value = int(
                    original_value
                )
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="suricata",
            )
        )

    return lineage

def create_zeek_lineage(
    parsed_fields: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:

    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "orig_bytes": "network.orig_bytes",
        "resp_bytes": "network.resp_bytes",
    }

    lineage = []

    for source_field, target_field in mappings.items():

        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]
        normalized_value = original_value

        if source_field in {
            "src_port",
            "dst_port",
            "orig_bytes",
            "resp_bytes",
        }:
            try:
                normalized_value = int(
                    original_value
                )
            except (ValueError, TypeError):
                pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="zeek",
            )
        )

    return lineage

def create_cisco_asa_lineage(
    parsed_fields,
    raw_sha256,
    parser_id,
    parser_version,
):
    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "action": "event.action",
        "user": "user.name",
        "hostname": "device.name",
        "message_id": "event.code",
    }

    lineage = []

    for source_field, target_field in mappings.items():
        if source_field not in parsed_fields:
            continue

        value = parsed_fields[source_field]

        if value is None:
            continue

        lineage.append(
            {
                "target_field": target_field,
                "source_field": source_field,
                "original_value": value,
                "normalized_value": value,
                "extraction_method": "cisco_asa",
                "parser_id": parser_id,
                "parser_version": parser_version,
                "confidence": 1.0,
                "raw_sha256": raw_sha256,
            }
        )

    return lineage

def create_palo_alto_lineage(
    parsed_fields,
    raw_sha256,
    parser_id,
    parser_version,
):
    mappings = {
        "src_ip": "source.ip",
        "src_port": "source.port",
        "dst_ip": "destination.ip",
        "dst_port": "destination.port",
        "protocol": "network.protocol",
        "action": "event.action",
        "user": "user.name",
        "hostname": "device.name",
        "bytes": "network.bytes",
        "packets": "network.packets",
        "application": "network.application",
        "rule": "security.rule",
        "session_id": "event.session_id",
    }

    lineage = []

    for source_field, target_field in mappings.items():
        if source_field not in parsed_fields:
            continue

        value = parsed_fields[source_field]

        if value is None:
            continue

        normalized_value = value

        if source_field in {
            "src_port",
            "dst_port",
            "bytes",
            "packets",
        }:
            try:
                normalized_value = int(value)
            except (ValueError, TypeError):
                normalized_value = value

        lineage.append(
            {
                "target_field": target_field,
                "source_field": source_field,
                "original_value": value,
                "normalized_value": normalized_value,
                "extraction_method": "palo_alto",
                "parser_id": parser_id,
                "parser_version": parser_version,
                "confidence": 1.0,
                "raw_sha256": raw_sha256,
            }
        )

    return lineage

def create_configurable_lineage(
    parsed_fields: dict,
    field_mappings: dict,
    raw_sha256: str,
    parser_id: str,
    parser_version: str,
) -> List[FieldLineage]:
    lineage = []

    for source_field, target_field in field_mappings.items():
        if source_field not in parsed_fields:
            continue

        original_value = parsed_fields[source_field]

        normalized_value = original_value

        if isinstance(original_value, str):
            try:
                normalized_value = int(original_value)
            except ValueError:
                try:
                    normalized_value = float(original_value)
                except ValueError:
                    pass

        lineage.append(
            create_lineage(
                source_field=source_field,
                target_field=target_field,
                original_value=original_value,
                normalized_value=normalized_value,
                parser_id=parser_id,
                parser_version=parser_version,
                raw_sha256=raw_sha256,
                confidence=1.0,
                extraction_method="configurable",
            )
        )

    return lineage