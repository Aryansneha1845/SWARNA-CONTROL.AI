"""ETH trace: live Etherscan -> public RPC -> cached fixture. Demo never dies."""
import json
import os
from pathlib import Path

FIXTURE = Path(__file__).parent.parent / "fixtures" / "praveen_chain.json"

def _load_cache() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))

def trace(tx_hash: str) -> dict:
    # 1. Try Etherscan V2 free (chainid=1 Ethereum, 3 req/s, 100k/day, no card)
    api_key = os.getenv("ETHERSCAN_API_KEY", "")
    if api_key and tx_hash.startswith("0x"):
        try:
            import requests
            r = requests.get("https://api.etherscan.io/v2/api", params={
                "chainid": "1",
                "module": "proxy", "action": "eth_getTransactionByHash",
                "txhash": tx_hash, "apikey": api_key,
            }, timeout=10)
            j = r.json()
            if j.get("result"):
                data = _load_cache()
                data["live"] = {"from": j["result"].get("from"), "to": j["result"].get("to")}
                return data
        except Exception:
            pass
    # 2. Try no-key public RPC
    try:
        import requests
        rpc = os.getenv("ETH_RPC_URL", "https://rpc.ankr.com/eth")
        r = requests.post(rpc, json={"jsonrpc": "2.0", "id": 1, "method": "eth_getTransactionByHash", "params": [tx_hash]}, timeout=10)
        if r.json().get("result"):
            data = _load_cache()
            data["live_rpc"] = True
            return data
    except Exception:
        pass
    # 3. Cached fallback — always works
    data = _load_cache()
    data["cached"] = True
    return data
