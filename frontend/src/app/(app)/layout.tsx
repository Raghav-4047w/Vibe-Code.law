"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (!role) {
      window.location.href = "/login";
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/30 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-body-sm text-outline">
            © 2026 Sovereign Vault Authentication. Statutory record management framework.
          </p>
          <div className="flex gap-4 text-body-sm text-outline">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Help Desk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
