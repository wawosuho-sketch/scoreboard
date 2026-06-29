const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulate() {
  console.log("=== 시나리오 1: 고등 남자부 A조 경기 점수 입력 ===");
  
  // 1. 고등 남자부 ID 찾기
  const { data: div } = await supabase.from('divisions').select('id').eq('code', 'HIGH_MALE').single();
  const { data: group } = await supabase.from('groups').select('id').eq('division_id', div.id).eq('code', 'A').single();
  
  // 2. A조 경기 가져오기
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, status')
    .eq('group_id', group.id)
    .order('match_no')
    .limit(3);

  if (!matches || matches.length === 0) {
    console.log("경기를 찾을 수 없습니다.");
    return;
  }

  // 3. 점수 입력
  console.log(`총 ${matches.length}경기 점수 반영 중...`);
  
  const results = [
    { home: 35, away: 32, forfeit: false },
    { home: 20, away: 0, forfeit: true }, // 몰수패
    { home: 40, away: 45, forfeit: false }
  ];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const res = results[i];
    const winnerId = res.home > res.away ? match.home_team_id : match.away_team_id;
    const loserId = res.home > res.away ? match.away_team_id : match.home_team_id;

    await supabase.from('matches').update({
      home_score: res.home,
      away_score: res.away,
      status: res.forfeit ? 'FORFEIT_COMPLETED' : 'COMPLETED',
      winner_team_id: winnerId,
      loser_team_id: loserId,
      is_forfeit: res.forfeit,
      forfeit_loser_team_id: res.forfeit ? loserId : null,
      result_confirmed_at: new Date().toISOString()
    }).eq('id', match.id);

    console.log(`- 매치 ${i+1} 업데이트 완료 (스코어 ${res.home}:${res.away}${res.forfeit ? ' 몰수패' : ''})`);
  }

  console.log("=== 시나리오 1 완료 ===");
}

simulate().catch(console.error);
