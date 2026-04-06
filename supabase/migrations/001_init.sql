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
  office_id uuid NOT NULL REFERENCES offices(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Who is in the office right now
-- Mirrors OBC bot_building_presence exactly:
--   composite PK (session_id, bot_id), joined_at, left_at, role
CREATE TABLE agent_presence (
  session_id uuid NOT NULL REFERENCES office_sessions(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  role text,
  PRIMARY KEY (session_id, agent_id)
);

-- Chat messages
-- Mirrors OBC chat_messages: id (uuid PK), session_id (text — OBC uses string patterns),
-- bot_id (uuid FK), message (text NOT NULL), ts (timestamptz), metadata (jsonb)
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  agent_id uuid REFERENCES agents(id),
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
  creator_agent_id uuid REFERENCES agents(id),
  session_id uuid REFERENCES office_sessions(id),
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

-- City connection state (optional — only when city mode enabled)
-- JWT stored here, only readable by service_role
CREATE TABLE city_connections (
  agent_id uuid PRIMARY KEY REFERENCES agents(id),
  city_bot_id uuid NOT NULL,
  city_zone_id integer,
  connected_at timestamptz DEFAULT now(),
  last_sync_at timestamptz
);

-- Enable Supabase Realtime on tables the frontend subscribes to
ALTER PUBLICATION supabase_realtime ADD TABLE agent_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
