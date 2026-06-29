"use client";

import { useState, useMemo, useEffect } from "react";
import { Trophy, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { calculateStandings, TeamStats, StandingOverride } from "@/lib/standings";
import { Database } from "@/types/database.types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface Props {
  matches: Match[];
  teams: Team[];
  overrides: StandingOverride[];
  divisions: Database["public"]["Tables"]["divisions"]["Row"][];
  groups: Database["public"]["Tables"]["groups"]["Row"][];
}

export default function StandingsClient({ matches, teams, overrides, divisions, groups }: Props) {
  const [activeTab, setActiveTab] = useState("HIGH_MALE");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // 현재 종별의 조 목록
  const currentGroups = useMemo(() => {
    const divId = divisions.find(d => d.code === activeTab)?.id;
    return groups.filter(g => g.division_id === divId).sort((a, b) => a.code.localeCompare(b.code));
  }, [divisions, groups, activeTab]);

  // 종별이 바뀔 때 activeGroup 초기화
  useEffect(() => {
    if (currentGroups.length > 0 && (!activeGroup || !currentGroups.find(g => g.code === activeGroup))) {
      setActiveGroup(currentGroups[0].code);
    } else if (currentGroups.length === 0) {
      setActiveGroup(null);
    }
  }, [currentGroups, activeGroup]);

  // 순위표 계산
  const standings = useMemo(() => {
    const activeDivId = divisions.find(d => d.code === activeTab)?.id;
    
    let activeGroupId: string | null = null;
    if (activeGroup) {
      activeGroupId = groups.find(g => g.division_id === activeDivId && g.code === activeGroup)?.id || null;
    }

    if (!activeDivId) return [];

    let filteredTeams = teams.filter((t) => t.division_id === activeDivId);
    let filteredMatches = matches.filter((m) => m.division_id === activeDivId);

    if (activeGroupId) {
      filteredTeams = filteredTeams.filter(t => t.group_id === activeGroupId);
      filteredMatches = filteredMatches.filter(m => m.group_id === activeGroupId);
    } else if (currentGroups.length > 0) {
      return [];
    }

    return calculateStandings(filteredMatches, filteredTeams, overrides);
  }, [matches, teams, overrides, divisions, groups, activeTab, activeGroup, currentGroups.length]);

  const topTier = standings.slice(0, 2);
  const lowerTier = standings.slice(2);

  const getTeamInfo = (team: TeamStats) => {
    const t = teams.find(x => x.id === team.team_id);
    return { name: t?.team_name || t?.school_name || "알 수 없음", schoolName: t?.school_name };
  };

  return (
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black pb-24 font-sans halftone-bg selection:bg-brand-court-orange selection:text-white">
      
      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-[40vh] overflow-hidden border-b-4 border-brand-ink-black">
        <Image 
          src="/manga_ranking_bg.png" 
          alt="Ranking Background" 
          fill 
          className="object-cover object-top opacity-60 mix-blend-multiply"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-paper-cream to-transparent"></div>
        <div className="absolute inset-0 speed-line-bg opacity-30 pointer-events-none"></div>
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-paper-cream/90 backdrop-blur-md border-b-4 border-brand-ink-black pt-safe shadow-[0_4px_0_#111111]">
        <div className="flex items-center justify-between px-4 h-16 max-w-5xl mx-auto">
          <Link href="/" className="p-2 -ml-2 text-brand-ink-black hover:scale-110 transition-transform" aria-label="뒤로 가기">
            <ChevronLeft className="w-8 h-8 stroke-[3]" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest flex items-center gap-2 italic score-font">
            <Trophy className="w-6 h-6 text-brand-court-orange fill-brand-court-orange" />
            <span className="text-brand-ink-black">POWER RANKING</span>
          </h1>
          <div className="w-10"></div>
        </div>
        
        {/* Division Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 max-w-5xl mx-auto gap-3 py-3">
          {[
            { id: "HIGH_MALE", label: "고등 남" },
            { id: "MIDDLE_MALE", label: "중등 남" },
            { id: "MIDDLE_FEMALE", label: "중등 여" },
            { id: "ELEMENTARY_MALE", label: "초등 남" },
            { id: "ELEMENTARY_FEMALE", label: "초등 여" }
          ].map((div) => (
            <button
              key={div.id}
              onClick={() => setActiveTab(div.id)}
              className={`px-5 py-2 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-transform duration-200 border-2 border-brand-ink-black shadow-[3px_3px_0_#111111] ${
                activeTab === div.id 
                  ? "bg-brand-ink-black text-white -translate-y-1" 
                  : "bg-white text-brand-ink-black hover:bg-brand-comic-yellow hover:-translate-y-0.5"
              }`}
              style={{ transform: activeTab === div.id ? 'rotate(-2deg)' : 'rotate(0)' }}
            >
              {div.label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative z-10 p-4 max-w-5xl mx-auto mt-6">
        
        {/* Group Tabs */}
        {currentGroups.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {currentGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.code)}
                className={`px-6 py-2 text-sm font-black uppercase tracking-widest transition-transform duration-200 border-2 border-brand-ink-black shadow-[3px_3px_0_#111111] rounded-full ${
                  activeGroup === group.code 
                    ? "bg-brand-court-orange text-white scale-110" 
                    : "bg-white text-brand-ink-black hover:bg-brand-paper-cream hover:scale-105"
                }`}
              >
                Group {group.code}
              </button>
            ))}
          </div>
        )}

        {standings.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center comic-panel max-w-2xl mx-auto slanted">
            <p className="font-black text-2xl uppercase tracking-widest text-brand-ink-black">등록된 팀이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-16 mt-12">
            
            {/* QUALIFICATION ZONE (1st & 2nd) */}
            <section>
              <div className="flex items-end gap-3 mb-8 border-b-4 border-brand-ink-black pb-2">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-brand-ink-black score-font bg-white px-3 py-1 border-2 border-brand-ink-black shadow-[4px_4px_0_#111111] -rotate-2 inline-block">
                  진출권 ZONE
                </h2>
                <span className="text-sm font-black text-brand-ink-black/60 tracking-widest mb-1 ml-2">TOP 2</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {topTier.map((team, idx) => {
                    const info = getTeamInfo(team);
                    const isFirst = idx === 0;
                    return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 50, rotate: -5 }}
                      animate={{ opacity: 1, y: 0, rotate: isFirst ? -2 : 2 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.2 }}
                      key={team.team_id}
                      className={`relative group border-4 border-brand-ink-black p-4 sm:p-6 ${isFirst ? 'bg-brand-comic-yellow' : 'bg-brand-sky-blue'} shadow-[6px_6px_0_#111111] sm:shadow-[8px_8px_0_#111111] flex flex-col justify-between min-h-[160px] sm:min-h-[220px]`}
                    >
                      <div className="absolute inset-0 speed-line-bg opacity-10 pointer-events-none"></div>
                      
                      {team.needs_lottery && (
                        <div className="absolute -top-4 -right-4 comic-stamp bg-brand-victory-red text-white text-sm px-4 py-2 rotate-12 z-20 shadow-[4px_4px_0_#111111]">
                          추첨 대기!
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col items-center pt-12 sm:pt-16 min-h-[120px] sm:min-h-[160px] pb-2 sm:pb-4">
                        {/* 순위 숫자 */}
                        <span className="absolute left-0 sm:left-4 -top-2 sm:top-2 text-5xl sm:text-8xl font-black italic score-font text-white drop-shadow-[4px_4px_0_#111111] z-20">
                          {idx + 1}
                        </span>

                        {/* 승점 스탬프 */}
                        <div className="absolute right-0 sm:right-4 -top-2 sm:top-2 text-center bg-white px-3 sm:px-4 py-1.5 sm:py-2 border-4 border-brand-ink-black shadow-[4px_4px_0_#111111] rotate-2 z-20">
                          <span className="text-[10px] sm:text-xs text-brand-ink-black font-black tracking-widest block mb-1">승점</span>
                          <span className="text-2xl sm:text-4xl font-black score-font text-brand-victory-red leading-none">{team.points}</span>
                        </div>

                        {/* 팀명 중심 */}
                        <div className="flex items-center justify-center pt-2">
                          <h3 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-brand-ink-black text-center break-keep leading-tight">
                            {info.name}
                          </h3>
                        </div>

                        <div className="mt-8 inline-flex items-center gap-3 sm:gap-4 bg-white/90 border-2 border-brand-ink-black px-4 py-2 shadow-[3px_3px_0_#111111] font-black text-xs sm:text-sm -rotate-1">
                          <span className="text-brand-ink-black">{team.games}경기</span>
                          <span className="text-brand-royal-blue">{team.wins}승</span>
                          <span className="text-brand-ink-black/50">{team.losses}패</span>
                          <span className="text-brand-ink-black">득실 {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}</span>
                        </div>
                      </div>
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            </section>

            {/* LOWER TIER */}
            {lowerTier.length > 0 && (
              <section className="mt-16">
                <div className="flex items-end gap-3 mb-6 border-b-2 border-brand-ink-black pb-2">
                  <h2 className="text-xl font-black italic tracking-widest uppercase text-brand-ink-black score-font">
                    CONTENDERS
                  </h2>
                </div>
                
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {lowerTier.map((team, idx) => {
                      const info = getTeamInfo(team);
                      return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, delay: idx * 0.1 }}
                        key={team.team_id}
                        className="comic-panel flex items-center justify-between p-3 sm:p-5 relative overflow-visible bg-white hover:-translate-y-1 transition-transform"
                      >
                        {team.needs_lottery && (
                          <div className="absolute -left-2 -top-2 bg-brand-victory-red text-white text-[10px] font-black px-2 py-1 border-2 border-brand-ink-black shadow-[2px_2px_0_#111111] -rotate-12 z-20">
                            추첨!
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0 z-10">
                          <span className="text-3xl sm:text-4xl font-black italic score-font text-brand-ink-black/30 w-8 sm:w-10 text-center shrink-0">
                            {idx + 3}
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-black text-sm sm:text-lg text-brand-ink-black truncate">
                              {info.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6 shrink-0 z-10">
                          <div className="hidden sm:flex items-center gap-3 text-xs font-black text-brand-ink-black/70 bg-brand-paper-cream px-4 py-2 border-2 border-brand-ink-black shadow-[2px_2px_0_#111111]">
                            <span>{team.games}경기</span>
                            <span className="text-brand-royal-blue">{team.wins}승</span>
                            <span className="text-brand-ink-black/40">{team.losses}패</span>
                            <div className="w-1 h-1 bg-brand-ink-black rounded-full mx-1"></div>
                            <span>득실</span>
                            <span className={`${team.pointDiff > 0 ? "text-brand-royal-blue" : team.pointDiff < 0 ? "text-brand-victory-red" : "text-brand-ink-black"}`}>
                              {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center bg-brand-comic-yellow px-3 py-1 sm:px-4 sm:py-2 border-2 border-brand-ink-black shadow-[3px_3px_0_#111111] min-w-[3.5rem] rotate-2">
                            <span className="text-[10px] text-brand-ink-black/60 font-black tracking-widest leading-tight">승점</span>
                            <span className="text-xl sm:text-2xl font-black score-font text-brand-ink-black leading-none">{team.points}</span>
                          </div>
                        </div>
                      </motion.div>
                    )})}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Rule Indicator */}
            <div className="pt-12 text-center flex flex-col items-center">
              <div className="inline-flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-black text-brand-ink-black/40 uppercase tracking-widest">
                <span>1. 승점</span>
                <span>2. 승자승</span>
                <span>3. 득실차</span>
                <span>4. 다득점</span>
                <span>5. 추첨</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
