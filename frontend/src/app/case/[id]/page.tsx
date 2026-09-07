'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, UploadCloud, FileText, History, CheckCircle, RefreshCw,
  FileLock2, Download, CheckCircle2, Lock, AlertTriangle, FileDown, Shield,
  ScanText, Image as ImageIcon, ChevronDown, ChevronUp, Eye,
  BrainCircuit, Sparkles, UserCircle, Building2, Map, Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const USERS: Record<number, { name: string; role: string; badge: string }> = {
  1: { name: 'Sub-Inspector Sharma', role: 'Officer',  badge: '9482A' },
  2: { name: 'Chief Inspector Verma', role: 'Reviewer', badge: '1109X' },
  3: { name: 'Hon. Judge Patel',      role: 'Judge',    badge: 'JDG-01' },
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CaseDetails() {
  const { id } = useParams();
  const [caseData, setCaseData]       = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sealing, setSealing]         = useState(false);
  const [docType, setDocType]         = useState('FIR');
  const [expandedOCR, setExpandedOCR] = useState<Record<number, boolean>>({});
  const [expandedImgs, setExpandedImgs] = useState<Record<number, boolean>>({});
  const [expandedAI, setExpandedAI] = useState<Record<number, boolean>>({});
  const [versionImages, setVersionImages] = useState<Record<number, any[]>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ checks: any[] } | null>(null);


  const canUpload = currentUser?.role === 'Officer';
  const canSeal   = currentUser?.role === 'Judge';
  const currentUserId = currentUser?.id || 1;

  const getHeaders = () => {
    const token = localStorage.getItem('sih_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCase = async () => {
    try {
      const res = await fetch(`${API}/cases/${id}`, { headers: getHeaders() });
      setCaseData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchImages = async (versionId: number) => {
    if (versionImages[versionId] !== undefined) return;
    try {
      const res = await fetch(`${API}/versions/${versionId}/images/`, { headers: getHeaders() });
      const data = await res.json();
      setVersionImages(prev => ({ ...prev, [versionId]: data }));
    } catch { setVersionImages(prev => ({ ...prev, [versionId]: [] })); }
  };

  const toggleOCR = (versionId: number) => {
    setExpandedOCR(prev => ({ ...prev, [versionId]: !prev[versionId] }));
  };

  const toggleImgs = (versionId: number) => {
    if (!expandedImgs[versionId]) fetchImages(versionId);
    setExpandedImgs(prev => ({ ...prev, [versionId]: !prev[versionId] }));
  };

  const toggleAI = (versionId: number) => {
    setExpandedAI(prev => ({ ...prev, [versionId]: !prev[versionId] }));
  };

  useEffect(() => {
    const token = localStorage.getItem('sih_token');
    const userRaw = localStorage.getItem('sih_user');
    if (!token || !userRaw) { window.location.href = '/login'; return; }
    setCurrentUser(JSON.parse(userRaw));
    fetchCase();
  }, [id]);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!canUpload || isUploading) return;
    setIsUploading(true);
    const formData = new FormData(e.target);
    formData.append('user_id', currentUserId.toString());
    try {
      const res = await fetch(`${API}/cases/${id}/documents/`, { method: 'POST', body: formData, headers: getHeaders() });
      const data = await res.json();
      if (res.ok) { alert('Document securely uploaded and sealed!'); fetchCase(); e.target.reset(); }
      else        { alert(`Error: ${data.detail}`); }
    } catch { alert('Network error — is the backend running?'); }
    finally { setIsUploading(false); }
  };

  const handleVerify = async (document_id: number) => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res  = await fetch(`${API}/documents/${document_id}/verify/`, { headers: getHeaders() });
      const data = await res.json();
      setVerifyResult({ checks: data.integrity_checks });
    } catch {
      setVerifyResult({ checks: [{ version: '—', status: 'ERROR', message: 'Could not contact the server. Please ensure the backend is running.' }] });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSeal = async () => {
    if (!canSeal) return;
    const confirmed = confirm(
      `⚠️ WARNING: This action is PERMANENT and IRREVERSIBLE.\n\n` +
      `Sealing Case "${caseData?.title}" will:\n` +
      `• Prevent ALL future document uploads\n` +
      `• Prevent ALL new document versions\n` +
      `• Record your identity in the permanent audit log\n\n` +
      `Are you absolutely sure you want to seal this case for trial?`
    );
    if (!confirmed) return;
    setSealing(true);
    try {
      const formData = new FormData();
      formData.append('user_id', currentUserId.toString());
      const res  = await fetch(`${API}/cases/${id}/seal/`, { method: 'POST', body: formData, headers: getHeaders() });
      const data = await res.json();
      if (res.ok) { alert(`Case sealed successfully.`); fetchCase(); }
      else        { alert(`Error: ${data.detail}`); }
    } catch { alert('Network error.'); }
    finally { setSealing(false); }
  };

  const handleDownloadReport = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/cases/${id}/report/`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!caseData) return <div className="p-8 text-center text-error font-bold">Case not found</div>;

  const isSealed     = caseData.is_sealed;
  const sealerInfo   = isSealed && caseData.sealed_by ? USERS[caseData.sealed_by] : null;

  return (
    <div className="min-h-screen bg-background text-text-main font-sans">
      <Navbar showBack={true} />

      <main className="p-6 max-w-7xl mx-auto">

        {/* SEALED BANNER */}
        {isSealed && (
          <div className="mb-6 bg-red-600 text-white rounded-xl p-4 flex items-center gap-4 shadow-lg border border-red-700">
            <Lock className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-black text-lg tracking-wide uppercase">⚖️ This Case Is Sealed for Trial</p>
              <p className="text-red-100 text-sm mt-0.5">
                Sealed by <strong>{sealerInfo?.name || 'a Judge'}</strong>
                {caseData.sealed_at ? ` on ${new Date(caseData.sealed_at).toLocaleString()}` : ''}.
                No further documents or versions can be added.
              </p>
            </div>
          </div>
        )}

        {/* ROLE RESTRICTION BANNER */}
        {!isSealed && !canUpload && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-300 text-amber-800 rounded-xl p-4 flex items-center gap-4">
            <AlertTriangle className="w-7 h-7 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Read-Only Access — Role: {currentUser.role}</p>
              <p className="text-sm mt-0.5">
                {currentUser.role === 'Judge'
                  ? 'As a Judge, you have read-only access. You may verify integrity and seal cases. Only Officers can upload documents.'
                  : 'As a Reviewer, you have read-only access. Only Officers can upload or update documents.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-5">

            {/* Case Info */}
            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <h2 className="text-2xl font-bold mb-1 text-text-main">{caseData.title}</h2>
              <p className="text-text-secondary mb-5 font-mono text-sm border-b border-slate-100 pb-4">{caseData.case_number}</p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-secondary">Status</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-md border flex items-center gap-1 ${isSealed ? 'bg-error/10 text-red-700 border-error/20' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {isSealed ? <Lock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {caseData.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-secondary">Created On</span>
                  <span className="text-sm font-bold text-text-main">{new Date(caseData.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-secondary">Your Access</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${canUpload ? 'bg-primary/5 text-primary border-blue-200' : 'bg-border text-text-secondary border-border'}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button onClick={handleDownloadReport}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all">
                  <FileDown className="w-4 h-4" /> Download Custody Report
                </button>
                {canSeal && !isSealed && (
                  <button onClick={handleSeal} disabled={sealing}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60">
                    <Lock className="w-4 h-4" /> {sealing ? 'Sealing...' : 'Seal Case for Trial'}
                  </button>
                )}
              </div>
            </div>

            {/* Upload Form */}
            {canUpload && !isSealed && (
              <div className="bg-surface rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-slate-100">
                  <UploadCloud className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-main">Add New Document</h3>
                </div>
                <form onSubmit={handleUpload} className="p-5 space-y-4">

                  {/* Document Type selector — drives the fields below */}
                  <div>
                    <label className="block text-xs font-black text-text-secondary uppercase tracking-wider mb-1.5">Document Type <span className="text-error">*</span></label>
                    <select name="doc_type" value={docType} onChange={e => setDocType(e.target.value)}
                      className="w-full border border-border rounded-lg p-2.5 bg-surface focus:ring-2 focus:ring-primary outline-none text-sm cursor-pointer font-bold">
                      <option value="FIR">FIR (First Information Report)</option>
                      <option value="Evidence">Physical Evidence</option>
                      <option value="Forensic">Forensic Report</option>
                      <option value="Statement">Witness / Accused Statement</option>
                      <option value="Court">Court Filing / Order</option>
                      <option value="Medical">Medical / Post-Mortem Report</option>
                    </select>
                  </div>

                  {/* FIR-specific fields */}
                  {docType === 'FIR' && (
                    <div className="bg-primary/5 border border-blue-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-black text-primary uppercase tracking-wider">FIR Details</p>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">FIR Title / Subject <span className="text-error">*</span></label>
                        <input required name="name" type="text" placeholder="e.g., FIR against theft at MG Road"
                          className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Date of Filing</label>
                          <input name="fir_date" type="date" className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Filing Officer</label>
                          <input name="fir_officer" type="text" defaultValue={currentUser.name} readOnly
                            className="w-full border border-border rounded-lg p-2 text-sm bg-border text-text-secondary cursor-not-allowed" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evidence-specific fields */}
                  {docType === 'Evidence' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Evidence Details</p>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Evidence Label <span className="text-error">*</span></label>
                        <input required name="name" type="text" placeholder="e.g., Exhibit A — Mobile Phone seized from accused"
                          className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Evidence Type</label>
                          <select name="evidence_type" className="w-full border border-border rounded-lg p-2 text-sm bg-surface outline-none focus:ring-1 focus:ring-amber-400">
                            <option>Physical Object</option><option>Photograph</option>
                            <option>CCTV Footage</option><option>Digital Record</option><option>Document</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Collection Date</label>
                          <input name="collection_date" type="date" className="w-full border border-border rounded-lg p-2 text-sm bg-surface outline-none focus:ring-1 focus:ring-amber-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forensic-specific fields */}
                  {docType === 'Forensic' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-black text-purple-700 uppercase tracking-wider">Forensic Report Details</p>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Report Title <span className="text-error">*</span></label>
                        <input required name="name" type="text" placeholder="e.g., DNA Analysis Report — Victim Sample"
                          className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Forensic Lab / Authority</label>
                        <input name="forensic_lab" type="text" placeholder="e.g., State Forensic Science Laboratory, Delhi"
                          className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                      </div>
                    </div>
                  )}

                  {/* Statement-specific fields */}
                  {docType === 'Statement' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-black text-green-700 uppercase tracking-wider">Statement Details</p>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Statement Description <span className="text-error">*</span></label>
                        <input required name="name" type="text" placeholder="e.g., Statement of Witness Ramesh Kumar (u/s 161 CrPC)"
                          className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Person's Role</label>
                          <select name="person_role" className="w-full border border-border rounded-lg p-2 text-sm bg-surface outline-none focus:ring-1 focus:ring-green-400">
                            <option>Witness</option><option>Accused</option><option>Victim</option><option>Expert</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Statement Date</label>
                          <input name="statement_date" type="date" className="w-full border border-border rounded-lg p-2 text-sm bg-surface outline-none focus:ring-1 focus:ring-green-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generic title for Court / Medical */}
                  {(docType === 'Court' || docType === 'Medical') && (
                    <div className="bg-background border border-border rounded-lg p-4">
                      <label className="block text-xs font-bold text-text-secondary mb-1">Document Title <span className="text-error">*</span></label>
                      <input required name="name" type="text"
                        placeholder={docType === 'Court' ? 'e.g., Bail Application Order — Sessions Court' : 'e.g., Post-Mortem Report — Dr. A. Verma'}
                        className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-surface" />
                    </div>
                  )}

                  {/* File upload — always shown */}
                  <div>
                    <label className="block text-xs font-black text-text-secondary uppercase tracking-wider mb-1.5">Attach File <span className="text-error">*</span></label>
                    <input required name="file" type="file"
                      className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-primary/5 file:text-primary hover:file:bg-blue-100 cursor-pointer border border-border rounded-lg bg-background p-1" />
                    <p className="text-xs text-text-secondary mt-1">SHA-256 hash will be computed and locked on upload.</p>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold tracking-wide flex justify-center items-center gap-2">
                    <FileLock2 className="w-4 h-4" /> Upload & Cryptographically Seal
                  </button>
                </form>
              </div>
            )}

            {/* Locked upload notice */}
            {(!canUpload || isSealed) && (
              <div className="bg-surface p-6 rounded-xl border-2 border-dashed border-border text-center">
                <Lock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-text-secondary font-bold text-sm">Upload Restricted</p>
                <p className="text-text-secondary text-xs mt-1">
                  {isSealed ? 'This case is sealed. No uploads allowed.' : `Role "${currentUser.role}" cannot upload documents.`}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Document Chain of Custody */}
          <div className="lg:col-span-8">
            <div className="bg-surface rounded-xl shadow-sm border border-border">
              <div className="p-5 border-b border-border bg-background rounded-t-xl flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-text-main">
                    <History className="w-5 h-5 text-primary" /> Document Chain of Custody
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">Git-inspired immutable version control. <strong>No Hard Deletes.</strong></p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                  {caseData.documents?.length || 0} Records
                </div>
              </div>

              <div className="p-6">
                {(!caseData.documents || caseData.documents.length === 0) ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-background">
                    <FileLock2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-text-secondary font-medium">No documents secured yet.</p>
                    {canUpload && !isSealed && <p className="text-text-secondary text-sm mt-1">Use the form on the left to upload the first document.</p>}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {Object.entries(
                      caseData.documents.reduce((acc: any, doc: any) => {
                        if (!acc[doc.doc_type]) acc[doc.doc_type] = [];
                        acc[doc.doc_type].push(doc);
                        return acc;
                      }, {})
                    ).map(([docType, docs]: [string, any]) => (
                      <div key={docType}>
                        <h4 className="text-sm font-black text-text-secondary uppercase tracking-widest border-b-2 border-border pb-2 mb-5 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" /> {docType} FILES
                        </h4>
                        <div className="space-y-5">
                          {docs.map((doc: any) => (
                            <div key={doc.id} className="border border-border rounded-xl overflow-hidden shadow-sm">
                              {/* Document Header */}
                              <div className="bg-surface p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/5 p-2 rounded-lg border border-primary/20">
                                    <FileText className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-text-main">{doc.name}</h4>
                                    <span className="text-xs text-text-secondary font-mono">ID: #{doc.id}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => handleVerify(doc.id)}
                                    className="flex items-center gap-1 bg-surface border-2 border-green-200 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify Integrity
                                  </button>
                                  <a href="https://amoy.polygonscan.com/address/0xA94D3FF15B2c24E8e2E820d6e631c79a69b2b14c" target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 bg-[#8247E5] border-2 border-[#8247E5] text-white hover:bg-[#6c3bbf] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                                    <svg viewBox="0 0 40 40" className="w-3.5 h-3.5 fill-current"><path d="M26.2208 13.6847L20 9.87062L13.7792 13.6847V21.3129L20 25.1271L26.2208 21.3129V13.6847ZM28.4357 22.5956L20 27.7661L11.5643 22.5956V12.4045L20 7.23395L28.4357 12.4045V22.5956Z"></path><path d="M20.0001 27.7662L11.5645 32.9367V22.5957L20.0001 27.7662Z"></path><path d="M11.5645 12.4044L20.0001 7.23389V17.5749L11.5645 12.4044Z"></path><path d="M28.4357 12.4044L20.0001 17.5749V7.23389L28.4357 12.4044Z"></path><path d="M20.0001 27.7662L28.4357 22.5957V32.9367L20.0001 27.7662Z"></path></svg>
                                    Polygonscan
                                  </a>
                                  {canUpload && !isSealed && (
                                    <Link href={`/document/${doc.id}`}>
                                      <button className="flex items-center gap-1 bg-surface border-2 border-border hover:border-blue-400 hover:text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                                        <RefreshCw className="w-3.5 h-3.5" /> Update Version
                                      </button>
                                    </Link>
                                  )}
                                </div>
                              </div>

                              {/* Version Timeline */}
                              <div className="p-5 bg-background">
                                <div className="relative border-l-2 border-blue-200 ml-3 space-y-5">
                                  {doc.versions.sort((a: any, b: any) => b.version_number - a.version_number).map((v: any) => {
                                    const uInfo = USERS[v.uploaded_by] || { name: 'Unknown', role: '—', badge: '—' };
                                    return (
                                      <div key={v.id} className="relative pl-7">
                                        <div className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${v.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                        <div className={`bg-surface p-4 rounded-lg border shadow-sm ${v.status === 'Active' ? 'border-green-200 ring-1 ring-green-50' : 'border-border opacity-75'}`}>
                                          {/* Version header */}
                                          <div className="flex flex-wrap gap-2 justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                              <span className={`font-black text-base ${v.status === 'Active' ? 'text-green-700' : 'text-text-secondary'}`}>
                                                v{v.version_number}.0
                                              </span>
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${v.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-border text-text-secondary border-border'}`}>
                                                {v.status}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                              <span className="text-xs text-text-secondary">{new Date(v.created_at).toLocaleString()}</span>
                                              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${v.file_path}?user_id=${currentUserId}&document_id=${doc.id}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex items-center gap-1 text-xs font-bold text-primary hover:text-blue-800 bg-primary/5 px-2 py-1 rounded border border-primary/20 hover:bg-blue-100 transition-colors">
                                                <Download className="w-3 h-3" /> VIEW FILE
                                              </a>
                                            </div>
                                          </div>
                                          {/* Uploader info */}
                                          <div className="flex items-center gap-2 mb-3 bg-background px-3 py-2 rounded-lg border border-slate-100 w-fit">
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">
                                              {uInfo.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-text-main">{uInfo.name}</span>
                                            <span className="text-xs text-text-secondary border-l border-border pl-2">{uInfo.role}</span>
                                            <span className="text-xs font-mono text-primary border-l border-border pl-2">Badge: {uInfo.badge}</span>
                                          </div>
                                          {/* Hash */}
                                          <div className="bg-background p-3 rounded-md border border-border">
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">SHA-256 Integrity Hash</span>
                                            </div>
                                            <p className="text-xs font-mono text-text-main break-all bg-surface p-2 rounded border border-slate-100">{v.file_hash}</p>
                                          </div>

                                          {/* ── AI NLP INSIGHTS ── */}
                                          <div className="mt-3 border border-success/20 rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => toggleAI(v.id)}
                                              className="w-full flex items-center justify-between px-4 py-2.5 bg-success/10 hover:bg-emerald-100 transition-colors text-left"
                                            >
                                              <div className="flex items-center gap-2">
                                                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm font-bold text-emerald-800">AI Document Analysis</span>
                                                {(v.ai_summary || v.entities) && (
                                                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Auto-Generated
                                                  </span>
                                                )}
                                              </div>
                                              {expandedAI[v.id] ? <ChevronUp className="w-4 h-4 text-emerald-500" /> : <ChevronDown className="w-4 h-4 text-emerald-500" />}
                                            </button>
                                            {expandedAI[v.id] && (
                                              <div className="p-4 bg-surface border-t border-emerald-100 space-y-4">
                                                {!v.ai_summary && !v.entities ? (
                                                  <div className="text-center py-4 text-text-secondary">
                                                    <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">No AI insights generated for this document.</p>
                                                  </div>
                                                ) : (
                                                  <>
                                                    {/* Auto Summary */}
                                                    {v.ai_summary && (
                                                      <div>
                                                        <h5 className="text-xs font-black text-success uppercase tracking-widest mb-2 border-b border-emerald-100 pb-1">Executive Summary</h5>
                                                        <p className="text-sm text-text-main leading-relaxed bg-success/10/50 p-3 rounded-lg border border-emerald-100 italic">
                                                          {v.ai_summary}
                                                        </p>
                                                      </div>
                                                    )}
                                                    
                                                    {/* Extracted Entities */}
                                                    {v.entities && (
                                                      <div>
                                                        <h5 className="text-xs font-black text-success uppercase tracking-widest mb-3 border-b border-emerald-100 pb-1">Extracted Entities</h5>
                                                        <div className="space-y-3">
                                                          {(() => {
                                                            try {
                                                              const ents = JSON.parse(v.entities);
                                                              if (Object.values(ents).every((arr: any) => arr.length === 0)) {
                                                                return <p className="text-xs text-text-secondary">No specific entities detected.</p>;
                                                              }
                                                              return (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                  {ents.PERSON?.length > 0 && (
                                                                    <div>
                                                                      <div className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-1.5"><UserCircle className="w-3.5 h-3.5"/> People</div>
                                                                      <div className="flex flex-wrap gap-1">{ents.PERSON.map((e: string, i: number) => <span key={i} className="text-xs bg-primary/5 text-primary border border-blue-200 px-2 py-0.5 rounded">{e}</span>)}</div>
                                                                    </div>
                                                                  )}
                                                                  {ents.GPE?.length > 0 && (
                                                                    <div>
                                                                      <div className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-1.5"><Map className="w-3.5 h-3.5"/> Locations</div>
                                                                      <div className="flex flex-wrap gap-1">{ents.GPE.map((e: string, i: number) => <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">{e}</span>)}</div>
                                                                    </div>
                                                                  )}
                                                                  {ents.ORG?.length > 0 && (
                                                                    <div>
                                                                      <div className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-1.5"><Building2 className="w-3.5 h-3.5"/> Organizations</div>
                                                                      <div className="flex flex-wrap gap-1">{ents.ORG.map((e: string, i: number) => <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">{e}</span>)}</div>
                                                                    </div>
                                                                  )}
                                                                  {ents.DATE?.length > 0 && (
                                                                    <div>
                                                                      <div className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-1.5"><Calendar className="w-3.5 h-3.5"/> Dates</div>
                                                                      <div className="flex flex-wrap gap-1">{ents.DATE.map((e: string, i: number) => <span key={i} className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">{e}</span>)}</div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            } catch(e) { return null; }
                                                          })()}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {/* ── OCR TEXT PREVIEW ── */}
                                          <div className="mt-3 border border-purple-200 rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => toggleOCR(v.id)}
                                              className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                                            >
                                              <div className="flex items-center gap-2">
                                                <ScanText className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-bold text-purple-800">AI OCR Scan — Extracted Text</span>
                                                {v.extracted_text
                                                  ? <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">{v.extracted_text.split(/\s+/).filter(Boolean).length} words</span>
                                                  : <span className="text-xs bg-slate-200 text-text-secondary px-2 py-0.5 rounded-full">No text found</span>
                                                }
                                              </div>
                                              {expandedOCR[v.id] ? <ChevronUp className="w-4 h-4 text-purple-500" /> : <ChevronDown className="w-4 h-4 text-purple-500" />}
                                            </button>
                                            {expandedOCR[v.id] && (
                                              <div className="p-4 bg-surface border-t border-purple-100">
                                                {v.extracted_text ? (
                                                  <pre className="text-xs text-text-main whitespace-pre-wrap font-mono bg-background p-3 rounded border border-border max-h-64 overflow-y-auto leading-relaxed">
                                                    {v.extracted_text}
                                                  </pre>
                                                ) : (
                                                  <div className="text-center py-4 text-text-secondary">
                                                    <ScanText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">No text could be extracted from this file.</p>
                                                    <p className="text-xs mt-1">This may be a non-text file or OCR was unable to read it.</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {/* ── EXTRACTED IMAGE GALLERY ── */}
                                          <div className="mt-2 border border-amber-200 rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => toggleImgs(v.id)}
                                              className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                                            >
                                              <div className="flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-amber-600" />
                                                <span className="text-sm font-bold text-amber-800">Extracted Images & Photos</span>
                                                {versionImages[v.id]?.length > 0 && (
                                                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">{versionImages[v.id].length} found</span>
                                                )}
                                              </div>
                                              {expandedImgs[v.id] ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
                                            </button>
                                            {expandedImgs[v.id] && (
                                              <div className="p-4 bg-surface border-t border-amber-100">
                                                {!versionImages[v.id] ? (
                                                  <p className="text-xs text-text-secondary text-center py-2">Loading images...</p>
                                                ) : versionImages[v.id].length === 0 ? (
                                                  <div className="text-center py-4 text-text-secondary">
                                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">No images were extracted from this file.</p>
                                                  </div>
                                                ) : (
                                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {versionImages[v.id].map((img: any, idx: number) => (
                                                      <a
                                                        key={img.id}
                                                        href={`${API}${img.url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group relative block rounded-lg overflow-hidden border border-border hover:border-amber-400 transition-all shadow-sm hover:shadow-md"
                                                      >
                                                        <img
                                                          src={`${API}${img.url}`}
                                                          alt={`Image ${idx + 1}`}
                                                          className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity"
                                                          onError={(e: any) => { e.target.style.display = 'none'; }}
                                                        />
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1.5 flex items-center justify-between">
                                                          <span>Image {idx + 1}</span>
                                                          <Eye className="w-3 h-3" />
                                                        </div>
                                                      </a>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── UPLOADING / OCR SCANNING DIALOG OVERLAY ── */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-t-4 border-blue-600">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <RefreshCw className="w-16 h-16 text-primary animate-spin opacity-20" />
              <ScanText className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-black text-text-main tracking-tight mb-2">Processing Document</h3>
            <p className="text-sm text-text-secondary font-medium">
              Uploading securely...<br/>
              Running OCR & AI Analysis...
            </p>
            <div className="w-full bg-border rounded-full h-1.5 mt-6 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFYING INTEGRITY LOADING OVERLAY ── */}
      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-t-4 border-green-600">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <RefreshCw className="w-16 h-16 text-green-500 animate-spin opacity-20" />
              <ShieldCheck className="w-8 h-8 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-black text-text-main tracking-tight mb-2">Verifying Integrity</h3>
            <p className="text-sm text-text-secondary font-medium">
              Recomputing cryptographic hash...<br/>
              Querying Polygon Blockchain...
            </p>
            <div className="w-full bg-border rounded-full h-1.5 mt-6 overflow-hidden">
              <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFY RESULTS MODAL ── */}
      {verifyResult && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setVerifyResult(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border-t-4 border-green-600 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-black tracking-wide text-sm uppercase">Cryptographic Integrity Report</h3>
              </div>
              <button onClick={() => setVerifyResult(null)} className="text-text-secondary hover:text-white transition-colors text-xl font-bold leading-none">×</button>
            </div>

            {/* Version Results */}
            <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
              {verifyResult.checks.map((c: any, i: number) => {
                const isVerified      = c.status === 'VERIFIED';
                const isLocalVerified = c.status === 'VERIFIED_LOCAL';
                const isTampered      = c.status === 'TAMPERED';
                const isMissing       = c.status === 'MISSING';
                return (
                  <div key={i} className={`rounded-xl border-2 p-4 ${
                    isVerified       ? 'border-green-300 bg-green-50' :
                    isLocalVerified  ? 'border-blue-200 bg-primary/5' :
                    isTampered       ? 'border-red-400 bg-error/10' :
                    isMissing        ? 'border-orange-300 bg-orange-50' :
                                       'border-border bg-background'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isVerified       ? 'bg-green-500' :
                        isLocalVerified  ? 'bg-primary/50' :
                        isTampered       ? 'bg-error/100' :
                        isMissing        ? 'bg-orange-500' : 'bg-slate-400'
                      }`}>
                        {isVerified      && <CheckCircle2 className="w-5 h-5 text-white" />}
                        {isLocalVerified && <ShieldCheck className="w-5 h-5 text-white" />}
                        {isTampered      && <AlertTriangle className="w-5 h-5 text-white" />}
                        {isMissing       && <FileLock2 className="w-5 h-5 text-white" />}
                        {!isVerified && !isLocalVerified && !isTampered && !isMissing && <Shield className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <span className="text-xs font-black text-text-secondary uppercase tracking-wider">Version {c.version}</span>
                        <div className={`text-sm font-black ${
                          isVerified ? 'text-green-700' : isLocalVerified ? 'text-primary' : isTampered ? 'text-red-700' : 'text-orange-700'
                        }`}>{c.status}</div>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isTampered ? 'text-red-700 font-semibold' : 'text-text-secondary'}`}>{c.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-slate-100">
              {verifyResult.checks.some((c: any) => c.status === 'VERIFIED') && (
                <button
                  onClick={() => window.open('https://amoy.polygonscan.com/address/0xA94D3FF15B2c24E8e2E820d6e631c79a69b2b14c', '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#8247E5] hover:bg-[#6c3bbf] text-white py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                  <svg viewBox="0 0 40 40" className="w-4 h-4 fill-current"><path d="M26.2208 13.6847L20 9.87062L13.7792 13.6847V21.3129L20 25.1271L26.2208 21.3129V13.6847ZM28.4357 22.5956L20 27.7661L11.5643 22.5956V12.4045L20 7.23395L28.4357 12.4045V22.5956Z"></path><path d="M20.0001 27.7662L11.5645 32.9367V22.5957L20.0001 27.7662Z"></path><path d="M11.5645 12.4044L20.0001 7.23389V17.5749L11.5645 12.4044Z"></path><path d="M28.4357 12.4044L20.0001 17.5749V7.23389L28.4357 12.4044Z"></path><path d="M20.0001 27.7662L28.4357 22.5957V32.9367L20.0001 27.7662Z"></path></svg>
                  View on Polygonscan
                </button>
              )}
              <button
                onClick={() => setVerifyResult(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
