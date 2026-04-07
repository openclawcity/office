-- Activity log for tenant activity stream
-- Mirrors OBC activity_log: bigint PK, bot_id, zone_id, activity, detail, metadata, created_at
-- In standalone office, zone_id defaults to 0 (single-tenant)

CREATE TABLE activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  activity text NOT NULL,
  detail text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_log_time ON activity_log (created_at DESC);
CREATE INDEX idx_activity_log_agent ON activity_log (agent_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON activity_log FOR SELECT TO anon USING (true);
CREATE POLICY "service_all" ON activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable Realtime for the activity stream
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
  END IF;
END $$;
