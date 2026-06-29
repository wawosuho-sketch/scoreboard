-- 5.1 divisions 테이블
CREATE TABLE public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    competition_type TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.2 groups 테이블
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    display_order INTEGER NOT NULL
);

-- 5.3 teams 테이블
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    school_name TEXT NOT NULL,
    team_name TEXT,
    short_name TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- 5.4 matches 테이블
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    stage TEXT NOT NULL,
    match_no INTEGER NOT NULL,
    match_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    home_placeholder TEXT,
    away_placeholder TEXT,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    loser_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    is_forfeit BOOLEAN DEFAULT false,
    forfeit_loser_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    result_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5.5 standings_override 테이블
CREATE TABLE public.standings_override (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    manual_rank INTEGER NOT NULL,
    reason TEXT,
    locked_by UUID,
    locked_at TIMESTAMPTZ DEFAULT now()
);

-- 5.6 bracket_slots 테이블
CREATE TABLE public.bracket_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    slot_position TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    seed_label TEXT,
    source_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    source_rank INTEGER,
    locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.7 audit_logs 테이블
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_name TEXT NOT NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    before_data JSONB,
    after_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 초기 데이터 삽입 스크립트 등은 필요시 추가
