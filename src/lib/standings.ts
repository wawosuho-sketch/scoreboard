import type { Database } from "@/types/database.types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

export interface TeamStats {
  team_id: string;
  division_id: string;
  group_id: string | null;
  school_name: string;
  team_name: string | null;
  games: number;
  wins: number;
  losses: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  manual_rank: number | null;
  needs_lottery?: boolean;
}

export interface StandingOverride {
  team_id: string;
  manual_rank: number;
}

function hasManualRank(team: TeamStats): boolean {
  return team.manual_rank !== null && team.manual_rank !== undefined;
}

function getMatchWinnerTeamId(match: Match): string | null {
  if (match.winner_team_id) {
    return match.winner_team_id;
  }
  if (
    match.home_team_id &&
    match.away_team_id &&
    match.home_score !== null &&
    match.away_score !== null
  ) {
    if (match.home_score > match.away_score) return match.home_team_id;
    if (match.away_score > match.home_score) return match.away_team_id;
  }
  return null;
}

function compareAutomaticStanding(
  a: TeamStats,
  b: TeamStats,
  samePointGroup: TeamStats[],
  completedMatches: Match[]
): number {
  // 1순위: 승점
  if (b.points !== a.points) return b.points - a.points;

  // 2순위: 조건부 승자승 (동일 승점 그룹이 정확히 2팀일 때만 적용)
  if (samePointGroup.length === 2) {
    const headToHead = completedMatches.find(
      (m) =>
        (m.home_team_id === a.team_id && m.away_team_id === b.team_id) ||
        (m.home_team_id === b.team_id && m.away_team_id === a.team_id)
    );

    const winnerTeamId = headToHead ? getMatchWinnerTeamId(headToHead) : null;

    if (winnerTeamId === a.team_id) return -1;
    if (winnerTeamId === b.team_id) return 1;
  }

  // 3순위: 득실차
  if (b.pointDiff !== a.pointDiff) {
    return b.pointDiff - a.pointDiff;
  }

  // 4순위: 다득점
  if (b.pointsFor !== a.pointsFor) {
    return b.pointsFor - a.pointsFor;
  }

  // 5순위: 추첨 필요
  return 0;
}

function markLotteryNeeded(teams: TeamStats[], completedMatches: Match[], isGroupFinished: boolean): TeamStats[] {
  const result = [...teams];
  
  if (!isGroupFinished) return result; // 리그전 미종료 시 추첨 대기 표시 안 함

  for (let i = 0; i < result.length - 1; i += 1) {
    const current = result[i];
    const next = result[i + 1];

    if (hasManualRank(current) || hasManualRank(next)) continue;

    // Check if they have exact same points, diff, and for.
    const isPerfectTie =
      current.points === next.points &&
      current.pointDiff === next.pointDiff &&
      current.pointsFor === next.pointsFor;

    if (!isPerfectTie) continue;

    const samePointGroup = result.filter((t) => t.points === current.points);
    const cmp = compareAutomaticStanding(current, next, samePointGroup, completedMatches);

    // cmp === 0 means head-to-head also didn't resolve it (or didn't apply).
    if (cmp === 0) {
      current.needs_lottery = true;
      next.needs_lottery = true;
    }
  }
  return result;
}

function applyManualRanks(automaticTeams: TeamStats[]): TeamStats[] {
  const total = automaticTeams.length;
  const result: Array<TeamStats | null> = Array(total).fill(null);

  const manualTeams = automaticTeams
    .filter(hasManualRank)
    .sort((a, b) => a.manual_rank! - b.manual_rank!);

  const autoTeams = automaticTeams.filter((team) => !hasManualRank(team));

  for (const team of manualTeams) {
    if (team.manual_rank! < 1 || team.manual_rank! > total) {
      throw new Error(`Invalid manual_rank: ${team.manual_rank}`);
    }
    const index = team.manual_rank! - 1;
    if (result[index] !== null) {
      throw new Error(`Duplicate manual_rank detected: ${team.manual_rank}`);
    }
    result[index] = team;
  }

  let autoIndex = 0;
  for (let i = 0; i < result.length; i += 1) {
    if (result[i] === null) {
      result[i] = autoTeams[autoIndex];
      autoIndex += 1;
    }
  }

  return result.filter((team): team is TeamStats => team !== null);
}

export function calculateStandings(
  matches: Match[],
  teams: Team[],
  overrides: StandingOverride[] = []
): TeamStats[] {
  const overrideMap = new Map(
    overrides.map((override) => [override.team_id, override.manual_rank])
  );

  const statsMap = new Map<string, TeamStats>();

  for (const team of teams) {
    statsMap.set(team.id, {
      team_id: team.id,
      division_id: team.division_id,
      group_id: team.group_id,
      school_name: team.school_name,
      team_name: team.team_name,
      games: 0,
      wins: 0,
      losses: 0,
      points: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      manual_rank: overrideMap.get(team.id) ?? null,
      needs_lottery: false,
    });
  }

  const completedMatches = matches.filter(
    (match) =>
      match.status === "COMPLETED" || match.status === "FORFEIT_COMPLETED"
  );

  for (const match of completedMatches) {
    if (!match.home_team_id || !match.away_team_id) continue;
    if (match.home_score === null || match.away_score === null) continue;
    if (match.home_score === match.away_score) continue; // 무승부 배제

    const home = statsMap.get(match.home_team_id);
    const away = statsMap.get(match.away_team_id);

    if (!home || !away) continue;

    home.games += 1;
    away.games += 1;
    home.pointsFor += match.home_score;
    home.pointsAgainst += match.away_score;
    away.pointsFor += match.away_score;
    away.pointsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
      away.points += 1;
    } else {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
      home.points += 1;
    }
  }

  const teamsWithDiff = Array.from(statsMap.values()).map((team) => ({
    ...team,
    pointDiff: team.pointsFor - team.pointsAgainst,
  }));

  const pointGroups = new Map<number, TeamStats[]>();
  for (const team of teamsWithDiff) {
    if (!pointGroups.has(team.points)) pointGroups.set(team.points, []);
    pointGroups.get(team.points)!.push(team);
  }

  const isGroupFinished = matches.length > 0 && matches.every(
    (m) => m.status === "COMPLETED" || m.status === "FORFEIT_COMPLETED"
  );

  const automaticSorted = Array.from(pointGroups.entries())
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, group]) => {
      const sortedGroup = [...group].sort((a, b) =>
        compareAutomaticStanding(a, b, group, completedMatches)
      );
      return markLotteryNeeded(sortedGroup, completedMatches, isGroupFinished);
    });

  return applyManualRanks(automaticSorted);
}
