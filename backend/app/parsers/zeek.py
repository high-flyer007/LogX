import json

from typing import Any, Dict

from app.parsers.base import BaseParser


class ZeekConnParser(BaseParser):

    parser_id = "zeek.conn"
    version = "1.0.0"
    vendor = "Zeek"
    product = "Zeek conn.log"
    supported_formats = ("json", "zeek")

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:

        if detected_format == "json":
            try:
                data = json.loads(raw_data)
            except (json.JSONDecodeError, TypeError):
                return False

            if not isinstance(data, dict):
                return False

            return (
                "uid" in data
                and (
                    "id.orig_h" in data
                    or "id.resp_h" in data
                )
            )

        if detected_format == "zeek":
            lines = raw_data.strip().splitlines()

            if not lines:
                return False

            fields_line = next(
                (
                    line
                    for line in lines
                    if line.startswith("#fields ")
                ),
                None,
            )

            return bool(
                fields_line
                and "uid" in fields_line
                and "id.orig_h" in fields_line
                and "id.resp_h" in fields_line
            )

        return False

    def parse(self, raw_data: str) -> Dict[str, Any]:

        if raw_data.lstrip().startswith("{"):
            return self._parse_json(raw_data)

        return self._parse_zeek(raw_data)

    def _parse_json(self, raw_data: str) -> Dict[str, Any]:

        data = json.loads(raw_data)

        return self._build_result(
            timestamp=data.get("ts"),
            uid=data.get("uid"),
            source_ip=data.get("id.orig_h"),
            source_port=data.get("id.orig_p"),
            destination_ip=data.get("id.resp_h"),
            destination_port=data.get("id.resp_p"),
            protocol=data.get("proto"),
            service=data.get("service"),
            conn_state=data.get("conn_state"),
            data=data,
        )

    def _parse_zeek(self, raw_data: str) -> Dict[str, Any]:

        lines = raw_data.strip().splitlines()

        fields = None
        data_line = None

        for line in lines:
            if line.startswith("#fields "):
                fields = line[len("#fields "):].strip().split()

            elif line and not line.startswith("#"):
                data_line = line

        if not fields or not data_line:
            raise ValueError("Invalid Zeek conn.log structure")

        separator = "\t"

        if "\\x09" in raw_data:
            separator = "\t"

        values = data_line.split("\t")

        data = dict(zip(fields, values))

        return self._build_result(
            timestamp=data.get("ts"),
            uid=data.get("uid"),
            source_ip=data.get("id.orig_h"),
            source_port=data.get("id.orig_p"),
            destination_ip=data.get("id.resp_h"),
            destination_port=data.get("id.resp_p"),
            protocol=data.get("proto"),
            service=data.get("service"),
            conn_state=data.get("conn_state"),
            data=data,
        )

    def _build_result(
        self,
        timestamp: Any,
        uid: Any,
        source_ip: Any,
        source_port: Any,
        destination_ip: Any,
        destination_port: Any,
        protocol: Any,
        service: Any,
        conn_state: Any,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:

        result: Dict[str, Any] = {
            "event": {
                "category": "network",
                "type": "connection",
                "action": conn_state,
                "name": "Zeek connection",
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
            result["source"]["port"] = self._to_int(source_port)
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

        orig_bytes = data.get("orig_bytes")
        resp_bytes = data.get("resp_bytes")

        if orig_bytes is not None:
            result["network"]["orig_bytes"] = self._to_int(
                orig_bytes
            )
            result["lineage_source"]["orig_bytes"] = orig_bytes

        if resp_bytes is not None:
            result["network"]["resp_bytes"] = self._to_int(
                resp_bytes
            )
            result["lineage_source"]["resp_bytes"] = resp_bytes

        result["metadata"] = {
            "timestamp": timestamp,
            "uid": uid,
            "service": service,
            "duration": data.get("duration"),
            "conn_state": conn_state,
            "local_orig": data.get("local_orig"),
            "local_resp": data.get("local_resp"),
            "missed_bytes": data.get("missed_bytes"),
            "history": data.get("history"),
            "orig_pkts": data.get("orig_pkts"),
            "orig_ip_bytes": data.get("orig_ip_bytes"),
            "resp_pkts": data.get("resp_pkts"),
            "resp_ip_bytes": data.get("resp_ip_bytes"),
        }

        return result

    @staticmethod
    def _to_int(value: Any) -> Any:

        try:
            return int(value)

        except (TypeError, ValueError):
            return value