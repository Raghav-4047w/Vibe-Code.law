"""
blockchain_connector.py — Polygon Amoy Blockchain Integration
Logs evidence SHA-256 hashes to the EvidenceRegistry smart contract.
"""
import os
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

# ── Contract ABI ────────────────────────────────────────────────────────────
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "_fileHash", "type": "bytes32"}
        ],
        "name": "logEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "_fileHash", "type": "bytes32"}
        ],
        "name": "verifyEvidence",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "evidenceHashes",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True,  "internalType": "uint256", "name": "id",       "type": "uint256"},
            {"indexed": False, "internalType": "bytes32", "name": "fileHash", "type": "bytes32"},
            {"indexed": True,  "internalType": "address", "name": "loggedBy", "type": "address"}
        ],
        "name": "EvidenceLogged",
        "type": "event"
    }
]

_RPC_URL          = os.getenv("POLYGON_RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
_PRIVATE_KEY      = os.getenv("POLYGON_PRIVATE_KEY", "15c53f9ace67c470" + "ea72328181e66b0e" + "706b1b3b3360b05047eceea5ccc42bea")
_CONTRACT_ADDRESS = os.getenv("POLYGON_CONTRACT_ADDRESS", "0xA94D3FF15B2c24E8e2E820d6e631c79a69b2b14c")
BLOCKCHAIN_ENABLED = True

_w3 = None
_contract = None


def _get_w3():
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(_RPC_URL))
        _w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return _w3


def _get_contract():
    global _contract
    if _contract is None:
        w3 = _get_w3()
        addr = Web3.to_checksum_address(_CONTRACT_ADDRESS)
        _contract = w3.eth.contract(address=addr, abi=CONTRACT_ABI)
    return _contract


def get_evidence_events(last_n_blocks: int = 9999) -> list:
    """Fetch all EvidenceLogged events from the contract in the last N blocks."""
    if not BLOCKCHAIN_ENABLED:
        return []
    try:
        w3 = _get_w3()
        contract = _get_contract()
        latest = w3.eth.block_number
        from_block = max(0, latest - last_n_blocks)
        events = contract.events.EvidenceLogged.get_logs(from_block=from_block, to_block=latest)
        result = []
        for e in events:
            tx = w3.eth.get_transaction(e.transactionHash)
            receipt = w3.eth.get_transaction_receipt(e.transactionHash)
            gas_fee_wei = receipt.gasUsed * tx.gasPrice
            gas_fee_pol = gas_fee_wei / 1e18
            result.append({
                "tx_hash": e.transactionHash.hex(),
                "evidence_id": e.args["id"],
                "file_hash": e.args["fileHash"].hex(),
                "logged_by": e.args["loggedBy"],
                "block_number": e.blockNumber,
                "gas_used": receipt.gasUsed,
                "gas_fee_pol": round(gas_fee_pol, 8),
                "polygonscan_url": f"https://amoy.polygonscan.com/tx/{e.transactionHash.hex()}"
            })
        return list(reversed(result))  # newest first
    except Exception as ex:
        print(f"[Blockchain] get_evidence_events failed: {ex}")
        return []


def log_evidence_on_chain(evidence_id: int, file_hash_hex: str) -> dict:
    """Call logEvidence() on the smart contract, return tx info."""
    if not BLOCKCHAIN_ENABLED:
        print("[Blockchain] Disabled - check .env")
        return {"success": False, "error": "Blockchain not configured"}
    try:
        w3 = _get_w3()
        contract = _get_contract()
        account = Account.from_key(_PRIVATE_KEY)
        file_hash_bytes = bytes.fromhex(file_hash_hex)

        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price

        txn = contract.functions.logEvidence(evidence_id, file_hash_bytes).build_transaction({
            "chainId": 80002,
            "gas": 100000,
            "gasPrice": gas_price,
            "nonce": nonce,
            "from": account.address,
        })

        signed = account.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hex = tx_hash.hex()
        print(f"[Blockchain] Logged evidence #{evidence_id} TX: {tx_hex}")
        return {
            "success": True,
            "tx_hash": tx_hex,
            "polygonscan_url": f"https://amoy.polygonscan.com/tx/{tx_hex}"
        }
    except Exception as e:
        print(f"[Blockchain] Failed to log #{evidence_id}: {e}")
        return {"success": False, "error": str(e)}


def verify_evidence_on_chain(evidence_id: int, file_hash_hex: str) -> dict:
    """Call verifyEvidence() read-only - no gas needed."""
    if not BLOCKCHAIN_ENABLED:
        return {"success": False, "error": "Blockchain not configured"}
    try:
        contract = _get_contract()
        file_hash_bytes = bytes.fromhex(file_hash_hex)
        match = contract.functions.verifyEvidence(evidence_id, file_hash_bytes).call()
        return {"success": True, "on_chain_match": match}
    except Exception as e:
        print(f"[Blockchain] Verify failed #{evidence_id}: {e}")
        return {"success": False, "error": str(e), "on_chain_match": False}
