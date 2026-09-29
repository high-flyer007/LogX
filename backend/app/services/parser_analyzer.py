import json
import re
from collections import Counter
from typing import Any, Dict, List


class ParserAnalyzer:
    """
    Deterministic analysis layer for unknown telemetry.

    This service does NOT generate or execute a parser.
    It analyzes the structure of an unknown log and produces
    candidate fields and parser hints.

    AI can consume this result later to generate suggestions.
    """

    KEY_VALUE_PATTERN = re.compile(
        r'([A-Za-z_][A-Za-z0-9_.-]*)='
        r'(?:"([^"]*)"|\'([^\']*)\'|([^\s]+))'
    )

    IP_PATTERN = re.compile(
        r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    )

    PORT_PATTERN = re.compile(
        r'\bport[=:]\s*(\d{1,5})\b',
        re.IGNORECASE,
    )

    def analyze(
        self,
        raw_data: str,
        detected_format: str = "unknown",
        detected_source: str = "unknown",
    ) -> Dict[str, Any]:

        text = raw_data.strip()

        result = {
            "format": detected_format,
            "source": detected_source,
            "length": len(text),
            "line_count": len(text.splitlines()),
            "structure": {},
            "fields": [],
            "field_candidates": [],
            "patterns": [],
            "parser_hints": [],
            "confidence": 0.0,
        }

        if not text:
            result["parser_hints"].append("Empty log payload")
            return result

        # ---------------------------------------------------------
        # JSON STRUCTURE
        # ---------------------------------------------------------

        json_data = None

        try:
            parsed = json.loads(text)

            if isinstance(parsed, dict):
                json_data = parsed

                result["structure"]["type"] = "json_object"
                result["structure"]["field_count"] = len(parsed)

                result["fields"] = list(parsed.keys())

                result["field_candidates"] = [
                    {
                        "source_field": key,
                        "sample_value": self._safe_sample(value),
                        "candidate": self._guess_field(key, value),
                    }
                    for key, value in parsed.items()
                ]

        except (json.JSONDecodeError, TypeError):
            pass

        # ---------------------------------------------------------
        # KEY-VALUE STRUCTURE
        # ---------------------------------------------------------

        matches = list(self.KEY_VALUE_PATTERN.finditer(text))

        if matches:
            keys = [match.group(1) for match in matches]

            result["structure"]["key_value_pairs"] = len(matches)
            result["structure"]["key_value_keys"] = keys

            for match in matches:
                key = match.group(1)

                value = (
                    match.group(2)
                    if match.group(2) is not None
                    else match.group(3)
                    if match.group(3) is not None
                    else match.group(4)
                )

                result["field_candidates"].append(
                    {
                        "source_field": key,
                        "sample_value": value,
                        "candidate": self._guess_field(key, value),
                    }
                )

        # ---------------------------------------------------------
        # COMMON SECURITY PATTERNS
        # ---------------------------------------------------------

        if self.IP_PATTERN.search(text):
            result["patterns"].append("ipv4_address")

        if self.PORT_PATTERN.search(text):
            result["patterns"].append("port")

        if re.search(r"\b(?:TCP|UDP|ICMP)\b", text, re.IGNORECASE):
            result["patterns"].append("network_protocol")

        if re.search(
            r"\b(?:allow|allowed|permit|permitted|deny|denied|drop|blocked)\b",
            text,
            re.IGNORECASE,
        ):
            result["patterns"].append("security_action")

        if re.search(
            r"\b(?:user|username|srcuser|account)\b",
            text,
            re.IGNORECASE,
        ):
            result["patterns"].append("user_identity")

        if re.search(
            r"\b(?:firewall|fw|ids|ips|vpn|dns|proxy|endpoint)\b",
            text,
            re.IGNORECASE,
        ):
            result["patterns"].append("security_device")

        # ---------------------------------------------------------
        # FORMAT HINTS
        # ---------------------------------------------------------

        if text.startswith("CEF:"):
            result["parser_hints"].append("CEF-compatible structure")

        if text.startswith("LEEF:"):
            result["parser_hints"].append("LEEF-compatible structure")

        if text.startswith("%ASA-"):
            result["parser_hints"].append("Cisco ASA syslog structure")

        if "PAN-OS" in text or "type=TRAFFIC" in text:
            result["parser_hints"].append(
                "Palo Alto PAN-OS telemetry structure"
            )

        if "event_type" in text and "flow_id" in text:
            result["parser_hints"].append(
                "Possible Suricata EVE structure"
            )

        if "id.orig_h" in text and "id.resp_h" in text:
            result["parser_hints"].append(
                "Possible Zeek connection structure"
            )

        # ---------------------------------------------------------
        # FIELD FREQUENCY
        # ---------------------------------------------------------

        if result["field_candidates"]:
            names = [
                item["source_field"]
                for item in result["field_candidates"]
            ]

            result["structure"]["field_frequency"] = dict(
                Counter(names)
            )

        # ---------------------------------------------------------
        # CONFIDENCE
        # ---------------------------------------------------------

        confidence = 0.2

        if detected_format != "unknown":
            confidence += 0.2

        if detected_source != "unknown":
            confidence += 0.2

        if result["fields"]:
            confidence += 0.2

        if result["patterns"]:
            confidence += 0.1

        if result["field_candidates"]:
            confidence += 0.1

        result["confidence"] = min(confidence, 0.99)

        return result

    @staticmethod
    def _safe_sample(value: Any) -> Any:
        """
        Prevent huge nested structures from being returned
        as AI-analysis samples.
        """

        if isinstance(value, (dict, list)):
            return str(value)[:300]

        return value

    @staticmethod
    def _guess_field(
        field_name: str,
        value: Any,
    ) -> str:

        name = field_name.lower().replace("-", "_").replace(".", "_")

        aliases = {
            "src": "source.ip",
            "src_ip": "source.ip",
            "source_ip": "source.ip",
            "id_orig_h": "source.ip",

            "dst": "destination.ip",
            "dst_ip": "destination.ip",
            "destination_ip": "destination.ip",
            "id_resp_h": "destination.ip",

            "spt": "source.port",
            "src_port": "source.port",
            "source_port": "source.port",
            "id_orig_p": "source.port",

            "dpt": "destination.port",
            "dst_port": "destination.port",
            "destination_port": "destination.port",
            "id_resp_p": "destination.port",

            "proto": "network.protocol",
            "protocol": "network.protocol",

            "action": "event.action",

            "user": "user.name",
            "username": "user.name",
            "srcuser": "user.name",

            "host": "device.name",
            "hostname": "device.name",
            "device": "device.name",

            "bytes": "network.bytes",
            "packets": "network.packets",

            "app": "network.application",
            "application": "network.application",

            "rule": "security.rule",

            "sessionid": "event.session_id",
            "session_id": "event.session_id",
        }

        if name in aliases:
            return aliases[name]

        # Value-based fallback

        if isinstance(value, str):
            if ParserAnalyzer.IP_PATTERN.fullmatch(value):
                return "possible.ip"

            if value.lower() in {
                "tcp",
                "udp",
                "icmp",
            }:
                return "network.protocol"

        return "unmapped"