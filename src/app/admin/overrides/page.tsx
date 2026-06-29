import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AdminOverridesClient from "./AdminOverridesClient";

export const dynamic = "force-dynamic";

export default async function AdminOverridesPage() {
  try {
    await requireAdmin(["SUPER_ADMIN", "SCORE_MANAGER"]);
  } catch (error) {
    redirect("/admin/login");
  }

  const [
    { data: divisions },
    { data: groups },
    { data: teams },
    { data: overrides }
  ] = await Promise.all([
    supabaseAdmin.from("divisions").select("*").order("display_order"),
    supabaseAdmin.from("groups").select("*").order("display_order"),
    supabaseAdmin.from("teams").select("*"),
    supabaseAdmin.from("standings_override").select("*")
  ]);

  if (!divisions || !groups || !teams) {
    return <div className="text-white p-8">데이터 로드 실패</div>;
  }

  return (
    <AdminOverridesClient 
      divisions={divisions}
      groups={groups}
      teams={teams}
      initialOverrides={overrides || []}
    />
  );
}
