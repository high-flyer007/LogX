import shlex
from typing import Any, Dict

from app.parsers.base import BaseParser


class FortiGateTrafficParser(BaseParser):

    parser_id = "fortigate.traffic"
    version = "1.0.0"

    vendor = "Fortinet"
    product = "FortiGate"

    supported_formats = ("key_value",)

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:

        if detected_format != "key_value":
            return False

        text = raw_data.lower()

        required_fields = [
            "srcip=",
            "dstip=",
            "action=",
        ]

        return all(
            field in text
            for field in required_fields
        )

    def parse(
        self,
        raw_data: str,
    ) -> Dict[str, Any]:

        fields = self._parse_key_value(raw_data)

        return {
            "event": {
                "action": fields.get("action"),
                "category": "network",
                "type": "connection",
            },

            "source": {
                "ip": fields.get("srcip"),
                "port": self._to_int(fields.get("srcport")),
            },

            "destination": {
                "ip": fields.get("dstip"),
                "port": self._to_int(fields.get("dstport")),
            },

            "network": {
    "protocol": self._normalize_protocol(
        fields.get("proto")
    ),
    "bytes": self._to_int(
        fields.get("sentbyte")
    ),
},

            "device": {
                "vendor": self.vendor,
                "product": self.product,
                "name": fields.get("devname"),
                "id": fields.get("devid"),
            },

            "metadata": fields,
        }

    @staticmethod
    def _parse_key_value(
        raw_data: str,
    ) -> Dict[str, str]:

        result: Dict[str, str] = {}

        for token in shlex.split(raw_data):

            if "=" not in token:
                continue

            key, value = token.split(
                "=",
                1,
            )

            result[key] = value

        return result

    @staticmethod
    def _to_int(
        value: Any,
    ) -> Any:

        if value is None:
            return None

        try:
            return int(value)
        except (ValueError, TypeError):
            return value

    @staticmethod
    def _normalize_protocol(value: Any) -> Any:

        if value is None:
            return None

        protocol_map = {
        "1": "icmp",
        "6": "tcp",
        "17": "udp",
    }

        return protocol_map.get(
            str(value).lower(),
            str(value).lower(),
        )