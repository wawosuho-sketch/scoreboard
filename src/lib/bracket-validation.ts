import { Database } from "@/types/database.types";
import { QualifiedTeam } from "./qualifiers";

type BracketSlot = Database["public"]["Tables"]["bracket_slots"]["Row"];

export function validateBracketAssignment({
  slot,
  selectedTeamId,
  selectedTeamStats,
  allSlotsInDivision,
  opponentSlot,
  opponentTeamStats,
  competitionType,
  isSuperAdmin,
}: {
  slot: BracketSlot;
  selectedTeamId: string;
  selectedTeamStats: QualifiedTeam | undefined;
  allSlotsInDivision: BracketSlot[];
  opponentSlot: BracketSlot | null;
  opponentTeamStats: QualifiedTeam | null;
  competitionType: string;
  isSuperAdmin: boolean;
}) {
  // 1. 잠긴 브라켓 수정 권한 검증
  if (slot.is_locked && !isSuperAdmin) {
    throw new Error("This bracket slot is locked. Only SUPER_ADMIN can modify it.");
  }

  // 2. 진출 확정 여부 검증
  if (!selectedTeamStats || selectedTeamStats.status !== "QUALIFIED") {
    throw new Error("Only QUALIFIED teams can be assigned to the bracket.");
  }

  // 3. 중복 배정 검증
  const isAlreadyAssigned = allSlotsInDivision.some(
    (s) => s.id !== slot.id && s.team_id === selectedTeamId
  );
  if (isAlreadyAssigned) {
    throw new Error("This team is already assigned to another slot in the bracket.");
  }

  // 4. 첫 라운드에서 조 1위끼리 대결 금지 검증
  const isFirstRound =
    (competitionType === "GROUP_KNOCKOUT_8" && slot.stage === "QUARTER_FINAL") ||
    (competitionType === "GROUP_KNOCKOUT_4" && slot.stage === "SEMI_FINAL");

  if (isFirstRound && opponentSlot && opponentTeamStats) {
    if (selectedTeamStats.rankInGroup === 1 && opponentTeamStats.rankInGroup === 1) {
      throw new Error("조 1위 팀끼리는 결선 첫 라운드에서 맞붙을 수 없습니다.");
    }
  }
}
