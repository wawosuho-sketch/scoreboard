"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Play } from "lucide-react";
import { Database } from "@/types/database.types";

type Division = Database["public"]["Tables"]["divisions"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface Props {
  divisions: Division[];
  allMatches: Match[];
  teams: Team[];
}

export default function HomeClient({ divisions, allMatches, teams }: Props) {
  const getTeamInfo = (id: string | null, placeholder: string | null) => {
    if (id) {
      const t = teams.find(team => team.id === id);
      return { name: t ? (t.team_name || t.school_name) : "알 수 없음", schoolName: t?.school_name };
    }
    return { name: placeholder || "진출팀 미정", schoolName: undefined };
  };

  const getDivisionName = (divId: string) => {
    const d = divisions.find(d => d.id === divId);
    return d ? d.name : "알 수 없음";
  };

  const now = new Date();
  const koreaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // 예정된 경기 (오늘 포함 미래)
  const scheduledMatches = allMatches.filter(m => m.status === "SCHEDULED" && m.match_date >= koreaDate).slice(0, 5);
  
  // 종료된 경기
  const completedMatches = allMatches.filter(m => m.status === "COMPLETED" || m.status === "FORFEIT_COMPLETED")
    .sort((a, b) => new Date(`${b.match_date}T${b.start_time}`).getTime() - new Date(`${a.match_date}T${a.start_time}`).getTime())
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-brand-paper-cream text-brand-ink-black pb-24 overflow-x-hidden font-sans halftone-bg selection:bg-brand-court-orange selection:text-white">
      
      {/* ========================================================
          MANGA HERO SECTION
          ======================================================== */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden border-b-4 border-brand-ink-black">
        {/* Manga Hero Background */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/manga_hero_bg.png" 
            alt="Manga Court Background" 
            fill 
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Speed Line Overlay */}
        <div className="absolute inset-0 z-0 speed-line-bg pointer-events-none opacity-50"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-brand-paper-cream via-transparent to-transparent opacity-90 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center text-center pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.8, ease: "backOut" }}
            className="flex flex-col items-center"
          >
            {/* Magazine Headline Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="comic-stamp px-4 py-2 text-sm sm:text-base">40 TEAMS</span>
              <span className="comic-stamp px-4 py-2 text-sm sm:text-base bg-brand-sky-blue text-white rotate-2">62 MATCHES</span>
              <span className="comic-stamp px-4 py-2 text-sm sm:text-base bg-brand-victory-red text-white -rotate-1">5 DIVISIONS</span>
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9] text-brand-ink-black drop-shadow-[4px_4px_0_#FFF3D6] score-font relative">
              <span className="absolute -inset-2 bg-brand-court-orange/20 blur-2xl z-0 rounded-full"></span>
              <span className="relative z-10 block pb-2 stroke-black text-brand-ink-black" style={{ WebkitTextStroke: '2px white' }}>SEJONG</span>
              <span className="relative z-10 block text-brand-court-orange" style={{ WebkitTextStroke: '3px #111111' }}>CHAMPIONSHIP</span>
            </h1>
            
            <p className="mt-8 text-xl sm:text-2xl font-black tracking-tight max-w-xl mx-auto bg-white border-4 border-brand-ink-black px-6 py-3 shadow-[8px_8px_0_#111111] transform -rotate-1">
              마지막 버저가 울릴 때까지!<br/>
              <span className="text-brand-court-orange">오늘의 주인공은 우리 학교</span>
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-12 flex flex-wrap gap-4 justify-center"
            >
              <Link href="/bracket">
                <button className="comic-stamp bg-brand-court-orange text-white px-8 py-4 text-xl hover:scale-110 transition-transform duration-300 rotate-0 hover:-rotate-2">
                  <span className="flex items-center gap-2">
                    결선 대진표 보기 <Play className="w-5 h-5 fill-white" />
                  </span>
                </button>
              </Link>
              <Link href="/standings">
                <button className="comic-stamp bg-white text-brand-ink-black px-8 py-4 text-xl hover:scale-110 transition-transform duration-300 rotate-0 hover:rotate-2">
                  파워랭킹 확인
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          UPCOMING MATCHES (Comic Panels)
          ======================================================== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-end justify-between mb-8 border-b-4 border-brand-ink-black pb-4">
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-brand-ink-black flex flex-col gap-1 score-font">
            <span className="flex items-center gap-3">
              <span className="bg-brand-ink-black text-white px-3 py-1 -skew-x-12">UPCOMING</span> 
              <span>MATCHES</span>
            </span>
            <span className="text-lg sm:text-xl font-bold not-italic tracking-tight text-brand-ink-black/70">다가오는 경기</span>
          </h2>
          <Link href="/matches" className="text-sm font-black text-brand-ink-black uppercase tracking-wider hover:text-brand-court-orange transition-colors flex items-center border-2 border-brand-ink-black px-3 py-1 bg-white hover:bg-brand-paper-cream shadow-[2px_2px_0_#111111]">
            전체보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto comic-scrollbar gap-6 pb-8 snap-x snap-mandatory pt-2">
          {scheduledMatches.length === 0 ? (
            <div className="w-full py-16 text-center comic-panel slanted">
              <p className="font-black text-xl uppercase tracking-widest">예정된 경기가 없습니다.</p>
            </div>
          ) : scheduledMatches.map((match, i) => {
            const home = getTeamInfo(match.home_team_id, match.home_placeholder);
            const away = getTeamInfo(match.away_team_id, match.away_placeholder);
            return (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="snap-center shrink-0 w-[85vw] sm:w-[420px] comic-panel relative p-6 hover:-translate-y-2 transition-transform overflow-hidden slanted"
            >
              {/* Manga Action Background */}
              <div className="absolute inset-0 opacity-20">
                <Image src="/manga_action_bg.png" alt="Manga Action" fill className="object-cover" />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-black text-white bg-brand-ink-black px-3 py-1 -skew-x-6">{getDivisionName(match.division_id)}</span>
                  <span className="text-sm font-black border-2 border-brand-ink-black bg-white px-2 py-1 shadow-[2px_2px_0_#111111] rotate-2">
                    {match.match_date.slice(5).replace("-", ".")} {match.start_time.slice(0, 5)}
                  </span>
                </div>
                
                <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-6 mt-8">
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-brand-ink-black leading-tight break-keep">
                      {home.name}
                    </h3>
                  </div>
                  
                  <div className="shrink-0 text-3xl sm:text-4xl font-black italic text-brand-victory-red score-font drop-shadow-[2px_2px_0_#111111] -rotate-12">
                    VS
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-brand-ink-black leading-tight break-keep">
                      {away.name}
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </section>

      {/* ========================================================
          SCORE FLASH (Recent Results)
          ======================================================== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="flex items-end justify-between mb-8 border-b-4 border-brand-ink-black pb-4">
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-brand-ink-black flex flex-col gap-1 score-font">
            <span className="flex items-center gap-3">
              <span className="bg-brand-comic-yellow text-brand-ink-black px-3 py-1 border-2 border-brand-ink-black shadow-[4px_4px_0_#111111] -rotate-2">SCORE</span> 
              <span>FLASH</span>
            </span>
            <span className="text-lg sm:text-xl font-bold not-italic tracking-tight text-brand-ink-black/70">최근 경기 결과</span>
          </h2>
          <Link href="/matches" className="text-sm font-black text-brand-ink-black uppercase tracking-wider hover:text-brand-royal-blue transition-colors flex items-center border-2 border-brand-ink-black px-3 py-1 bg-white hover:bg-brand-paper-cream shadow-[2px_2px_0_#111111]">
            전체보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedMatches.length === 0 ? (
            <div className="col-span-full py-16 text-center comic-panel-blue slanted">
              <p className="font-black text-xl uppercase tracking-widest">아직 종료된 경기가 없습니다.</p>
            </div>
          ) : completedMatches.map((res, i) => {
            const home = getTeamInfo(res.home_team_id, res.home_placeholder);
            const away = getTeamInfo(res.away_team_id, res.away_placeholder);
            const isHomeWinner = res.winner_team_id === res.home_team_id;
            const isAwayWinner = res.winner_team_id === res.away_team_id;

            return (
            <motion.div 
              key={res.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`group relative flex flex-col p-5 transition-transform hover:-translate-y-1 ${isHomeWinner ? 'comic-panel-blue' : 'comic-panel-orange'}`}
            >
              <div className="relative z-10 flex justify-between items-center mb-4 border-b-2 border-brand-ink-black/20 pb-2">
                <span className="text-sm font-black text-brand-ink-black/60">{res.match_date.slice(5).replace("-", ".")}</span>
                <span className="text-sm font-black text-white uppercase tracking-widest border-2 border-brand-ink-black px-2 py-0.5 bg-brand-victory-red -rotate-3 shadow-[2px_2px_0_#111111]">FINAL</span>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4 mt-4">
                <div className="flex-1 min-w-0 text-right">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black leading-tight break-keep ${isHomeWinner ? "text-brand-ink-black" : "text-brand-ink-black/40"}`}>
                    {home.name}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-4 shrink-0 mx-2 bg-white border-4 border-brand-ink-black px-4 sm:px-6 py-2 shadow-[4px_4px_0_#111111] -skew-x-6 z-20">
                  {res.is_forfeit ? (
                    <span className="text-sm text-brand-victory-red font-black tracking-widest uppercase flex items-center gap-1">
                      몰수패
                    </span>
                  ) : (
                    <>
                      <span className={`text-3xl sm:text-5xl font-black score-font tracking-tighter ${isHomeWinner ? "text-brand-royal-blue" : "text-brand-ink-black/40"}`}>
                        {res.home_score}
                      </span>
                      <span className="text-brand-ink-black/20 text-xl sm:text-2xl font-black italic">-</span>
                      <span className={`text-3xl sm:text-5xl font-black score-font tracking-tighter ${isAwayWinner ? "text-brand-court-orange" : "text-brand-ink-black/40"}`}>
                        {res.away_score}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black leading-tight break-keep ${isAwayWinner ? "text-brand-ink-black" : "text-brand-ink-black/40"}`}>
                    {away.name}
                  </h3>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </section>

      {/* ========================================================
          POWER RANKINGS CALL TO ACTION
          ======================================================== */}
      <section className="relative mt-24 overflow-hidden py-24 border-y-4 border-brand-ink-black speed-line-bg bg-brand-comic-yellow">
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 border-4 border-brand-ink-black bg-white text-sm font-black text-brand-ink-black uppercase shadow-[6px_6px_0_#111111] rotate-2">
            <Trophy className="w-5 h-5 text-brand-victory-red" /> POWER RANKING
          </div>
          
          <h2 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-brand-ink-black mb-6 relative">
            <span className="absolute inset-0 text-white translate-x-1 translate-y-1">파워랭킹 확인하기</span>
            <span className="relative z-10 text-brand-ink-black" style={{ WebkitTextStroke: '2px #111111' }}>파워랭킹 확인하기</span>
          </h2>
          
          <p className="text-brand-ink-black font-bold max-w-md mx-auto mb-12 text-lg bg-white border-2 border-brand-ink-black p-4 shadow-[4px_4px_0_#111111] -rotate-1">
            승점, 득실차, 승자승 규칙이 반영된 종별 순위를 확인하세요.
          </p>
          
          <Link href="/standings">
            <button className="comic-stamp bg-white text-brand-ink-black px-12 py-5 text-2xl hover:scale-110 transition-transform duration-300 rotate-0 hover:-rotate-3 shadow-[8px_8px_0_#111111]">
              <span className="relative z-10 flex items-center gap-2">
                순위표 보기 
              </span>
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
