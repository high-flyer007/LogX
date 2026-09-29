import ipaddress
from typing import Any, Dict, List


class ValidationResult:
    def __init__(
        self,
        status: str,
        errors: List[str] | None = None,
        warnings: List[str] | None = None,
    ):
        self.status = status
        self.errors = errors or []
        self.warnings = warnings or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class EventValidator:

    def validate(
        self,
        event: Dict[str, Any],
    ) -> ValidationResult:

        errors = []
        warnings = []

        source = event.get("source", {})
        destination = event.get("destination", {})
        network = event.get("network", {})

        # ---------------------------------------------
        # SOURCE IP
        # ---------------------------------------------

        source_ip = source.get("ip")

        if source_ip is not None:

            if not self._valid_ip(source_ip):
                errors.append(
                    f"Invalid source.ip: {source_ip}"
                )

        # ---------------------------------------------
        # DESTINATION IP
        # ---------------------------------------------

        destination_ip = destination.get("ip")

        if destination_ip is not None:

            if not self._valid_ip(destination_ip):
                errors.append(
                    f"Invalid destination.ip: "
                    f"{destination_ip}"
                )

        # ---------------------------------------------
        # SOURCE PORT
        # ---------------------------------------------

        source_port = source.get("port")

        if source_port is not None:

            if not self._valid_port(source_port):
                errors.append(
                    f"Invalid source.port: "
                    f"{source_port}"
                )

        # ---------------------------------------------
        # DESTINATION PORT
        # ---------------------------------------------

        destination_port = destination.get("port")

        if destination_port is not None:

            if not self._valid_port(destination_port):
                errors.append(
                    f"Invalid destination.port: "
                    f"{destination_port}"
                )

        # ---------------------------------------------
        # NETWORK PROTOCOL
        # ---------------------------------------------

        protocol = network.get("protocol")

        if protocol is not None:

            supported_protocols = {
                "tcp",
                "udp",
                "icmp",
                "sctp",
                "gre",
            }

            if str(protocol).lower() not in supported_protocols:

                warnings.append(
                    f"Unknown network protocol: "
                    f"{protocol}"
                )

        # ---------------------------------------------
        # FINAL STATUS
        # ---------------------------------------------

        if errors:

            return ValidationResult(
                status="invalid",
                errors=errors,
                warnings=warnings,
            )

        if warnings:

            return ValidationResult(
                status="warning",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status="valid"
        )

    @staticmethod
    def _valid_ip(
        value: Any,
    ) -> bool:

        try:
            ipaddress.ip_address(
                str(value)
            )

            return True

        except ValueError:
            return False

    @staticmethod
    def _valid_port(
        value: Any,
    ) -> bool:

        if not isinstance(value, int):
            return False

        return 0 <= value <= 65535