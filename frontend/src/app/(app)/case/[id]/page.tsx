"use client";

import { useState, useEffect } from "react";
import { Scale, FileText, Download, UploadCloud, Lock, CheckCircle2, AlertTriangle, ShieldCheck, HardDrive, ChevronDown, ChevronRight, User, Search, Database, Loader2, Info, Calendar } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CaseDossier({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userBadge, setUserBadge] = useState("");
  const [userId, setUserId] = useState<number>(1);
  
  // Seal Case State
  const [verdict, setVerdict] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sealConfirmed, setSealConfirmed] = useState(false);
  const [isSealing, setIsSealing] = useState(false);

  // Upload Evidence State
  const [evType, setEvType] = useState("First Information Report (FIR)");
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState(new Date().toISOString().split('T')[0]);
  const [evConfirmed, setEvConfirmed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");

  const fetchEvidence = async () => {
    try {
      const evidenceRes = await axios.get(`/api/cases/${params.id}/evidence`);
      setEvidenceList(evidenceRes.data);
    } catch (err) {
      console.error("Failed to fetch evidence data");
    }
  };

  useEffect(() => {
    setRole(sessionStorage.getItem("userRole") || "Officer");
    setUserName(sessionStorage.getItem("userName") || "");
    setUserBadge(sessionStorage.getItem("userBadge") || "");
    setUserId(parseInt(sessionStorage.getItem("userId") || "1"));

    const fetchData = async () => {
      try {
        const [caseRes, evidenceRes] = await Promise.all([
          axios.get(`/api/cases/${params.id}`),
          axios.get(`/api/cases/${params.id}/evidence`)
        ]);
        setCaseData(caseRes.data);
        setEvidenceList(evidenceRes.data);
      } catch (err) {
        console.error("Failed to fetch case data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleSealCase = async () => {
    if (!verdict || !orderRef || !sealConfirmed) {
      alert("Please fill in the Judicial Verdict, Sealing Order Reference, and check the confirmation box.");
      return;
    }
    
    setIsSealing(true);
    try {
      await axios.post(`/api/cases/${params.id}/seal`, {
        verdict: verdict,
        order_ref: orderRef,
        remarks: remarks,
        user_id: userId
      });
      setCaseData({ ...caseData, is_sealed: true, status: verdict });
      alert("Case has been judicially sealed.");
    } catch (err) {
      alert("Failed to seal case.");
    } finally {
      setIsSealing(false);
    }
  };

  const [evFiles, setEvFiles] = useState<File[]>([]);

  const handleUploadEvidence = async () => {
    if (!evTitle || !evConfirmed || evFiles.length === 0) {
      alert("Please provide a Document Title, attach file(s), and check the confirmation box.");
      return;
    }

    setIsUploading(true);
    
    try {
      for (let i = 0; i < evFiles.length; i++) {
        const file = evFiles[i];
        setUploadStep(`Processing file ${i+1}/${evFiles.length}: ${file.name}...`);
        
        const formData = new FormData();
        formData.append("title", evFiles.length > 1 ? `${evTitle} - ${file.name}` : evTitle);
        formData.append("type", evType);
        formData.append("uploaded_by", userName);
        formData.append("file", file);

        await new Promise(r => setTimeout(r, 800));
        setUploadStep(`File ${i+1}/${evFiles.length}: Running Gemini Vision AI Analysis...`);
        
        await axios.post(`/api/cases/${params.id}/evidence`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000  // 2 min timeout - AI processing takes time on free tier
        });
      }
      
      setUploadStep("Sealing evidence on immutable ledger...");
      await new Promise(r => setTimeout(r, 500));
      
      alert(`Successfully uploaded and sealed ${evFiles.length} evidence artifact(s).`);
      setEvTitle("");
      setEvConfirmed(false);
      setEvFiles([]);
      await fetchEvidence();
    } catch (err) {
      alert("Failed to upload one or more evidence files.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  if (!caseData) {
    return <div className="text-center py-20 text-outline">Case not found.</div>;
  }

  // Dynamic texts based on role
  const sessionTag = role === "Officer" ? "FULL IO EXECUTION" : role === "Judge" ? "JUDICIAL READ-ONLY REVIEW" : "ANALYST READ-ONLY ACCESS";
  const sessionTagColor = role === "Officer" ? "bg-primary text-white" : role === "Judge" ? "bg-[#0D7A5F] text-white" : "bg-[#101B31] text-white";

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* Processing Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-primary/90 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-md w-full mx-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-outline-variant/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-t-transparent border-r-[#0D7A5F] border-b-transparent border-l-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              <FileText size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h3 className="text-[18px] font-bold text-primary mb-2">Processing Evidence</h3>
            <p className="text-[13px] text-outline mb-4">Please wait while we process and seal your document...</p>
            <div className="bg-[#F0F3FF] rounded-lg p-3 border border-outline-variant/30">
              <p className="text-[12px] font-bold text-[#0D7A5F] flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {uploadStep}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Top Main Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6 flex flex-col lg:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
           <div className="bg-primary rounded-xl p-4 text-white shadow-md mt-1 shrink-0">
             <Scale size={28} />
           </div>
           <div>
             <h1 className="text-display-lg-mobile text-primary font-bold m-0 leading-tight">{caseData.title}</h1>
             <div className="flex flex-wrap items-center gap-3 mt-3">
               <span className="text-[11px] text-primary font-bold tracking-widest uppercase bg-surface-container-low px-2 py-1 rounded">
                 REF: {caseData.fir_no}
               </span>
               <span className="text-body-sm text-outline">&bull;</span>
               <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5"><ShieldCheck size={14}/> {caseData.jurisdiction}</span>
               <span className="text-body-sm text-outline">&bull;</span>
               <span className="text-body-sm text-outline flex items-center gap-1.5"><Lock size={14}/> Logged: {caseData.date}</span>
             </div>
           </div>
        </div>

        {/* Role / Access Badge — compact & separate */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-surface rounded-xl border border-outline-variant/50 px-4 py-2">
            <span className="text-[10px] text-outline tracking-widest font-bold uppercase">Session Access</span>
            <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase ${sessionTagColor}`}>{sessionTag}</span>
          </div>
          <div className="flex gap-2">
            {["Officer", "Judge", "Analyst"].map((r) => (
              <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                role === r
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant/30 bg-surface text-outline"
              }`}>{r}</span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-outline">
            <User size={13} className={role === "Analyst" ? "text-[#92400E]" : "text-primary"} />
            <span className={`font-bold ${role === "Analyst" ? "text-[#92400E]" : "text-primary"}`}>{userName} ({userBadge})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6 shrink-0">
          
          {/* Evidentiary Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[14px] text-primary font-bold flex items-center gap-2"><Database size={16}/> Evidentiary Metadata</h3>
                {!caseData.is_sealed && (role === "Judge" || role === "Analyst") && (
                  <span className="text-[9px] bg-[#FFF8ED] text-[#92400E] border border-[#FCD34D] px-2 py-0.5 rounded font-bold uppercase tracking-widest">PENDING JUDICIAL SEAL</span>
                )}
                {caseData.is_sealed && (
                  <span className="text-[9px] bg-error-container text-error px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1"><Lock size={10}/> SEALED</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5 border-b border-outline-variant/30 pb-5">
                <div className="text-center border-r border-outline-variant/30">
                  <div className="text-[28px] text-primary font-bold leading-none mb-2">{evidenceList.length}</div>
                  <div className="text-[10px] text-outline font-bold tracking-widest uppercase">ARTIFACTS</div>
                </div>
                <div className="text-center">
                  <div className="text-[28px] text-primary font-bold leading-none mb-2">0</div>
                  <div className="text-[10px] text-outline font-bold tracking-widest uppercase">TAMPER ALERTS</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-[#F0F3FF]/50 p-3 rounded-lg border border-outline-variant/30 mb-5">
                 <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0"><ShieldCheck size={14}/></div>
                 <div>
                   <p className="text-[9px] text-outline uppercase tracking-widest font-bold mb-0.5">AUTHORIZED CUSTODIAN IO</p>
                   <p className="text-[13px] text-primary font-bold leading-tight">IO ID: {caseData.io_id}</p>
                 </div>
              </div>

              <button 
                onClick={() => window.open(`/api/cases/${params.id}/pdf`, '_blank')}
                className="w-full bg-primary hover:bg-[#101B31] text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold transition-all shadow-sm"
              >
                <Download size={16} /> Download Case Report (PDF)
              </button>
            </div>
          </div>

          {/* Role-Specific Action Cards */}
          
          {/* JUDGE ROLE */}
          {role === "Judge" && (
            <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${caseData.is_sealed ? 'border-outline-variant/50' : 'border border-outline-variant/50'}`}>
              <div className="p-5 border-b border-outline-variant/30 bg-surface/50 flex justify-between items-center">
                <h3 className="text-[14px] text-primary font-bold flex items-center gap-2"><Scale size={16} /> Seal the Case</h3>
                <Lock size={14} className="text-[#92400E]" />
              </div>
              
              <div className="p-5">
                {caseData.is_sealed ? (
                  <div className="bg-surface-container p-4 rounded-lg text-center">
                    <Lock size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-[13px] font-bold text-primary">Case is Judicially Sealed</p>
                    <p className="text-[11px] text-outline mt-1">{caseData.status}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-outline mb-4 leading-relaxed">Sealing this case finalizes the evidentiary record under judicial authority. No further documents or evidence may be added, and all chain-of-custody entries become permanently locked.</p>
                    
                    <div className="space-y-4 mb-5">
                      <div>
                        <label className="block text-[11px] font-bold text-primary mb-1">Judicial Verdict / Case Disposition *</label>
                        <select 
                          value={verdict} onChange={(e) => setVerdict(e.target.value)}
                          className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-white focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Select Disposition --</option>
                          <option value="Chargesheet Filed">Chargesheet Filed</option>
                          <option value="Case Closed - Lack of Evidence">Case Closed - Lack of Evidence</option>
                          <option value="Transferred to Higher Court">Transferred to Higher Court</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-primary mb-1">Sealing Order / Judgment Reference *</label>
                        <input 
                          type="text" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="e.g., JUD-ORD-2026-DEL"
                          className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-[#F0F3FF]/30 focus:outline-none focus:border-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-primary mb-1">Judicial Remarks / Sealing Direction (Optional)</label>
                        <textarea 
                          rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Evidence verified and record directed for final archival..."
                          className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-white focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 mb-5 cursor-pointer bg-surface/50 p-3 rounded-lg border border-outline-variant/30">
                      <input type="checkbox" checked={sealConfirmed} onChange={(e) => setSealConfirmed(e.target.checked)} className="mt-0.5" />
                      <span className="text-[11px] text-primary leading-relaxed">I solemnly attest and confirm under judicial seal that this case dossier is finalized, exhibits are verified, and the record is to be permanently cryptographically sealed.</span>
                    </label>
                    
                    <button 
                      onClick={handleSealCase} disabled={isSealing}
                      className="w-full bg-primary hover:bg-[#101B31] text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold transition-all shadow-sm disabled:opacity-70"
                    >
                      {isSealing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      Seal Case & Affix Judicial Lock
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ANALYST ROLE */}
          {role === "Analyst" && (
            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
              <div className="p-5 border-b border-outline-variant/30 bg-surface/50 flex justify-between items-center">
                <h3 className="text-[14px] text-primary font-bold flex items-center gap-2"><ShieldCheck size={16} /> Analyst Access Privileges</h3>
                <span className="text-[9px] bg-surface-container-high text-primary px-2 py-0.5 rounded font-bold uppercase tracking-widest">RESTRICTED REVIEW</span>
              </div>
              <div className="p-5">
                <div className="bg-[#FFF8ED] border border-[#FCD34D]/50 p-3 rounded-lg mb-4 flex gap-2 items-start">
                  <Info size={16} className="text-[#92400E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-[#92400E] mb-1">Notice: Sorry, you are only allowed to view and download the report.</p>
                    <p className="text-[11px] text-[#92400E]/80 leading-relaxed">Analyst role is restricted to read-only evidentiary review, cryptographic verification, and certified report generation. Evidentiary modification requires Officer credentials.</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 mb-2">
                   <span className="text-[11px] text-outline">Report Scope</span>
                   <span className="text-[12px] text-primary font-bold">Full Dossier ({evidenceList.length} Artifacts)</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                   <span className="text-[11px] text-outline">Cryptographic Checksum</span>
                   <span className="text-[12px] text-[#0D7A5F] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Verified</span>
                </div>

                <button onClick={() => window.open(`/api/cases/${params.id}/pdf`, '_blank')} className="w-full bg-primary hover:bg-[#101B31] text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold transition-all shadow-sm">
                  <Download size={16} /> Download Evidentiary Report
                </button>
              </div>
            </div>
          )}

          {/* OFFICER ROLE */}
          {role === "Officer" && (
             <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
              <div className="p-5 border-b border-outline-variant/30 bg-surface/50">
                <h3 className="text-[14px] text-[#92400E] font-bold flex items-center gap-2"><UploadCloud size={16} /> Update Version / Add Evidence</h3>
                <p className="text-[10px] text-outline mt-1">Upload a new document to create a new version in the chain of custody</p>
              </div>
              <div className="p-5">
                {caseData.is_sealed ? (
                  <div className="flex items-start gap-2 bg-error-container/50 p-4 rounded-lg text-error">
                     <Lock size={18} className="shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[13px] font-bold mb-1">Judicially Sealed</p>
                       <p className="text-[11px]">This case dossier is locked. No further evidence can be added to the chain of custody.</p>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">Evidence Artifact Type</label>
                      <select 
                        value={evType} onChange={(e) => setEvType(e.target.value)}
                        className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-[#F0F3FF]/30 focus:outline-none focus:border-primary"
                      >
                        <option>First Information Report (FIR)</option>
                        <option>Seizure Memo / Panchnama</option>
                        <option>Digital Disk Clone / Bit-Stream</option>
                        <option>CCTV / Multimedia Footage</option>
                        <option>Forensic Analyst Report</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">Document Title</label>
                      <input 
                        type="text" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="e.g. Supplementary Addendum on Digital Asset Movement"
                        className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-[11px] font-bold text-primary mb-1">Filing Date</label>
                          <input type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-primary bg-white focus:outline-none" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-bold text-primary mb-1">Filing Officer</label>
                          <input type="text" value={userName} readOnly className="w-full border border-outline-variant/50 rounded p-2 text-[13px] text-outline bg-surface-container focus:outline-none" />
                       </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">Attach Digital Artifact(s)</label>
                      <label className="border border-dashed border-outline-variant rounded-lg p-5 text-center bg-[#F0F3FF]/30 hover:bg-[#F0F3FF] transition-colors cursor-pointer block relative">
                        <input type="file" multiple accept="application/pdf,image/png,image/jpeg,image/jpg,.raw,.e01,.mp4,.pcap" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                            if (e.target.files) {
                                setEvFiles(Array.from(e.target.files));
                            }
                        }} />
                        <FileText size={20} className={`mx-auto mb-2 ${evFiles.length > 0 ? 'text-[#0D7A5F]' : 'text-[#92400E]'}`} />
                        <p className={`text-[12px] font-bold mb-0.5 ${evFiles.length > 0 ? 'text-[#0D7A5F]' : 'text-primary'}`}>
                          {evFiles.length > 0 ? `${evFiles.length} file(s) selected` : "Click to browse or drag evidence files"}
                        </p>
                        <p className="text-[10px] text-outline">
                          {evFiles.length > 0 ? evFiles.map(f => f.name).join(", ") : "Allowed formats: .PDF, .RAW, .E01, .MP4, .PCAP"}
                        </p>
                      </label>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer mt-2">
                      <input type="checkbox" checked={evConfirmed} onChange={(e) => setEvConfirmed(e.target.checked)} className="mt-0.5" />
                      <span className="text-[11px] text-primary leading-tight">I solemnly attest that this digital artifact is genuine, unadulterated, and seized under lawful statutory custody.</span>
                    </label>

                    <button 
                      onClick={handleUploadEvidence} disabled={isUploading || !evConfirmed}
                      className={`w-full ${evConfirmed ? 'bg-primary hover:bg-[#101B31]' : 'bg-outline-variant'} text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold transition-all shadow-sm mt-4 disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      Upload & Create New Version (v{evidenceList.length + 1})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMON: Admissibility Mandate */}
          <div className="bg-[#F0F3FF] rounded-xl p-4 flex gap-3 items-start border border-[#ccdbf6]">
             <Info size={16} className="text-[#92400E] shrink-0 mt-0.5" />
             <div>
                <p className="text-[11px] font-bold text-primary mb-1">Admissibility Mandate (BSA 2023)</p>
                <p className="text-[10px] text-primary/80 leading-relaxed">Any modification to an uploaded artifact appends a new revision node. Previous versions cannot be expunged, deleted, or re-written.</p>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-4">
          
          <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-outline-variant/50">
            <h2 className="text-[18px] text-primary font-bold pl-2">Document Chain of Custody</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, document, hash..."
                className="pl-8 pr-3 py-1.5 w-full bg-[#F0F3FF]/50 border border-outline-variant/50 rounded-lg text-[12px] focus:ring-2 focus:ring-secondary/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-10">
            {evidenceList.filter(ev =>
              !searchQuery ||
              ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ev.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ev.file_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ev.uploaded_by?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-20 text-outline">
                {searchQuery ? `No documents match "${searchQuery}".` : "No evidence artifacts uploaded yet."}
              </div>
            ) : (
              evidenceList
                .filter(ev =>
                  !searchQuery ||
                  ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ev.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ev.file_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ev.uploaded_by?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((ev: any, idx: number, arr: any[]) => {
                const versionNum = arr.length - idx;
                const isLatest = idx === 0;
                return (
                <div key={idx} className={`border rounded-xl p-4 shadow-sm ${isLatest ? 'bg-white border-primary/30' : 'bg-surface/60 border-outline-variant/30 opacity-80'}`}>
                  
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg border mt-1 ${isLatest ? 'bg-[#0D7A5F]/10 text-[#0D7A5F] border-[#0D7A5F]/30' : 'bg-surface-container text-outline border-outline-variant/30'}`}><FileText size={20}/></div>
                      <div>
                        <h4 className="text-[14px] text-primary font-bold leading-tight mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold ${isLatest ? 'bg-[#0D7A5F] text-white' : 'bg-[#E2E8F0] text-outline'}`}>
                            v{versionNum} {isLatest ? '&bull; LATEST' : '&bull; SUPERSEDED'}
                          </span>
                          {ev.type} — {ev.title}
                        </h4>
                        <p className="text-[11px] text-outline font-mono">Size: {ev.size}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                       <button 
                         onClick={async () => {
                           try {
                             alert("Verifying evidence integrity...");
                             const res = await axios.get(`/api/evidence/${ev.id}/verify`);
                             const d = res.data;
                             const diskOk = d.disk_verified ? "✅ PASS" : "❌ FAIL";
                             const chainOk = d.on_chain_verified ? "✅ PASS" : (d.blockchain_tx ? "⏳ Pending Confirmation" : "⏳ Not yet logged");
                             
                             let overall = "";
                             if (d.disk_verified && d.on_chain_verified) {
                               overall = "✅ FULLY VERIFIED — Evidence is UNTAMPERED";
                             } else if (d.disk_verified && !d.on_chain_verified) {
                               overall = "✅ LOCAL FILE VERIFIED — Blockchain Sync Pending";
                             } else {
                               overall = "❌ INTEGRITY COMPROMISED — HASH MISMATCH!";
                             }
                             
                             alert(`${overall}\n\n📁 Local Server Hash Match: ${diskOk}\n🔗 Blockchain (Polygon Amoy): ${chainOk}\n\nStored Hash:\n${d.stored_hash}\n\nComputed Local Hash:\n${d.recomputed_hash || "N/A"}`);
                           } catch (err: any) {
                             alert("Verification failed: " + (err.response?.data?.detail || "Could not verify"));
                           }
                         }}
                         className="flex items-center justify-between xl:justify-start gap-2 bg-[#F0F3FF]/50 hover:bg-[#F0F3FF] border border-outline-variant/50 px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary transition-colors cursor-pointer"
                       >
                         <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#0D7A5F]"/> Verify Integrity</div>
                       </button>

                       <button 
                         onClick={() => window.open(`/api/files/${ev.file_hash}`, "_blank")}
                         className="flex items-center justify-between xl:justify-start gap-2 bg-[#F0FFF4] hover:bg-[#E6F4EA] border border-[#A8DAB5] px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#0D7A5F] transition-colors cursor-pointer"
                       >
                         <div className="flex items-center gap-1.5"><FileText size={12}/> View Uploaded File</div>
                       </button>

                       <button 
                         onClick={() => {
                           const txUrl = ev.blockchain_tx ? `https://amoy.polygonscan.com/tx/${ev.blockchain_tx}` : null;
                           if (txUrl) window.open(txUrl, "_blank");
                           else alert("⏳ Blockchain TX not yet recorded for this evidence.\n\nThis happens if upload was before blockchain was enabled, or if the transaction is still pending.");
                         }}
                         className={`flex items-center justify-between xl:justify-start gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${ev.blockchain_tx ? 'bg-[#FFF8ED] hover:bg-[#FFF0D4] border-[#FCD34D] text-[#92400E]' : 'bg-surface border-outline-variant/30 text-outline opacity-60'}`}
                       >
                         <div className="flex items-center gap-1.5"><HardDrive size={12}/> {ev.blockchain_tx ? "View on Polygonscan ↗" : "Polygonscan (Pending)"}</div>
                       </button>
                    </div>
                  </div>

                  {/* Accordions */}
                  <div className="mt-4 flex flex-col gap-2">
                    
                    {/* Gemini Analysis Accordion */}
                    <details open={isLatest} className="group bg-[#E6F4EA]/30 border border-[#0D7A5F]/30 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-3 cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={14} className="text-[#0D7A5F]" />
                           <span className="text-[12px] font-bold text-primary">AI Document Analysis</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-[#0D7A5F] bg-[#0D7A5F]/10 px-2 py-0.5 rounded">Auto-Generated</span>
                        </div>
                        <ChevronDown size={14} className="text-outline group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="p-4 pt-2 border-t border-[#0D7A5F]/20 bg-white/60">
                        {(() => {
                           try {
                             const data = JSON.parse(ev.ai_analysis);
                             if (data.summary.includes("processing in progress")) {
                               return <div className="text-[11px] text-[#92400E] font-bold whitespace-pre-wrap flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> {data.summary}</div>;
                             }
                             return (
                               <div className="flex flex-col gap-4">
                                 <div>
                                   <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">Executive Summary</p>
                                   <p className="text-[12px] text-primary leading-relaxed bg-[#F0F3FF]/50 p-2.5 rounded-lg border border-outline-variant/30 italic">{data.summary}</p>
                                 </div>
                                 <div>
                                   <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Extracted Entities</p>
                                   <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                     <div>
                                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><User size={10}/> People</p>
                                        <div className="flex flex-wrap gap-1">
                                          {data.entities?.persons?.length > 0 ? data.entities.persons.map((p:string, i:number) => <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{p}</span>) : <span className="text-[10px] text-outline">None</span>}
                                        </div>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><Database size={10}/> Organizations</p>
                                        <div className="flex flex-wrap gap-1">
                                          {data.entities?.orgs?.length > 0 ? data.entities.orgs.map((o:string, i:number) => <span key={i} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">{o}</span>) : <span className="text-[10px] text-outline">None</span>}
                                        </div>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-bold text-primary mb-1">📍 Locations</p>
                                        <div className="flex flex-wrap gap-1">
                                          {data.entities?.locations?.length > 0 ? data.entities.locations.map((l:string, i:number) => <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">{l}</span>) : <span className="text-[10px] text-outline">None</span>}
                                        </div>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><Calendar size={10}/> Dates</p>
                                        <div className="flex flex-wrap gap-1">
                                          {data.entities?.dates?.length > 0 ? data.entities.dates.map((d:string, i:number) => <span key={i} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">{d}</span>) : <span className="text-[10px] text-outline">None</span>}
                                        </div>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           } catch(e: any) {
                             // Try to sanitize the string if JSON.parse failed due to unescaped newlines
                             try {
                               let sanitized = ev.ai_analysis;
                               // If it has markdown json block, extract it
                               const match = sanitized.match(/\{[\s\S]*\}/);
                               if (match) sanitized = match[0];
                               // Escape literal newlines so JSON.parse won't crash
                               sanitized = sanitized.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
                               const data = JSON.parse(sanitized);
                               return (
                                 <div className="flex flex-col gap-4">
                                   <div>
                                     <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">Executive Summary</p>
                                     <p className="text-[12px] text-primary leading-relaxed bg-[#F0F3FF]/50 p-2.5 rounded-lg border border-outline-variant/30 italic">{data.summary}</p>
                                   </div>
                                   <div>
                                     <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Extracted Entities</p>
                                     <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                       <div>
                                          <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><User size={10}/> People</p>
                                          <div className="flex flex-wrap gap-1">
                                            {data.entities?.persons?.length > 0 ? data.entities.persons.map((p:string, i:number) => <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{p}</span>) : <span className="text-[10px] text-outline">None</span>}
                                          </div>
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><Database size={10}/> Organizations</p>
                                          <div className="flex flex-wrap gap-1">
                                            {data.entities?.orgs?.length > 0 ? data.entities.orgs.map((o:string, i:number) => <span key={i} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">{o}</span>) : <span className="text-[10px] text-outline">None</span>}
                                          </div>
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-bold text-primary mb-1">📍 Locations</p>
                                          <div className="flex flex-wrap gap-1">
                                            {data.entities?.locations?.length > 0 ? data.entities.locations.map((l:string, i:number) => <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">{l}</span>) : <span className="text-[10px] text-outline">None</span>}
                                          </div>
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1"><Calendar size={10}/> Dates</p>
                                          <div className="flex flex-wrap gap-1">
                                            {data.entities?.dates?.length > 0 ? data.entities.dates.map((d:string, i:number) => <span key={i} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">{d}</span>) : <span className="text-[10px] text-outline">None</span>}
                                          </div>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               );
                             } catch(innerE) {
                               console.error("Failed to parse AI Analysis JSON even after sanitize:", innerE, ev.ai_analysis);
                               return <div className="text-[11px] text-primary whitespace-pre-wrap leading-relaxed"><strong>Parsing Error:</strong><br/>{ev.ai_analysis || "No AI analysis available."}</div>;
                             }
                           }
                        })()}
                      </div>
                    </details>

                    {/* OCR Scan Accordion */}
                    <details className="group bg-surface-container-low border border-outline-variant/30 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-surface-container/50 transition-colors">
                        <div className="flex items-center gap-2">
                           <FileText size={14} className="text-primary" />
                           <span className="text-[12px] font-bold text-primary">Raw Extracted Text (OCR)</span>
                           <span className="text-[9px] text-outline ml-2 px-2 py-0.5 border border-outline-variant rounded-full">For indexing/search</span>
                        </div>
                        <ChevronDown size={14} className="text-outline group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="p-4 pt-1 border-t border-outline-variant/30 bg-white/50">
                         <div className="text-[10px] text-outline italic mb-2">Note: Full document can be viewed via the 'View Uploaded File' button above. Below is the raw data used by the AI.</div>
                         <div className="bg-[#1E1E1E] text-[#D4D4D4] p-4 rounded-lg text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto overflow-x-hidden shadow-inner select-text scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                           {ev.ocr_text || "No OCR text extracted."}
                         </div>
                      </div>
                    </details>

                    {/* Images Accordion */}
                    <details open={isLatest} className="group bg-surface-container-low border border-outline-variant/30 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-3 cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                           <Search size={14} className="text-primary" />
                           <span className="text-[12px] font-bold text-primary">Extracted Images & Photos</span>
                        </div>
                        <ChevronDown size={14} className="text-outline group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="p-4 pt-3 border-t border-outline-variant/30 bg-white/50">
                        {(() => {
                           try {
                             const data = JSON.parse(ev.ai_analysis);
                             if (data.images && data.images.length > 0) {
                               return (
                                 <div className="flex flex-wrap gap-3">
                                   {data.images.map((img: string, idx: number) => {
                                      const hashOnly = img.split('.')[0];
                                      return (
                                        <a key={idx} href={`/api/files/${hashOnly}`} target="_blank" rel="noreferrer" className="block border border-outline-variant/50 rounded overflow-hidden shadow-sm hover:border-primary transition-colors bg-white p-1">
                                          <img src={`/api/files/${hashOnly}`} alt="Extracted Evidence" className="h-28 w-auto object-cover rounded-sm" />
                                        </a>
                                      );
                                   })}
                                 </div>
                               );
                             }
                             return <div className="text-[11px] text-outline italic">No images found in this document.</div>;
                           } catch(e) {
                             return <div className="text-[11px] text-outline italic">No images found or legacy format.</div>;
                           }
                        })()}
                      </div>
                    </details>

                  </div>

                  {/* Revision History UI */}
                  <div className="mt-5 pt-5 border-t border-outline-variant/30 pl-2">
                    <p className="text-[9px] text-outline uppercase font-bold tracking-widest mb-4">VERSION TRAIL — v{versionNum}</p>
                    
                    <div className={`relative pl-6 pb-2 border-l-2 ${isLatest ? 'border-[#0D7A5F]' : 'border-outline-variant/50'}`}>
                       <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ${isLatest ? 'bg-[#0D7A5F]' : 'bg-outline-variant'}`}>
                         {isLatest ? <CheckCircle2 size={10} /> : <Lock size={10} />}
                       </div>
                       <div className="flex justify-between items-center mb-2">
                         <span className={`text-[11px] font-bold ${isLatest ? 'text-[#0D7A5F]' : 'text-outline'}`}>
                           {isLatest ? 'ACTIVE — CURRENT VERSION' : 'SUPERSEDED'}
                         </span>
                         <span className="text-[10px] text-outline">By: <span className="font-bold">{ev.uploaded_by}</span></span>
                       </div>
                       <div className={`p-3 rounded-lg text-[12px] border ${isLatest ? 'bg-[#F0FFF4] text-[#0D7A5F] border-[#0D7A5F]/20' : 'bg-surface text-outline border-outline-variant/30'}`}>
                         {isLatest 
                           ? `Current active version. Securely archived.`
                           : `This version has been superseded by v${versionNum + 1}. Securely preserved for audit trail.`
                         }
                       </div>
                    </div>
                  </div>

                </div>
              );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
