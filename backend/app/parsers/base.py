from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseParser(ABC):
    """
    Base interface that every LogX parser must implement.
    """

    parser_id: str = "unknown"
    version: str = "1.0.0"
    vendor: str = "Unknown"
    product: str = "Unknown"
    supported_formats: tuple[str, ...] = ()

    @abstractmethod
    def can_parse(
        self,
        raw_data: str,
        detected_format: str,
    ) -> bool:
        """
        Determine whether this parser can process the input.
        """
        raise NotImplementedError

    @abstractmethod
    def parse(
        self,
        raw_data: str,
    ) -> Dict[str, Any]:
        """
        Parse raw data into structured fields.
        """
        raise NotImplementedError