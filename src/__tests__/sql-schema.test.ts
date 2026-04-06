import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(__dirname, '../../supabase/migrations');

describe('SQL migrations', () => {
  const initSql = readFileSync(join(MIGRATIONS_DIR, '001_init.sql'), 'utf-8');
  const rlsSql = readFileSync(join(MIGRATIONS_DIR, '002_rls.sql'), 'utf-8');

  describe('001_init.sql', () => {
    it('creates all 7 tables', () => {
      const tables = ['agents', 'offices', 'office_sessions', 'agent_presence', 'messages', 'artifacts', 'city_connections'];
      for (const table of tables) {
        expect(initSql, `Missing CREATE TABLE ${table}`).toContain(`CREATE TABLE ${table}`);
      }
    });

    it('agent_presence has composite PK matching OBC bot_building_presence', () => {
      expect(initSql).toContain('PRIMARY KEY (session_id, agent_id)');
    });

    it('messages.session_id is text (matches OBC chat_messages)', () => {
      expect(initSql).toMatch(/session_id\s+text\s+NOT NULL/);
    });

    it('messages.id is uuid (matches OBC chat_messages PK type)', () => {
      expect(initSql).toContain('id uuid PRIMARY KEY DEFAULT gen_random_uuid()');
    });

    it('artifacts has status check constraint matching OBC', () => {
      expect(initSql).toContain("status IN ('published', 'draft', 'abandoned')");
    });

    it('enables realtime on agent_presence, messages, agents', () => {
      expect(initSql).toContain('supabase_realtime ADD TABLE agent_presence');
      expect(initSql).toContain('supabase_realtime ADD TABLE messages');
      expect(initSql).toContain('supabase_realtime ADD TABLE agents');
    });

    it('agents has display_name unique index', () => {
      expect(initSql).toContain('idx_agents_display_name');
    });

    it('city_connections references agents', () => {
      expect(initSql).toContain('agent_id uuid PRIMARY KEY REFERENCES agents(id)');
    });

    it('does not contain any OBC-only columns', () => {
      // These columns exist in OBC bots but should NOT be in standalone agents
      const obcOnlyColumns = ['current_zone_id', 'webhook_url', 'webhook_token', 'is_npc', 'npc_config', 'is_swarm', 'paused'];
      for (const col of obcOnlyColumns) {
        expect(initSql, `Should not contain OBC-only column: ${col}`).not.toMatch(new RegExp(`\\b${col}\\b`));
      }
    });
  });

  describe('002_rls.sql', () => {
    it('enables RLS on all 7 tables', () => {
      const tables = ['agents', 'offices', 'office_sessions', 'agent_presence', 'messages', 'artifacts', 'city_connections'];
      for (const table of tables) {
        expect(rlsSql, `Missing ENABLE ROW LEVEL SECURITY on ${table}`).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      }
    });

    it('has anon select policies for 6 tables (not city_connections)', () => {
      const anonTables = ['agents', 'offices', 'office_sessions', 'agent_presence', 'messages', 'artifacts'];
      for (const table of anonTables) {
        expect(rlsSql).toContain(`ON ${table} FOR SELECT TO anon`);
      }
      // city_connections should NOT have anon select
      expect(rlsSql).not.toContain('ON city_connections FOR SELECT TO anon');
    });

    it('has service_role policies for all 7 tables', () => {
      const tables = ['agents', 'offices', 'office_sessions', 'agent_presence', 'messages', 'artifacts', 'city_connections'];
      for (const table of tables) {
        expect(rlsSql).toContain(`ON ${table} FOR ALL TO service_role`);
      }
    });
  });
});
