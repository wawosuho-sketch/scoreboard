import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AdminMatchesClient from "./AdminMatchesClient";

// 이 페이지는 항상 최신 데이터를 불러와야 하므로 캐시를 끕니다.
export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  try {
    // 권한 검증
    await requireAdmin(["SUPER_ADMIN", "SCORE_MANAGER"]);
  } catch (error) {
    redirect("/admin/login");
  }

  const [matchesResult, teamsResult, divisionsResult, groupsResult] = await Promise.all([
    supabaseAdmin.from("matches").select("*").order("match_date", { ascending: true }).order("start_time", { ascending: true }),
    supabaseAdmin.from("teams").select("*"),
    supabaseAdmin.from("divisions").select("*"),
    supabaseAdmin.from("groups").select("*")
  ]);

  if (matchesResult.error || teamsResult.error || divisionsResult.error || groupsResult.error) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center text-white">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  return <AdminMatchesClient 
    matches={matchesResult.data} 
    teams={teamsResult.data} 
    divisions={divisionsResult.data}
    groups={groupsResult.data}
  />;
}
