"""SWARN-CONTROL.AI data contracts. LLM never decides money — only extraction/explanation."""
from typing import Literal
from pydantic import BaseModel

Rail = Literal["message", "upi", "bank", "crypto"]
Confidence = Literal["Known fact", "Supported", "Possible relationship", "Unverified"]
EntityType = Literal["person", "company", "phone", "upi", "website", "telegram", "wallet", "token", "amount", "claim", "date"]

class Entity(BaseModel):
    type: EntityType
    value: str
    source: str  # which input it came from

class Event(BaseModel):
    id: str
    rail: Rail
    timestamp: str | None = None
    amount_inr: float | None = None
    amount_usdt: float | None = None
    identifiers: dict = {}
    raw_ref: str = ""

class Link(BaseModel):
    from_id: str
    to_id: str
    why: str
    evidence: list[str]
    confidence: Confidence

class Investigation(BaseModel):
    events: list[Event]
    entities: list[Entity]
    links: list[Link]
    kill_chain: dict[str, bool]
    current_destination: str
    hindi_summary: str
