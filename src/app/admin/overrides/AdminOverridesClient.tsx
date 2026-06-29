"use client";

import { useState } from "react";
import { Database } from "@/types/database.types";
import { ChevronLeft, Save, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Division = Database["public"]["Tables"]["divisions"]["Row"];
type Group = Database["public"]["Tables"]["groups"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Override = Database["public"]["Tables"]["standings_override"]["Row"];

interface Props {
  divisions: Division[];
  groups: Group[];
  teams: Team[];
  initialOverrides: Override[];
}

export default function AdminOverridesClient({ divisions, groups, teams, initialOverrides }: Props) {
  const router = useRouter();
  const [activeDiv, setActiveDiv] = useState(divisions[0]?.id || "");
  
  const currentDivGroups = groups.filter(g => g.division_id === activeDiv);
  const [activeGroup, setActiveGroup] = useState(currentDivGroups[0]?.id || "");

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [manualRank, setManualRank] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentTeams = teams.filter(t => t.division_id === activeDiv && t.group_id === activeGroup);
  const currentOverrides = initialOverrides.filter(o => o.division_id === activeDiv && o.group_id === activeGroup);

  const getTeamName = (id: string) => {
    const t = teams.find(t => t.id === id);
    return t ? (t.team_name || t.school_name) : "알 수 없음";
  };

  const handleGroupChange = (divId: string, groupId: string) => {
    setActiveDiv(divId);
    setActiveGroup(groupId);
    setSelectedTeamId("");
    setManualRank("");
    setReason("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !manualRank) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division_id: activeDiv,
          group_id: activeGroup,
          team_id: selectedTeamId,
          manual_rank: Number(manualRank),
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save override");

      setManualRank("");
      setReason("");
      setSelectedTeamId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (overrideId: string) => {
    if (!confirm("해당 수동 조정을 삭제하시겠습니까? (자동 순위로 복구됩니다)")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overrides?id=${overrideId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("삭제 실패");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg-dark text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">순위 수동 조정</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 h-fit">
            <h2 className="font-bold text-lg mb-4 text-brand-neon-blue">종별 및 조 선택</h2>
            <div className="space-y-4">
              {divisions.map(div => {
                const divGroups = groups.filter(g => g.division_id === div.id);
                return (
                  <div key={div.id}>
                    <div className="text-sm font-bold text-brand-text-secondary mb-2">{div.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {divGroups.map(grp => (
                        <button
                          key={grp.id}
                          onClick={() => handleGroupChange(div.id, grp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            activeDiv === div.id && activeGroup === grp.id
                              ? "bg-brand-volt-yellow text-black"
                              : "bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {grp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form & List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-white/10">
              <h2 className="font-bold text-lg mb-4 text-brand-neon-pink flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                수동 순위 적용
              </h2>
              <p className="text-sm text-brand-text-secondary mb-6">
                추첨 등 예외적인 상황으로 순위를 강제로 배정해야 할 때만 사용하세요.
                수동 조정된 팀은 자동 계산 로직보다 우선하여 최상단에 고정됩니다.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-1">팀 선택</label>
                    <select 
                      required 
                      value={selectedTeamId} 
                      onChange={e => setSelectedTeamId(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-volt-yellow outline-none"
                    >
                      <option value="">-- 팀 선택 --</option>
                      {currentTeams.map(t => (
                        <option key={t.id} value={t.id}>{getTeamName(t.id)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-1">지정 순위 (1~{currentTeams.length})</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={currentTeams.length} 
                      required 
                      value={manualRank}
                      onChange={e => setManualRank(Number(e.target.value) || "")}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-volt-yellow outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-brand-text-secondary mb-1">조정 사유</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="예: 승점 동률로 인한 주최측 추첨 결과 (1위 배정)"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-volt-yellow outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading || !selectedTeamId} 
                    className="w-full py-3 bg-brand-volt-yellow text-black hover:bg-yellow-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    수동 순위 저장
                  </button>
                </div>
              </form>
            </div>

            {/* Current Overrides List */}
            <div className="glass-panel p-6 rounded-xl border border-white/10">
              <h2 className="font-bold text-lg mb-4 text-white">현재 적용된 수동 조정 목록</h2>
              
              {currentOverrides.length === 0 ? (
                <div className="text-center py-8 text-brand-text-secondary text-sm border border-dashed border-white/10 rounded-lg">
                  적용된 수동 순위가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOverrides.map(o => (
                    <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#111] rounded-lg border border-white/5 border-l-4 border-l-brand-volt-yellow">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-brand-volt-yellow">{o.manual_rank}위</span>
                          <span className="font-bold text-white text-lg">{getTeamName(o.team_id)}</span>
                        </div>
                        <p className="text-xs text-brand-text-secondary">사유: {o.reason}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(o.id)}
                        className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1 w-fit"
                      >
                        <X className="w-4 h-4" /> 취소
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
