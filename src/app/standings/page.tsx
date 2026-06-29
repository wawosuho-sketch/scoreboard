import { supabase } from "@/lib/supabase";
import StandingsClient from "./StandingsClient";
import { AlertTriangle } from "lucide-react";

export const revalidate = 60; // 1분 단위 자동 갱신/캐시 갱신

export default async function StandingsPage() {
  const [teamsResult, matchesResult, overridesResult, divisionsResult, groupsResult] = await Promise.all([
    supabase.from("teams").select("*"),
    supabase.from("matches").select("*").in("status", ["COMPLETED", "FORFEIT_COMPLETED"]),
    supabase.from("standings_override").select("*"),
    supabase.from("divisions").select("*"),
    supabase.from("groups").select("*")
  ]);

  if (teamsResult.error || matchesResult.error || overridesResult.error || divisionsResult.error || groupsResult.error) {
    console.error({
      teamsError: teamsResult.error,
      matchesError: matchesResult.error,
      overridesError: overridesResult.error,
    });

    return (
      <div className="min-h-screen bg-brand-paper-cream halftone-bg flex flex-col items-center justify-center p-4 text-center">
        <div className="comic-panel-orange p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-brand-victory-red mx-auto mb-4" />
          <h2 className="text-xl font-black text-brand-ink-black mb-2">데이터 로드 실패</h2>
          <p className="text-brand-ink-black/60 text-sm font-bold">
            순위 데이터를 불러오는 중 문제가 발생했습니다.<br />잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StandingsClient 
      teams={teamsResult.data || []} 
      matches={matchesResult.data || []} 
      overrides={overridesResult.data || []}
      divisions={divisionsResult.data || []}
      groups={groupsResult.data || []}
    />
  );
}
