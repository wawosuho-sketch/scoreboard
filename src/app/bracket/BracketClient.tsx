"use client";

import { useState, useRef } from "react";
import { Database } from "@/types/database.types";
import { ChevronLeft, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, useScroll, useSpring } from "framer-motion";
import Image from "next/image";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Division = Database["public"]["Tables"]["divisions"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type BracketSlot = Database["public"]["Tables"]["bracket_slots"]["Row"];

interface Props {
  divisions: Division[];
  matches: Match[];
  teams: Team[];
  slots: BracketSlot[];
}

const STAGES = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"];
const STAGE_LABELS: Record<string, string> = {
  QUARTER_FINAL: "CHAPTER 1. 8강",
  SEMI_FINAL: "CHAPTER 2. 4강",
  FINAL: "FINAL CHAPTER. 결승",
};

export default function BracketClient({ divisions, matches, teams, slots }: Props) {
  const [activeDiv, setActiveDiv] = useState(divisions[0]?.id || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDiv = divisions.find((d) => d.id === activeDiv);
  const currentMatches = matches.filter((m) => m.division_id === activeDiv);
  const currentSlots = slots.filter((s) => s.division_id === activeDiv);

  const getTeamObj = (teamId: string | null) => {
    if (!teamId) return null;
    return teams.find((t) => t.id === teamId) || null;
  };

  const getMatchTeam = (matchId: string, slotPos: string, dbTeamId: string | null) => {
    if (dbTeamId) {
      const t = getTeamObj(dbTeamId);
      return { name: t ? (t.team_name || t.school_name) : "진출팀 미정", schoolName: t?.school_name, isUnknown: !t };
    }
    const slot = currentSlots.find(
      (s) => s.match_id === matchId && s.slot_position.toUpperCase() === slotPos.toUpperCase()
    );
    if (slot && slot.team_id) {
      const t = getTeamObj(slot.team_id);
      return { name: t ? (t.team_name || t.school_name) : "진출팀 미정", schoolName: t?.school_name, isUnknown: !t };
    }
    return { name: "진출팀 미정", schoolName: undefined, isUnknown: true };
  };

  const isBracketLocked = currentSlots.length > 0 && currentSlots.every((s) => s.is_locked);

  const { scrollXProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollXProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black pb-24 font-sans halftone-bg selection:bg-brand-court-orange selection:text-white">
      
      {/* Background Mask */}
      <div className="fixed inset-0 z-0 overflow-hidden border-b-4 border-brand-ink-black pointer-events-none">
        <Image 
          src="/manga_bracket_bg.png" 
          alt="Bracket Background" 
          fill 
          className="object-cover object-top opacity-50 mix-blend-multiply"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-paper-cream to-transparent"></div>
        <div className="absolute inset-0 speed-line-bg opacity-30"></div>
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-paper-cream/90 backdrop-blur-md border-b-4 border-brand-ink-black pt-safe shadow-[0_4px_0_#111111]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-brand-ink-black hover:scale-110 transition-transform" aria-label="뒤로 가기">
              <ChevronLeft className="w-8 h-8 stroke-[3]" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic text-brand-ink-black score-font flex flex-col sm:flex-row sm:items-end gap-1">
              <span>ROAD TO FINAL</span>
              <span className="text-lg sm:text-xl font-bold not-italic tracking-tight text-brand-ink-black/70 mb-0.5">결승으로 가는 길</span>
            </h1>
          </div>
          {isBracketLocked && (
            <div className="comic-stamp px-4 py-1.5 bg-brand-victory-red text-white text-sm rotate-2 self-start sm:self-auto shadow-[4px_4px_0_#111111]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 fill-white" /> 대진 확정!
              </div>
            </div>
          )}
        </div>
        
        {/* Division Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 max-w-7xl mx-auto gap-3 py-3">
          {divisions.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDiv(d.id)}
              className={`px-5 py-2 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-transform duration-200 border-2 border-brand-ink-black shadow-[3px_3px_0_#111111] ${
                activeDiv === d.id 
                  ? "bg-brand-ink-black text-white -translate-y-1" 
                  : "bg-white text-brand-ink-black hover:bg-brand-comic-yellow hover:-translate-y-0.5"
              }`}
              style={{ transform: activeDiv === d.id ? 'rotate(-2deg)' : 'rotate(0)' }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </header>

      <div className="relative z-10 p-4 max-w-7xl mx-auto mt-6">
        
        {/* Scroll Progress Indicator for Mobile */}
        <div className="block md:hidden mb-6">
          <div className="h-2 border-2 border-brand-ink-black bg-white rounded-none overflow-hidden w-full max-w-[200px] mx-auto shadow-[2px_2px_0_#111111]">
            <motion.div className="h-full bg-brand-court-orange origin-left" style={{ scaleX }} />
          </div>
          <p className="text-center text-xs text-brand-ink-black font-black uppercase tracking-widest mt-2">Swipe to navigate</p>
        </div>

        {currentMatches.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center comic-panel max-w-2xl mx-auto slanted">
            <p className="font-black text-2xl uppercase tracking-widest text-brand-ink-black">대진표 데이터가 없습니다.</p>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="flex justify-start min-w-max lg:min-w-0 lg:w-full gap-4 sm:gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-12 px-4 md:px-0 pt-8"
          >
            {STAGES.map((stageName, stageIdx) => {
              const stageMatches = currentMatches.filter((m) => m.stage === stageName);
              if (stageMatches.length === 0) return null;
              const isFinal = stageName === "FINAL";

              return (
                <div key={stageName} className={`snap-center shrink-0 w-[85vw] md:w-auto flex-1 flex flex-col justify-around relative ${isFinal ? 'md:min-w-[320px]' : 'md:min-w-[280px]'}`}>
                  <h3 className={`text-center font-black uppercase tracking-tighter mb-8 sm:mb-12 flex flex-col items-center gap-1 score-font bg-white border-4 border-brand-ink-black py-2 px-4 shadow-[4px_4px_0_#111111] sm:shadow-[6px_6px_0_#111111] z-10 mx-auto ${isFinal ? 'text-2xl sm:text-4xl bg-brand-comic-yellow rotate-2' : 'text-xl sm:text-2xl -rotate-1'}`}>
                    {STAGE_LABELS[stageName]}
                  </h3>
                  
                  <div className="flex flex-col gap-12 flex-1 justify-around relative">
                    {/* Connecting lines could go here if needed, but comic panels are self-contained */}
                    
                    {stageMatches.map((match, matchIdx) => {
                      const home = getMatchTeam(match.id, "HOME", match.home_team_id);
                      const away = getMatchTeam(match.id, "AWAY", match.away_team_id);
                      const isCompleted = match.status === "COMPLETED" || match.status === "FORFEIT_COMPLETED";
                      const isHomeWinner = isCompleted && match.winner_team_id === match.home_team_id;
                      const isAwayWinner = isCompleted && match.winner_team_id === match.away_team_id;

                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, x: 20 }}
                          whileInView={{ opacity: 1, scale: 1, x: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: stageIdx * 0.1 + matchIdx * 0.1 }}
                          key={match.id}
                          className={cn(
                            "relative group bg-white border-4 border-brand-ink-black p-3 sm:p-5 transition-transform hover:-translate-y-2 slanted shadow-[4px_4px_0_#111111] sm:shadow-[8px_8px_0_#111111]",
                            isFinal ? "min-h-[200px] sm:min-h-[300px] border-[6px] sm:border-8 shadow-[6px_6px_0_#111111] sm:shadow-[12px_12px_0_#111111]" : ""
                          )}
                        >
                          {/* Match Header */}
                          <div className="flex flex-col gap-2 mb-6 relative z-10">
                            <div className="flex justify-between items-center">
                              <span className="comic-stamp bg-brand-ink-black text-white px-2 py-0.5 text-xs -rotate-2">
                                MATCH {match.match_no}
                              </span>
                              {match.is_forfeit && (
                                <span className="comic-stamp bg-brand-victory-red text-white border-2 border-brand-ink-black px-3 py-1 text-xs rotate-3 shadow-[2px_2px_0_#111111] z-20">
                                  몰수패!
                                </span>
                              )}
                              {isCompleted && !match.is_forfeit && (
                                <span className="comic-stamp bg-brand-court-orange text-brand-ink-black border-2 border-brand-ink-black px-3 py-1 text-xs -rotate-3 shadow-[2px_2px_0_#111111] z-20">
                                  BUZZER!
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-brand-ink-black font-black tracking-widest uppercase border-b-2 border-brand-ink-black/20 pb-1">
                              {match.match_date.slice(5).replace("-", ".")} {match.start_time.slice(0, 5)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-4 relative z-10">
                            {/* HOME */}
                            <div className={cn(
                              "flex justify-between items-center relative transition-all duration-300",
                              isCompleted && !isHomeWinner ? "opacity-60 grayscale" : ""
                            )}>
                              <div className="flex items-center gap-2 z-10 min-w-0">
                                {!home.isUnknown ? (
                                  <>
                                    <h3 className={cn("font-black truncate", isFinal ? "text-xl sm:text-4xl" : "text-base sm:text-2xl", isCompleted && !isHomeWinner ? "text-brand-ink-black/40" : "text-brand-ink-black")}>{home.name}</h3>
                                  </>
                                ) : (
                                  <>
                                    <h3 className={cn("font-black text-brand-ink-black/20", isFinal ? "text-xl sm:text-4xl" : "text-base sm:text-2xl")}>진출팀 미정</h3>
                                  </>
                                )}
                              </div>
                              {isCompleted && (
                                <span className={cn(
                                  "font-black score-font z-10 ml-4",
                                  isFinal ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl",
                                  isHomeWinner ? "text-brand-victory-red" : "text-brand-ink-black/40"
                                )}>
                                  {match.home_score}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-center -my-3 relative z-20">
                              <span className="text-xl sm:text-2xl font-black italic text-brand-victory-red score-font drop-shadow-[2px_2px_0_#111111] -rotate-6">VS</span>
                            </div>

                            {/* AWAY */}
                            <div className={cn(
                              "flex justify-between items-center relative transition-all duration-300",
                              isCompleted && !isAwayWinner ? "opacity-60 grayscale" : ""
                            )}>
                              <div className="flex items-center gap-2 z-10 min-w-0">
                                {!away.isUnknown ? (
                                  <>
                                    <h3 className={cn("font-black truncate", isFinal ? "text-xl sm:text-4xl" : "text-base sm:text-2xl", isCompleted && !isAwayWinner ? "text-brand-ink-black/40" : "text-brand-ink-black")}>{away.name}</h3>
                                  </>
                                ) : (
                                  <>
                                    <h3 className={cn("font-black text-brand-ink-black/20", isFinal ? "text-xl sm:text-4xl" : "text-base sm:text-2xl")}>진출팀 미정</h3>
                                  </>
                                )}
                              </div>
                              {isCompleted && (
                                <span className={cn(
                                  "font-black score-font z-10 ml-4",
                                  isFinal ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl",
                                  isAwayWinner ? "text-brand-victory-red" : "text-brand-ink-black/40"
                                )}>
                                  {match.away_score}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
