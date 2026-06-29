const fs = require('fs');
const path = require('path');

function generateSeed() {
  const sql = [];
  
  // UUIDs
  const divIds = {
    HIGH_MALE: '11111111-1111-1111-1111-111111111111',
    MIDDLE_MALE: '22222222-2222-2222-2222-222222222222',
    MIDDLE_FEMALE: '33333333-3333-3333-3333-333333333333',
    ELEM_MALE: '44444444-4444-4444-4444-444444444444',
    ELEM_FEMALE: '55555555-5555-5555-5555-555555555555'
  };

  sql.push(`-- 1. Divisions`);
  sql.push(`INSERT INTO public.divisions (id, name, code, competition_type, display_order) VALUES
  ('${divIds.HIGH_MALE}', '고등 남자부', 'HIGH_MALE', 'GROUP_KNOCKOUT_4', 1),
  ('${divIds.MIDDLE_MALE}', '중등 남자부', 'MIDDLE_MALE', 'GROUP_KNOCKOUT_8', 2),
  ('${divIds.MIDDLE_FEMALE}', '중등 여자부', 'MIDDLE_FEMALE', 'GROUP_KNOCKOUT_4', 3),
  ('${divIds.ELEM_MALE}', '초등 남자부', 'ELEMENTARY_MALE', 'ROUND_ROBIN_FINAL', 4),
  ('${divIds.ELEM_FEMALE}', '초등 여자부', 'ELEMENTARY_FEMALE', 'ROUND_ROBIN_FINAL', 5)
  ON CONFLICT DO NOTHING;`);

  // Groups and Teams logic
  let groupIdCounter = 1;
  let teamIdCounter = 1;
  
  function getUuid(type, id) {
    return `${type.toString().padStart(8, '0')}-0000-0000-0000-${id.toString().padStart(12, '0')}`;
  }

  const groups = [];
  const teams = [];

  function addGroup(divId, name, code, order, teamNames) {
    const groupId = getUuid('9999', groupIdCounter++);
    groups.push(`('${groupId}', '${divId}', '${name}', '${code}', ${order})`);
    
    teamNames.forEach((tName, idx) => {
      const teamId = getUuid('8888', teamIdCounter++);
      teams.push(`('${teamId}', '${divId}', '${groupId}', '${tName}', '${tName}', '${tName}', ${idx + 1})`);
    });
  }

  // HIGH_MALE (10 teams) -> A(5), B(5)
  addGroup(divIds.HIGH_MALE, 'A조', 'A', 1, ['고등A1', '고등A2', '고등A3', '고등A4', '고등A5']);
  addGroup(divIds.HIGH_MALE, 'B조', 'B', 2, ['고등B1', '고등B2', '고등B3', '고등B4', '고등B5']);

  // MIDDLE_MALE (13 teams) -> A(3), B(3), C(3), D(4)
  addGroup(divIds.MIDDLE_MALE, 'A조', 'A', 1, ['남중A1', '남중A2', '남중A3']);
  addGroup(divIds.MIDDLE_MALE, 'B조', 'B', 2, ['남중B1', '남중B2', '남중B3']);
  addGroup(divIds.MIDDLE_MALE, 'C조', 'C', 3, ['남중C1', '남중C2', '남중C3']);
  addGroup(divIds.MIDDLE_MALE, 'D조', 'D', 4, ['남중D1', '남중D2', '남중D3', '남중D4']);

  // MIDDLE_FEMALE (8 teams) -> A(4), B(4)
  addGroup(divIds.MIDDLE_FEMALE, 'A조', 'A', 1, ['여중A1', '여중A2', '여중A3', '여중A4']);
  addGroup(divIds.MIDDLE_FEMALE, 'B조', 'B', 2, ['여중B1', '여중B2', '여중B3', '여중B4']);

  // ELEM_MALE (5 teams) -> 풀리그
  addGroup(divIds.ELEM_MALE, '풀리그', 'LEAGUE', 1, ['남초1', '남초2', '남초3', '남초4', '남초5']);

  // ELEM_FEMALE (4 teams) -> 풀리그
  addGroup(divIds.ELEM_FEMALE, '풀리그', 'LEAGUE', 1, ['여초1', '여초2', '여초3', '여초4']);

  sql.push(`\n-- 2. Groups`);
  sql.push(`INSERT INTO public.groups (id, division_id, name, code, display_order) VALUES`);
  sql.push(groups.join(',\n') + `\n  ON CONFLICT DO NOTHING;`);

  sql.push(`\n-- 3. Teams`);
  sql.push(`INSERT INTO public.teams (id, division_id, group_id, school_name, team_name, short_name, display_order) VALUES`);
  sql.push(teams.join(',\n') + `\n  ON CONFLICT DO NOTHING;`);

  sql.push(`\n-- 4. Matches (Placeholder for 62 matches)`);
  // Just inserting a few matches for testing
  sql.push(`INSERT INTO public.matches (division_id, stage, match_no, match_date, start_time, status) VALUES
  ('${divIds.HIGH_MALE}', 'GROUP', 1, '2026-07-07', '14:00:00', 'SCHEDULED'),
  ('${divIds.HIGH_MALE}', 'GROUP', 2, '2026-07-07', '15:00:00', 'SCHEDULED')
  ON CONFLICT DO NOTHING;`);

  fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql.join('\n'));
  console.log('seed.sql generated');
}

generateSeed();
