import csv
import io
from typing import Any, Dict, Optional

from app.parsers.base import BaseParser


class GenericCSVParser(BaseParser):
    parser_id = "generic.csv"
    version = "1.0.0"
    vendor = "Generic"
    product = "CSV Security Telemetry"
    supported_formats = ("csv",)

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:

        if detected_format != "csv":
            return False

        try:
            rows = list(
                csv.DictReader(
                    io.StringIO(raw_data)
                )
            )

            return bool(rows)

        except csv.Error:
            return False

    def parse(self, raw_data: str) -> Dict[str, Any]:

        reader = csv.DictReader(
            io.StringIO(raw_data)
        )

        rows = list(reader)

        if not rows:
            raise ValueError(
                "CSV contains no data rows"
            )

        row = rows[0]

        # Normalize column names.
        normalized_row = {
            str(key).strip().lower(): value
            for key, value in row.items()
            if key is not None
        }

        timestamp = self._first(
            normalized_row,
            [
                "timestamp",
                "@timestamp",
                "time",
                "event_time",
                "datetime",
            ],
        )

        source_ip = self._first(
            normalized_row,
            [
                "src_ip",
                "source_ip",
                "srcip",
                "source.ip",
            ],
        )

        source_port = self._first(
            normalized_row,
            [
                "src_port",
                "source_port",
                "srcport",
                "source.port",
            ],
        )

        destination_ip = self._first(
            normalized_row,
            [
                "dst_ip",
                "destination_ip",
                "dstip",
                "destination.ip",
            ],
        )

        destination_port = self._first(
            normalized_row,
            [
                "dst_port",
                "destination_port",
                "dstport",
                "destination.port",
            ],
        )

        protocol = self._first(
            normalized_row,
            [
                "protocol",
                "proto",
                "network.protocol",
            ],
        )

        action = self._first(
            normalized_row,
            [
                "action",
                "event_action",
                "event.action",
            ],
        )

        bytes_value = self._first(
            normalized_row,
            [
                "bytes",
                "network_bytes",
                "sent_bytes",
                "network.bytes",
            ],
        )

        hostname = self._first(
            normalized_row,
            [
                "hostname",
                "host",
                "device",
                "device_name",
                "device.name",
            ],
        )

        user = self._first(
            normalized_row,
            [
                "user",
                "username",
                "user_name",
            ],
        )

        event_type = self._first(
            normalized_row,
            [
                "event_type",
                "type",
                "event.type",
            ],
        )

        result: Dict[str, Any] = {
            "event": {
                "category": "security",
                "type": event_type or "telemetry",
            },
            "source": {},
            "destination": {},
            "network": {},
            "user": {},
            "device": {},
            "metadata": {},
            "lineage_source": {},
        }

        if timestamp is not None:
            result["event"]["timestamp"] = timestamp

        if action is not None:
            result["event"]["action"] = action
            result["lineage_source"]["action"] = action

        if source_ip is not None:
            result["source"]["ip"] = source_ip
            result["lineage_source"]["src_ip"] = source_ip

        if source_port is not None:
            result["source"]["port"] = self._to_int(
                source_port
            )
            result["lineage_source"]["src_port"] = source_port

        if destination_ip is not None:
            result["destination"]["ip"] = destination_ip
            result["lineage_source"]["dst_ip"] = destination_ip

        if destination_port is not None:
            result["destination"]["port"] = self._to_int(
                destination_port
            )
            result["lineage_source"]["dst_port"] = destination_port

        if protocol is not None:
            result["network"]["protocol"] = protocol
            result["lineage_source"]["protocol"] = protocol

        if bytes_value is not None:
            result["network"]["bytes"] = self._to_int(
                bytes_value
            )
            result["lineage_source"]["bytes"] = bytes_value

        if hostname is not None:
            result["device"]["name"] = hostname
            result["lineage_source"]["hostname"] = hostname

        if user is not None:
            result["user"]["name"] = user

        mapped_fields = {
            "timestamp",
            "@timestamp",
            "time",
            "event_time",
            "datetime",
            "src_ip",
            "source_ip",
            "srcip",
            "source.ip",
            "src_port",
            "source_port",
            "srcport",
            "source.port",
            "dst_ip",
            "destination_ip",
            "dstip",
            "destination.ip",
            "dst_port",
            "destination_port",
            "dstport",
            "destination.port",
            "protocol",
            "proto",
            "network.protocol",
            "action",
            "event_action",
            "event.action",
            "bytes",
            "network_bytes",
            "sent_bytes",
            "network.bytes",
            "hostname",
            "host",
            "device",
            "device_name",
            "device.name",
            "user",
            "username",
            "user_name",
            "event_type",
            "type",
            "event.type",
        }

        result["metadata"] = {
            key: value
            for key, value in normalized_row.items()
            if key not in mapped_fields
        }

        return result

    @staticmethod
    def _first(
        data: Dict[str, Any],
        keys: list[str],
    ) -> Optional[Any]:

        for key in keys:
            value = data.get(key)

            if value is not None and str(value).strip() != "":
                return value

        return None

    @staticmethod
    def _to_int(value: Any) -> Any:

        try:
            return int(value)
        except (TypeError, ValueError):
            return value