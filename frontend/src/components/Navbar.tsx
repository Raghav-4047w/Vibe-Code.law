"use client";

import Link from "next/link";
import { Scale, LogOut, User, Shield, BadgeCheck } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userBadge, setUserBadge] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserName(sessionStorage.getItem("userName") || "");
    setUserRole(sessionStorage.getItem("userRole") || "");
    setUserBadge(sessionStorage.getItem("userBadge") || "");
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const roleColor = userRole === "Officer"
    ? "bg-primary text-white"
    : userRole === "Judge"
    ? "bg-[#0D7A5F] text-white"
    : "bg-[#92400E] text-white";

  const tabs = [
    { label: "Case Repository", href: "/", match: (p: string | null) => p === "/" || (p?.startsWith("/case") && !p?.startsWith("/case/new")) },
    { label: "Audit Trail", href: "/audit", match: (p: string | null) => p?.startsWith("/audit") },
  ];

  return (
    <div className="w-full bg-white shadow-sm flex flex-col sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Branding */}
        <Link href="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-90">
          <div className="bg-primary rounded-lg p-2 text-white shadow-sm flex items-center justify-center">
            <Scale size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-headline-sm text-primary m-0 font-bold leading-tight">
              Digital Evidence Locker
            </h1>
            <p className="text-label-caps text-outline font-medium tracking-wider text-[10px]">
              National Judicial &amp; Forensic Authentication Network
            </p>
          </div>
        </Link>

        {/* Middle: Navigation Tabs */}
        <div className="hidden md:flex items-center gap-2 bg-surface p-1 rounded-xl border border-outline-variant/30 shadow-sm">
          {tabs.map((tab) => {
            const isActive = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-5 py-2 rounded-lg text-label-md transition-all border ${
                  isActive
                    ? "bg-[#101B31] text-white font-bold border-[#101B31]"
                    : "bg-white text-primary hover:bg-surface-container font-medium border-outline-variant/30"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Profile Icon + Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown((v) => !v)}
              className="flex flex-col items-center gap-0.5 group"
              title="Profile"
            >
              <div className="h-9 w-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-surface-container-high group-hover:opacity-90 transition-opacity">
                <User size={16} />
              </div>
              <span className="text-[9px] text-outline font-bold tracking-wider">PROFILE</span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-outline-variant/30 z-50 overflow-hidden">
                <div className="bg-primary px-5 py-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {userName.split(" ").filter(w => w.length > 1).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </div>
                  <div>
                    <p className="text-white font-bold text-[14px] leading-tight">{userName || "Unknown"}</p>
                    <p className="text-white/70 text-[11px] mt-0.5">{userBadge}</p>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline font-bold uppercase tracking-widest">Role</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${roleColor}`}>{userRole}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline font-bold uppercase tracking-widest">Badge / Service ID</span>
                    <span className="text-[12px] text-primary font-mono font-bold">{userBadge}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline font-bold uppercase tracking-widest">Auth Status</span>
                    <span className="text-[10px] text-[#0D7A5F] font-bold flex items-center gap-1"><BadgeCheck size={12}/> JWT Authenticated</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-outline font-bold uppercase tracking-widest">Network</span>
                    <span className="text-[10px] text-primary font-bold flex items-center gap-1"><Shield size={10}/> Polygon Amoy Testnet</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 mx-4 mb-3" />
                <div className="px-4 pb-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-error/10 hover:bg-error/20 text-error font-bold py-2.5 rounded-xl text-[13px] transition-colors"
                  >
                    <LogOut size={14} /> Sign Out Securely
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indian Tricolor Strip — Saffron | White | Green */}
      <div className="flex h-[3px] w-full">
        <div style={{ width: "33.33%", backgroundColor: "#FF9933" }} />
        <div style={{ width: "33.34%", backgroundColor: "#FFFFFF", outline: "1px solid #e5e7eb" }} />
        <div style={{ width: "33.33%", backgroundColor: "#138808" }} />
      </div>
    </div>
  );
}



