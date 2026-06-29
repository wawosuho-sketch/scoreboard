import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN", "SCORE_MANAGER"]);
    const body = await req.json();
    const { division_id, group_id, team_id, manual_rank, reason } = body;

    if (!division_id || !group_id || !team_id || !manual_rank) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if an override already exists for this team
    const { data: existing } = await (supabaseAdmin
      .from("standings_override") as any)
      .select("id")
      .eq("team_id", team_id)
      .single();

    if (existing) {
      // Update
      const updatePayload: any = {
        manual_rank,
        reason,
        locked_by: admin.id
      };
      const { error: updateError } = await (supabaseAdmin
        .from("standings_override") as any)
        .update(updatePayload)
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert
      const insertPayload: any = {
        division_id,
        group_id,
        team_id,
        manual_rank,
        reason,
        locked_by: admin.id
      };
      const { error: insertError } = await (supabaseAdmin
        .from("standings_override") as any)
        .insert(insertPayload);

      if (insertError) throw insertError;
    }

    const auditPayload: any = {
      actor_name: admin.name,
      actor_role: admin.role,
      action: "SET_STANDINGS_OVERRIDE",
      target_type: "team",
      target_id: team_id,
      reason: reason || "수동 순위 지정",
      after_data: { manual_rank }
    };
    await (supabaseAdmin.from("audit_logs") as any).insert(auditPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Overrides Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN", "SCORE_MANAGER"]);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Fetch before delete to get team_id for audit
    const { data: override } = await (supabaseAdmin
      .from("standings_override") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (!override) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("standings_override")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    const deleteAuditPayload: any = {
      actor_name: admin.name,
      actor_role: admin.role,
      action: "DELETE_STANDINGS_OVERRIDE",
      target_type: "team",
      target_id: override.team_id,
      reason: "수동 순위 삭제",
      before_data: override
    };
    await (supabaseAdmin.from("audit_logs") as any).insert(deleteAuditPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
