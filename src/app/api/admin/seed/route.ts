import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    // 1. 기존 데이터 정리 (의존성 역순)
    await supabaseAdmin.from("bracket_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("standings_override").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("divisions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. 종별 데이터 삽입
    const divisions = [
      { code: "HIGH_MALE", name: "고등 남자부", competition_type: "GROUP_KNOCKOUT_4", display_order: 1 },
      { code: "MIDDLE_MALE", name: "중등 남자부", competition_type: "GROUP_KNOCKOUT_8", display_order: 2 },
      { code: "MIDDLE_FEMALE", name: "중등 여자부", competition_type: "GROUP_KNOCKOUT_4", display_order: 3 },
      { code: "ELEMENTARY_MALE", name: "초등 남자부", competition_type: "GROUP_KNOCKOUT_2", display_order: 4 },
      { code: "ELEMENTARY_FEMALE", name: "초등 여자부", competition_type: "GROUP_KNOCKOUT_2", display_order: 5 }
    ];

    const { data: divData, error: divErr } = await (supabaseAdmin.from("divisions") as any).insert(divisions).select();
    if (divErr) throw new Error("Divisions insert failed: " + divErr.message);

    const divMap = divData.reduce((acc: any, d: any) => ({ ...acc, [d.code]: d.id }), {} as Record<string, string>);

    // 실제 참가 학교 (PDF 데이터 기반)
    const realTeams = {
      HIGH_MALE: [
        { group: "A", schools: ["보람고", "고운고", "한솔고", "새롬고", "세종캠퍼스고"] },
        { group: "B", schools: ["아름고", "두루고", "세종대성고", "다정고", "양지고"] }
      ],
      MIDDLE_MALE: [
        { group: "A", schools: ["양지중", "도담중", "집현중"] },
        { group: "B", schools: ["나성중", "해밀중", "반곡중"] },
        { group: "C", schools: ["새롬중", "한솔중", "다정중"] },
        { group: "D", schools: ["종촌중", "보람중", "아름중", "고운중"] }
      ],
      MIDDLE_FEMALE: [
        { group: "A", schools: ["나성중", "양지중", "한솔중", "고운중"] },
        { group: "B", schools: ["새롬중", "두루중", "집현중", "보람중"] }
      ],
      ELEMENTARY_MALE: [
        { group: "A", schools: ["나성초", "미르초", "소담초", "으뜸초", "해밀초"] }
      ],
      ELEMENTARY_FEMALE: [
        { group: "A", schools: ["나성초", "보람초", "으뜸초", "해밀초"] }
      ]
    };

    // 3. 조별 및 팀 데이터 생성 함수
    const insertGroupsAndTeams = async (divCode: string, groupsConfig: {group: string, schools: string[]}[]) => {
      const divId = divMap[divCode];
      const insertedGroups = [];
      const insertedTeams = [];
      
      for (let i = 0; i < groupsConfig.length; i++) {
        const conf = groupsConfig[i];
        const { data: gData } = await (supabaseAdmin.from("groups") as any).insert({
          division_id: divId,
          name: `${conf.group}조`,
          code: conf.group,
          display_order: i + 1
        }).select().single();
        
        insertedGroups.push(gData!);

        for (let j = 0; j < conf.schools.length; j++) {
          const { data: tData } = await (supabaseAdmin.from("teams") as any).insert({
            division_id: divId,
            group_id: gData!.id,
            school_name: conf.schools[j],
            team_name: conf.schools[j],
            display_order: j + 1
          }).select().single();
          insertedTeams.push(tData!);
        }
      }
      return { groups: insertedGroups, teams: insertedTeams };
    };

    // 각 종별 매치 생성
    const hm = await insertGroupsAndTeams("HIGH_MALE", realTeams.HIGH_MALE);
    const mm = await insertGroupsAndTeams("MIDDLE_MALE", realTeams.MIDDLE_MALE);
    const mf = await insertGroupsAndTeams("MIDDLE_FEMALE", realTeams.MIDDLE_FEMALE);
    const em = await insertGroupsAndTeams("ELEMENTARY_MALE", realTeams.ELEMENTARY_MALE);
    const ef = await insertGroupsAndTeams("ELEMENTARY_FEMALE", realTeams.ELEMENTARY_FEMALE);

    const allTeams = [...hm.teams, ...mm.teams, ...mf.teams, ...em.teams, ...ef.teams];

    // PDF 기반 정확한 62경기 일정 데이터
    const schedule = [
      { date: '2026-07-07', time: '17:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '나성초', away: '미르초' },
      { date: '2026-07-07', time: '18:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '소담초', away: '으뜸초' },
      { date: '2026-07-07', time: '19:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '집현중', away: '양지중' },
      { date: '2026-07-07', time: '20:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '반곡중', away: '나성중' },
      { date: '2026-07-08', time: '17:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '나성초', away: '해밀초' },
      { date: '2026-07-08', time: '18:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '미르초', away: '으뜸초' },
      { date: '2026-07-08', time: '19:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '나성초', away: '보람초' },
      { date: '2026-07-08', time: '20:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '으뜸초', away: '해밀초' },
      { date: '2026-07-09', time: '16:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '소담초', away: '해밀초' },
      { date: '2026-07-09', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '다정중', away: '새롬중' },
      { date: '2026-07-09', time: '18:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '아름중', away: '고운중' },
      { date: '2026-07-09', time: '19:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '종촌중', away: '보람중' },
      { date: '2026-07-09', time: '20:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '집현중', away: '도담중' },
      { date: '2026-07-10', time: '17:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '나성초', away: '소담초' },
      { date: '2026-07-10', time: '18:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '미르초', away: '해밀초' },
      { date: '2026-07-10', time: '19:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '나성초', away: '으뜸초' },
      { date: '2026-07-10', time: '20:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '보람초', away: '해밀초' },
      { date: '2026-08-25', time: '17:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '양지중', away: '고운중' },
      { date: '2026-08-25', time: '18:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '나성중', away: '한솔중' },
      { date: '2026-08-25', time: '19:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '집현중', away: '보람중' },
      { date: '2026-08-25', time: '20:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '새롬중', away: '두루중' },
      { date: '2026-08-26', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '반곡중', away: '해밀중' },
      { date: '2026-08-26', time: '18:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '다정중', away: '한솔중' },
      { date: '2026-08-26', time: '19:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '아름중', away: '종촌중' },
      { date: '2026-08-26', time: '20:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '고운중', away: '보람중' },
      { date: '2026-08-27', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '양지중', away: '도담중' },
      { date: '2026-08-27', time: '18:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '새롬고', away: '보람고' },
      { date: '2026-08-27', time: '19:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '고운고', away: '한솔고' },
      { date: '2026-08-27', time: '20:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '양지고', away: '아름고' },
      { date: '2026-09-01', time: '17:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '해밀초', away: '으뜸초' },
      { date: '2026-09-01', time: '18:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '미르초', away: '소담초' },
      { date: '2026-09-01', time: '19:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '두루고', away: '세종대성고' }, // note: pdf says 대성고, map to 세종대성고
      { date: '2026-09-01', time: '20:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '새롬고', away: '세종캠퍼스고' },
      { date: '2026-09-03', time: '17:00:00', div: 'ELEMENTARY_MALE', stage: 'GROUP', home: '나성초', away: '으뜸초' },
      { date: '2026-09-03', time: '18:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '양지중', away: '나성중' },
      { date: '2026-09-03', time: '19:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '고운중', away: '한솔중' },
      { date: '2026-09-03', time: '20:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '나성중', away: '해밀중' },
      { date: '2026-09-08', time: '17:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '나성초', away: '해밀초' },
      { date: '2026-09-08', time: '18:00:00', div: 'ELEMENTARY_FEMALE', stage: 'GROUP', home: '보람초', away: '으뜸초' },
      { date: '2026-09-08', time: '19:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '집현중', away: '새롬중' },
      { date: '2026-09-08', time: '20:00:00', div: 'MIDDLE_FEMALE', stage: 'GROUP', home: '보람중', away: '두루중' },
      { date: '2026-09-09', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'GROUP', home: '새롬중', away: '한솔중' },
      { date: '2026-09-09', time: '18:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '보람고', away: '고운고' },
      { date: '2026-09-09', time: '19:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '양지고', away: '다정고' },
      { date: '2026-09-09', time: '20:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '아름고', away: '두루고' },
      
      { date: '2026-09-10', time: '17:00:00', div: 'MIDDLE_FEMALE', stage: 'SEMI_FINAL', homePH: '여중준결승 H1', awayPH: '여중준결승 A1' },
      { date: '2026-09-10', time: '18:00:00', div: 'MIDDLE_FEMALE', stage: 'SEMI_FINAL', homePH: '여중준결승 H2', awayPH: '여중준결승 A2' },
      { date: '2026-09-10', time: '19:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '세종캠퍼스고', away: '한솔고' }, // note: pdf says 캠퍼스고 -> 세종캠퍼스고
      { date: '2026-09-10', time: '20:00:00', div: 'HIGH_MALE', stage: 'GROUP', home: '세종대성고', away: '다정고' }, // note: pdf says 대성고 -> 세종대성고
      
      { date: '2026-09-15', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'QUARTER_FINAL', homePH: '남중8강 H1', awayPH: '남중8강 A1' },
      { date: '2026-09-15', time: '18:00:00', div: 'MIDDLE_MALE', stage: 'QUARTER_FINAL', homePH: '남중8강 H2', awayPH: '남중8강 A2' },
      { date: '2026-09-15', time: '19:00:00', div: 'MIDDLE_MALE', stage: 'QUARTER_FINAL', homePH: '남중8강 H3', awayPH: '남중8강 A3' },
      { date: '2026-09-15', time: '20:00:00', div: 'MIDDLE_MALE', stage: 'QUARTER_FINAL', homePH: '남중8강 H4', awayPH: '남중8강 A4' },
      
      { date: '2026-09-17', time: '17:00:00', div: 'MIDDLE_MALE', stage: 'SEMI_FINAL', homePH: '남중준결승 H1', awayPH: '남중준결승 A1' },
      { date: '2026-09-17', time: '18:00:00', div: 'MIDDLE_MALE', stage: 'SEMI_FINAL', homePH: '남중준결승 H2', awayPH: '남중준결승 A2' },
      { date: '2026-09-17', time: '19:00:00', div: 'HIGH_MALE', stage: 'SEMI_FINAL', homePH: '남고준결승 H1', awayPH: '남고준결승 A1' },
      { date: '2026-09-17', time: '20:00:00', div: 'HIGH_MALE', stage: 'SEMI_FINAL', homePH: '남고준결승 H2', awayPH: '남고준결승 A2' },
      
      { date: '2026-09-19', time: '09:00:00', div: 'ELEMENTARY_FEMALE', stage: 'FINAL', homePH: '여초결승 H', awayPH: '여초결승 A' },
      { date: '2026-09-19', time: '10:00:00', div: 'ELEMENTARY_MALE', stage: 'FINAL', homePH: '남초결승 H', awayPH: '남초결승 A' },
      { date: '2026-09-19', time: '11:00:00', div: 'MIDDLE_FEMALE', stage: 'FINAL', homePH: '여중결승 H', awayPH: '여중결승 A' },
      { date: '2026-09-19', time: '12:00:00', div: 'MIDDLE_MALE', stage: 'FINAL', homePH: '남중결승 H', awayPH: '남중결승 A' },
      { date: '2026-09-19', time: '13:00:00', div: 'HIGH_MALE', stage: 'FINAL', homePH: '남고결승 H', awayPH: '남고결승 A' }
    ];

    let matchNo = 1;
    const matchInserts: any[] = [];
    const bracketSlots: any[] = [];
    for (const sc of schedule) {
      if (sc.stage === 'GROUP') {
        // Find exact team objects
        let t1Name = sc.home;
        let t2Name = sc.away;
        // Adjust PDF short names to full names in DB
        if (t1Name === "대성고") t1Name = "세종대성고";
        if (t2Name === "대성고") t2Name = "세종대성고";
        if (t1Name === "캠퍼스고") t1Name = "세종캠퍼스고";
        if (t2Name === "캠퍼스고") t2Name = "세종캠퍼스고";

        const t1 = allTeams.find((t: any) => t.school_name === t1Name);
        const t2 = allTeams.find((t: any) => t.school_name === t2Name);
        if (!t1 || !t2) {
          console.log(`Team not found: ${t1Name} or ${t2Name}`);
          continue;
        }

        matchInserts.push({
          division_id: divMap[sc.div],
          group_id: t1.group_id, // since group matches are in-group
          stage: "GROUP",
          match_no: matchNo++,
          match_date: sc.date,
          start_time: sc.time,
          home_team_id: t1.id,
          away_team_id: t2.id,
          status: "SCHEDULED"
        });
      } else {
        matchInserts.push({
          division_id: divMap[sc.div],
          group_id: null,
          stage: sc.stage,
          match_no: matchNo++,
          match_date: sc.date,
          start_time: sc.time,
          home_placeholder: sc.homePH,
          away_placeholder: sc.awayPH,
          status: "SCHEDULED"
        });
      }
    }

    // 5. 경기 Insert
    const { data: insertedMatches, error: matchErr } = await (supabaseAdmin.from("matches") as any).insert(matchInserts).select();
    if (matchErr) throw new Error("Matches insert failed: " + matchErr.message);

    // 6. 브라켓 슬롯 생성
    for (const match of (insertedMatches || []) as any[]) {
      if (match.stage !== "GROUP") {
        bracketSlots.push({
          division_id: match.division_id,
          stage: match.stage,
          match_id: match.id,
          slot_position: "HOME",
          seed_label: match.home_placeholder
        });
        bracketSlots.push({
          division_id: match.division_id,
          stage: match.stage,
          match_id: match.id,
          slot_position: "AWAY",
          seed_label: match.away_placeholder
        });
      }
    }

    const { error: slotErr } = await (supabaseAdmin.from("bracket_slots") as any).insert(bracketSlots);
    if (slotErr) throw new Error("Bracket Slots insert failed: " + slotErr.message);

    return NextResponse.json({ success: true, message: `Successfully seeded real data matches.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
