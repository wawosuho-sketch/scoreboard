"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database.types";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Division = Database["public"]["Tables"]["divisions"]["Row"];
type Group = Database["public"]["Tables"]["groups"]["Row"];

interface Props {
  matches: Match[];
  teams: Team[];
  divisions: Division[];
  groups: Group[];
}

export default function MatchesClient({ matches, teams, divisions, groups }: Props) {
  const [activeDate, setActiveDate] = useState<string>("ALL");

  const dates = Array.from(new Set(matches.map(m => m.match_date))).sort();

  const filteredMatches = activeDate === "ALL" 
    ? matches 
    : matches.filter(m => m.match_date === activeDate);

  const getTeamName = (teamId: string | null, placeholder: string | null) => {
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      return team ? (team.team_name || team.school_name) : "알 수 없음";
    }
    return placeholder || "미정";
  };

  const getDivisionName = (divId: string) => divisions.find(d => d.id === divId)?.name || "";
  const getGroupName = (groupId: string | null) => {
    if (!groupId) return "결선";
    return groups.find(g => g.id === groupId)?.name || "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <span className="border-2 border-brand-ink-black px-2 py-0.5 bg-brand-sky-blue text-brand-ink-black text-xs font-black shadow-[2px_2px_0_#111111] -rotate-2">종료</span>;
      case "FORFEIT_COMPLETED": return <span className="border-2 border-brand-ink-black px-2 py-0.5 bg-brand-victory-red text-white text-xs font-black shadow-[2px_2px_0_#111111] -rotate-2">몰수종료</span>;
      case "IN_PROGRESS": return <span className="border-2 border-brand-ink-black px-2 py-0.5 bg-brand-comic-yellow text-brand-ink-black text-xs font-black animate-pulse shadow-[2px_2px_0_#111111] rotate-2">진행중</span>;
      case "SCHEDULED": return <span className="border-2 border-brand-ink-black px-2 py-0.5 bg-white text-brand-ink-black text-xs font-black shadow-[2px_2px_0_#111111]">예정</span>;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black pb-24 halftone-bg selection:bg-brand-court-orange selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-paper-cream/90 backdrop-blur-md border-b-4 border-brand-ink-black pt-safe shadow-[0_4px_0_#111111]">
        <div className="flex items-center justify-between px-4 h-16 max-w-5xl mx-auto">
          <Link href="/" className="p-2 -ml-2 text-brand-ink-black hover:scale-110 transition-transform">
            <ChevronLeft className="w-8 h-8 stroke-[3]" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 tracking-widest italic score-font">
            <Calendar className="w-6 h-6 text-brand-court-orange" />
            MATCHES
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex overflow-x-auto comic-scrollbar border-t-2 border-brand-ink-black/10 px-4 bg-white/50 max-w-5xl mx-auto">
          <button
            onClick={() => setActiveDate("ALL")}
            className={`px-5 py-3 text-sm font-black whitespace-nowrap transition-colors border-b-4 ${
              activeDate === "ALL" ? "text-brand-ink-black border-brand-ink-black bg-brand-comic-yellow" : "text-brand-ink-black/60 border-transparent hover:text-brand-ink-black"
            }`}
          >
            전체 경기
          </button>
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setActiveDate(date)}
              className={`px-5 py-3 text-sm font-black whitespace-nowrap transition-colors border-b-4 ${
                activeDate === date ? "text-brand-ink-black border-brand-ink-black bg-brand-comic-yellow" : "text-brand-ink-black/60 border-transparent hover:text-brand-ink-black"
              }`}
            >
              {format(parseISO(date), "M.d (E)", { locale: ko })}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl space-y-6 mt-6">
        {filteredMatches.length === 0 ? (
          <div className="text-center font-black text-xl uppercase tracking-widest text-brand-ink-black/50 py-10 comic-panel slanted">
            해당 일자에 경기가 없습니다.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isHomeWinner = match.status.includes("COMPLETED") && (match.home_score || 0) > (match.away_score || 0);
            const isAwayWinner = match.status.includes("COMPLETED") && (match.away_score || 0) > (match.home_score || 0);
            
            return (
              <div key={match.id} className="comic-panel p-4 sm:p-6 relative hover:-translate-y-1 transition-transform overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b-2 border-brand-ink-black/20 pb-3">
                  <div className="text-xs sm:text-sm text-brand-ink-black/60 font-black">
                    {format(parseISO(`${match.match_date}T${match.start_time}`), "M.d (E) HH:mm", { locale: ko })}
                    <span className="mx-2 text-brand-ink-black/20">|</span>
                    <span className="text-brand-court-orange">{getDivisionName(match.division_id)} {getGroupName(match.group_id)}</span>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="flex justify-between items-center px-2">
                  {/* Home Team */}
                  <div className="flex-1 text-right min-w-0">
                    <div className={`text-xl sm:text-3xl font-black break-keep leading-tight ${isHomeWinner ? "text-brand-royal-blue" : "text-brand-ink-black"}`}>
                      {getTeamName(match.home_team_id, match.home_placeholder)}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="px-4 shrink-0 text-center relative z-10">
                    <div className="text-3xl sm:text-5xl font-black score-font tracking-tighter text-brand-ink-black bg-white px-4 sm:px-6 py-1 sm:py-2 border-4 border-brand-ink-black shadow-[4px_4px_0_#111111] -skew-x-6">
                      {match.status === "SCHEDULED" ? (
                        <span className="text-brand-ink-black/30">- : -</span>
                      ) : (
                        <>{match.home_score} <span className="text-brand-ink-black/30 text-2xl sm:text-3xl mx-1">:</span> {match.away_score}</>
                      )}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-xl sm:text-3xl font-black break-keep leading-tight ${isAwayWinner ? "text-brand-royal-blue" : "text-brand-ink-black"}`}>
                      {getTeamName(match.away_team_id, match.away_placeholder)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
