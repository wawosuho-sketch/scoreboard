-- 20260629001000_constraints_indexes_rls.sql

-- 1. Create admin_users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SCORE_MANAGER', 'BRACKET_MANAGER', 'VIEW_ONLY')),
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update standings_override to reference admin_users
ALTER TABLE public.standings_override
  DROP COLUMN locked_by,
  ADD COLUMN locked_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- 3. Add matches constraints
ALTER TABLE public.matches
ADD CONSTRAINT matches_score_non_negative
CHECK (
  (home_score IS NULL OR home_score >= 0)
  AND
  (away_score IS NULL OR away_score >= 0)
);

ALTER TABLE public.matches
ADD CONSTRAINT matches_no_same_team
CHECK (
  home_team_id IS NULL
  OR away_team_id IS NULL
  OR home_team_id <> away_team_id
);

ALTER TABLE public.matches
ADD CONSTRAINT matches_forfeit_score_rule
CHECK (
  is_forfeit = false
  OR
  (
    (home_score = 20 AND away_score = 0)
    OR
    (home_score = 0 AND away_score = 20)
  )
);

ALTER TABLE public.matches
ADD CONSTRAINT matches_completed_requires_scores
CHECK (
  status NOT IN ('COMPLETED', 'FORFEIT_COMPLETED')
  OR
  (
    home_score IS NOT NULL
    AND away_score IS NOT NULL
    AND winner_team_id IS NOT NULL
    AND loser_team_id IS NOT NULL
    AND result_confirmed_at IS NOT NULL
  )
);

ALTER TABLE public.matches
ADD CONSTRAINT matches_no_draw_when_completed
CHECK (
  status NOT IN ('COMPLETED', 'FORFEIT_COMPLETED')
  OR home_score <> away_score
);

-- 4. Enable RLS
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow public read-only access for divisions" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for bracket_slots" ON public.bracket_slots FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_matches_division_group ON public.matches(division_id, group_id);
CREATE INDEX idx_teams_division_group ON public.teams(division_id, group_id);
CREATE INDEX idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX idx_matches_status ON public.matches(status);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matches_modtime
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
