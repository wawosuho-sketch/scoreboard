CREATE UNIQUE INDEX idx_admin_sessions_token_hash ON public.admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_admin_user_id ON public.admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

ALTER TABLE public.admin_users ADD COLUMN pin_salt TEXT;

CREATE TABLE public.admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL
);

CREATE INDEX idx_login_attempts_ip_time ON public.admin_login_attempts(ip_address, attempt_time);
