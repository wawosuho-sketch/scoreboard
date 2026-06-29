import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboardPage() {
  let admin;
  try {
    admin = await requireAdmin(["SUPER_ADMIN", "SCORE_MANAGER", "BRACKET_MANAGER", "VIEW_ONLY"]);
  } catch (error) {
    // 세션이 없거나 유효하지 않으면 로그인 페이지로 강제 리다이렉트
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-brand-bg-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 rounded-2xl border border-brand-border-glass">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-brand-neon-blue" />
              <div>
                <h1 className="text-2xl font-bold">관리자 대시보드</h1>
                <p className="text-brand-text-secondary text-sm mt-1">환영합니다, {admin.name}님 (권한: {admin.role})</p>
              </div>
            </div>
            <LogoutButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/matches" className="p-6 bg-white/5 rounded-xl border border-white/5 hover:border-brand-neon-blue/50 transition-colors cursor-pointer block">
              <h3 className="text-lg font-bold text-brand-neon-blue mb-2">경기 결과 입력</h3>
              <p className="text-sm text-brand-text-secondary">각 조별 경기 점수를 기입하고 몰수패를 처리합니다.</p>
            </Link>
            <Link href="/admin/overrides" className="p-6 bg-white/5 rounded-xl border border-white/5 hover:border-brand-volt-yellow/50 transition-colors cursor-pointer block">
              <h3 className="text-lg font-bold text-brand-volt-yellow mb-2">순위 수동 조정</h3>
              <p className="text-sm text-brand-text-secondary">동률 추첨 결과에 따른 수동 순위를 오버라이드합니다.</p>
            </Link>
            <Link href="/admin/bracket" className="p-6 bg-white/5 rounded-xl border border-white/5 hover:border-brand-neon-pink/50 transition-colors cursor-pointer block">
              <h3 className="text-lg font-bold text-brand-neon-pink mb-2">결선 대진표 관리</h3>
              <p className="text-sm text-brand-text-secondary">4강/8강 브라켓을 구성하고 진출팀을 배정합니다.</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
