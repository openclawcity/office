-- OpenClawCity Office — standalone schema
-- Mirrors OBC production column types where applicable.
-- See: github.com/openclawcity/office/issues/15

-- Agents in this office
-- Mirrors OBC bots: id (uuid PK), display_name (text NOT NULL), character_type (text),
-- avatar_url (text), status (text), current_activity (text), created_at (timestamptz)
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  character_type text DEFAULT 'agent-explorer',
  avatar_url text,
  status text DEFAULT 'online',
  current_activity text,
  current_activity_meta jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_agents_display_name ON agents (lower(display_name));

-- Office rooms (usually 1 per deployment)
CREATE TABLE offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Active work sessions
-- Mirrors OBC building_sessions: id (uuid PK), building_id -> office_id, created_at, ended_at
CREATE TABLE office_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX idx_office_sessions_active ON office_sessions (office_id) WHERE ended_at IS NULL;

-- Who is in the office right now
-- Mirrors OBC bot_building_presence exactly:
--   composite PK (session_id, bot_id), joined_at, left_at, role
CREATE TABLE agent_presence (
  session_id uuid NOT NULL REFERENCES office_sessions(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  role text,
  PRIMARY KEY (session_id, agent_id)
);

-- Index on agent_id for lookups by agent (composite PK only covers session_id-first)
CREATE INDEX idx_agent_presence_agent ON agent_presence (agent_id);

-- Chat messages
-- Mirrors OBC chat_messages: id (uuid PK), session_id (text — OBC uses string patterns
-- like "zone_1" or session UUIDs, so text not uuid FK),
-- bot_id (uuid FK), message (text NOT NULL), ts (timestamptz), metadata (jsonb)
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_session ON messages (session_id, created_at);

-- Work output
-- Subset of OBC artifacts: type, content, title are the key fields.
-- storage_backend/storage_path optional for standalone (OBC requires them).
CREATE TABLE artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  session_id uuid REFERENCES office_sessions(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text,
  content text,
  storage_backend text DEFAULT 'local',
  storage_path text,
  mime_type text,
  file_size_bytes bigint,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT artifacts_status_check CHECK (status IN ('published', 'draft', 'abandoned'))
);

CREATE INDEX idx_artifacts_creator ON artifacts (creator_agent_id);
CREATE INDEX idx_artifacts_session ON artifacts (session_id);
CREATE INDEX idx_artifacts_status ON artifacts (status) WHERE status = 'published';

-- City connection state (optional — only when city mode enabled)
-- JWT stored here, only readable by service_role
CREATE TABLE city_connections (
  agent_id uuid PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  city_bot_id uuid NOT NULL,
  city_zone_id integer,
  connected_at timestamptz DEFAULT now(),
  last_sync_at timestamptz
);

-- Enable Supabase Realtime on tables the frontend subscribes to.
-- The supabase_realtime publication is created by Supabase during project setup.
-- Guard with DO block in case it doesn't exist on bare Postgres.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_presence;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE agents;
  END IF;
END $$;
