import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateStandings } from "@/lib/standings";
import { determineQualifiers, QualifiedTeam } from "@/lib/qualifiers";
import { validateBracketAssignment } from "@/lib/bracket-validation";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN", "BRACKET_MANAGER"]);
    const isSuperAdmin = admin.role === "SUPER_ADMIN";
    
    const { slot_id, team_id, reason } = await request.json();

    if (!slot_id) {
      return NextResponse.json({ error: "Missing slot_id" }, { status: 400 });
    }

    const isClearing = !team_id;

    // 1. 슬롯 조회 및 관련된 Division 조회
    const { data: slot, error: slotError } = await supabaseAdmin
      .from("bracket_slots")
      .select("*, divisions(competition_type)")
      .eq("id", slot_id)
      .single() as any;

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.is_locked && !isSuperAdmin) {
      return NextResponse.json({ error: "Slot is locked. SUPER_ADMIN required." }, { status: 403 });
    }
    if (slot.is_locked && !reason) {
      return NextResponse.json({ error: "Reason required to modify a locked slot." }, { status: 400 });
    }

    const divisionId = slot.division_id;
    const competitionType = (slot.divisions as any).competition_type;

    // 2. 전체 데이터(Division내) 조회 (팀, 경기, 오버라이드, 모든 슬롯)
    const [
      { data: allSlots },
      { data: teams },
      { data: matches },
      { data: overrides }
    ] = await Promise.all([
      supabaseAdmin.from("bracket_slots").select("*").eq("division_id", divisionId),
      supabaseAdmin.from("teams").select("*").eq("division_id", divisionId),
      supabaseAdmin.from("matches").select("*").eq("division_id", divisionId).in("status", ["COMPLETED", "FORFEIT_COMPLETED"]),
      supabaseAdmin.from("standings_override").select("*").eq("division_id", divisionId)
    ]);

    if (!allSlots || !teams || !matches || !overrides) {
      return NextResponse.json({ error: "Failed to fetch division data" }, { status: 500 });
    }

    if (!isClearing) {
      // 3. 진출팀 계산
      const standings = calculateStandings(matches, teams, overrides);
      
      // 그룹별 묶기
      const standingsByGroup: Record<string, any[]> = {};
      for (const st of standings) {
        const g = st.group_id || "ALL";
        if (!standingsByGroup[g]) standingsByGroup[g] = [];
        standingsByGroup[g].push(st);
      }

      const qualifiers = determineQualifiers(standingsByGroup, 2);
      
      const selectedTeamStats = qualifiers.find((q) => q.team_id === team_id);
      if (!selectedTeamStats) {
        return NextResponse.json({ error: "해당 팀은 결선 진출 확정팀이 아닙니다." }, { status: 400 });
      }

      // 4. 상대 슬롯 정보 찾기
      const opponentSlot = (allSlots as any[]).find(
        (s) => s.match_id === slot.match_id && s.id !== slot.id
      ) || null;

      let opponentTeamStats: QualifiedTeam | null = null;
      if (opponentSlot && opponentSlot.team_id) {
        opponentTeamStats = qualifiers.find((q) => q.team_id === opponentSlot.team_id) || null;
      }

      // 5. 검증 가드레일 실행 (미진출/중복/1위끼리 매칭 방지 등)
      try {
        validateBracketAssignment({
          slot,
          selectedTeamId: team_id,
          selectedTeamStats,
          allSlotsInDivision: allSlots,
          opponentSlot,
          opponentTeamStats,
          competitionType,
          isSuperAdmin
        });
      } catch (validationError: any) {
        return NextResponse.json({ error: validationError.message }, { status: 400 });
      }
    }

    // 6. 배정 업데이트
    const updatePayload: any = { team_id: team_id || null };
    const { data: updatedSlot, error: updateError } = await (supabaseAdmin
      .from("bracket_slots") as any)
      .update(updatePayload)
      .eq("id", slot_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 7. 감사 로그 작성
    const auditPayload: any = {
      actor_name: admin.name,
      actor_role: admin.role,
      action: "ASSIGN_BRACKET",
      target_type: "BRACKET_SLOT",
      target_id: slot_id,
      before_data: slot,
      after_data: updatedSlot,
      reason: reason || "Bracket assignment",
    };
    await (supabaseAdmin.from("audit_logs") as any).insert(auditPayload);

    return NextResponse.json({ success: true, slot: updatedSlot });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
