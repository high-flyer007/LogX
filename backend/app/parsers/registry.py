from typing import Dict, List, Optional

from app.parsers.base import BaseParser
from app.parsers.fortigate import FortiGateTrafficParser
from app.parsers.json_parser import GenericJSONParser
from app.parsers.syslog import SyslogParser
from app.parsers.csv_parser import GenericCSVParser
from app.parsers.cef import GenericCEFParser
from app.parsers.leef import GenericLEEFParser
from app.parsers.suricata import SuricataParser
from app.parsers.zeek import ZeekConnParser
from app.parsers.cisco_asa import CiscoASAParser
from app.parsers.palo_alto import PaloAltoParser
from app.parsers.configurable import ConfigurableParser

class ParserRegistry:

    def __init__(self) -> None:

        self._parsers: Dict[str, BaseParser] = {}

        self.register(FortiGateTrafficParser())
        self.register(GenericJSONParser())
        self.register(SyslogParser())
        self.register(GenericCSVParser())
        self.register(GenericCEFParser())
        self.register(GenericLEEFParser())
        self.register(SuricataParser())
        self.register(ZeekConnParser())
        self.register(CiscoASAParser())
        self.register(PaloAltoParser())
        
        self.load_persisted()

    def register(
        self,
        parser: BaseParser,
    ) -> None:

        self._parsers[
            parser.parser_id
        ] = parser

    def get(
        self,
        parser_id: str,
    ) -> Optional[BaseParser]:

        return self._parsers.get(parser_id)

    def list_parsers(
        self,
    ) -> List[Dict[str, object]]:

        return [
            {
                "id": parser.parser_id,
                "version": parser.version,
                "vendor": parser.vendor,
                "product": parser.product,
                "formats": parser.supported_formats,
            }
            for parser in self._parsers.values()
        ]

    def find_parser(
        self,
        raw_data: str,
        detected_format: str,
        source: str,
    ) -> Optional[BaseParser]:
        source_aliases = {
            "fortigate": {"fortigate"},
            "cisco_asa": {"cisco", "cisco_asa"},
            "palo_alto": {"paloalto", "palo_alto"},
            "suricata": {"suricata"},
            "zeek": {"zeek"},
        }

        allowed_parser_sources = source_aliases.get(
            source,
            {source},
        )

        # 1. Prefer source-specific parsers.
        for parser in self._parsers.values():
            parser_source = parser.parser_id.split(".")[0]

            if (
                parser_source in allowed_parser_sources
                and parser.can_parse(
                    raw_data,
                    detected_format,
                )
            ):
                return parser

        # 2. Prefer an exact format parser.
        for parser in self._parsers.values():
            if (
                parser.parser_id == detected_format
                and parser.can_parse(
                    raw_data,
                    detected_format,
                )
            ):
                return parser

        # 3. Fall back to generic parsers.
        for parser in self._parsers.values():
            if (
                parser.parser_id.startswith("generic.")
                and parser.can_parse(
                    raw_data,
                    detected_format,
                )
            ):
                return parser

        return None

    def register_configurable(
        self,
        parser_id: str,
        version: str,
        vendor: str,
        product: str,
        supported_formats: tuple[str, ...],
        required_fields: list[str],
        field_mappings: Dict[str, str],
    ) -> BaseParser:
        parser = ConfigurableParser(
            parser_id=parser_id,
            version=version,
            vendor=vendor,
            product=product,
            supported_formats=supported_formats,
            required_fields=required_fields,
            field_mappings=field_mappings,
        )

        self.register(parser)

        return parser

    def load_persisted(self) -> None:
        from app.core.database import SessionLocal
        from app.models.db import ParserDefinition

        with SessionLocal() as session:
            definitions = (
                session.query(ParserDefinition)
                .filter(ParserDefinition.status == "active")
                .all()
            )

            for definition in definitions:
                if self.get(definition.parser_id):
                    continue

                self.register_configurable(
                    parser_id=definition.parser_id,
                    version=definition.version,
                    vendor=definition.vendor,
                    product=definition.product,
                    supported_formats=tuple(definition.supported_formats or []),
                    required_fields=list(definition.required_fields or []),
                    field_mappings=dict(definition.field_mappings or {}),
                )