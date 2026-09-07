'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Folder, ShieldCheck, FileText, Plus, MapPin, Calendar, Tag, Hash, AlignLeft, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';


const CRIME_TYPES = [
  'Theft / Robbery', 'Cyber Crime / Fraud', 'Murder / Attempt to Murder',
  'Assault / Battery', 'Kidnapping / Abduction', 'Drug Trafficking',
  'Sexual Offence / Rape', 'Domestic Violence', 'Corruption / Bribery',
  'Property Dispute', 'Arson', 'Forgery / Cheating', 'Defamation', 'Dacoity', 'Extortion', 'Cyber Terrorism', 'Other',
];




const IPC_SECTIONS = [
  'IPC 302 - Murder', 'IPC 307 - Attempt to Murder', 'IPC 376 - Rape',
  'IPC 420 - Cheating', 'IPC 379 - Theft', 'IPC 392 - Robbery', 'IPC 395 - Dacoity',
  'IPC 354 - Assault on Woman', 'IPC 498A - Cruelty by Husband',
  'IPC 406 - Criminal Breach of Trust', 'IPC 120B - Criminal Conspiracy',
  'IPC 34 - Common Intention', 'IPC 499/500 - Defamation', 'IPC 363 - Kidnapping', 'IPC 465 - Forgery',
  'IT Act 66C', 'NDPS Act', 'Other'
];

const BNS_SECTIONS = [
  'BNS 103 - Murder', 'BNS 109 - Attempt to Murder', 'BNS 64 - Rape',
  'BNS 318 - Cheating', 'BNS 303 - Theft', 'BNS 309 - Robbery', 'BNS 310 - Dacoity',
  'BNS 74 - Assault on Woman', 'BNS 85 - Cruelty by Husband',
  'BNS 316 - Criminal Breach of Trust', 'BNS 61 - Criminal Conspiracy',
  'BNS 3(5) - Common Intention', 'BNS 356 - Defamation', 'BNS 137 - Kidnapping', 'BNS 336 - Forgery',
  'IT Act 66C', 'NDPS Act', 'Other'
];




