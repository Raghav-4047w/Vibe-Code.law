"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Database, Download, Loader2 } from "lucide-react";
import axios from "axios";

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/audit");
        setLogs(res.data);
        setFilteredLogs(res.data);
      } catch {
        console.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleFilter = () => {
    let result = [...logs];
    if (dateFrom) result = result.filter(l => new Date(l.timestamp) >= new Date(dateFrom));
    if (dateTo) result = result.filter(l => new Date(l.timestamp) <= new Date(dateTo + "T23:59:59Z"));
    setFilteredLogs(result);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setFilteredLogs(logs);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter((w) => w.length > 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActionColor = (action: string) => {
    if (action.includes("REGISTER")) return "bg-[#0D7A5F] text-white";
    if (action.includes("UPLOAD")) return "bg-surface-container-high text-primary";
    if (action.includes("VIEW")) return "bg-surface-variant text-primary";
    if (action.includes("SEAL")) return "bg-error-container text-error";
    if (action.includes("LOGIN")) return "bg-primary text-white";
    return "bg-surface-container text-primary";
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    return { date, time: time + " IST" };
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ["ID", "Timestamp", "User Name", "Badge ID", "Role", "Action", "Details", "Blockchain Tx"];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.user?.name || "System",
      log.user?.badge_id || "",
      log.user?.role || "",
      log.action,
      `"${(log.details || "").replace(/"/g, '""')}"`,
      log.blockchain_tx || ""
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 flex items-center justify-between relative overflow-hidden">
        <ShieldCheck className="absolute -right-8 -top-8 text-surface-container w-64 h-64 opacity-50 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-primary rounded-xl p-4 text-secondary shadow-md">
            <Database size={28} />
          </div>
          <div>
            <h1 className="text-display-lg-mobile text-primary font-bold m-0 leading-tight">
              Immutable Audit Trail
            </h1>
            <p className="text-body-md text-outline mt-1 flex items-center gap-2">
              <ShieldCheck size={14} className="text-tertiary-fixed-dim" /> Tamper-evident statutory record • {logs.length} total actions logged
            </p>
          </div>
        </div>

        <div className="relative z-10 bg-surface px-6 py-4 rounded-xl border border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-secondary">
            <Database size={20} />
          </div>
          <div>
            <p className="text-label-caps text-outline font-bold tracking-widest mb-1 flex items-center gap-1.5 uppercase">
              Showing{" "}
              <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
            </p>
            <p className="text-headline-lg text-primary m-0">{filteredLogs.length} / {logs.length}</p>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 px-6 py-4 flex flex-wrap items-center gap-4">
        <span className="text-[11px] font-bold text-outline uppercase tracking-widest">Filter by Date Range</span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-primary font-bold">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-outline-variant/50 rounded-lg px-3 py-1.5 text-[12px] text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-primary font-bold">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-outline-variant/50 rounded-lg px-3 py-1.5 text-[12px] text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-primary text-white text-[12px] font-bold px-4 py-1.5 rounded-lg hover:bg-[#101B31] transition-colors"
        >
          View Logs
        </button>
        <button
          onClick={handleReset}
          className="bg-surface border border-outline-variant/30 text-primary text-[12px] font-bold px-4 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
        >
          Reset
        </button>
        <button
          onClick={exportToCSV}
          className="ml-auto text-label-md text-primary font-bold flex items-center gap-2 hover:bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 transition-colors"
        >
          <Download size={14} /> Download CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30 bg-surface/50">
          <h3 className="text-label-caps text-primary font-bold tracking-widest">
            CRYPTOGRAPHIC ACTION LEDGER
          </h3>
          <span className="text-[11px] text-outline font-mono">SHA-256 Tamper-Evident • Read-Only Immutable Log</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-outline">
            No audit logs found for the selected date range.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/30 border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-label-caps text-outline tracking-widest w-[150px]">TIMESTAMP (IST)</th>
                  <th className="px-6 py-4 text-label-caps text-outline tracking-widest w-[250px]">OFFICER / OFFICIAL</th>
                  <th className="px-6 py-4 text-label-caps text-outline tracking-widest w-[180px]">ACTION</th>
                  <th className="px-6 py-4 text-label-caps text-outline tracking-widest">ACTION DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const ts = formatTimestamp(log.timestamp);
                  const logUserName = log.user?.name || "System";
                  const logUserBadge = log.user?.badge_id || "";
                  const logUserRole = log.user?.role || "";
                  return (
                    <tr key={log.id} className="border-b border-outline-variant/20 hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <p className="text-label-md text-primary font-bold">{ts.date}</p>
                        <p className="text-body-sm text-outline font-mono mt-1">{ts.time}</p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-primary">
                            {getInitials(logUserName)}
                          </div>
                          <div>
                            <p className="text-label-md text-primary font-bold">{logUserName}</p>
                            <p className="text-[11px] text-outline mt-0.5">{logUserRole} • {logUserBadge}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center w-fit gap-1.5 ${getActionColor(log.action)}`}>
                          <ShieldCheck size={10} /> {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <p className="text-body-md text-on-surface-variant leading-relaxed">{log.details}</p>
                        {log.blockchain_tx && (
                          <p className="text-[10px] text-outline mt-1 font-mono">Tx: {log.blockchain_tx}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


