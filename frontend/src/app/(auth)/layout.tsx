import { Scale, Lock } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Auth Header */}
      <div className="w-full flex flex-col shrink-0 z-20">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-lg p-2 text-white shadow-sm flex items-center justify-center relative w-10 h-10">
              <Scale size={24} />
              <div className="absolute inset-0 flex items-center justify-center mt-1">
                <Lock size={10} className="text-white fill-primary" />
              </div>
            </div>
            <h1 className="text-headline-sm text-primary m-0 font-bold leading-tight">Digital Evidence Locker</h1>
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <p className="text-body-md text-primary font-bold m-0 leading-tight">Central Judicial Network</p>
            <p className="text-label-caps text-outline font-medium">Digital Evidence Framework</p>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden min-h-0">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B2A4A 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="z-10 w-full max-w-4xl max-h-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Official Footer */}
      <footer className="w-full py-3 shrink-0">
        <div className="px-4 flex flex-col items-center justify-center text-center">
          <p className="text-label-caps text-outline font-medium tracking-widest">
            DIGITAL EVIDENCE LOCKER, ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
