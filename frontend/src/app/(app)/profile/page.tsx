"use client";

import { useEffect, useState } from "react";
import { User, ShieldCheck, Mail, Hash, Briefcase, Activity } from "lucide-react";

export default function Profile() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userBadge, setUserBadge] = useState("");

  useEffect(() => {
    setUserName(sessionStorage.getItem("userName") || "Unknown User");
    setUserRole(sessionStorage.getItem("userRole") || "Guest");
    setUserBadge(sessionStorage.getItem("userBadge") || "N/A");
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary rounded-xl p-2.5 text-secondary shadow-sm">
          <User size={24} />
        </div>
        <h1 className="text-display-lg-mobile text-primary font-bold m-0 flex items-center gap-2">
          Active Session
          <div className="w-2 h-2 rounded-full bg-secondary mb-3" />
        </h1>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden relative p-8">
        <ShieldCheck className="absolute -right-8 -top-8 text-surface-container w-64 h-64 opacity-50 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-32 h-32 rounded-full bg-surface-container flex items-center justify-center text-primary text-5xl font-bold shadow-inner">
            {userName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <h2 className="text-[28px] font-bold text-primary leading-tight">{userName}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F3FF] border border-outline-variant/50 text-primary font-bold text-[12px] uppercase tracking-widest rounded-md mt-2">
                <Activity size={14} className="text-[#0D7A5F]" /> Session Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-outline-variant/30">
                <Briefcase className="text-secondary" size={20} />
                <div>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Designation & Role</p>
                  <p className="text-[14px] text-primary font-bold">{userRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-outline-variant/30">
                <Hash className="text-secondary" size={20} />
                <div>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Service / Badge ID</p>
                  <p className="text-[14px] text-primary font-bold">{userBadge}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-outline-variant/30 md:col-span-2">
                <Mail className="text-secondary" size={20} />
                <div>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Registered Comm Channel</p>
                  <p className="text-[14px] text-primary font-bold">{userBadge.toLowerCase()}@dept.gov.in</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
