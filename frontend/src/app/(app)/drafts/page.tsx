"use client";

import { useEffect, useState } from "react";
import { FileText, ArrowRight, Trash2, Calendar } from "lucide-react";
import Link from "next/link";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const savedDrafts = JSON.parse(localStorage.getItem("caseDrafts") || "[]");
      // sort by newest first
      savedDrafts.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setDrafts(savedDrafts);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteDraft = (id: string) => {
    try {
      const savedDrafts = drafts.filter(d => d.id !== id);
      localStorage.setItem("caseDrafts", JSON.stringify(savedDrafts));
      setDrafts(savedDrafts);
    } catch(e) {}
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-5xl px-6 py-8">
        <h1 className="text-display-sm text-primary font-bold mb-2 flex items-center gap-3">
          <FileText className="text-secondary" /> Saved Drafts
        </h1>
        <p className="text-body-md text-outline mb-8">
          Resume your incomplete case registrations. Drafts are saved securely in your local session.
        </p>

        {drafts.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <FileText className="text-outline-variant mb-4" size={48} />
            <h3 className="text-headline-sm text-primary font-bold mb-2">No Saved Drafts</h3>
            <p className="text-body-sm text-outline">You haven't saved any case registration drafts yet.</p>
            <Link href="/case/new" className="mt-6 bg-primary text-white px-6 py-2 rounded-lg text-label-md font-bold hover:bg-[#101B31] transition-colors">
              Register New Case
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft, idx) => (
              <div key={idx} className="bg-white border border-outline-variant/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-surface-container px-3 py-1 rounded border border-outline-variant/30 text-[10px] font-bold text-primary tracking-wider uppercase">
                    {draft.legalEra === "post" ? "Post-2024 (BNS)" : "Pre-2024 (IPC)"}
                  </div>
                  <button onClick={() => deleteDraft(draft.id)} className="text-outline-variant hover:text-error transition-colors" title="Delete Draft">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-headline-sm text-primary font-bold mb-2 truncate">
                  {draft.formData?.title || "Untitled Case"}
                </h3>
                <p className="text-body-sm text-outline mb-4">
                  <span className="font-bold text-primary">FIR No:</span> {draft.formData?.fir_no || "Not Specified"}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-outline mb-6">
                  <Calendar size={12} />
                  Last saved: {new Date(draft.timestamp).toLocaleString()}
                </div>

                <Link href={`/case/new?draftId=${draft.id}`} className="w-full bg-[#F0F3FF] hover:bg-secondary/10 text-secondary border border-secondary/20 rounded-lg py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold transition-colors">
                  Resume Registration <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
