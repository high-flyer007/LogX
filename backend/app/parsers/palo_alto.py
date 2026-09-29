import re
from typing import Any, Dict

from app.parsers.base import BaseParser


class PaloAltoParser(BaseParser):
    parser_id = "paloalto.traffic"
    version = "1.0.0"
    vendor = "Palo Alto Networks"
    product = "PAN-OS Traffic"
    supported_formats = ("syslog", "key_value")

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:

        if detected_format not in self.supported_formats:
            return False

        text = raw_data.lower()

        return (
            "pan-os" in text
            or "palo alto" in text
            or "type=traffic" in text
            or 'type="traffic"' in text
            or (
                "receive_time=" in text
                and "serial=" in text
                and "src=" in text
                and "dst=" in text
            )
        )

    def parse(self, raw_data: str) -> Dict[str, Any]:
        text = raw_data.strip()

        result = {
            "event": {
                "category": "network",
                "type": "firewall",
                "action": None,
                "name": "Palo Alto traffic",
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
        # KEY-VALUE EXTRACTION
        #
        # Handles:
        #   src=10.0.0.60
        #   dst=192.168.1.25
        #   spt=55000
        #   dpt=443
        #   proto=tcp
        #   action=allow
        # ---------------------------------------------------------

        def get_value(key: str):
            match = re.search(
                rf'\b{re.escape(key)}=(?:"([^"]*)"|(\S+))',
                text,
                re.IGNORECASE,
            )

            if not match:
                return None

            return match.group(1) if match.group(1) is not None else match.group(2)

        source_ip = get_value("src")
        destination_ip = get_value("dst")

        source_port = get_value("spt")
        destination_port = get_value("dpt")

        protocol = get_value("proto")
        action = get_value("action")

        application = get_value("app")
        rule = get_value("rule")

        hostname = (
            get_value("device")
            or get_value("hostname")
            or get_value("host")
        )

        if hostname is None:
            syslog_hostname_match = re.search(
                r">\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+([^\s]+)\s+PAN-OS\b",
                text,
                re.IGNORECASE,
            )

            if syslog_hostname_match:
                hostname = syslog_hostname_match.group(1)

        username = (
            get_value("srcuser")
            or get_value("user")
            or get_value("username")
        )

        bytes_value = get_value("bytes")
        packets_value = get_value("packets")

        session_id = (
            get_value("sessionid")
            or get_value("session_id")
        )

        message_type = get_value("type")

        # ---------------------------------------------------------
        # TYPE / ACTION NORMALIZATION
        # ---------------------------------------------------------

        if message_type:
            result["event"]["type"] = message_type

        if action:
            result["event"]["action"] = action.lower()

        if application:
            result["event"]["name"] = application

        # ---------------------------------------------------------
        # SOURCE
        # ---------------------------------------------------------

        if source_ip:
            result["source"]["ip"] = source_ip

        if source_port is not None:
            try:
                result["source"]["port"] = int(source_port)
            except ValueError:
                result["source"]["port"] = source_port

        # ---------------------------------------------------------
        # DESTINATION
        # ---------------------------------------------------------

        if destination_ip:
            result["destination"]["ip"] = destination_ip

        if destination_port is not None:
            try:
                result["destination"]["port"] = int(destination_port)
            except ValueError:
                result["destination"]["port"] = destination_port

        # ---------------------------------------------------------
        # NETWORK
        # ---------------------------------------------------------

        if protocol:
            result["network"]["protocol"] = protocol.lower()

        if bytes_value is not None:
            try:
                result["network"]["bytes"] = int(bytes_value)
            except ValueError:
                result["network"]["bytes"] = bytes_value

        if packets_value is not None:
            try:
                result["network"]["packets"] = int(packets_value)
            except ValueError:
                result["network"]["packets"] = packets_value

        # ---------------------------------------------------------
        # USER
        # ---------------------------------------------------------

        if username:
            result["user"]["name"] = username

        # ---------------------------------------------------------
        # DEVICE
        # ---------------------------------------------------------

        if hostname:
            result["device"]["name"] = hostname

        # ---------------------------------------------------------
        # METADATA
        # ---------------------------------------------------------

        result["metadata"] = {
            "message_type": message_type,
            "application": application,
            "rule": rule,
            "session_id": session_id,
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
            result["lineage_source"]["protocol"] = protocol.lower()

        if action:
            result["lineage_source"]["action"] = action.lower()

        if username:
            result["lineage_source"]["user"] = username

        if hostname:
            result["lineage_source"]["hostname"] = hostname

        if bytes_value is not None:
            result["lineage_source"]["bytes"] = bytes_value

        if packets_value is not None:
            result["lineage_source"]["packets"] = packets_value

        if application:
            result["lineage_source"]["application"] = application

        if rule:
            result["lineage_source"]["rule"] = rule

        if session_id:
            result["lineage_source"]["session_id"] = session_id

        return result