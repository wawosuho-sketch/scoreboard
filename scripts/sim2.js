const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulate2() {
  console.log("=== 시나리오 2: 중등 남자부 B조 완벽한 동률(추첨 대기) 세팅 ===");
  
  const { data: div } = await supabase.from('divisions').select('id').eq('code', 'MIDDLE_MALE').single();
  const { data: group } = await supabase.from('groups').select('id').eq('division_id', div.id).eq('code', 'B').single();
  
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id')
    .eq('group_id', group.id)
    .order('match_no')
    .limit(3);

  // 3팀의 조별 풀리그는 3경기입니다. 완벽한 동률을 만들려면:
  // Team 1 승 Team 2 패 (20:10)
  // Team 2 승 Team 3 패 (20:10)
  // Team 3 승 Team 1 패 (20:10)
  // 이렇게 하면 1승 1패씩, 득실차 모두 0, 다득점도 모두 30으로 완벽한 동점 발생.
  
  const results = [
    { home: 20, away: 10 },
    { home: 20, away: 10 },
    { home: 20, away: 10 }
  ];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const res = results[i];
    const winnerId = res.home > res.away ? match.home_team_id : match.away_team_id;
    const loserId = res.home > res.away ? match.away_team_id : match.home_team_id;

    await supabase.from('matches').update({
      home_score: res.home,
      away_score: res.away,
      status: 'COMPLETED',
      winner_team_id: winnerId,
      loser_team_id: loserId,
      is_forfeit: false,
      result_confirmed_at: new Date().toISOString()
    }).eq('id', match.id);
  }
  
  console.log("=== 시나리오 2 완료 ===");
}

simulate2().catch(console.error);
