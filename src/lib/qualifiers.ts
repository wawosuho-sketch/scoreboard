import { TeamStats } from "./standings";

export type QualificationStatus = "QUALIFIED" | "ELIMINATED" | "PENDING_LOTTERY";

export interface QualifiedTeam extends TeamStats {
  status: QualificationStatus;
  originalGroup: string | null;
  rankInGroup: number;
}

/**
 * 조별 또는 전체 순위 배열(이미 정렬된 상태)을 받아 결선 진출팀과 상태를 계산합니다.
 * @param standingsByGroup 조별(또는 단일 그룹)로 묶인 순위 데이터 (키: 그룹명 또는 'ALL')
 * @param advanceCount 각 조(또는 전체)에서 진출하는 팀 수 (기본 2팀)
 */
export function determineQualifiers(
  standingsByGroup: Record<string, TeamStats[]>,
  advanceCount: number = 2
): QualifiedTeam[] {
  const qualifiers: QualifiedTeam[] = [];

  for (const [groupId, standings] of Object.entries(standingsByGroup)) {
    // standings는 calculateStandings에 의해 1위부터 꼴찌까지 정렬된 상태라고 가정합니다.
    
    for (let i = 0; i < standings.length; i++) {
      const team = standings[i];
      const rank = i + 1;
      let status: QualificationStatus = "ELIMINATED";

      // 진출권 내에 있는 팀
      if (rank <= advanceCount) {
        if (team.needs_lottery) {
          // 동률 추첨 대기 상태라면 진출 확정 보류
          status = "PENDING_LOTTERY";
        } else {
          status = "QUALIFIED";
        }
      } 
      // 진출권 밖이지만, 진출 커트라인 팀과 완전 동률이라 추첨 대기 중인 경우
      else if (rank === advanceCount + 1 && team.needs_lottery) {
        status = "PENDING_LOTTERY";
      }

      // 진출 가능성이 없는 ELIMINATED 팀은 제외하고 반환 목록에 넣습니다.
      if (status !== "ELIMINATED") {
        qualifiers.push({
          ...team,
          status,
          originalGroup: groupId === "ALL" ? null : groupId,
          rankInGroup: rank,
        });
      }
    }
  }

  return qualifiers;
}
