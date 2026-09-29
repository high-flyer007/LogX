import csv
import io
import json
import re
from typing import Dict


class FormatDetector:

    FORMATS = {
        "json",
        "csv",
        "syslog",
        "cef",
        "leef",
        "key_value",
        "zeek",
        "unknown",
    }

    def detect(self, raw_data: str) -> Dict[str, object]:
        """
        Detect the format of a raw security log.

        Detection is intentionally conservative.
        Unknown input should remain UNKNOWN rather than
        being incorrectly classified.
        """

        text = raw_data.strip()

        if not text:
            return {
                "format": "unknown",
                "confidence": 0.0,
                "reason": "Empty input",
            }

        if self._looks_like_zeek(text):
            return {
                "format": "zeek",
                "confidence": 0.99,
                "reason": "Zeek conn.log header detected",
            }
                
        # JSON
        if self._is_json(text):
            return {
                "format": "json",
                "confidence": 0.99,
                "reason": "Valid JSON document",
            }

        # CEF
        if text.startswith("CEF:"):
            return {
                "format": "cef",
                "confidence": 0.99,
                "reason": "CEF header detected",
            }

        # LEEF
        if text.startswith("LEEF:"):
            return {
                "format": "leef",
                "confidence": 0.99,
                "reason": "LEEF header detected",
            }

        # Syslog
        if self._looks_like_syslog(text):
            return {
                "format": "syslog",
                "confidence": 0.90,
                "reason": "Syslog header pattern detected",
            }

        # CSV
        if self._looks_like_csv(text):
            return {
                "format": "csv",
                "confidence": 0.85,
                "reason": "Consistent CSV structure detected",
            }

        # Key-value
        if self._looks_like_key_value(text):
            return {
                "format": "key_value",
                "confidence": 0.85,
                "reason": "Multiple key=value fields detected",
            }

        return {
            "format": "unknown",
            "confidence": 0.0,
            "reason": "No supported format confidently detected",
        }

    @staticmethod
    def _is_json(text: str) -> bool:
        try:
            json.loads(text)
            return True
        except (json.JSONDecodeError, TypeError):
            return False

    @staticmethod
    def _looks_like_syslog(text: str) -> bool:
        """
        Detect common RFC 3164 / RFC 5424 style syslog headers,
        including common BSD-style syslog messages without a priority prefix.
        """

        # RFC 5424:
        # <134>1 2026-09-19T12:30:00Z host app - - message
        rfc5424 = re.match(
            r"^<\d+>\d\s+\d{4}-\d{2}-\d{2}T",
            text,
        )

        if rfc5424:
            return True

        # RFC 3164 with priority:
        # <134>Sep 19 12:30:00 hostname message
        rfc3164 = re.match(
            r"^<\d+>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}",
            text,
        )

        if rfc3164:
            return True

        # Common BSD-style syslog without priority:
        # Sep 26 11:00:00 hostname process[1234]: message
        bsd_syslog = re.match(
            r"^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\S+(?:\[\d+\])?:",
            text,
        )

        return bool(bsd_syslog)

    @staticmethod
    def _looks_like_csv(text: str) -> bool:
        lines = text.splitlines()

        if len(lines) < 2:
            return False

        try:
            rows = list(
                csv.reader(
                    io.StringIO(text)
                )
            )

            if len(rows) < 2:
                return False

            column_count = len(rows[0])

            if column_count < 2:
                return False

            return all(
                len(row) == column_count
                for row in rows[:10]
            )

        except csv.Error:
            return False

    
    @staticmethod
    def _looks_like_key_value(text: str) -> bool:
        matches = re.findall(
            r"\b[A-Za-z_][A-Za-z0-9_.-]*=(?:\"[^\"]*\"|'[^']*'|\S+)",
            text,
        )

        return len(matches) >= 2

    @staticmethod
    def _looks_like_zeek(text: str) -> bool:
        lines = text.splitlines()

        if not lines:
            return False

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

        if not has_separator or not fields_line:
            return False

        required_fields = {
            "ts",
            "uid",
            "id.orig_h",
            "id.orig_p",
            "id.resp_h",
            "id.resp_p",
            "proto",
        }

        field_text = fields_line[len("#fields "):].strip()

        fields = set(field_text.split())

        return required_fields.issubset(fields)