-- Row Level Security for standalone office
-- Single-tenant: anon can read, only service_role can write.
-- city_connections has no anon read (sensitive JWT data).

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_connections ENABLE ROW LEVEL SECURITY;

-- Anon read access (frontend uses anon key for reads)
CREATE POLICY "anon_select" ON agents FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON offices FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON office_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON agent_presence FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON artifacts FOR SELECT TO anon USING (true);
-- No anon read on city_connections (contains JWTs)

-- Service role full access (backend API routes)
CREATE POLICY "service_all" ON agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON offices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON office_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON agent_presence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON artifacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON city_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
