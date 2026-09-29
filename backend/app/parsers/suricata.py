from typing import Any, Dict
import json

from app.parsers.base import BaseParser


class SuricataParser(BaseParser):
    parser_id = "suricata.eve"
    version = "1.0.0"
    vendor = "Suricata"
    product = "Suricata EVE"
    supported_formats = ("json",)

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:
        if detected_format != "json":
            return False

        try:
            data = json.loads(raw_data)
        except (json.JSONDecodeError, TypeError):
            return False

        if not isinstance(data, dict):
            return False

        return (
            "event_type" in data
            and any(
                key in data
                for key in (
                    "src_ip",
                    "dest_ip",
                    "flow_id",
                    "alert",
                )
            )
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        data = json.loads(raw_data)

        event_type = data.get(
            "event_type",
            "unknown",
        )

        source_ip = data.get("src_ip")
        source_port = data.get("src_port")

        destination_ip = data.get("dest_ip")
        destination_port = data.get("dest_port")

        protocol = data.get("proto")

        alert = data.get("alert")

        if not isinstance(alert, dict):
            alert = {}

        action = (
            alert.get("action")
            or data.get("action")
        )

        signature = alert.get("signature")
        category = alert.get("category")
        severity = alert.get("severity")

        hostname = (
            data.get("host")
            or data.get("hostname")
            or data.get("sensor")
        )

        user = (
            data.get("user")
            or data.get("username")
        )

        result: Dict[str, Any] = {
            "event": {
                "category": "security",
                "type": event_type,
                "action": action,
                "name": signature,
            },
            "source": {},
            "destination": {},
            "network": {},
            "user": {},
            "device": {},
            "threat": {},
            "metadata": {},
            "lineage_source": {},
        }

        if source_ip is not None:
            result["source"]["ip"] = source_ip
            result["lineage_source"]["src_ip"] = source_ip

        if source_port is not None:
            result["source"]["port"] = self._to_int(
                source_port
            )
            result["lineage_source"]["src_port"] = (
                source_port
            )

        if destination_ip is not None:
            result["destination"]["ip"] = destination_ip
            result["lineage_source"]["dst_ip"] = (
                destination_ip
            )

        if destination_port is not None:
            result["destination"]["port"] = self._to_int(
                destination_port
            )
            result["lineage_source"]["dst_port"] = (
                destination_port
            )

        if protocol is not None:
            result["network"]["protocol"] = protocol
            result["lineage_source"]["protocol"] = protocol

        if action is not None:
            result["lineage_source"]["action"] = action

        if hostname is not None:
            result["device"]["name"] = hostname
            result["lineage_source"]["hostname"] = (
                hostname
            )

        if user is not None:
            result["user"]["name"] = user
            result["lineage_source"]["user"] = user

        if signature is not None:
            result["threat"]["signature"] = signature

        if category is not None:
            result["threat"]["category"] = category

        if severity is not None:
            result["threat"]["severity"] = self._to_int(
                severity
            )

        if signature is not None:
            result["lineage_source"]["signature"] = signature

        if category is not None:
            result["lineage_source"]["category"] = category

        if severity is not None:
            result["lineage_source"]["severity"] = severity

        result["metadata"] = {
            "timestamp": data.get("timestamp"),
            "event_type": event_type,
            "flow_id": data.get("flow_id"),
            "in_iface": data.get("in_iface"),
            "out_iface": data.get("out_iface"),
            "app_proto": data.get("app_proto"),
            "direction": data.get("direction"),
            "alert": alert,
        }

        return result

    @staticmethod
    def _to_int(value: Any) -> Any:
        try:
            return int(value)
        except (TypeError, ValueError):
            return value