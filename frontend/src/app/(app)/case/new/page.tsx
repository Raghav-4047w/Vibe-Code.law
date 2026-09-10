"use client";

import { useState, useEffect } from "react";
import { FileText, Save, Plus, ShieldAlert, Loader2, X, Phone, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterCase() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [legalEra, setLegalEra] = useState<"post" | "pre">("post");
  const [allSections, setAllSections] = useState<any>({ post_2024: [], pre_2024: [] });
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionSearch, setSectionSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("Current User");
  const [userBadge, setUserBadge] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    fir_no: "",
    title: "",
    description: "",
    jurisdiction: "",
    date: "",
    complainant_name: "",
    complainant_phone: "",
    accused_names: "",
  });

  // Fetch legal sections and load draft
  useEffect(() => {
    setUserName(sessionStorage.getItem("userName") || "Current User");
    setUserBadge(sessionStorage.getItem("userBadge") || "");
    
    // Load Draft
    const savedDraft = localStorage.getItem("caseDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData);
        setSelectedSections(draft.selectedSections);
        setLegalEra(draft.legalEra);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }

    axios.get("http://localhost:8000/api/legal-sections").then((res) => {
      setAllSections(res.data);
    }).catch(() => {});
  }, []);

  const handleSaveDraft = () => {
    const draft = {
      formData,
      selectedSections,
      legalEra
    };
    localStorage.setItem("caseDraft", JSON.stringify(draft));
    alert("Draft saved successfully! You can return later to complete it.");
  };

  const currentSections = legalEra === "post" ? allSections.post_2024 : allSections.pre_2024;

  const filteredSections = currentSections.filter(
    (s: any) =>
      !selectedSections.includes(s.code) &&
      (s.code.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        s.title.toLowerCase().includes(sectionSearch.toLowerCase()))
  );

  const addSection = (code: string) => {
    setSelectedSections([...selectedSections, code]);
    setSectionSearch("");
    setShowDropdown(false);
  };

  const removeSection = (code: string) => {
    setSelectedSections(selectedSections.filter((s) => s !== code));
  };

  const handleSubmit = async () => {
    if (!formData.fir_no || !formData.title || !formData.date) {
      alert("Please fill in the required fields: FIR Number, Title, and Date");
      return;
    }
    setLoading(true);
    try {
      // 1. Create the Case
      const res = await axios.post("http://localhost:8000/api/cases", {
        fir_no: formData.fir_no,
        title: formData.title,
        description: formData.description || "Initial case registration.",
        date: formData.date,
        status: "Open",
        legal_era: legalEra,
        sections: selectedSections.join(", ") || "N/A",
        jurisdiction: formData.jurisdiction || "N/A",
        io_id: parseInt(sessionStorage.getItem("userId") || "1"),
      });

      const newCaseId = res.data.id;

      // 2. Upload the Initial FIR Document if provided
      if (evidenceFile) {
        const fd = new FormData();
        fd.append("title", "Initial FIR Document");
        fd.append("type", "First Information Report (FIR)");
        fd.append("file", evidenceFile);
        fd.append("uploaded_by", sessionStorage.getItem("userName") || "Unknown Officer");
        
        await axios.post(`http://localhost:8000/api/cases/${newCaseId}/evidence`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      // Clear draft on successful submission
      localStorage.removeItem("caseDraft");
      window.location.href = `/case/${newCaseId}`;
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to register case.");
    } finally {
      setLoading(false);
    }
  };

  // Quick-add buttons (top 5 most common)
  const quickAdds = legalEra === "post"
    ? ["BNS § 111", "BNS § 318(4)", "BNS § 308", "IT Act § 43", "IT Act § 66"]
    : ["IPC § 420", "IPC § 302", "IPC § 379", "IPC § 406", "IPC § 506"];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-label-md text-outline">
          <Link href="/" className="hover:text-primary transition-colors">Cases</Link>
          <span>›</span>
          <span className="text-primary font-medium">Register New Case</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-xl p-2.5 text-secondary shadow-sm">
            <FileText size={24} />
          </div>
          <h1 className="text-display-lg-mobile text-primary font-bold m-0 flex items-center gap-2">
            Register New Case
            <div className="w-2 h-2 rounded-full bg-secondary mb-3" />
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden mt-2">
        {/* ── STEP 01: CASE IDENTIFICATION ── */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white text-label-caps px-2 py-1 rounded">01</span>
              <h2 className="text-headline-sm text-primary font-bold tracking-wide">CASE IDENTIFICATION</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Case / FIR Number <span className="text-secondary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">#</div>
                <input type="text" value={formData.fir_no} onChange={(e) => setFormData({ ...formData, fir_no: e.target.value })} placeholder="e.g. FIR-2026-015" className="block w-full pl-8 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              </div>
              <p className="text-[11px] text-outline mt-1.5">Standardized Format: FIR-YYYY-NNN</p>
            </div>

            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Case Title <span className="text-secondary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant font-serif italic">T</div>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Cyber Financial Fraud & Unauthorized Gateway Access" className="block w-full pl-8 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              </div>
              <p className="text-[11px] text-outline mt-1.5">Descriptive title summarizing the primary unlawful incident</p>
            </div>

            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Date of Incident <span className="text-secondary">*</span></label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="block w-full px-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              <p className="text-[11px] text-outline mt-1.5">Calendar date on or from which offence transpired</p>
            </div>

            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Police Station / Jurisdiction <span className="text-secondary">*</span></label>
              <input type="text" value={formData.jurisdiction} onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })} placeholder="e.g., Cyber Crime PS, Central District, New Delhi" className="block w-full px-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              <p className="text-[11px] text-outline mt-1.5">Statutory police jurisdiction exercising investigative cognizance</p>
            </div>
          </div>

          {/* Applicable Legal Sections */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-label-md text-primary font-bold">Applicable Legal Sections <span className="text-secondary">*</span></label>
              <div className="flex gap-2">
                <button onClick={() => setLegalEra("post")} className={`text-[10px] font-bold px-2.5 py-1 rounded border flex items-center gap-1 transition-colors ${legalEra === "post" ? "bg-primary text-white border-primary" : "bg-surface-container text-primary border-outline-variant/30 hover:bg-surface-container-high"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${legalEra === "post" ? "bg-secondary" : "bg-outline"}`} />
                  Post-2024 (BNS & BSA)
                </button>
                <button onClick={() => setLegalEra("pre")} className={`text-[10px] font-bold px-2.5 py-1 rounded border flex items-center gap-1 transition-colors ${legalEra === "pre" ? "bg-primary text-white border-primary" : "bg-surface-container text-primary border-outline-variant/30 hover:bg-surface-container-high"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${legalEra === "pre" ? "bg-secondary" : "bg-outline"}`} />
                  Pre-2024 (IPC Code)
                </button>
              </div>
            </div>

            {/* Selected Sections */}
            <div className="min-h-[50px] p-2 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 flex flex-wrap gap-2 items-center">
              {selectedSections.length === 0 && (
                <span className="text-outline text-body-sm px-2">No sections selected — use Quick Add or search below</span>
              )}
              {selectedSections.map((code) => {
                const section = [...allSections.post_2024, ...allSections.pre_2024].find((s: any) => s.code === code);
                return (
                  <span key={code} className="bg-primary text-white text-label-caps px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                    {code} {section ? `(${section.title})` : ""}
                    <button onClick={() => removeSection(code)} className="text-white/70 hover:text-white"><X size={12} /></button>
                  </span>
                );
              })}
            </div>

            {/* Quick Add */}
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <span className="text-label-caps text-outline">Quick Add:</span>
              {quickAdds.filter((q) => !selectedSections.includes(q)).map((code) => (
                <button key={code} onClick={() => addSection(code)} className="bg-surface-container text-primary text-[10px] font-bold px-2 py-1 rounded hover:bg-surface-container-high border border-outline-variant/30 transition-colors">
                  + {code}
                </button>
              ))}
            </div>

            {/* Search to add */}
            <div className="relative mt-3">
              <input
                type="text"
                value={sectionSearch}
                onChange={(e) => { setSectionSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search legal section / details..."
                className="block w-full px-3 py-2.5 border border-outline-variant/50 rounded-lg bg-white text-body-md text-primary focus:ring-2 focus:ring-secondary/30 focus:border-primary"
              />
              {showDropdown && sectionSearch && filteredSections.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/30 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSections.slice(0, 10).map((s: any) => (
                    <button key={s.code} onClick={() => addSection(s.code)} className="w-full text-left px-4 py-2.5 hover:bg-surface-container transition-colors flex justify-between items-center border-b border-outline-variant/10 last:border-0">
                      <div>
                        <span className="text-label-md text-primary font-bold">{s.code}</span>
                        <span className="text-body-sm text-outline ml-2">— {s.title}</span>
                      </div>
                      <span className="text-[9px] text-outline bg-surface-container px-1.5 py-0.5 rounded uppercase">{s.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 02: PARTIES INVOLVED ── */}
        <div className="p-8 border-t border-outline-variant/30 bg-surface/50">
          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white text-label-caps px-2 py-1 rounded">02</span>
              <h2 className="text-headline-sm text-primary font-bold tracking-wide">PARTIES INVOLVED</h2>
            </div>
            <span className="text-label-caps text-outline">Statutory Record of Informant & Suspects</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Complainant Name <span className="text-secondary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="text-outline-variant" size={16} /></div>
                <input type="text" value={formData.complainant_name} onChange={(e) => setFormData({ ...formData, complainant_name: e.target.value })} placeholder="e.g. Ananya Roy" className="block w-full pl-10 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              </div>
              <p className="text-[11px] text-outline mt-1.5">Primary reporting person or corporate legal representative</p>
            </div>
            <div>
              <label className="block text-label-md text-primary font-bold mb-1.5">Complainant Phone Number <span className="text-secondary">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="text-outline-variant" size={16} /></div>
                <input type="text" value={formData.complainant_phone} onChange={(e) => setFormData({ ...formData, complainant_phone: e.target.value })} placeholder="+91 98101 23456" className="block w-full pl-10 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
              </div>
              <p className="text-[11px] text-outline mt-1.5">For automated statutory dispatch notifications</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-label-md text-primary font-bold mb-1.5">Accused Name(s)</label>
              <input type="text" value={formData.accused_names} onChange={(e) => setFormData({ ...formData, accused_names: e.target.value })} placeholder="e.g. Rohan Sharma, Vikram Malik, Unknown IP Holder 192.168.1.1" className="block w-full px-3 py-3 border border-outline-variant/50 rounded-lg bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary" />
            </div>
          </div>
        </div>

        {/* ── STEP 03: CASE DETAILS ── */}
        <div className="p-8 border-t border-outline-variant/30">
          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white text-label-caps px-2 py-1 rounded">03</span>
              <h2 className="text-headline-sm text-primary font-bold tracking-wide">CASE DETAILS</h2>
            </div>
            <span className="text-label-caps text-outline">Factual Synopsis & Custody Assignment</span>
          </div>

          <div className="mb-6">
            <label className="block text-label-md text-primary font-bold mb-1.5">Brief Description <span className="text-secondary">*</span></label>
            <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Factual summary of offence, timeline of occurrence, compromised assets, and initial vector of discovery..." className="block w-full px-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F0F3FF]/50 focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary resize-none" />
          </div>

          <div>
            <label className="block text-label-md text-primary font-bold mb-1.5">Investigating Officer (IO Assignment)</label>
            <div className="bg-white border border-outline-variant/50 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg text-white flex items-center justify-center font-bold">IO</div>
                <div>
                  <p className="text-label-md text-primary font-bold leading-tight flex items-center gap-2">
                    {userName} — Self
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">LOGGED IN / ACTIVE TOKEN</span>
                  </p>
                  <p className="text-[11px] text-outline mt-0.5">
                    {userBadge} • Root Key Carrier
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-outline mt-1.5">Defaults automatically to authenticated officer token for cryptographic genesis signing.</p>
          </div>
        </div>

        {/* ── STEP 04: DECLARATION ── */}
        <div className="p-8 border-t border-outline-variant/30 bg-surface/50">
          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white text-label-caps px-2 py-1 rounded">04</span>
              <h2 className="text-headline-sm text-primary font-bold tracking-wide">DECLARATION</h2>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-outline-variant/50 flex items-start gap-4">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary shrink-0" />
            <p className="text-body-sm text-primary leading-relaxed">
              I confirm that the above details are accurate to the best of my knowledge and have been recorded in accordance with applicable procedure.
              <br /><span className="text-error mt-1 inline-block">Falsification of statutory police records carries disciplinary and penal liability under BNSS.</span>
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-primary px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center text-tertiary-fixed"><ShieldAlert size={16} /></div>
            <div>
              <p className="text-label-md text-white font-bold leading-tight">Case Registration Intake • Ready to Submit</p>
              <p className="text-[11px] text-primary-fixed-dim m-0">Cryptographically Secured Case Dossier Genesis</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveDraft} className="bg-white text-primary px-6 py-2.5 rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm">
              <Save size={16} /> Save Draft
            </button>
            <button onClick={handleSubmit} disabled={loading} className="bg-secondary hover:bg-[#b55c00] text-white px-8 py-2.5 rounded-lg text-label-md font-bold flex items-center gap-2 transition-colors shadow-md disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              {loading ? "Registering..." : "Register Case"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
