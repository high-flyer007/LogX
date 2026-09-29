import re
from typing import Any, Dict

from app.parsers.base import BaseParser


class GenericCEFParser(BaseParser):
    parser_id = "generic.cef"
    version = "1.0.0"
    vendor = "Generic"
    product = "Common Event Format"
    supported_formats = ("cef",)

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:
        return (
            detected_format == "cef"
            and raw_data.strip().startswith("CEF:")
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        text = raw_data.strip()

        parts = text.split("|", 7)

        if len(parts) < 8:
            raise ValueError(
                "Invalid CEF event: expected 8 CEF sections"
            )

        header = parts[:7]
        extensions_text = parts[7]

        cef_version = header[0].replace("CEF:", "", 1)
        device_vendor = header[1]
        device_product = header[2]
        device_version = header[3]
        signature_id = header[4]
        event_name = header[5]
        severity = header[6]

        extensions = self._parse_extensions(
            extensions_text
        )

        source_ip = self._first(
            extensions,
            ["src", "src_ip", "sourceAddress"],
        )

        destination_ip = self._first(
            extensions,
            ["dst", "dst_ip", "destinationAddress"],
        )

        source_port = self._first(
            extensions,
            ["spt", "src_port", "sourcePort"],
        )

        destination_port = self._first(
            extensions,
            ["dpt", "dst_port", "destinationPort"],
        )

        protocol = self._first(
            extensions,
            ["proto", "protocol"],
        )

        action = self._first(
            extensions,
            ["act", "action"],
        )

        hostname = self._first(
            extensions,
            ["dvchost", "dhost", "hostname"],
        )

        user = self._first(
            extensions,
            ["suser", "user", "username"],
        )

        bytes_value = self._first(
            extensions,
            ["bytes", "out", "in"],
        )

        result: Dict[str, Any] = {
            "event": {
                "category": "security",
                "type": "cef",
                "action": action,
                "name": event_name,
            },
            "source": {},
            "destination": {},
            "network": {},
            "user": {},
            "device": {},
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

        if action is not None:
            result["lineage_source"]["action"] = action

        if hostname is not None:
            result["device"]["name"] = hostname
            result["lineage_source"]["hostname"] = hostname

        if user is not None:
            result["user"]["name"] = user

        result["metadata"] = {
            "cef_version": cef_version,
            "device_vendor": device_vendor,
            "device_product": device_product,
            "device_version": device_version,
            "signature_id": signature_id,
            "event_name": event_name,
            "severity": severity,
            "extensions": extensions,
        }

        return result

    @staticmethod
    def _parse_extensions(
        text: str,
    ) -> Dict[str, str]:

        # CEF extensions are key=value pairs separated
        # by spaces. Quoted values containing spaces are supported.
        pattern = re.compile(
            r'([A-Za-z][A-Za-z0-9_.-]*)='
            r'(?:"([^"]*)"|(\S+))'
        )

        result: Dict[str, str] = {}

        for match in pattern.finditer(text):
            key = match.group(1)
            value = (
                match.group(2)
                if match.group(2) is not None
                else match.group(3)
            )

            result[key] = value

        return result

    @staticmethod
    def _first(
        data: Dict[str, str],
        keys: list[str],
    ) -> Any:

        for key in keys:
            value = data.get(key)

            if value is not None:
                return value

        return None

    @staticmethod
    def _to_int(value: Any) -> Any:

        try:
            return int(value)
        except (TypeError, ValueError):
            return value