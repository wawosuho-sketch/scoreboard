import { supabase } from "@/lib/supabase";
import MatchesClient from "./MatchesClient";

export const revalidate = 30; // 30초마다 캐시 갱신

export default async function MatchesPage() {
  const [matchesResult, teamsResult, divisionsResult, groupsResult] = await Promise.all([
    supabase.from("matches").select("*").order("match_date", { ascending: true }).order("start_time", { ascending: true }),
    supabase.from("teams").select("*"),
    supabase.from("divisions").select("*"),
    supabase.from("groups").select("*")
  ]);

  return (
    <MatchesClient 
      matches={matchesResult.data || []}
      teams={teamsResult.data || []}
      divisions={divisionsResult.data || []}
      groups={groupsResult.data || []}
    />
  );
}