export default function Dashboard() {
  const [cases, setCases]         = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [legalFramework, setLegalFramework] = useState<'BNS' | 'IPC'>('BNS');

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const canCreateCase = currentUser?.role === 'Officer';

  useEffect(() => {
    // Auth guard
    const token = localStorage.getItem('sih_token');
    const userRaw = localStorage.getItem('sih_user');
    if (!token || !userRaw) { window.location.href = '/login'; return; }
    setCurrentUser(JSON.parse(userRaw));
    fetchCases();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('sih_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCases = () => {
    const token = localStorage.getItem('sih_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/cases/`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => setCases(data))
      .catch(err => console.error('Error fetching cases', err));
  };

  const toggleSection = (s: string) => {
    setSelectedSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleCreateCase = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // Build an enriched title that encodes metadata
    const meta = {
      title:             fd.get('title') as string,
      crime_type:        fd.get('crime_type') as string,
      incident_date:     fd.get('incident_date') as string,
      location:          fd.get('location') as string,
      complainant_name:  fd.get('complainant_name') as string,
      complainant_phone: fd.get('complainant_phone') as string,
      accused_name:      fd.get('accused_name') as string,
      ipc_sections:      selectedSections,
      description:       fd.get('description') as string,
    };

    const payload = {
      case_number: fd.get('case_number') as string,
      title: meta.title,
    };

    // Store metadata as a separate call — we post a "metadata document" after creating the case
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/cases/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        // Store extra metadata in localStorage (prototype approach — no extra DB table needed)
        const stored = JSON.parse(localStorage.getItem('case_metadata') || '{}');
        stored[created.id] = meta;
        localStorage.setItem('case_metadata', JSON.stringify(stored));

        setShowModal(false);
        setSelectedSections([]);
        fetchCases();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch { alert('Network error.'); }
  };

  const getCaseMeta = (id: number) => {
    const stored = JSON.parse(localStorage.getItem('case_metadata') || '{}');
    return stored[id] || null;
  };

  const [fileSearchMatches, setFileSearchMatches] = useState<number[]>([]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setFileSearchMatches([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/search/?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => setFileSearchMatches(data || []))
        .catch(err => console.error("Search error", err));
    }, 300); // 300ms debounce
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const STOP_WORDS = new Set(["i","me","my","we","our","you","your","he","him","his","she","her","it","its","they","them","their","what","which","who","whom","this","that","these","those","am","is","are","was","were","be","been","being","have","has","had","do","does","did","a","an","the","and","but","if","or","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","can","will","just","don","should","now","find","case","cases","around","people","months","years","days","show","looking","search"]);

  // Deep search logic across all case data and metadata
  const sortedCases = [...cases].map((c: any) => {
    let score = 0;
    
    // 1. If there's no search query, everything has score 0 (will show all)
    if (!searchQuery) return { ...c, score: 1 };
    
    const queryWords = searchQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => !STOP_WORDS.has(w) && w.length > 2);
      
    if (queryWords.length === 0) return { ...c, score: 1 };

    const meta = getCaseMeta(c.id) || {};
    const searchableText = `
      ${c.case_number} ${c.title} ${c.status}
      ${meta.crime_type || ''} ${meta.location || ''} 
      ${meta.complainant_name || ''} ${meta.accused_name || ''}
      ${(meta.ipc_sections || []).join(' ')} 
      ${meta.description || ''}
    `.toLowerCase();

    // Score based on local metadata
    queryWords.forEach(kw => {
      if (searchableText.includes(kw)) score += 1;
    });

    // Score based on backend file contents (the earlier in the array, the higher the score)
    const backendRankIndex = fileSearchMatches.indexOf(c.id);
    if (backendRankIndex !== -1) {
       // Add points inversely proportional to its rank in backend results
       score += (fileSearchMatches.length - backendRankIndex) * 2;
    }

    return { ...c, score };
  })
  .filter(c => c.score > 0)
  .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background text-text-main font-sans">
      <Navbar />

      <main className="p-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* ===================== SIDEBAR ===================== */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
            
            {/* Action Panel */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-5">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Quick Actions</h3>
              {canCreateCase ? (
                <button onClick={() => setShowModal(true)}
                  className="w-full bg-[#1a3a6b] hover:bg-[#132a4f] text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Register New Case
                </button>
              ) : (
                <div className="bg-background border border-border rounded-lg p-4 text-center text-sm text-text-secondary font-medium">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
                  Your role ({currentUser?.role}) does not have permission to register new cases.
                </div>
              )}
            </div>

            {/* System Overview */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-5">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">System Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary font-semibold mb-1">Total Registered Cases</p>
                  <p className="text-3xl font-black text-[#1a3a6b]">{cases.length}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-xs text-green-700 font-bold uppercase">Active</p>
                    <p className="text-xl font-black text-green-800">{cases.filter((c: any) => !c.is_sealed).length}</p>
                  </div>
                  <div className="bg-error/10 border border-error/20 p-3 rounded-lg">
                    <p className="text-xs text-red-700 font-bold uppercase">Sealed</p>
                    <p className="text-xl font-black text-red-800">{cases.filter((c: any) => c.is_sealed).length}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ===================== MAIN DOSSIER AREA ===================== */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            
            {/* Search Bar */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-2">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <input type="text" placeholder="Natural AI Search: Try 'Cyber fraud in Delhi' or 'FIR-2026-104'..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-background border-0 rounded-lg text-text-main font-medium placeholder-slate-400 focus:ring-2 focus:ring-blue-600 sm:text-sm transition-all" />
              </div>
            </div>

            {/* Case List */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-background flex justify-between items-center">
                <h2 className="text-lg font-black text-[#1a3a6b] tracking-wide">CASE DOSSIERS</h2>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{sortedCases.length} Results</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {sortedCases.length === 0 ? (
                  <div className="py-16 text-center">
                    <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-text-secondary font-medium">No cases found matching your criteria.</p>
                  </div>
                ) : (
                  sortedCases.map((c: any) => {
                    const meta = getCaseMeta(c.id);
                    return (
                      <Link href={`/case/${c.id}`} key={c.id} className="block hover:bg-primary/5 transition-colors group">
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Case Number Badge */}
                            <div className={`w-28 flex-shrink-0 text-center py-1.5 rounded border font-mono text-xs font-bold ${c.is_sealed ? 'bg-error/10 text-red-700 border-error/20' : 'bg-border text-[#1a3a6b] border-border'}`}>
                              {c.case_number}
                            </div>
                            
                            {/* Main Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-black text-text-main group-hover:text-primary truncate">{c.title}</h3>
                                {c.is_sealed && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><Lock className="w-3 h-3"/> Sealed</span>}
                              </div>
                              {meta && (
                                <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-medium">
                                  {meta.crime_type && <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-text-secondary" /> {meta.crime_type}</span>}
                                  {meta.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-text-secondary" /> {meta.location}</span>}
                                  {meta.incident_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-text-secondary" /> {meta.incident_date}</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Stats & Action */}
                          <div className="flex items-center gap-6 sm:pl-4 sm:border-l border-border">
                            <div className="text-center min-w-[70px]">
                              <p className="text-xl font-black text-text-main leading-none">{c.documents?.length || 0}</p>
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Docs</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-surface border-2 border-border group-hover:border-blue-500 group-hover:bg-primary flex items-center justify-center transition-all flex-shrink-0">
                              <span className="text-text-secondary group-hover:text-white font-bold leading-none translate-x-px">→</span>
                            </div>
                          </div>

                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ===================== CREATE CASE MODAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl my-4">

            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 rounded-t-2xl">
              <h3 className="text-xl font-black tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> REGISTER NEW CASE
              </h3>
              <p className="text-text-secondary text-sm mt-1">Fill in all mandatory fields to officially register this case in the system.</p>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

              {/* Section 1: Case Identification */}
              <div>
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> Case Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">
                      Case / FIR Number <span className="text-error">*</span>
                    </label>
                    <input required name="case_number" type="text"
                      placeholder="e.g., FIR-2026-105"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono" />
                    <p className="text-xs text-text-secondary mt-1">Format: FIR-YYYY-NNN</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">
                      Case Title <span className="text-error">*</span>
                    </label>
                    <input required name="title" type="text"
                      placeholder="e.g., Cyber Fraud at Sector 14"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">
                      Type of Crime <span className="text-error">*</span>
                    </label>
                    <select required name="crime_type"
                      className="w-full border border-border rounded-lg p-2.5 bg-surface focus:ring-1 focus:ring-primary outline-none text-sm cursor-pointer">
                      <option value="">-- Select Type --</option>
                      {CRIME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">
                      Date of Incident <span className="text-error">*</span>
                    </label>
                    <input required name="incident_date" type="date"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                </div>
              </div>

              {/* Section 2: Location */}
              <div>
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Incident Location
                </h4>
                <input required name="location" type="text"
                  placeholder="e.g., Plot No. 42, MG Road, Sector 14, New Delhi — 110001"
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
              </div>

              {/* Section 3: Parties Involved */}
              <div>
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Parties Involved
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">Complainant / Victim Name <span className="text-error">*</span></label>
                    <input required name="complainant_name" type="text"
                      placeholder="Full name of complainant"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1.5">Complainant Phone</label>
                    <input name="complainant_phone" type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-text-main mb-1.5">Accused / Suspect Name(s)</label>
                    <input name="accused_name" type="text"
                      placeholder="Full name(s) of accused — leave blank if unknown"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                </div>
              </div>

              
              
              {/* Section 4: Legal Framework & Sections */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Applicable Legal Sections
                  </h4>
                  <div className="flex items-center bg-border p-1 rounded-lg">
                    <button type="button" onClick={() => { setLegalFramework('BNS'); setSelectedSections([]); }}
                      className={`text-xs px-3 py-1 font-bold rounded ${legalFramework === 'BNS' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-main'}`}>
                      Post-2024 (BNS)
                    </button>
                    <button type="button" onClick={() => { setLegalFramework('IPC'); setSelectedSections([]); }}
                      className={`text-xs px-3 py-1 font-bold rounded ${legalFramework === 'IPC' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-main'}`}>
                      Pre-2024 (IPC)
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(legalFramework === 'BNS' ? BNS_SECTIONS : IPC_SECTIONS).map(s => (
                    <button key={s} type="button" onClick={() => toggleSection(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${selectedSections.includes(s)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-text-secondary border-border hover:border-primary'}`}>
                      {s}
                    </button>
                  ))}
                </div>
</div>

              {/* Section 5: Brief Description */}
              <div>
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlignLeft className="w-3.5 h-3.5" /> Brief Description of Incident
                </h4>
                <textarea name="description" rows={3}
                  placeholder="Briefly describe the incident, how it was reported, and initial findings..."
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none" />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-100 sticky bottom-0 bg-surface pb-1">
                <button type="button" onClick={() => { setShowModal(false); setSelectedSections([]); }}
                  className="flex-1 bg-border text-text-main font-bold py-3 rounded-lg hover:bg-border opacity-80 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Register & Seal Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
