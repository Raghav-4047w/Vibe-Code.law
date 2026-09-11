"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Layers, CheckCircle2, Clock, Wallet, Cpu, Hash } from "lucide-react";
import axios from "axios";

const WALLET   = "0xc58dC13162fcA1b04AF4af2Ea9072d8FDE1ef8f7";
const CONTRACT = "0xA94D3FF15B2c24E8e2E820d6e631c79a69b2b14c";
const SCAN     = "https://amoy.polygonscan.com";

interface ChainTx {
  tx_hash: string;
  evidence_id: number;
  file_hash: string;
  logged_by: string;
  block_number: number | string;
  gas_used: number;
  gas_fee_pol: number;
  title?: string;
  fir_no?: string;
  uploaded_at?: string;
  polygonscan_url: string;
}

export default function BlockchainLedger() {
  const [txs, setTxs]         = useState<ChainTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/blockchain/transactions");
      setTxs(res.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to fetch blockchain txs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const shortHash = (h: string) =>
    h ? `${h.slice(0, 10)}...${h.slice(-8)}` : "—";

  const formatTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const totalGas = txs.reduce((a, t) => a + (t.gas_fee_pol || 0), 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-primary flex items-center gap-2">
            <Layers size={22} className="text-[#8B5CF6]" /> Blockchain Evidence Ledger
          </h1>
          <p className="text-[12px] text-outline mt-1">
            Live data pulled directly from <span className="font-bold text-[#8B5CF6]">Polygon Amoy</span> smart contract events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-[#101B31] hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh Chain
          </button>
          <a
            href={`${SCAN}/address/${WALLET}`}
            target="_blank"
            className="flex items-center gap-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded-lg text-[12px] font-bold transition-colors"
          >
            Open on PolygonScan <ExternalLink size={12}/>
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-[#8B5CF6]/10 rounded-lg"><Wallet size={18} className="text-[#8B5CF6]" /></div>
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Wallet</p>
            <p className="text-[11px] font-mono text-primary font-bold">{WALLET.slice(0,12)}…</p>
            <a href={`${SCAN}/address/${WALLET}`} target="_blank"
               className="text-[10px] text-[#8B5CF6] hover:underline flex items-center gap-0.5">
              View wallet <ExternalLink size={9}/>
            </a>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-[#0D7A5F]/10 rounded-lg"><CheckCircle2 size={18} className="text-[#0D7A5F]" /></div>
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Total Logs</p>
            <p className="text-[26px] font-bold text-primary leading-tight">{loading ? "—" : txs.length}</p>
            <p className="text-[10px] text-outline">Evidence hashes on-chain</p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-[#F59E0B]/10 rounded-lg"><Cpu size={18} className="text-[#F59E0B]" /></div>
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Total Gas Spent</p>
            <p className="text-[18px] font-bold text-primary leading-tight">{loading ? "—" : totalGas.toFixed(6)}</p>
            <p className="text-[10px] text-outline">POL (Amoy Testnet)</p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg"><Hash size={18} className="text-primary" /></div>
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Contract</p>
            <p className="text-[11px] font-mono text-primary font-bold">{CONTRACT.slice(0,12)}…</p>
            <a href={`${SCAN}/address/${CONTRACT}`} target="_blank"
               className="text-[10px] text-[#8B5CF6] hover:underline flex items-center gap-0.5">
              View contract <ExternalLink size={9}/>
            </a>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-outline-variant/20 flex justify-between items-center bg-[#F5F3FF]/50">
          <h2 className="text-[13px] font-bold text-primary flex items-center gap-2">
            <Layers size={13} className="text-[#8B5CF6]" />
            EvidenceLogged Events — Polygon Amoy
          </h2>
          {lastRefresh && (
            <span className="text-[10px] text-outline flex items-center gap-1">
              <Clock size={9}/> {lastRefresh.toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-outline">
            <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px]">Reading from Polygon Amoy blockchain…</span>
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-24 text-outline text-[13px]">
            No on-chain evidence logs yet. Upload an evidence file to create your first blockchain record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/20 text-outline font-bold uppercase tracking-widest text-[9px]">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">TX Hash</th>
                  <th className="px-4 py-3 text-left">Evidence</th>
                  <th className="px-4 py-3 text-left">FIR No.</th>
                  <th className="px-4 py-3 text-left">Uploaded At</th>
                  <th className="px-4 py-3 text-left">Block</th>
                  <th className="px-4 py-3 text-left">Gas</th>
                  <th className="px-4 py-3 text-left">PolygonScan</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, i) => (
                  <tr
                    key={tx.tx_hash}
                    className="border-b border-outline-variant/10 hover:bg-[#F5F3FF]/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-outline font-bold">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-primary font-bold">
                      <span title={tx.tx_hash}>{shortHash(tx.tx_hash)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] text-[9px] font-bold px-1.5 py-0.5 rounded">
                          #{tx.evidence_id}
                        </span>
                        <span className="text-primary font-medium truncate max-w-[120px]" title={tx.title}>
                          {tx.title || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-outline text-[10px]">
                      {tx.fir_no || "—"}
                    </td>
                    <td className="px-4 py-3 text-outline whitespace-nowrap">
                      {formatTime(tx.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-outline">
                      {tx.block_number !== "—" ? `#${tx.block_number}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-outline">
                      {tx.gas_fee_pol ? `${tx.gas_fee_pol} POL` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={tx.polygonscan_url}
                        target="_blank"
                        className="flex items-center gap-1 text-[#8B5CF6] hover:text-[#7C3AED] font-bold hover:underline"
                      >
                        View TX <ExternalLink size={10}/>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
