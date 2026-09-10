"use client";

import Link from "next/link";
import { Scale, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userBadge, setUserBadge] = useState("");

  useEffect(() => {
    setUserName(sessionStorage.getItem("userName") || "");
    setUserRole(sessionStorage.getItem("userRole") || "");
    setUserBadge(sessionStorage.getItem("userBadge") || "");
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const showProfile = () => {
    alert(`Logged in Profile:\n\nName: ${userName}\nRole: ${userRole}\nBadge ID: ${userBadge}`);
  };

  const tabs = [
    { label: "Case Repository", href: "/", match: (p: string | null) => p === "/" || (p?.startsWith("/case") && !p?.startsWith("/case/new")) },
    { label: "Audit Trail", href: "/audit", match: (p: string | null) => p?.startsWith("/audit") },
    { label: "Active Session", href: "/profile", match: (p: string | null) => p?.startsWith("/profile") },
  ];

  return (
    <div className="w-full bg-white border-b border-outline-variant/30 flex flex-col">
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
              National Judicial & Forensic Authentication Network
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

        {/* Right: User Profile & Actions */}
        <div className="flex items-center space-x-4">
          {userName && (
            <div className="text-right hidden sm:block">
              <p className="text-label-md text-primary font-semibold m-0 leading-tight">
                {userName}
              </p>
              <p className="text-body-sm text-outline m-0">
                {userRole} • {userBadge}
              </p>
            </div>
          )}
          <button 
            onClick={showProfile}
            className="h-9 w-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-surface-container-high cursor-pointer hover:opacity-90 transition-opacity"
            title="Profile Settings"
          >
            <User size={16} />
          </button>
          <button
            onClick={handleLogout}
            className="text-outline hover:text-error transition-colors ml-2"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tricolor Indicator Line */}
      <div className="flex h-1 w-full">
        <div className="w-1/3 bg-secondary"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-tertiary"></div>
      </div>
    </div>
  );
}
