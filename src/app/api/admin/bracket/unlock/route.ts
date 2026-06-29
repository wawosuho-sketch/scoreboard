import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN"]);
    
    const { division_id, reason } = await request.json();

    if (!division_id || !reason) {
      return NextResponse.json({ error: "division_id and reason are required" }, { status: 400 });
    }

    // 1. 해당 종별의 모든 슬롯 잠금 해제
    const updatePayload: any = { is_locked: false };
    const { error: updateError } = await (supabaseAdmin
      .from("bracket_slots") as any)
      .update(updatePayload)
      .eq("division_id", division_id);

    if (updateError) throw updateError;

    // 2. 감사 로그 작성
    const auditPayload: any = {
      actor_name: admin.name,
      actor_role: admin.role,
      action: "UNLOCK_BRACKET",
      target_type: "DIVISION",
      target_id: division_id,
      reason,
    };
    await (supabaseAdmin.from("audit_logs") as any).insert(auditPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
