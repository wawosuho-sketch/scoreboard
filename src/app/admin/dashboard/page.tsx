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
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="comic-panel p-8 bg-white border-4 border-brand-ink-black shadow-[8px_8px_0_#111111]">
          <div className="flex items-center justify-between mb-8 border-b-4 border-brand-ink-black pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-comic-yellow flex items-center justify-center border-2 border-brand-ink-black shadow-[4px_4px_0_#111111] -rotate-3">
                <ShieldCheck className="w-6 h-6 text-brand-ink-black" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic uppercase score-font tracking-tighter">관리자 대시보드</h1>
                <p className="text-brand-ink-black/70 font-bold text-sm mt-1">환영합니다, {admin.name}님 (권한: {admin.role})</p>
              </div>
            </div>
            <LogoutButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/matches" className="p-6 bg-brand-sky-blue/20 rounded-xl border-4 border-brand-ink-black shadow-[4px_4px_0_#111111] hover:-translate-y-1 hover:shadow-none transition-all block">
              <h3 className="text-2xl font-black text-brand-ink-black mb-2 score-font italic tracking-wide">경기 결과 입력</h3>
              <p className="text-sm font-bold text-brand-ink-black/70">각 조별 경기 점수를 기입하고 몰수패를 처리합니다.</p>
            </Link>
            <Link href="/admin/overrides" className="p-6 bg-brand-comic-yellow/40 rounded-xl border-4 border-brand-ink-black shadow-[4px_4px_0_#111111] hover:-translate-y-1 hover:shadow-none transition-all block">
              <h3 className="text-2xl font-black text-brand-ink-black mb-2 score-font italic tracking-wide">순위 수동 조정</h3>
              <p className="text-sm font-bold text-brand-ink-black/70">동률 추첨 결과에 따른 수동 순위를 오버라이드합니다.</p>
            </Link>
            <Link href="/admin/bracket" className="p-6 bg-brand-victory-red/20 rounded-xl border-4 border-brand-ink-black shadow-[4px_4px_0_#111111] hover:-translate-y-1 hover:shadow-none transition-all block">
              <h3 className="text-2xl font-black text-brand-ink-black mb-2 score-font italic tracking-wide">결선 대진표 관리</h3>
              <p className="text-sm font-bold text-brand-ink-black/70">4강/8강 브라켓을 구성하고 진출팀을 배정합니다.</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
