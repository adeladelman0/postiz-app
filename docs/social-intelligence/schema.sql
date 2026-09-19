CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  name text NOT NULL,
  website text,
  industry text,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  voice jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brand_profiles_org_idx ON brand_profiles (organization_id);

CREATE TABLE IF NOT EXISTS social_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  profile_url text NOT NULL,
  handle text,
  external_id text,
  source text NOT NULL CHECK (source IN ('public','connected','imported')),
  is_competitor boolean NOT NULL DEFAULT false,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_targets_org_idx ON social_targets (organization_id);

CREATE TABLE IF NOT EXISTS audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  target_id uuid NOT NULL REFERENCES social_targets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  captured_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_runs_target_idx ON audit_runs (target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  audit_run_id uuid REFERENCES audit_runs(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES social_targets(id) ON DELETE CASCADE,
  external_id text,
  url text,
  published_at timestamptz,
  format text,
  body_text text,
  hook text,
  cta text,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_snapshots_target_idx ON content_snapshots (target_id, published_at DESC);

CREATE TABLE IF NOT EXISTS content_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_snapshot_id uuid NOT NULL REFERENCES content_snapshots(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  metric_value double precision NOT NULL,
  unit text,
  evidence text NOT NULL CHECK (evidence IN ('observed','inferred','recommended')),
  confidence double precision,
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_snapshot_id, metric_key, evidence)
);

CREATE TABLE IF NOT EXISTS content_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  pillars jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES content_strategies(id) ON DELETE SET NULL,
  title text NOT NULL,
  goal text NOT NULL DEFAULT '',
  platform text NOT NULL,
  format text NOT NULL DEFAULT 'other',
  hook text NOT NULL DEFAULT '',
  script text,
  caption text,
  cta text,
  creative_brief text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','production','review','approved','scheduled','published')),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idea_bank_org_status_idx ON idea_bank (organization_id, status);

CREATE TABLE IF NOT EXISTS content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES content_strategies(id) ON DELETE SET NULL,
  horizon_days integer NOT NULL CHECK (horizon_days IN (30,60,90)),
  strategy_summary text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES content_plans(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES idea_bank(id) ON DELETE SET NULL,
  planned_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  platform text NOT NULL,
  format text NOT NULL,
  hook text NOT NULL DEFAULT '',
  script text,
  caption text,
  cta text,
  creative_brief text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','production','review','approved','scheduled','published')),
  postiz_post_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_plan_items_time_idx ON content_plan_items (plan_id, planned_at);

CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  plan_item_id uuid NOT NULL REFERENCES content_plan_items(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','changes_requested','rejected')),
  reviewer_id text,
  message text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  plan_item_id uuid REFERENCES content_plan_items(id) ON DELETE SET NULL,
  postiz_post_id text,
  platform text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS performance_snapshots_post_idx ON performance_snapshots (organization_id, postiz_post_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  insight text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
