'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, AlertCircle, Eye, EyeOff, Scale } from 'lucide-react';
import { loginRequest, saveSession } from '@/lib/auth';

const ROLE_COLORS: any = {
  Officer: 'bg-secondary',
  Reviewer: 'bg-success',
  Judge: 'bg-purple-700',
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('sih_token')) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { access_token, user } = await loginRequest(username, password);
      saveSession(access_token, user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* GOVERNMENT HEADER */}
      <header className="bg-primary text-white border-b-4 border-accent">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-5">
          <div className="flex-shrink-0 w-16 h-16 bg-surface rounded flex items-center justify-center shadow-lg text-primary">
            <Scale className="w-10 h-10 text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-text-secondary uppercase">BNS / BNSS Compliant</p>
            <h1 className="text-xl font-black tracking-wide leading-tight uppercase">Digital Evidence Vault</h1>
            <p className="text-sm text-text-secondary font-medium">Cryptographically Secured Blockchain Ledger</p>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Login Card */}
          <div className="bg-surface rounded shadow-sm border border-border">

            {/* Card Header */}
            <div className="bg-primary px-8 py-6 text-white text-center rounded-t">
              <div className="w-14 h-14 bg-white/10 rounded flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                <Shield className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-xl font-black tracking-wide">SECURE LEGAL LOGIN</h2>
              <p className="text-text-secondary text-xs mt-1 tracking-widest uppercase">Evidence Vault Portal</p>
            </div>

            {/* Classification notice */}
            <div className="bg-accent/10 border-b border-accent/20 px-6 py-2.5 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <p className="text-xs text-text-main font-semibold">
                This system is for official legal use only. Unauthorised access is strictly prohibited.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 py-7 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error px-4 py-3 rounded text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">
                  Officer ID / Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. sharma"
                  required
                  className="w-full border-2 border-border focus:border-primary rounded px-4 py-3 text-sm font-semibold text-text-main outline-none transition-colors bg-background focus:bg-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full border-2 border-border focus:border-primary rounded px-4 py-3 pr-12 text-sm font-semibold text-text-main outline-none transition-colors bg-background focus:bg-surface"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white font-black py-3.5 rounded tracking-widest text-sm uppercase transition-all hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block" /> Authenticating...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Sign In Securely</>
                )}
              </button>
            </form>

            {/* Demo credentials box */}
            <div className="mx-8 mb-7 bg-background border border-border rounded p-4">
              <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3">Demo Credentials</p>
              <div className="space-y-2">
                {[
                  { username: 'sharma',  password: 'Officer@123',  role: 'Officer',  name: 'Sub-Inspector Sharma' },
                  { username: 'verma',   password: 'Reviewer@123', role: 'Reviewer', name: 'Chief Inspector Verma' },
                  { username: 'judge1',  password: 'Judge@123',    role: 'Judge',    name: 'Hon. Judge Patel' },
                ].map(cred => (
                  <button key={cred.username} type="button"
                    onClick={() => { setUsername(cred.username); setPassword(cred.password); }}
                    className="w-full flex items-center justify-between bg-surface hover:bg-border border border-border rounded px-3 py-2 transition-colors text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-text-main">{cred.name}</p>
                      <p className="text-xs text-text-secondary font-mono">{cred.username} / {cred.password}</p>
                    </div>
                    <span className={`text-xs text-white font-bold px-2 py-0.5 rounded ${ROLE_COLORS[cred.role]}`}>
                      {cred.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-text-secondary mt-5">
            Legal Hackathon Project &nbsp;|&nbsp; Blockchain Evidence Layer
          </p>
        </div>
      </main>

      {/* PAGE FOOTER */}
      <footer className="bg-primary text-text-secondary text-center py-3 text-xs border-t border-border">
        © Digital Evidence Vault &nbsp;|&nbsp; All rights reserved
      </footer>
    </div>
  );
}
