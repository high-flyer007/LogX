import re
from typing import Dict


class SourceDetector:

    SOURCES = {
        "fortigate",
        "cisco_asa",
        "palo_alto",
        "suricata",
        "zeek",
        "generic",
        "unknown",
    }

    def detect(
        self,
        raw_data: str,
        detected_format: str,
    ) -> Dict[str, object]:

        text = raw_data.lower()

        # FortiGate
        if self._is_fortigate(text):
            return {
                "source": "fortigate",
                "vendor": "Fortinet",
                "product": "FortiGate",
                "confidence": 0.98,
                "reason": "FortiGate-specific fields detected",
            }

        # Cisco ASA
        if self._is_cisco_asa(text):
            return {
                "source": "cisco_asa",
                "vendor": "Cisco",
                "product": "ASA",
                "confidence": 0.97,
                "reason": "Cisco ASA message identifier detected",
            }

        # Palo Alto
        if self._is_palo_alto(text):
            return {
                "source": "palo_alto",
                "vendor": "Palo Alto Networks",
                "product": "PAN-OS",
                "confidence": 0.97,
                "reason": "PAN-OS fields detected",
            }

        # Suricata
        if self._is_suricata(text):
            return {
                "source": "suricata",
                "vendor": "Open Information Security Foundation",
                "product": "Suricata",
                "confidence": 0.98,
                "reason": "Suricata event fields detected",
            }

        # Zeek
        if self._is_zeek(text):
            return {
                "source": "zeek",
                "vendor": "Zeek",
                "product": "Zeek",
                "confidence": 0.95,
                "reason": "Zeek log fields detected",
            }

        # Generic JSON
        if detected_format == "json":
            return {
                "source": "generic",
                "vendor": "Generic",
                "product": "JSON Security Telemetry",
                "confidence": 0.70,
                "reason": "Valid JSON with no known source signature",
            }

        # Generic Syslog
        if detected_format == "syslog":
            return {
                "source": "generic",
                "vendor": "Generic",
                "product": "Syslog Security Telemetry",
                "confidence": 0.70,
                "reason": "Valid Syslog with no known source signature",
            }

        # Generic CSV
        if detected_format == "csv":
            return {
                "source": "generic",
                "vendor": "Generic",
                "product": "CSV Security Telemetry",
                "confidence": 0.70,
                "reason": "Valid CSV with no known source signature",
            }

        # Generic CEF
        if detected_format == "cef":
            return {
                "source": "generic",
                "vendor": "Generic",
                "product": "Common Event Format",
                "confidence": 0.90,
                "reason": "Valid CEF event with no known vendor signature",
            }

        #Generic LEEF
        if detected_format == "leef":
            return {
                "source": "generic",
                "vendor": "Generic",
                "product": "Log Event Extended Format",
                "confidence": 0.90,
                "reason": "Valid LEEF event with no known vendor signature",
            }

        # Unknown source
        return {
            "source": "unknown",
            "vendor": None,
            "product": None,
            "confidence": 0.0,
            "reason": "No known source signature detected",
        }

    @staticmethod
    def _is_fortigate(text: str) -> bool:

        indicators = [
            "devname=",
            "devid=",
            "logid=",
            "type=",
            "subtype=",
            "srcip=",
            "dstip=",
            "policyid=",
        ]

        return sum(
            indicator in text
            for indicator in indicators
        ) >= 3

    @staticmethod
    def _is_cisco_asa(text: str) -> bool:
        indicators = [
            "%asa-",
            "cisco asa",
            "adaptive security appliance",
        ]

        return any(indicator in text for indicator in indicators)

    @staticmethod
    def _is_palo_alto(text: str) -> bool:
        indicators = [
            "palo alto",
            "pan-os",
            "panw",
            "type=traffic",
            "type=\"traffic\"",

            # Common PAN-OS traffic fields
            "receive_time=",
            "serial=",
            "sessionid=",
        ]

        return any(indicator in text for indicator in indicators)

    @staticmethod
    def _is_suricata(text: str) -> bool:

        indicators = [
            '"event_type"',
            '"src_ip"',
            '"dest_ip"',
            '"alert"',
            '"flow_id"',
            '"signature"',
        ]

        return sum(
            indicator in text
            for indicator in indicators
        ) >= 3

    @staticmethod
    def _is_zeek(text: str) -> bool:
        lines = text.splitlines()

        if not lines:
            return False

        # ---------------------------------------------------------
        # Standard Zeek log format
        # ---------------------------------------------------------
        has_separator = any(
            line.startswith("#separator ")
            for line in lines
        )

        fields_line = next(
            (
                line
                for line in lines
                if line.startswith("#fields ")
            ),
            None,
        )

        if has_separator and fields_line:
            required_fields = {
                "ts",
                "uid",
                "id.orig_h",
                "id.orig_p",
                "id.resp_h",
                "id.resp_p",
            }

            fields = set(
                fields_line[len("#fields "):]
                .strip()
                .split()
            )

            if required_fields.issubset(fields):
                return True

        # ---------------------------------------------------------
        # Zeek key=value representation
        # ---------------------------------------------------------
        text_lower = text.lower()

        required_keyvalue_fields = (
            "ts=",
            "uid=",
            "id.orig_h=",
            "id.resp_h=",
            "id.orig_p=",
            "id.resp_p=",
        )

        return all(
            field in text_lower
            for field in required_keyvalue_fields
        )