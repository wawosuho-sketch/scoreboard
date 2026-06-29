import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AdminBracketClient from "./AdminBracketClient";

export const dynamic = "force-dynamic";

export default async function AdminBracketPage() {
  let admin;
  try {
    admin = await requireAdmin(["SUPER_ADMIN", "BRACKET_MANAGER"]);
  } catch (error) {
    redirect("/admin/login");
  }

  const [
    { data: divisions },
    { data: slots },
    { data: teams },
    { data: matches },
    { data: overrides },
    { data: groups }
  ] = await Promise.all([
    supabaseAdmin.from("divisions").select("*").order("display_order"),
    supabaseAdmin.from("bracket_slots").select("*"),
    supabaseAdmin.from("teams").select("*"),
    supabaseAdmin.from("matches").select("*").in("status", ["COMPLETED", "FORFEIT_COMPLETED"]),
    supabaseAdmin.from("standings_override").select("*"),
    supabaseAdmin.from("groups").select("*")
  ]);

  if (!divisions || !slots || !teams || !matches || !overrides || !groups) {
    return <div className="text-white p-8">데이터 로드 실패</div>;
  }

  return (
    <AdminBracketClient 
      divisions={divisions}
      slots={slots}
      teams={teams}
      matches={matches}
      overrides={overrides}
      groups={groups}
      isAdminSuper={admin.role === "SUPER_ADMIN"}
    />
  );
}
