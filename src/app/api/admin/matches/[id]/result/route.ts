import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= 200;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 관리자 세션 권한 검증 (SCORE_MANAGER, SUPER_ADMIN)
    let admin;
    try {
      admin = await requireAdmin(["SCORE_MANAGER", "SUPER_ADMIN"]);
    } catch (authError: any) {
      if (authError.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const resolvedParams = await params;
    const matchId = resolvedParams.id;
    const body = await request.json();
    const {
      home_score,
      away_score,
      is_forfeit,
      forfeit_loser_team_id,
      reason,
      is_reset,
    } = body;

    // 2. 경기 정보 확인
    const { data: match, error: matchError } = await (supabaseAdmin
      .from("matches") as any)
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (!match.home_team_id || !match.away_team_id) {
      return NextResponse.json({ error: "Teams not assigned" }, { status: 400 });
    }

    const isEditingCompletedMatch =
      match.status === "COMPLETED" || match.status === "FORFEIT_COMPLETED";

    if (isEditingCompletedMatch && !reason) {
      return NextResponse.json(
        { error: "Reason is required when editing or resetting a completed match" },
        { status: 400 }
      );
    }

    let updatePayload: any = {};

    if (is_reset) {
      updatePayload = {
        home_score: null,
        away_score: null,
        winner_team_id: null,
        loser_team_id: null,
        is_forfeit: false,
        forfeit_loser_team_id: null,
        status: "SCHEDULED",
        result_confirmed_at: null,
      };
    } else {
      let finalHomeScore = home_score;
      let finalAwayScore = away_score;
      let winnerId = null;
      let loserId = null;
      let status = is_forfeit ? "FORFEIT_COMPLETED" : "COMPLETED";

      // 3. 점수 및 몰수패 로직 검증
      if (is_forfeit) {
        if (!forfeit_loser_team_id) {
          return NextResponse.json({ error: "Forfeit loser required" }, { status: 400 });
        }
        
        if (forfeit_loser_team_id === match.home_team_id) {
          finalHomeScore = 0;
          finalAwayScore = 20;
          winnerId = match.away_team_id;
          loserId = match.home_team_id;
        } else if (forfeit_loser_team_id === match.away_team_id) {
          finalHomeScore = 20;
          finalAwayScore = 0;
          winnerId = match.home_team_id;
          loserId = match.away_team_id;
        } else {
          return NextResponse.json({ error: "Invalid forfeit loser team" }, { status: 400 });
        }
      } else {
        if (!isValidScore(finalHomeScore) || !isValidScore(finalAwayScore)) {
          return NextResponse.json(
            { error: "Scores must be non-negative integers between 0 and 200" },
            { status: 400 }
          );
        }

        if (finalHomeScore === finalAwayScore) {
          return NextResponse.json({ error: "Matches cannot end in a draw" }, { status: 400 });
        }

        if (finalHomeScore > finalAwayScore) {
          winnerId = match.home_team_id;
          loserId = match.away_team_id;
        } else {
          winnerId = match.away_team_id;
          loserId = match.home_team_id;
        }
      }

      updatePayload = {
        home_score: finalHomeScore,
        away_score: finalAwayScore,
        winner_team_id: winnerId,
        loser_team_id: loserId,
        is_forfeit,
        forfeit_loser_team_id: is_forfeit ? forfeit_loser_team_id : null,
        status,
        result_confirmed_at: new Date().toISOString(),
      };
    }

    // 4. 경기 결과 업데이트
    const { data: updatedMatch, error: updateError } = await (supabaseAdmin
      .from("matches") as any)
      .update(updatePayload)
      .eq("id", matchId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. 감사 로그 작성
    const auditPayload: any = {
      actor_name: admin.name,
      actor_role: admin.role,
      action: is_reset ? "RESET_MATCH_RESULT" : (isEditingCompletedMatch ? "EDIT_MATCH_RESULT" : "UPDATE_MATCH_RESULT"),
      target_type: "MATCH",
      target_id: matchId,
      before_data: match,
      after_data: updatedMatch,
      reason: reason || (is_reset ? "Match result reset" : (is_forfeit ? "Forfeit score update" : "Regular score input")),
    };
    await (supabaseAdmin.from("audit_logs") as any).insert(auditPayload);

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
