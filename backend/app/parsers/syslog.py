import re
from datetime import datetime
from typing import Any, Dict, Optional

from app.parsers.base import BaseParser


class SyslogParser(BaseParser):
    parser_id = "syslog"
    version = "1.0.0"
    vendor = "Generic"
    product = "Syslog Security Telemetry"
    supported_formats = ("syslog",)

    def can_parse(self, raw_data: str, detected_format: str) -> bool:
        if detected_format != "syslog":
            return False

        text = raw_data.strip()

        return bool(
            re.match(
                r"^<\d+>(?:\d\s+)?",
                text,
            )
            or re.match(
                r"^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\S+(?:\[\d+\])?:",
                text,
            )
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        text = raw_data.strip()

        priority = None
        version = None
        timestamp = None
        hostname = None
        app_name = None
        proc_id = None
        msg_id = None
        message = text

        # ---------------------------------------------------------
        # PRI
        # ---------------------------------------------------------
        pri_match = re.match(r"^<(\d+)>", text)

        if pri_match:
            priority = int(pri_match.group(1))
            message = text[pri_match.end():]

        # ---------------------------------------------------------
        # RFC 5424
        # <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID ...
        # ---------------------------------------------------------
        rfc5424_match = re.match(
            r"^(?P<version>\d+)\s+"
            r"(?P<timestamp>\S+)\s+"
            r"(?P<hostname>\S+)\s+"
            r"(?P<app_name>\S+)\s+"
            r"(?P<proc_id>\S+)\s+"
            r"(?P<msg_id>\S+)\s+"
            r"(?P<structured>(?:-|\[.*?\](?:\s+\[.*?\])*))"
            r"(?:\s+(?P<message>.*))?$",
            message,
        )

        if rfc5424_match:
            version = int(rfc5424_match.group("version"))
            timestamp = self._clean_nil(
                rfc5424_match.group("timestamp")
            )
            hostname = self._clean_nil(
                rfc5424_match.group("hostname")
            )
            app_name = self._clean_nil(
                rfc5424_match.group("app_name")
            )
            proc_id = self._clean_nil(
                rfc5424_match.group("proc_id")
            )
            msg_id = self._clean_nil(
                rfc5424_match.group("msg_id")
            )

            message = (
                rfc5424_match.group("message")
                or ""
            )

        else:
            # -----------------------------------------------------
            # RFC 3164
            # <PRI>Mmm dd HH:mm:ss HOST TAG: MESSAGE
            # -----------------------------------------------------
            rfc3164_match = re.match(
                r"^(?P<timestamp>"
                r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
                r"\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}"
                r")\s+"
                r"(?P<hostname>\S+)\s+"
                r"(?P<tag>[^:\s]+)"
                r"(?::\s*|\s+)"
                r"(?P<message>.*)$",
                message,
            )

            if rfc3164_match:
                timestamp = rfc3164_match.group(
                    "timestamp"
                )
                hostname = rfc3164_match.group(
                    "hostname"
                )
                app_name = rfc3164_match.group(
                    "tag"
                )
                message = rfc3164_match.group(
                    "message"
                )

        # ---------------------------------------------------------
        # Extract common security fields from message
        # ---------------------------------------------------------
        source_ip = self._extract(
            message,
            [
                r"\bsrc(?:_ip|ip)?=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bsrc=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bsource=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bsrc(?:_ip|ip)?\s*:\s*(\d{1,3}(?:\.\d{1,3}){3})",
            ],
        )

        destination_ip = self._extract(
            message,
            [
                r"\bdst(?:_ip|ip)?=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bdst=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bdestination=(\d{1,3}(?:\.\d{1,3}){3})",
                r"\bdst(?:_ip|ip)?\s*:\s*(\d{1,3}(?:\.\d{1,3}){3})",
            ],
        )

        source_port = self._extract(
            message,
            [
                r"\bsrc_port=(\d+)",
                r"\bsrcport=(\d+)",
                r"\bsport=(\d+)",
            ],
        )

        destination_port = self._extract(
            message,
            [
                r"\bdst_port=(\d+)",
                r"\bdstport=(\d+)",
                r"\bdport=(\d+)",
            ],
        )

        protocol = self._extract(
            message,
            [
                r"\bprotocol=([A-Za-z0-9_-]+)",
                r"\bproto=([A-Za-z0-9_-]+)",
            ],
        )

        action = self._extract(
            message,
            [
                r"\baction=([A-Za-z0-9_.-]+)",
            ],
        )

        user = self._extract(
            message,
            [
                r"\buser=([^\s]+)",
                r"\busername=([^\s]+)",
            ],
        )

        event_type = self._extract(
            message,
            [
                r"\bevent_type=([A-Za-z0-9_.-]+)",
                r"\btype=([A-Za-z0-9_.-]+)",
            ],
        )

        result: Dict[str, Any] = {
            "event": {
                "category": "security",
                "type": event_type or "syslog",
            },
            "source": {},
            "destination": {},
            "network": {},
            "user": {},
            "device": {},
            "metadata": {},
            "lineage_source": {},
        }

        if timestamp:
            result["event"]["timestamp"] = timestamp

        if action:
            result["event"]["action"] = action

        if source_ip:
            result["source"]["ip"] = source_ip
            result["lineage_source"]["src_ip"] = source_ip

        if source_port:
            result["source"]["port"] = self._to_int(
                source_port
            )
            result["lineage_source"]["src_port"] = source_port

        if destination_ip:
            result["destination"]["ip"] = destination_ip
            result["lineage_source"]["dst_ip"] = destination_ip

        if destination_port:
            result["destination"]["port"] = self._to_int(
                destination_port
            )
            result["lineage_source"]["dst_port"] = destination_port

        if protocol:
            result["network"]["protocol"] = protocol
            result["lineage_source"]["protocol"] = protocol

        if user:
            result["user"]["name"] = user

        if hostname:
            result["device"]["name"] = hostname
            result["lineage_source"]["hostname"] = hostname

        if app_name:
            result["device"]["application"] = app_name

        metadata = {
            "priority": priority,
            "severity": self._severity_from_priority(priority),
            "facility": self._facility_from_priority(priority),
            "syslog_version": version,
            "app_name": app_name,
            "proc_id": proc_id,
            "msg_id": msg_id,
            "message": message,
        }

        result["metadata"] = {
            key: value
            for key, value in metadata.items()
            if value is not None
        }

        if action:
            result["lineage_source"]["action"] = action

        return result

    @staticmethod
    def _clean_nil(value: Optional[str]) -> Optional[str]:
        if value in (None, "-"):
            return None
        return value

    @staticmethod
    def _extract(
        text: str,
        patterns: list[str],
    ) -> Optional[str]:

        for pattern in patterns:
            match = re.search(pattern, text)

            if match:
                return match.group(1)

        return None

    @staticmethod
    def _to_int(value: Any) -> Any:
        try:
            return int(value)
        except (TypeError, ValueError):
            return value

    @staticmethod
    def _facility_from_priority(priority: Optional[int]):
        if priority is None:
            return None

        return priority // 8

    @staticmethod
    def _severity_from_priority(priority: Optional[int]):
        if priority is None:
            return None

        return priority % 8