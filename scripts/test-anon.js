const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const [teamsResult, matchesResult, overridesResult] = await Promise.all([
    supabase.from("teams").select("*"),
    supabase.from("matches").select("*").in("status", ["COMPLETED", "FORFEIT_COMPLETED"]),
    supabase.from("standings_override").select("*")
  ]);

  console.log("Teams Data Length:", teamsResult.data ? teamsResult.data.length : 0);
  console.log("Matches Data Length:", matchesResult.data ? matchesResult.data.length : 0);
  console.log("Overrides Data Length:", overridesResult.data ? overridesResult.data.length : 0);
}

test();
