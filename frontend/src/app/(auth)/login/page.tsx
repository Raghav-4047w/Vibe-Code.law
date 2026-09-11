"use client";

import { useState } from "react";
import { Shield, IdCard, KeyRound, Eye, EyeOff, Gavel, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"Officer" | "Analyst" | "Judge">("Officer");
  const [showPassword, setShowPassword] = useState(false);
  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      if (!badgeId) {
        setError("Please enter your Service ID to reset password.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        await axios.post("/api/auth/forgot-password", { badge_id: badgeId });
        setResetSent(true);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to initiate recovery. Ensure Service ID is correct.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!badgeId || !password) {
      setError("Please enter both ID and Password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/login", {
        badge_id: badgeId,
        password: password,
        role: role,
      });

      sessionStorage.setItem("token", res.data.access_token);
      sessionStorage.setItem("userRole", res.data.role);
      sessionStorage.setItem("userName", res.data.name);
      sessionStorage.setItem("userBadge", res.data.badge_id);
      sessionStorage.setItem("userId", res.data.user_id.toString());

      window.location.href = "/";
    } catch {
      setError("Invalid credentials or unauthorized role.");
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="bg-white rounded-[16px] shadow-xl border border-outline-variant/20 w-full p-8 text-center">
          <div className="bg-surface-container w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-[#0D7A5F]" size={32} />
          </div>
          <h2 className="text-headline-sm text-primary font-bold mb-2">Real-Time OTP Sent</h2>
          <p className="text-body-md text-outline mb-4">
            A secure 6-digit OTP has been sent via SMTP to the registered departmental email for Service ID <strong>{badgeId}</strong>.
          </p>
          <div className="bg-[#F0F3FF] border border-outline-variant/50 rounded-lg p-4 mb-6 text-left text-sm text-primary">
            <p className="font-bold mb-2 text-secondary">Live Demo Testing Inbox:</p>
            <p><strong>Inbox URL:</strong> <a href="https://ethereal.email/login" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://ethereal.email/login</a></p>
            <p><strong>Email:</strong> msfx77wiuhj2cp74@ethereal.email</p>
            <p><strong>Password:</strong> kwMA2rENZz4MSVQZmz</p>
          </div>
          <button onClick={() => { setResetSent(false); setIsForgotPassword(false); }} className="text-secondary font-bold hover:underline">
            Return to Secure Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <form onSubmit={handleLogin} className="bg-white rounded-[16px] shadow-xl border border-outline-variant/20 w-full overflow-hidden flex flex-col md:flex-row max-w-4xl">
        
        {/* Left Side: Branding & Info */}
        <div className="md:w-[45%] bg-surface/30 p-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-outline-variant/30 relative">
           <div className="mb-4 bg-surface-container-low border border-outline-variant/30 rounded-full px-4 py-1.5 inline-flex items-center gap-2 self-start">
             <div className="w-2 h-2 rounded-full bg-secondary"></div>
             <span className="text-[10px] text-primary tracking-widest font-bold uppercase">
               Blockchain Evidence Layer
             </span>
           </div>
           
           <div className="bg-gradient-to-br from-primary to-secondary w-20 h-20 rounded-2xl flex items-center justify-center mb-8 relative shadow-lg transform hover:scale-105 transition-transform duration-300">
             <Shield className="text-white" size={40} />
             <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
               <Lock size={14} className="text-primary" />
             </div>
           </div>
           <h2 className="text-headline-lg text-primary font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
             {isForgotPassword ? "Account Recovery" : "Secure Legal Login"}
           </h2>
           <p className="text-[13px] text-outline leading-relaxed mb-8">
             Authenticate to access the tamper-proof evidentiary repository governed by Bharatiya Sakshya Adhiniyam, 2023.
           </p>

           {/* Official Use Notice */}
           <div className="bg-[#FFF8ED] border border-[#FCD34D] rounded-lg p-3 flex items-start gap-3 mt-auto">
             <Gavel className="text-[#92400E] shrink-0 mt-0.5" size={16} />
             <p className="text-[11px] text-[#92400E] leading-relaxed">
               <strong>Official Use Notice:</strong> Unauthorised access or misuse attracts penal prosecution under IT Act 2000 (Sec 43, 66) & BNS.
             </p>
           </div>
        </div>

        {/* Right Side: Form Inputs */}
        <div className="md:w-[55%] p-5 flex flex-col justify-center">
          
          {/* Role Selector */}
          {!isForgotPassword && (
            <div className="bg-surface-container-low rounded-[10px] p-1 flex mb-6">
              {(["Officer", "Analyst", "Judge"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-1.5 text-[13px] rounded-md flex items-center justify-center gap-2 transition-all ${
                    role === r
                      ? "bg-white shadow-sm text-primary font-bold"
                      : "text-outline-variant hover:text-primary"
                  }`}
                >
                  {role === r && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                  {r}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 text-error text-[12px] font-bold bg-error-container/50 border border-error/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-primary mb-1.5">
                {role} ID / Service ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdCard className="text-outline-variant" size={16} />
                </div>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder={
                    role === "Officer" ? "DL-POL-2024-8842" : role === "Analyst" ? "DEL-FSL-09" : "DL-CT-N001"
                  }
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline-variant/50 rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-[13px] text-primary transition-all"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[12px] font-bold text-primary">
                    Security Passcode / Token PIN
                  </label>
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[11px] text-secondary hover:underline font-bold">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="text-outline-variant" size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="block w-full pl-10 pr-10 py-2.5 border border-outline-variant/50 rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-[13px] text-primary transition-all font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Checkbox */}
          {!isForgotPassword && (
            <div className="bg-[#F8FAFC] rounded-lg p-3 border border-outline-variant/30 flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                id="ack"
              />
              <label htmlFor="ack" className="text-[11px] text-on-surface-variant leading-relaxed">
                I acknowledge this session is logged and monitored for audit and evidentiary
                purposes under <strong className="text-primary font-semibold">Section 63 BSA 2023.</strong>
              </label>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#101B31] text-white rounded-lg py-3 flex items-center justify-center gap-2 text-[13px] font-bold transition-all shadow-md mb-6 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : isForgotPassword ? (
              "Request Recovery Link"
            ) : (
              <>Sign In Securely <span className="text-lg leading-none">â†’</span></>
            )}
          </button>

          {/* Actions footer */}
          <div className="text-center mt-auto flex flex-col gap-2">
            {!isForgotPassword ? (
              <Link href="/register" className="text-[12px] font-bold text-secondary hover:underline">
                New statutory official? Register your identity here.
              </Link>
            ) : (
              <button type="button" onClick={() => setIsForgotPassword(false)} className="text-[12px] font-bold text-secondary hover:underline">
                Back to Secure Login
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
