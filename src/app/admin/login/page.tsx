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
    <main className="min-h-screen bg-brand-bg-dark flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-2xl w-full max-w-md border border-brand-border-glass relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon-blue/20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
            <Lock className="w-8 h-8 text-brand-neon-blue" />
          </div>
          <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
          <p className="text-brand-text-secondary text-sm mt-2">대회 운영진 전용 페이지입니다.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6 flex items-center gap-2 text-red-400 text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              관리자 PIN 코드
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-neon-blue transition-all"
              placeholder="PIN 번호를 입력하세요"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-neon-blue text-black font-bold py-3 rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "인증 중..." : "로그인"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
