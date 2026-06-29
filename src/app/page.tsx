import { supabaseAdmin } from "@/lib/supabase-admin";
import HomeClient from "./HomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const [
    { data: divisions },
    { data: allMatches },
    { data: teams }
  ] = await Promise.all([
    supabaseAdmin.from("divisions").select("*").order("display_order"),
    supabaseAdmin.from("matches").select("*").order("match_date").order("start_time"),
    supabaseAdmin.from("teams").select("*")
  ]);

  return (
    <HomeClient 
      divisions={divisions || []}
      allMatches={allMatches || []}
      teams={teams || []}
    />
  );
}
