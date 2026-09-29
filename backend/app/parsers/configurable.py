import shlex
from typing import Any, Dict

from app.parsers.base import BaseParser


class ConfigurableParser(BaseParser):
    def __init__(
        self,
        parser_id: str,
        version: str,
        vendor: str,
        product: str,
        supported_formats: tuple[str, ...],
        required_fields: list[str],
        field_mappings: Dict[str, str],
    ):
        self.parser_id = parser_id
        self.version = version
        self.vendor = vendor
        self.product = product
        self.supported_formats = supported_formats
        self.required_fields = required_fields
        self.field_mappings = field_mappings

    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:
        if detected_format not in self.supported_formats:
            return False

        fields = self._parse_key_value(raw_data)

        return all(
            field in fields
            for field in self.required_fields
        )

    def parse(
        self,
        raw_data: str,
    ) -> Dict[str, Any]:
        fields = self._parse_key_value(raw_data)

        result: Dict[str, Any] = {
            "metadata": dict(fields),
            "lineage_source": dict(fields),
        }

        for source_field, target_path in self.field_mappings.items():
            if source_field not in fields:
                continue

            value = self._convert_value(
                fields[source_field]
            )

            self._set_nested(
                result,
                target_path,
                value,
            )

        # Keep only genuinely unmapped fields in metadata.
        for source_field in self.field_mappings:
            result["metadata"].pop(
                source_field,
                None,
            )

        return result

    @staticmethod
    def _parse_key_value(
        raw_data: str,
    ) -> Dict[str, str]:
        result: Dict[str, str] = {}

        for token in shlex.split(raw_data):
            if "=" not in token:
                continue

            key, value = token.split(
                "=",
                1,
            )

            result[key] = value

        return result

    @staticmethod
    def _set_nested(
        result: Dict[str, Any],
        path: str,
        value: Any,
    ) -> None:
        parts = path.split(".")

        current = result

        for part in parts[:-1]:
            if part not in current:
                current[part] = {}

            current = current[part]

        current[parts[-1]] = value

    @staticmethod
    def _convert_value(
        value: str,
    ) -> Any:
        try:
            return int(value)
        except ValueError:
            pass

        try:
            return float(value)
        except ValueError:
            pass

        return value