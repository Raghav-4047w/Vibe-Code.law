"use client";

import { useEffect, useState } from "react";
import { Scale, FileText, Lock, CheckCircle2, AlertTriangle, ShieldCheck, HardDrive, Plus, ShieldAlert, ChevronRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Dashboard() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    setUserRole(sessionStorage.getItem("userRole") || "");
    const fetchCases = async () => {
      try {
        const res = await axios.get("/api/cases");
        setCases(res.data);
      } catch (err) {
        console.error("Failed to fetch cases");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => 
    (c.fir_no || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.statute || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Left Sidebar Analytics */}
      <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0">
        
        {/* Ledger Status */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-surface-variant rounded-bl-full -mr-16 -mt-16 opacity-30 pointer-events-none"></div>
           
           <div className="flex justify-between items-start mb-6">
             <p className="text-label-caps text-outline tracking-widest font-bold">TOTAL REGISTERED CASES</p>
             <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-surface-container px-2 py-1 rounded tracking-widest border border-outline-variant/30">
               <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div> Ledger: Live
             </span>
           </div>

           <div className="flex items-end gap-2 mb-8">
             <h2 className="text-display-lg text-primary m-0 leading-none">{cases.length}</h2>
             <span className="text-headline-sm text-outline mb-1">Cases</span>
           </div>

           <div className="grid grid-cols-2 gap-y-6 gap-x-4">
             <div>
               <div className="flex items-center gap-1.5 text-label-caps text-outline mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div> INVESTIGATING
               </div>
               <p className="text-headline-md text-secondary m-0">{cases.filter(c => !c.is_sealed && c.status !== "Chargesheet Filed").length}</p>
               <p className="text-[10px] text-outline">Active Seizures</p>
             </div>
             <div>
               <div className="flex items-center gap-1.5 text-label-caps text-outline mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> FILED
               </div>
               <p className="text-headline-md text-primary m-0">{cases.filter(c => !c.is_sealed && c.status === "Chargesheet Filed").length}</p>
               <p className="text-[10px] text-outline">Sec 173 Dossiers</p>
             </div>
             <div>
               <div className="flex items-center gap-1.5 text-label-caps text-outline mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-error"></div> SEALED
               </div>
               <p className="text-headline-md text-primary m-0">{cases.filter(c => c.is_sealed).length}</p>
               <p className="text-[10px] text-outline">Immutable Vault</p>
             </div>
           </div>
        </div>

        {/* Register Case Action - Only for IO */}
        {userRole === "Officer" && (
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/case/new" className="bg-primary hover:bg-[#101B31] text-white rounded-[16px] p-4 flex items-center justify-between group transition-colors shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-inner">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-label-md font-bold mb-0.5">Register New Case</p>
                  <p className="text-[11px] text-primary-fixed-dim m-0">Initiate Dossier (IO Exclusive)</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-primary-fixed-dim group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/drafts" className="bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant/50 rounded-[16px] p-4 flex items-center justify-between group transition-colors shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-label-md font-bold mb-0.5">Saved Drafts</p>
                  <p className="text-[11px] text-outline m-0">View Incomplete Case Registrations</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-outline group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* Right Main Content */}
      <div className="w-full lg:w-3/4 flex flex-col gap-4">
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-secondary" size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FIRs, sections (e.g., Sec 111 BNS), accused, or titles..."
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-outline-variant/50 rounded-[12px] shadow-sm text-body-md text-primary focus:ring-2 focus:ring-secondary/30 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        {/* List Header */}
        <div className="flex justify-between items-end mt-2 mb-1">
          <h2 className="text-headline-sm text-primary font-bold">Case Dossiers <span className="text-label-caps text-outline ml-2 font-normal">SHOWING {filteredCases.length} CASES</span></h2>
        </div>

        {/* Case Cards List */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-10 text-outline">No cases match your search.</div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((kase, idx) => (
              <div key={kase.id || idx} className="bg-white rounded-[16px] border border-outline-variant/40 shadow-sm overflow-hidden hover:border-outline-variant transition-colors group">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${kase.is_sealed ? 'bg-error-container text-error border-[#ffb4ab]' : 'bg-[#FFF8ED] text-[#92400E] border-[#FCD34D]'}`}>
                      {kase.is_sealed ? <Lock size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                      {kase.status}
                    </span>
                    <span className="text-label-md text-outline font-medium tracking-wide">FIR No. {(kase.fir_no || "").replace('FIR-', '')}</span>
                  </div>
                  
                  <h3 className="text-headline-sm text-primary font-bold mb-2 group-hover:text-secondary transition-colors">{kase.title}</h3>
                  <p className="text-body-sm text-on-surface-variant mb-6 line-clamp-2">{kase.description}</p>
                  
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-outline-variant/20">
                    <div className="col-span-1">
                      <p className="text-[10px] text-outline uppercase tracking-wider font-bold mb-1">STATUTE</p>
                      <p className="text-label-md text-primary truncate">{kase.statute}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-outline uppercase tracking-wider font-bold mb-1">JURISDICTION</p>
                      <p className="text-label-md text-primary truncate">{kase.jurisdiction}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-outline uppercase tracking-wider font-bold mb-1">DATE</p>
                      <p className="text-label-md text-primary">{kase.date}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-outline uppercase tracking-wider font-bold mb-1 flex items-center justify-end gap-1"><ShieldAlert size={10}/> TOTAL EVIDENCES</p>
                      <p className="text-label-md text-primary font-bold text-right">{kase.evidences ? kase.evidences.length : 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface px-5 py-3 border-t border-outline-variant/30 flex justify-between items-center">
                  <div className="text-[11px] text-outline font-medium">
                    IO / Officer ID: <span className="text-primary font-bold">{kase.io_id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => window.location.href = `/case/${kase.id}`} className={`px-4 py-1.5 rounded-lg text-label-md font-bold flex items-center gap-1.5 text-white shadow-sm transition-colors ${kase.is_sealed ? 'bg-[#4a0002] hover:bg-black' : 'bg-primary hover:bg-[#101B31]'}`}>
                      {kase.is_sealed ? <><Lock size={14}/> View Sealed Ledger (Read-Only)</> : 'View Dossier'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
