from typing import Any, Dict

from app.parsers.base import BaseParser


class GenericLEEFParser(BaseParser):
    parser_id = "generic.leef"
    version = "1.0.0"
    vendor = "Generic"
    product = "Log Event Extended Format"
    supported_formats = ("leef",)

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:
        return (
            detected_format == "leef"
            and raw_data.strip().startswith("LEEF:")
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        text = raw_data.strip()

        parts = text.split("|", 5)

        if len(parts) < 6:
            raise ValueError(
                "Invalid LEEF event: expected LEEF header"
            )

        leef_version = parts[0].replace(
            "LEEF:",
            "",
            1,
        )

        device_vendor = parts[1]
        device_product = parts[2]
        device_version = parts[3]
        event_id = parts[4]
        extensions_text = parts[5]

        extensions = self._parse_extensions(
            extensions_text
        )

        source_ip = self._first(
            extensions,
            [
                "src",
                "src_ip",
                "sourceAddress",
            ],
        )

        destination_ip = self._first(
            extensions,
            [
                "dst",
                "dst_ip",
                "destinationAddress",
            ],
        )

        source_port = self._first(
            extensions,
            [
                "spt",
                "src_port",
                "sourcePort",
            ],
        )

        destination_port = self._first(
            extensions,
            [
                "dpt",
                "dst_port",
                "destinationPort",
            ],
        )

        protocol = self._first(
            extensions,
            [
                "proto",
                "protocol",
            ],
        )

        action = self._first(
            extensions,
            [
                "action",
                "act",
            ],
        )

        hostname = self._first(
            extensions,
            [
                "dvchost",
                "dhost",
                "hostname",
            ],
        )

        user = self._first(
            extensions,
            [
                "usrName",
                "suser",
                "user",
                "username",
            ],
        )

        bytes_value = self._first(
            extensions,
            [
                "bytes",
                "out",
                "in",
            ],
        )

        result: Dict[str, Any] = {
            "event": {
                "category": "security",
                "type": "leef",
                "action": action,
                "name": event_id,
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

        if bytes_value is not None:
            result["network"]["bytes"] = self._to_int(
                bytes_value
            )
            result["lineage_source"]["bytes"] = (
                bytes_value
            )

        if action is not None:
            result["lineage_source"]["action"] = action

        if hostname is not None:
            result["device"]["name"] = hostname
            result["lineage_source"]["hostname"] = (
                hostname
            )

        if user is not None:
            result["user"]["name"] = user

        result["metadata"] = {
            "leef_version": leef_version,
            "device_vendor": device_vendor,
            "device_product": device_product,
            "device_version": device_version,
            "event_id": event_id,
            "extensions": extensions,
        }

        return result

    @staticmethod
    def _parse_extensions(
        text: str,
    ) -> Dict[str, str]:

        result: Dict[str, str] = {}

        # LEEF commonly uses TAB as the extension delimiter.
        # We also tolerate spaces for easier testing.
        fields = text.replace(
            "\t",
            " ",
        ).split()

        for field in fields:
            if "=" not in field:
                continue

            key, value = field.split(
                "=",
                1,
            )

            key = key.strip()
            value = value.strip()

            if not key:
                continue

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

        