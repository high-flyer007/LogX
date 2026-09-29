import re
from typing import Any, Dict

from app.parsers.base import BaseParser


class CiscoASAParser(BaseParser):
    parser_id = "cisco.asa"
    version = "1.0.0"
    vendor = "Cisco"
    product = "Adaptive Security Appliance"
    supported_formats = ("syslog", "key_value")

    def can_parse(self, raw_data: str, detected_format: str) -> bool:
        if detected_format not in self.supported_formats:
            return False

        text = raw_data.lower()

        return (
            "asa-" in text
            or "cisco asa" in text
            or "adaptive security appliance" in text
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        text = raw_data.strip()

        result = {
            "event": {
                "category": "network",
                "type": "firewall",
                "action": None,
                "name": None,
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

        # ---------------------------------------------------------
        # ASA MESSAGE ID
        # Example:
        # %ASA-6-302013:
        # ---------------------------------------------------------
        message_match = re.search(
            r"%ASA-\d+-(\d+)",
            text,
            re.IGNORECASE,
        )

        message_id = None

        if message_match:
            message_id = message_match.group(1)

        connection_id = None

        connection_id_match = re.search(
            r"Built\s+(?:outbound|inbound)\s+\w+\s+connection\s+(\d+)",
            text,
            re.IGNORECASE,
        )

        if connection_id_match:
            connection_id = connection_id_match.group(1)

        # ---------------------------------------------------------
        # HOSTNAME
        # ---------------------------------------------------------
        hostname = None

        # Explicit hostname= form
        hostname_match = re.search(
            r"\bhostname[=:]\s*([^\s]+)",
            text,
            re.IGNORECASE,
        )

        if hostname_match:
            hostname = hostname_match.group(1)

        # Standard syslog ASA hostname
        # Example:
        # <134>Sep 23 11:30:00 ASA-FW-01 %ASA-6-302013:
        if hostname is None:
            syslog_hostname_match = re.search(
                r">\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+([^\s]+)\s+%ASA-",
                text,
                re.IGNORECASE,
            )

        if syslog_hostname_match:
            hostname = syslog_hostname_match.group(1)

        # ---------------------------------------------------------
        # SOURCE / DESTINATION IP + PORT
        #
        # Handles common ASA forms such as:
        #
        # 10.0.0.10/51500
        # 192.168.1.20/443
        # ---------------------------------------------------------
        # ---------------------------------------------------------
        # SOURCE / DESTINATION IP + PORT
        #
        # Cisco ASA connection messages commonly look like:
        #
        # Built outbound TCP connection 12345
        # for outside:10.0.0.60/55000
        # (10.0.0.60/55000)
        # to inside:192.168.1.25/443
        # (192.168.1.25/443)
        #
        # We deliberately extract the addresses associated with
        # "for" and "to" instead of simply taking the first two
        # IP/port matches, because ASA repeats the addresses in
        # parentheses.
        # ---------------------------------------------------------

        source_ip = None
        source_port = None
        destination_ip = None
        destination_port = None

        connection_match = re.search(
            r"\bfor\s+\S+:(\d{1,3}(?:\.\d{1,3}){3})/(\d+)"
            r".*?\bto\s+\S+:(\d{1,3}(?:\.\d{1,3}){3})/(\d+)",
            text,
            re.IGNORECASE,
        )

        if connection_match:
            source_ip = connection_match.group(1)
            source_port = int(connection_match.group(2))

            destination_ip = connection_match.group(3)
            destination_port = int(connection_match.group(4))

        # ---------------------------------------------------------
        # PROTOCOL
        # ---------------------------------------------------------
        protocol = None

        protocol_match = re.search(
            r"\b(TCP|UDP|ICMP)\b",
            text,
            re.IGNORECASE,
        )

        if protocol_match:
            protocol = protocol_match.group(1).lower()

        # ---------------------------------------------------------
        # ACTION
        # ---------------------------------------------------------
        action = None

        lower_text = text.lower()

        if any(
            keyword in lower_text
            for keyword in [
                "denied",
                "deny",
                "drop",
                "blocked",
                "reject",
            ]
        ):
            action = "deny"

        elif any(
            keyword in lower_text
            for keyword in [
                "built",
                "allowed",
                "permit",
                "permitted",
                "accepted",
            ]
        ):
            action = "allow"

        # ---------------------------------------------------------
        # USER
        # ---------------------------------------------------------
        username = None

        user_match = re.search(
            r"\b(?:user|username|user_name)[=:]\s*([^\s,]+)",
            text,
            re.IGNORECASE,
        )

        if user_match:
            username = user_match.group(1)

        # ---------------------------------------------------------
        # POPULATE NORMALIZED FIELDS
        # ---------------------------------------------------------
        if source_ip:
            result["source"]["ip"] = source_ip

        if source_port is not None:
            result["source"]["port"] = source_port

        if destination_ip:
            result["destination"]["ip"] = destination_ip

        if destination_port is not None:
            result["destination"]["port"] = destination_port

        if protocol:
            result["network"]["protocol"] = protocol

        if username:
            result["user"]["name"] = username

        if hostname:
            result["device"]["name"] = hostname

        result["event"]["action"] = action
        result["event"]["name"] = (
            f"ASA message {message_id}"
            if message_id
            else "Cisco ASA event"
        )

        # ---------------------------------------------------------
        # METADATA
        # ---------------------------------------------------------
        result["metadata"] = {
            "message_id": message_id,
            "connection_id": connection_id,
            "raw_message": text,
        }

        # ---------------------------------------------------------
        # LINEAGE SOURCE
        # ---------------------------------------------------------
        if source_ip:
            result["lineage_source"]["src_ip"] = source_ip

        if source_port is not None:
            result["lineage_source"]["src_port"] = source_port

        if destination_ip:
            result["lineage_source"]["dst_ip"] = destination_ip

        if destination_port is not None:
            result["lineage_source"]["dst_port"] = destination_port

        if protocol:
            result["lineage_source"]["protocol"] = protocol

        if action:
            result["lineage_source"]["action"] = action

        if username:
            result["lineage_source"]["user"] = username

        if hostname:
            result["lineage_source"]["hostname"] = hostname

        if message_id:
            result["lineage_source"]["message_id"] = message_id

        return result