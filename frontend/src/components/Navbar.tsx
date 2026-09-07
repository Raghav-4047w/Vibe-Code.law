'use client';
import Link from 'next/link';
import { Shield, LogOut, ArrowLeft, ClipboardList, User, BadgeCheck, Scale } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUser, logout, SIHUser } from '@/lib/auth';

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Officer:  { bg: 'bg-secondary',    text: 'text-white',   border: 'border-primary' },
  Reviewer: { bg: 'bg-success', text: 'text-white', border: 'border-green-800' },
  Judge:    { bg: 'bg-purple-800',  text: 'text-purple-100',  border: 'border-purple-500' },
};

export default function Navbar({ showBack = false }: { showBack?: boolean }) {
  const [user, setUser] = useState<SIHUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const roleStyle = user ? (ROLE_STYLES[user.role] || ROLE_STYLES.Officer) : ROLE_STYLES.Officer;

  return (
    <header className="border-b border-border shadow-sm">
      {/* BRANDING HEADER */}
      <div className="bg-surface text-text-main">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary rounded flex items-center justify-center flex-shrink-0 shadow text-white">
              <Scale className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xl font-black tracking-wide leading-snug text-primary uppercase">Digital Evidence Vault</p>
              <p className="text-xs text-text-secondary leading-none font-medium mt-1">
                Cryptographically Secured Blockchain Ledger
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-text-secondary text-xs border border-border px-3 py-1.5 rounded bg-background">
            <Shield className="w-4 h-4 text-success" />
            <span className="font-bold tracking-wider uppercase">BNS / BNSS Compliant</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION STRIP */}
      <nav className="bg-primary text-white border-b-4 border-accent">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showBack ? (
              <Link href="/"
                className="flex items-center gap-1.5 bg-secondary hover:bg-primary border border-secondary px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> DASHBOARD
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm font-black tracking-widest text-white hidden sm:block uppercase">
                  Case Repository
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/audit"
              className="hidden md:flex items-center gap-1.5 bg-secondary hover:bg-primary border border-secondary px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors">
              <ClipboardList className="w-3.5 h-3.5" /> Audit Log
            </Link>

            {user && (
              <div className={`flex items-center gap-2 ${roleStyle.bg} border ${roleStyle.border} rounded px-3 py-1.5 shadow-sm`}>
                <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-black ${roleStyle.text} leading-none`}>{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <BadgeCheck className={`w-3 h-3 ${roleStyle.text} opacity-80`} />
                    <span className={`text-[10px] ${roleStyle.text} opacity-80 font-mono uppercase`}>
                      {user.role} | ID: {user.badge}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 bg-error hover:bg-red-800 border border-error px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors text-white shadow-sm">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
