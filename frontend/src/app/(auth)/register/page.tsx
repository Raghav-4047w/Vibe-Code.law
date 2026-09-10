"use client";

import { useState } from "react";
import { Shield, IdCard, KeyRound, Eye, EyeOff, Gavel, UserPlus, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"Officer" | "Analyst" | "Judge">("Officer");
  const [showPassword, setShowPassword] = useState(false);
  const [badgeId, setBadgeId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId || !password || !name) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      await axios.post("http://localhost:8000/api/auth/register", {
        badge_id: badgeId,
        name: name,
        password: password,
        role: role
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-white rounded-[16px] shadow-xl border border-outline-variant/20">
        <div className="w-16 h-16 bg-[#E7F5EE] rounded-full flex items-center justify-center text-[#0D7A5F] mb-4">
          <Shield size={32} />
        </div>
        <h2 className="text-headline-sm text-primary font-bold mb-2">Registration Complete</h2>
        <p className="text-body-md text-outline mb-6">Your statutory identity has been securely created.</p>
        <div className="flex items-center gap-2">
           <Loader2 className="animate-spin text-secondary" size={16} />
           <span className="text-label-md text-primary">Redirecting to Secure Login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Tag */}
      <div className="mb-6 bg-surface-container-low border border-outline-variant/30 rounded-full px-4 py-1.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-secondary"></div>
        <span className="text-label-caps text-primary tracking-widest font-bold">
          LEGAL HACKATHON PROJECT | BLOCKCHAIN EVIDENCE LAYER
        </span>
      </div>

      {/* Main Register Card */}
      <form onSubmit={handleRegister} className="bg-white rounded-[16px] shadow-xl border border-outline-variant/20 w-full p-8 relative overflow-hidden">
        
        {/* Shield Icon & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-surface-container w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <UserPlus className="text-primary" size={24} />
          </div>
          <h2 className="text-headline-lg text-primary font-bold">Register Identity</h2>
          <p className="text-body-sm text-outline mt-1">Enroll your hardware token or statutory ID</p>
        </div>

        {/* Role Selector */}
        <div className="bg-surface-container-low rounded-[10px] p-1 flex mb-6">
          <button
            type="button"
            onClick={() => setRole("Officer")}
            className={`flex-1 py-2 text-label-md rounded-md flex items-center justify-center gap-2 transition-all ${
              role === "Officer" ? "bg-white shadow-sm text-primary font-bold" : "text-outline-variant hover:text-primary"
            }`}
          >
            {role === "Officer" && <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>}
            Officer
          </button>
          <button
            type="button"
            onClick={() => setRole("Analyst")}
            className={`flex-1 py-2 text-label-md rounded-md flex items-center justify-center gap-2 transition-all ${
              role === "Analyst" ? "bg-white shadow-sm text-primary font-bold" : "text-outline-variant hover:text-primary"
            }`}
          >
            {role === "Analyst" && <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>}
            Analyst
          </button>
          <button
            type="button"
            onClick={() => setRole("Judge")}
            className={`flex-1 py-2 text-label-md rounded-md flex items-center justify-center gap-2 transition-all ${
              role === "Judge" ? "bg-white shadow-sm text-primary font-bold" : "text-outline-variant hover:text-primary"
            }`}
          >
            {role === "Judge" && <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>}
            Judge
          </button>
        </div>

        {error && <div className="mb-4 text-error text-body-sm font-bold bg-error-container p-3 rounded-lg">{error}</div>}

        {/* Form Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-label-md text-primary mb-1.5">
              Full Name (Official Record)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-outline-variant" size={18} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Insp. Vikram Rathore"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md text-primary mb-1.5">
              {role} ID / Service ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IdCard className="text-outline-variant" size={18} />
              </div>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder={role === "Officer" ? "DL-POL-2026-XXXX" : role === "Analyst" ? "DEL-FSL-XX" : "DL-CT-NXXX"}
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant/50 rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-label-md text-primary">New Security Passcode / Token PIN</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="text-outline-variant" size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="block w-full pl-10 pr-10 py-3 border border-outline-variant/50 rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-secondary/30 focus:border-primary text-body-md text-primary transition-all font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className="bg-[#F8FAFC] rounded-lg p-4 border border-outline-variant/30 flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            required
            className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            id="ack"
          />
          <label htmlFor="ack" className="text-body-sm text-on-surface-variant leading-relaxed">
            I confirm these details are accurate and acknowledge that fake statutory registrations are punishable under the Information Technology Act.
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-[#101B31] text-white rounded-lg py-3.5 flex items-center justify-center gap-2 text-label-md font-bold transition-all shadow-md mb-6 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Identity"}
          {!loading && <span className="text-lg leading-none">→</span>}
        </button>

        <div className="text-center mt-4">
           <Link href="/login" className="text-label-md text-secondary hover:underline">
             Already have a statutory ID? Sign in here.
           </Link>
        </div>

      </form>
    </div>
  );
}
