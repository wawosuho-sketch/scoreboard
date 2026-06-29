const fs = require('fs');

const divisions = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'HIGH_MALE', total: 13, groupMatches: 10, knockout: [ { stage: 'SEMI_FINAL', count: 2 }, { stage: 'FINAL', count: 1 } ] },
  { id: '22222222-2222-2222-2222-222222222222', code: 'MIDDLE_MALE', total: 20, groupMatches: 13, knockout: [ { stage: 'QUARTER_FINAL', count: 4 }, { stage: 'SEMI_FINAL', count: 2 }, { stage: 'FINAL', count: 1 } ] },
  { id: '33333333-3333-3333-3333-333333333333', code: 'MIDDLE_FEMALE', total: 11, groupMatches: 8, knockout: [ { stage: 'SEMI_FINAL', count: 2 }, { stage: 'FINAL', count: 1 } ] },
  { id: '44444444-4444-4444-4444-444444444444', code: 'ELEMENTARY_MALE', total: 11, groupMatches: 8, knockout: [ { stage: 'SEMI_FINAL', count: 2 }, { stage: 'FINAL', count: 1 } ] },
  { id: '55555555-5555-5555-5555-555555555555', code: 'ELEMENTARY_FEMALE', total: 7, groupMatches: 6, knockout: [ { stage: 'FINAL', count: 1 } ] },
];

let matchNo = 1;
const matchInserts = [];
const slotInserts = [];

let dateOffset = 0;

for (const div of divisions) {
  // Group matches
  for (let i = 0; i < div.groupMatches; i++) {
    const date = new Date(2026, 6, 7); // 2026-07-07
    date.setDate(date.getDate() + Math.floor(dateOffset / 5));
    dateOffset++;
    const dateStr = date.toISOString().slice(0, 10);
    const timeStr = `${10 + (i % 8)}:00:00`;
    
    // Pick random teams for the division. Teams use fixed IDs from seed.sql.
    // For simplicity, we just use null team ids or pick from a hardcoded list, but group matches must have teams.
    // In SQL seed, team IDs are '00008888-0000-0000-0000-0000000000xx'
    // Let's just create generic matches without team_ids for now, or match them.
    // Actually, group matches need teams. Let's just write home_placeholder instead of team_ids if we can't map them perfectly, 
    // but the UI expects group_id and team_ids.
    
    matchInserts.push(`('${div.id}', 'GROUP', ${matchNo++}, '${dateStr}', '${timeStr}', 'SCHEDULED')`);
  }

  // Knockout matches
  for (const st of div.knockout) {
    for (let i = 0; i < st.count; i++) {
      const date = new Date(2026, 8, 10); // 2026-09-10
      date.setDate(date.getDate() + (st.stage === 'FINAL' ? 5 : 0));
      const dateStr = date.toISOString().slice(0, 10);
      const timeStr = `14:00:00`;
      
      const homePh = `${st.stage}_H${i+1}`;
      const awayPh = `${st.stage}_A${i+1}`;
      
      const matchId = `gen_random_uuid()`; // We can't link bracket_slots easily this way.
      // Better to use a specific UUID
      const matchUuid = `99999999-9999-9999-9999-000000000${matchNo.toString().padStart(3, '0')}`;

      matchInserts.push(`('${matchUuid}', '${div.id}', '${st.stage}', ${matchNo}, '${dateStr}', '${timeStr}', '${homePh}', '${awayPh}', 'SCHEDULED')`);
      
      slotInserts.push(`('${div.id}', '${st.stage}', '${matchUuid}', 'HOME', '${homePh}')`);
      slotInserts.push(`('${div.id}', '${st.stage}', '${matchUuid}', 'AWAY', '${awayPh}')`);
      
      matchNo++;
    }
  }
}

// Actually, generating SQL manually with precise team mapping is tedious. Let's use a full node script with Supabase if the user provided keys, but they didn't.
