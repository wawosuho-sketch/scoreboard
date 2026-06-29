"use client";

import { useState } from "react";
import { Database } from "@/types/database.types";
import { ChevronLeft, Search, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface Props {
  matches: Match[];
  teams: Team[];
  divisions: Database["public"]["Tables"]["divisions"]["Row"][];
  groups: Database["public"]["Tables"]["groups"]["Row"][];
}

export default function AdminMatchesClient({ matches, teams, divisions, groups }: Props) {
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [isForfeit, setIsForfeit] = useState(false);
  const [forfeitLoser, setForfeitLoser] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uniqueDates = Array.from(new Set(matches.map(m => m.match_date))).sort();
  const [activeDate, setActiveDate] = useState(uniqueDates[0] || "");

  const filteredMatches = matches.filter(m => m.match_date === activeDate);

  const getTeamName = (id: string | null) => {
    if (!id) return "미정";
    const t = teams.find(t => t.id === id);
    return t ? (t.team_name || t.school_name) : "알 수 없음";
  };

  const handleOpenModal = (match: Match) => {
    setSelectedMatch(match);
    setHomeScore(match.home_score !== null ? match.home_score.toString() : "");
    setAwayScore(match.away_score !== null ? match.away_score.toString() : "");
    setIsForfeit(match.is_forfeit);
    setForfeitLoser(match.forfeit_loser_team_id || "");
    setReason("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/matches/${selectedMatch.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_score: isForfeit ? 0 : Number(homeScore),
          away_score: isForfeit ? 0 : Number(awayScore),
          is_forfeit: isForfeit,
          forfeit_loser_team_id: isForfeit ? forfeitLoser : null,
          reason: reason || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update match");

      // Success
      setSelectedMatch(null);
      router.refresh(); // Refresh Server Component data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black p-4 sm:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">경기 결과 입력</h1>
          </div>
        </header>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
          {uniqueDates.map(date => (
            <button 
              key={date}
              onClick={() => setActiveDate(date)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
                activeDate === date ? "bg-brand-neon-blue text-black" : "bg-white/5 text-brand-text-secondary hover:text-white"
              }`}
            >
              {date.slice(5).replace("-", ".")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map(match => {
            const div = divisions.find(d => d.id === match.division_id);
            const grp = groups.find(g => g.id === match.group_id);
            return (
            <div key={match.id} className="comic-panel p-4 hover:-translate-y-1 transition-transform bg-white slanted-light">
              <div className="flex justify-between items-center mb-3 border-b-2 border-brand-ink-black/20 pb-2">
                <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-brand-text-secondary">
                  {div ? div.name : "알 수 없음"} {grp ? `- ${grp.name}조` : ""}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  match.status === "COMPLETED" || match.status === "FORFEIT_COMPLETED" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-brand-neon-blue/20 text-brand-neon-blue"
                }`}>
                  {match.status === "COMPLETED" || match.status === "FORFEIT_COMPLETED" ? "종료됨" : match.start_time.slice(0, 5)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold mb-4 px-2">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-sm text-brand-text-secondary mb-1">홈팀</span>
                  <span className="text-center truncate w-full">{getTeamName(match.home_team_id)}</span>
                  <span className="text-2xl mt-2 score-font">{match.home_score ?? "-"}</span>
                </div>
                <div className="text-brand-text-secondary px-2">VS</div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-sm text-brand-text-secondary mb-1">어웨이팀</span>
                  <span className="text-center truncate w-full">{getTeamName(match.away_team_id)}</span>
                  <span className="text-2xl mt-2 score-font">{match.away_score ?? "-"}</span>
                </div>
              </div>

              <button 
                onClick={() => handleOpenModal(match)}
                className="w-full py-2 bg-brand-ink-black text-white font-bold hover:bg-brand-court-orange transition-colors comic-stamp !rotate-0 !shadow-[3px_3px_0_#111111]"
              >
                점수 입력 / 수정
              </button>
            </div>
          )})}
        </div>
      </div>

      {/* Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink-black/80 backdrop-blur-sm p-4">
          <div className="comic-panel bg-brand-paper-cream p-6 w-full max-w-md">
            <h2 className="text-2xl font-black italic uppercase score-font tracking-tighter mb-4 text-brand-ink-black flex items-center gap-2">
              <span className="bg-brand-comic-yellow px-2 border-2 border-brand-ink-black shadow-[2px_2px_0_#111111] -rotate-2">SCORE</span> INPUT
            </h2>
            <div className="flex justify-between items-center mb-6 bg-white border-4 border-brand-ink-black p-4 shadow-[4px_4px_0_#111111] -skew-x-3">
              <span className="font-black flex-1 text-center text-lg">{getTeamName(selectedMatch.home_team_id)}</span>
              <span className="text-brand-victory-red font-black italic px-4 text-xl score-font">VS</span>
              <span className="font-black flex-1 text-center text-lg">{getTeamName(selectedMatch.away_team_id)}</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg mb-4 text-red-400 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  id="forfeit" 
                  checked={isForfeit} 
                  onChange={(e) => setIsForfeit(e.target.checked)} 
                />
                <label htmlFor="forfeit" className="text-brand-neon-pink font-bold">몰수패 처리 (20:0)</label>
              </div>

              {!isForfeit ? (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-brand-ink-black font-bold mb-1">홈팀 점수</label>
                    <input type="number" min="0" max="200" required value={homeScore} onChange={e => setHomeScore(e.target.value)} className="w-full bg-white border-2 border-brand-ink-black p-3 text-brand-ink-black text-center text-xl font-bold focus:ring-4 focus:ring-brand-court-orange outline-none shadow-[2px_2px_0_#111111]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-brand-ink-black font-bold mb-1">어웨이팀 점수</label>
                    <input type="number" min="0" max="200" required value={awayScore} onChange={e => setAwayScore(e.target.value)} className="w-full bg-white border-2 border-brand-ink-black p-3 text-brand-ink-black text-center text-xl font-bold focus:ring-4 focus:ring-brand-court-orange outline-none shadow-[2px_2px_0_#111111]" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-brand-text-secondary mb-1">패배 팀 선택</label>
                  <select value={forfeitLoser} onChange={e => setForfeitLoser(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-neon-blue outline-none">
                    <option value="" className="text-black bg-white">-- 선택 --</option>
                    <option value={selectedMatch.home_team_id!} className="text-black bg-white">홈팀: {getTeamName(selectedMatch.home_team_id)}</option>
                    <option value={selectedMatch.away_team_id!} className="text-black bg-white">어웨이팀: {getTeamName(selectedMatch.away_team_id)}</option>
                  </select>
                </div>
              )}

              {(selectedMatch.status === "COMPLETED" || selectedMatch.status === "FORFEIT_COMPLETED") && (
                <div>
                  <label className="block text-sm text-brand-text-secondary mb-1">수정 사유 (필수)</label>
                  <input type="text" required value={reason} onChange={e => setReason(e.target.value)} placeholder="예: 심판 판정 번복, 점수 기입 실수 등" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-brand-neon-blue outline-none" />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setSelectedMatch(null)} className="flex-1 py-3 bg-white border-4 border-brand-ink-black font-black text-brand-ink-black shadow-[4px_4px_0_#111111] hover:translate-y-1 hover:shadow-none transition-all">
                  취소
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-court-orange text-white border-4 border-brand-ink-black font-black shadow-[4px_4px_0_#111111] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "저장 중..." : "결과 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
