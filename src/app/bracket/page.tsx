import BracketClient from "./BracketClient";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 30;

export default async function BracketPage() {
  const [
    { data: divisions },
    { data: matches },
    { data: teams },
    { data: slots }
  ] = await Promise.all([
    supabaseAdmin.from("divisions").select("*").order("display_order"),
    supabaseAdmin.from("matches").select("*").in("stage", ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"]).order("match_no"),
    supabaseAdmin.from("teams").select("*"),
    supabaseAdmin.from("bracket_slots").select("*")
  ]);

  if (!divisions || !matches || !teams || !slots) {
    return <div className="text-white p-8">데이터 로드 실패</div>;
  }

  return (
    <BracketClient 
      divisions={divisions}
      matches={matches}
      teams={teams}
      slots={slots}
    />
  );
}
