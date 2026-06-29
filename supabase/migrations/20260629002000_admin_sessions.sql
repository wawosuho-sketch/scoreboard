-- 1. Create admin_sessions table
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (No public access, strictly service role or admin interactions)
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Allow public read-only access for standings_override
CREATE POLICY "Allow public read-only access for standings_override" 
ON public.standings_override FOR SELECT USING (true);
