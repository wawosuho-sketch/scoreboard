CREATE TABLE public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    competition_type TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    display_order INTEGER NOT NULL
);

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

CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SCORE_MANAGER', 'BRACKET_MANAGER', 'VIEW_ONLY')),
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  pin_salt TEXT
);

CREATE TABLE public.standings_override (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    manual_rank INTEGER NOT NULL,
    reason TEXT,
    locked_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ DEFAULT now()
);

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
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL
);

-- Constraints
ALTER TABLE public.matches ADD CONSTRAINT matches_score_non_negative CHECK ((home_score IS NULL OR home_score >= 0) AND (away_score IS NULL OR away_score >= 0));
ALTER TABLE public.matches ADD CONSTRAINT matches_no_same_team CHECK (home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id);
ALTER TABLE public.matches ADD CONSTRAINT matches_forfeit_score_rule CHECK (is_forfeit = false OR ((home_score = 20 AND away_score = 0) OR (home_score = 0 AND away_score = 20)));
ALTER TABLE public.matches ADD CONSTRAINT matches_completed_requires_scores CHECK (status NOT IN ('COMPLETED', 'FORFEIT_COMPLETED') OR (home_score IS NOT NULL AND away_score IS NOT NULL AND winner_team_id IS NOT NULL AND loser_team_id IS NOT NULL AND result_confirmed_at IS NOT NULL));
ALTER TABLE public.matches ADD CONSTRAINT matches_no_draw_when_completed CHECK (status NOT IN ('COMPLETED', 'FORFEIT_COMPLETED') OR home_score <> away_score);

-- Enable RLS
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read-only access for divisions" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for bracket_slots" ON public.bracket_slots FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for standings_override" ON public.standings_override FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_matches_division_group ON public.matches(division_id, group_id);
CREATE INDEX idx_teams_division_group ON public.teams(division_id, group_id);
CREATE INDEX idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE UNIQUE INDEX idx_admin_sessions_token_hash ON public.admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_admin_user_id ON public.admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);
CREATE INDEX idx_login_attempts_ip_time ON public.admin_login_attempts(ip_address, attempt_time);

-- Triggers
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matches_modtime BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
