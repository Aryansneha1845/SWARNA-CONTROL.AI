# Architecture — SWARN-CONTROL.AI
Next.js (React Flow trail) -> FastAPI (/investigate, /control-pack, /tts-hindi) -> modules: narrative.py (Gemini->Groq->regex), upi_parser.py (Tesseract-ready regex), resolver.py (deterministic time+amount+ID rules), trace.py (Etherscan free -> Ankr no-key RPC -> cached JSON), control.py (Chakshu/SCORES/family/freeze drafts).
Data: Event/Entity/Link with Known fact / Supported / Possible / Unverified. JSON file = DB for solo MVP. LLM only for extraction + Hindi explanation, never money math.
ETH only. PII masked by default, delete-anytime, no OTP/SMS harvest.
