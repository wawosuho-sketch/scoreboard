"use client";

import { useState, useMemo } from "react";
import { Database } from "@/types/database.types";
import { calculateStandings } from "@/lib/standings";
import { determineQualifiers, QualifiedTeam } from "@/lib/qualifiers";
import { ChevronLeft, Lock, Unlock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Division = Database["public"]["Tables"]["divisions"]["Row"];
type BracketSlot = Database["public"]["Tables"]["bracket_slots"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];
type Override = Database["public"]["Tables"]["standings_override"]["Row"];
type Group = Database["public"]["Tables"]["groups"]["Row"];

interface Props {
  divisions: Division[];
  slots: BracketSlot[];
  teams: Team[];
  matches: Match[];
  overrides: Override[];
  groups: Group[];
  isAdminSuper: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  "FINAL": "결승전",
  "SEMI_FINAL": "4강전",
  "QUARTER_FINAL": "8강전",
  "ROUND_OF_16": "16강전"
};

export default function AdminBracketClient({ divisions, slots, teams, matches, overrides, groups, isAdminSuper }: Props) {
  const router = useRouter();
  const [activeDiv, setActiveDiv] = useState(divisions[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentDiv = divisions.find(d => d.id === activeDiv);
  const currentSlots = slots.filter(s => s.division_id === activeDiv);
  const isAllLocked = currentSlots.length > 0 && currentSlots.every(s => s.is_locked);

  const qualifiers = useMemo(() => {
    if (!activeDiv) return [];
    const divTeams = teams.filter(t => t.division_id === activeDiv);
    const divMatches = matches.filter(m => m.division_id === activeDiv);
    const divOverrides = overrides.filter(o => o.division_id === activeDiv);

    const standings = calculateStandings(divMatches, divTeams, divOverrides);
    const standingsByGroup: Record<string, any[]> = {};
    for (const st of standings) {
      const g = st.group_id || "ALL";
      if (!standingsByGroup[g]) standingsByGroup[g] = [];
      standingsByGroup[g].push(st);
    }
    return determineQualifiers(standingsByGroup, 2);
  }, [activeDiv, teams, matches, overrides]);

  const handleAssign = async (slotId: string, teamId: string) => {
    setError("");
    try {
      const res = await fetch("/api/admin/bracket/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: slotId, team_id: teamId || null, reason: "Manual UI Assignment" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLockToggle = async (lock: boolean) => {
    setError("");
    const reason = prompt(`이 대진표를 ${lock ? "잠금" : "해제"}하시겠습니까?\n사유를 입력해주세요.`);
    if (!reason && !lock) return;

    setLoading(true);
    try {
      const endpoint = lock ? "/api/admin/bracket/lock" : "/api/admin/bracket/unlock";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division_id: activeDiv, reason: reason || "Lock UI action" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle lock");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg-dark text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">대진표 관리 (Bracket Builder)</h1>
          </div>
          <div>
            {isAllLocked ? (
              <button onClick={() => handleLockToggle(false)} disabled={!isAdminSuper || loading} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-bold border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                <Lock className="w-4 h-4" /> 잠금 해제 (SUPER_ADMIN)
              </button>
            ) : (
              <button onClick={() => handleLockToggle(true)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-brand-neon-blue text-black rounded-lg font-bold hover:bg-cyan-400 disabled:opacity-50 transition-colors">
                <Unlock className="w-4 h-4" /> 대진표 잠금 확정
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto mb-8 hide-scrollbar pb-2">
          {divisions.map(d => (
            <button key={d.id} onClick={() => setActiveDiv(d.id)} className={`px-4 py-2 whitespace-nowrap rounded-lg font-bold transition-colors ${activeDiv === d.id ? "bg-white text-black" : "bg-white/5 text-brand-text-secondary hover:text-white"}`}>
              {d.name}
            </button>
          ))}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">{currentDiv?.name} 대진표 슬롯</h2>
          <div className="space-y-4 min-w-[700px]">
            {Object.entries(
              currentSlots.reduce((acc, slot) => {
                if (!acc[slot.match_id]) acc[slot.match_id] = { match_id: slot.match_id, stage: slot.stage, slots: [] };
                acc[slot.match_id].slots.push(slot);
                return acc;
              }, {} as Record<string, { match_id: string, stage: string, slots: BracketSlot[] }>)
            ).map(([matchId, matchGroup], idx) => {
              const homeSlot = matchGroup.slots.find(s => s.slot_position === "HOME");
              const awaySlot = matchGroup.slots.find(s => s.slot_position === "AWAY");
              
              return (
                <div key={matchId} className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <span className="text-brand-neon-blue font-bold text-lg">{STAGE_LABELS[matchGroup.stage] || matchGroup.stage}</span>
                    <span className="text-sm text-brand-text-secondary">제 {idx + 1}경기 (Match ID: {matchId.slice(0, 8)})</span>
                    <div className="flex-1 flex justify-end">
                      {homeSlot?.is_locked || awaySlot?.is_locked ? <Lock className="w-5 h-5 text-brand-text-secondary" /> : <Unlock className="w-5 h-5 text-brand-text-secondary opacity-30" />}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* HOME Slot */}
                    <div className="flex-1">
                      <label className="block text-xs text-brand-text-secondary mb-1">홈팀</label>
                      <select
                        value={homeSlot?.team_id || ""}
                        onChange={(e) => homeSlot && handleAssign(homeSlot.id, e.target.value)}
                        disabled={!homeSlot || (homeSlot.is_locked && !isAdminSuper)}
                        className="w-full bg-[#111] border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-brand-neon-blue disabled:opacity-50"
                      >
                        <option value="" className="text-black bg-white">-- 진출팀 선택 --</option>
                        {qualifiers.map(q => {
                          const isAssigned = currentSlots.some(s => s.id !== homeSlot?.id && s.team_id === q.team_id);
                          const isPending = q.status === "PENDING_LOTTERY";
                          
                          let isFirstRoundTopSeedCollision = false;
                          const isFirstRound =
                            (currentDiv?.competition_type === "GROUP_KNOCKOUT_8" && matchGroup.stage === "QUARTER_FINAL") ||
                            (currentDiv?.competition_type === "GROUP_KNOCKOUT_4" && matchGroup.stage === "SEMI_FINAL");
                            
                          if (isFirstRound && q.rankInGroup === 1 && awaySlot?.team_id) {
                            const opponentTeamStats = qualifiers.find(qt => qt.team_id === awaySlot.team_id);
                            if (opponentTeamStats?.rankInGroup === 1) isFirstRoundTopSeedCollision = true;
                          }

                          const isDisabled = isAssigned || isPending || isFirstRoundTopSeedCollision;
                          
                          let label = q.originalGroup 
                            ? `${groups.find(g => g.id === q.originalGroup)?.name} ${q.rankInGroup}위 - ${q.team_name || q.school_name}`
                            : `전체 ${q.rankInGroup}위 - ${q.team_name || q.school_name}`;
                            
                          if (isPending) label += " (추첨 대기 중)";
                          else if (isAssigned) label += " (타 경기 배정됨)";
                          else if (isFirstRoundTopSeedCollision) label += " (상대가 조 1위라 배정 불가)";

                          return (
                            <option key={q.team_id} value={q.team_id} disabled={isDisabled} className="text-black bg-white">
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex items-center justify-center text-brand-text-secondary px-2 pt-5">VS</div>

                    {/* AWAY Slot */}
                    <div className="flex-1">
                      <label className="block text-xs text-brand-text-secondary mb-1">어웨이팀</label>
                      <select
                        value={awaySlot?.team_id || ""}
                        onChange={(e) => awaySlot && handleAssign(awaySlot.id, e.target.value)}
                        disabled={!awaySlot || (awaySlot.is_locked && !isAdminSuper)}
                        className="w-full bg-[#111] border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-brand-neon-blue disabled:opacity-50"
                      >
                        <option value="" className="text-black bg-white">-- 진출팀 선택 --</option>
                        {qualifiers.map(q => {
                          const isAssigned = currentSlots.some(s => s.id !== awaySlot?.id && s.team_id === q.team_id);
                          const isPending = q.status === "PENDING_LOTTERY";
                          
                          let isFirstRoundTopSeedCollision = false;
                          const isFirstRound =
                            (currentDiv?.competition_type === "GROUP_KNOCKOUT_8" && matchGroup.stage === "QUARTER_FINAL") ||
                            (currentDiv?.competition_type === "GROUP_KNOCKOUT_4" && matchGroup.stage === "SEMI_FINAL");
                            
                          if (isFirstRound && q.rankInGroup === 1 && homeSlot?.team_id) {
                            const opponentTeamStats = qualifiers.find(qt => qt.team_id === homeSlot.team_id);
                            if (opponentTeamStats?.rankInGroup === 1) isFirstRoundTopSeedCollision = true;
                          }

                          const isDisabled = isAssigned || isPending || isFirstRoundTopSeedCollision;
                          const groupName = groups.find(g => g.id === q.originalGroup)?.name || "알수없는";
                          
                          let label = `${groupName}조 ${q.rankInGroup}위 - ${q.team_name || q.school_name}`;
                          if (isPending) label += " (추첨 대기 중)";
                          else if (isAssigned) label += " (타 경기 배정됨)";
                          else if (isFirstRoundTopSeedCollision) label += " (상대가 조 1위라 배정 불가)";

                          return (
                            <option key={q.team_id} value={q.team_id} disabled={isDisabled} className="text-black bg-white">
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
