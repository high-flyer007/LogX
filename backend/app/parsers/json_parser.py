import json
from typing import Any, Dict

from app.parsers.base import BaseParser


class GenericJSONParser(BaseParser):
    parser_id = "generic.json"
    version = "1.0.0"
    vendor = "Generic"
    product = "JSON Security Telemetry"
    supported_formats = ("json",)

    def can_parse(self, raw_data: str, detected_format: str) -> bool:
        if detected_format != "json":
            return False

        try:
            parsed = json.loads(raw_data)
            return isinstance(parsed, dict)
        except (json.JSONDecodeError, TypeError):
            return False

    def parse(self, raw_data: str) -> Dict[str, Any]:
        data = json.loads(raw_data)

        # Support common alternative field names.
        timestamp = (
            data.get("timestamp")
            or data.get("@timestamp")
            or data.get("time")
            or data.get("event_time")
        )

        source_ip = (
            data.get("src_ip")
            or data.get("source_ip")
            or data.get("srcip")
            or data.get("source", {}).get("ip")
            if isinstance(data.get("source"), dict)
            else data.get("src_ip")
            or data.get("source_ip")
            or data.get("srcip")
        )

        destination_ip = (
            data.get("dst_ip")
            or data.get("destination_ip")
            or data.get("dstip")
            or data.get("destination", {}).get("ip")
            if isinstance(data.get("destination"), dict)
            else data.get("dst_ip")
            or data.get("destination_ip")
            or data.get("dstip")
        )

        source_port = (
            data.get("src_port")
            or data.get("source_port")
            or data.get("srcport")
            or data.get("source", {}).get("port")
            if isinstance(data.get("source"), dict)
            else data.get("src_port")
            or data.get("source_port")
            or data.get("srcport")
        )

        destination_port = (
            data.get("dst_port")
            or data.get("destination_port")
            or data.get("dstport")
            or data.get("destination", {}).get("port")
            if isinstance(data.get("destination"), dict)
            else data.get("dst_port")
            or data.get("destination_port")
            or data.get("dstport")
        )

        protocol = (
            data.get("protocol")
            or data.get("proto")
            or data.get("network", {}).get("protocol")
            if isinstance(data.get("network"), dict)
            else data.get("protocol") or data.get("proto")
        )

        action = (
            data.get("action")
            or data.get("event_action")
            or data.get("event", {}).get("action")
            if isinstance(data.get("event"), dict)
            else data.get("action") or data.get("event_action")
        )

        bytes_value = (
            data.get("bytes")
            or data.get("sent_bytes")
            or data.get("network_bytes")
            or data.get("network", {}).get("bytes")
            if isinstance(data.get("network"), dict)
            else data.get("bytes")
            or data.get("sent_bytes")
            or data.get("network_bytes")
        )

        user = (
            data.get("user")
            or data.get("username")
            or data.get("user_name")
        )

        device_name = (
            data.get("hostname")
            or data.get("host")
            or data.get("device")
            or data.get("device_name")
        )

        event_type = (
            data.get("event_type")
            or data.get("type")
            or data.get("event", {}).get("type")
            if isinstance(data.get("event"), dict)
            else data.get("event_type") or data.get("type")
        )

        result: Dict[str, Any] = {
            "event": {
                "action": action,
                "category": "security",
                "type": event_type or "telemetry",
            },
            "source": {},
            "destination": {},
            "network": {},
            "user": {},
            "device": {},
            "metadata": {},
        }

        if timestamp is not None:
            result["event"]["timestamp"] = timestamp

        if source_ip is not None:
            result["source"]["ip"] = source_ip

        if source_port is not None:
            result["source"]["port"] = self._to_int(source_port)

        if destination_ip is not None:
            result["destination"]["ip"] = destination_ip

        if destination_port is not None:
            result["destination"]["port"] = self._to_int(
                destination_port
            )

        if protocol is not None:
            result["network"]["protocol"] = protocol

        if bytes_value is not None:
            result["network"]["bytes"] = self._to_int(bytes_value)

        if user is not None:
            if isinstance(user, dict):
                result["user"] = user
            else:
                result["user"]["name"] = user

        if device_name is not None:
            if isinstance(device_name, dict):
                result["device"] = device_name
            else:
                result["device"]["name"] = device_name

        # Preserve everything that was not explicitly normalized.
        mapped_keys = {
            "timestamp",
            "@timestamp",
            "time",
            "event_time",
            "src_ip",
            "source_ip",
            "srcip",
            "src_port",
            "source_port",
            "srcport",
            "dst_ip",
            "destination_ip",
            "dstip",
            "dst_port",
            "destination_port",
            "dstport",
            "protocol",
            "proto",
            "action",
            "event_action",
            "bytes",
            "sent_bytes",
            "network_bytes",
            "user",
            "username",
            "user_name",
            "hostname",
            "host",
            "device",
            "device_name",
            "event_type",
            "type",
            "source",
            "destination",
            "network",
            "event",
        }

        result["metadata"] = {
            key: value
            for key, value in data.items()
            if key not in mapped_keys
        }

        result["lineage_source"] = {
    "src_ip": source_ip,
    "src_port": source_port,
    "dst_ip": destination_ip,
    "dst_port": destination_port,
    "protocol": protocol,
    "bytes": bytes_value,
    "action": action,
    "hostname": device_name,
}
        return result

    @staticmethod
    def _to_int(value: Any) -> Any:
        try:
            return int(value)
        except (TypeError, ValueError):
            return value