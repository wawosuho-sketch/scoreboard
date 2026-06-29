"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-paper-cream flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="comic-panel p-8 w-full max-w-md bg-white border-4 border-brand-ink-black shadow-[8px_8px_0_#111111] relative overflow-hidden"
      >
        <div className="absolute inset-0 speed-line-bg opacity-10 pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-brand-comic-yellow flex items-center justify-center mb-4 border-2 border-brand-ink-black shadow-[4px_4px_0_#111111] rotate-3">
            <Lock className="w-8 h-8 text-brand-ink-black" />
          </div>
          <h1 className="text-3xl font-black text-brand-ink-black score-font italic uppercase tracking-tighter">
            ADMIN LOGIN
          </h1>
          <p className="text-brand-ink-black/70 font-bold text-sm mt-2">대회 운영진 전용 페이지</p>
        </div>

        {error && (
          <div className="bg-brand-victory-red border-2 border-brand-ink-black p-3 mb-6 flex items-center gap-2 text-white font-bold text-sm shadow-[4px_4px_0_#111111] -rotate-1">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-black text-brand-ink-black mb-2 uppercase tracking-widest">
              PIN CODE
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-white border-4 border-brand-ink-black px-4 py-3 text-brand-ink-black font-black text-xl tracking-[0.5em] text-center focus:outline-none focus:ring-4 focus:ring-brand-court-orange transition-all placeholder:text-brand-ink-black/20 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
              placeholder="핀 번호 입력"
              maxLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full comic-stamp bg-brand-court-orange text-white text-xl py-4 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:-rotate-1"
          >
            {loading ? "인증 중..." : "로그인"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
