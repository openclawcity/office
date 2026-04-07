# Office <> OBC Sync Gap Analysis

**Date**: 2026-04-07
**OBC ref commit**: `ca36c2b50` (radio and tata updates)

---

## 1. What We Built (office repo, current state)

| Component | Status | Notes |
|---|---|---|
| Office3D.tsx | Basic | Config-driven desks, adapter pattern, ESC handler |
| VoxelAgent.tsx | Basic | Corridor pathfinding, walk/idle animation, activity indicators |
| AgentSync.tsx | Adapter-based | Uses OfficeAdapter interface (not direct Supabase) |
| OfficeCamera.tsx | Parameterized | WASD + orbit, room bounds from props |
| OfficeLighting.tsx | Parameterized | Desk lamp positions from props |
| Desk.tsx | Full | Holographic labels, chair, clutter, monitor |
| OfficeFloor.tsx | Parameterized | Room size from props |
| OfficeWalls.tsx | Parameterized | Room size + wall color from props |
| RestArea.tsx | Parameterized | Room width from props |
| FillerFurniture.tsx | Parameterized | Room dims + configurable sign text |
| DemoAdapter | Done | 4 mock agents, activity cycling |
| SupabaseAdapter | Done | Realtime postgres_changes, UUID validation |
| Office config | Done | 4 presets, generateLayout() |
| SQL migrations | Done | 7 tables, RLS, indexes |
| Tests | 65 passing | Adapters, config, pathfinding, schema |

## 2. What OBC Has Now (deployed, not just planned)

### 2A. 3D Interior Features We're Missing

| Feature | OBC file | Lines | Priority |
|---|---|---|---|
| **Wander scheduler** | TataOffice3D.tsx:117-154 | 37 | HIGH — makes idle agents walk in break room with personality-based timing |
| **SEAT_POSITIONS** | constants.ts:18-28 | 10 | HIGH — agents sit at y=0.21 in chairs, not stand at floor |
| **WANDER_POINTS** | constants.ts:42-53 | 12 | HIGH — 10 named break room positions for idle agents |
| **Activity overrides** | TataOffice3D.tsx:70-104 | 34 | MEDIUM — force 'working' for 3 min after Chat/Call interaction |
| **Agent selection panel** | TataOffice3D.tsx:282-364 | 82 | HIGH — click agent shows context menu (Chat/Call/Work) |
| **Per-agent personality** | VoxelAgent.tsx:35-47 | 12 | MEDIUM — hash-based speed, walk cadence, breath rate per agent |
| **Seated animation** | VoxelAgent.tsx (seated pose) | ~30 | HIGH — bent legs, typing motion when at desk |
| **Activity bubbles (large)** | VoxelAgent.tsx (billboard) | ~25 | MEDIUM — WORKING/THINKING/BLOCKED billboard with task text |
| **Chat bubbles** | VoxelAgent.tsx + AgentSync | ~40 | MEDIUM — ephemeral 6s message from bot_spoke |
| **Ambient office audio** | TataOffice3D.tsx:171-208 | 37 | LOW — AC hum via Web Audio API |
| **Input focus guard** | OfficeCamera.tsx:27-29 | 3 | HIGH — don't pan camera when typing in input fields |
| **Stuck key prevention** | OfficeCamera.tsx:42 | 1 | HIGH — clear keys on focusin |
| **AgentSync prefix filter** | AgentSync.tsx:agentPrefix | ~20 | MEDIUM — filter by display_name prefix |
| **Always-present agents** | AgentSync.tsx:alwaysPresentPrefix | ~25 | MEDIUM — ensure agents show even if DB says left |
| **AgentState.activityMeta** | types.ts | 1 | HIGH — needed for activity bubble task text |
| **AgentState.lastMessage** | types.ts | 1 | MEDIUM — needed for chat bubbles |
| **ROOM_WIDTH = 15** | constants.ts:1 | 1 | LOW — our generateLayout handles any width |
| **7th desk (CMO)** | constants.ts:9 | 1 | LOW — our config system handles any desk count |

### 2B. Supabase Tables We're Missing

| Table | Columns | Purpose | Priority |
|---|---|---|---|
| `activity_log` | id(bigint), bot_id(uuid), zone_id(int), activity(text), detail(text), metadata(jsonb), created_at | Tenant activity stream — append-only history of agent actions | HIGH |
| `corporate_zone_access` | id(uuid), user_id(uuid), zone_id(int), role(text), tenant(text), created_at | Who can access which tenant zone | MEDIUM (Phase 3 city bridge) |

### 2C. Worker Features Deployed

| Feature | File | Purpose | Impact on office |
|---|---|---|---|
| `tenantActivity.ts` | workers/src/lib/ | Fire-and-forget activity logging for corporate zones | Our SupabaseAdapter should subscribe to activity_log for the activity stream |
| `POST /agents/activity` | workers/src/routes/ | Agent sets current_activity + current_activity_meta | Our SupabaseAdapter already watches bots.current_activity |
| Memory service | docker/memory-service/ | Shared MemPalace via MCP/SSE | No impact on office — agent runtime concern |

### 2D. Frontend Features Deployed

| Feature | File | Purpose | Impact |
|---|---|---|---|
| WorkspaceClient activity stream | src/app/workspace/ | Real-time activity feed from bots table | Our office should show similar activity indicators |

## 3. Gap Summary (Ordered by Priority)

### Must Have (blocks quality parity with OBC)

1. **Wander scheduler + WANDER_POINTS** — idle agents look frozen without this
2. **SEAT_POSITIONS** — agents float at floor level instead of sitting in chairs
3. **Agent selection panel** — clicking agents does nothing useful
4. **Seated animation** — agents stand at desks instead of typing
5. **AgentState.activityMeta + lastMessage** — missing fields break bubbles
6. **Input focus guard** — WASD fires while typing in select/inputs
7. **activity_log table** — needed for enterprise activity stream

### Should Have (noticeably better with)

8. **Per-agent personality** — all agents move/breathe identically without this
9. **Activity bubbles** — no visual feedback on what agent is doing
10. **Chat bubbles** — no visual feedback when agent speaks
11. **Activity overrides** — latency between user action and visual feedback
12. **Always-present agents** — agents can "disappear" in edge cases
13. **Ambient audio** — immersive polish

### Nice to Have (Phase 3+)

14. **corporate_zone_access table** — only needed for city bridge auth
15. **AgentSync prefix filter** — our adapter handles this differently

## 4. Implementation Plan

### Wave 1: Core 3D Parity (Issues #22-#27)

Files to change:
- `src/components/office-3d/core/types.ts` — add activityMeta, lastMessage
- `src/lib/adapter.ts` — add activityMeta, lastMessage to AgentState
- `src/components/office-3d/core/constants.ts` — add WANDER_POINTS, SEAT_POSITIONS helper, generateLayout updates
- `src/components/office-3d/Office3D.tsx` — wander scheduler, seat positions, agent selection panel, activity overrides
- `src/components/office-3d/agents/VoxelAgent.tsx` — per-agent personality, seated animation, activity/chat bubbles, onAgentClick
- `src/components/office-3d/systems/OfficeCamera.tsx` — input focus guard, stuck key prevention
- `src/components/office-3d/systems/AgentSync.tsx` — expose lastMessage from adapter
- `src/lib/adapters/demo.ts` — emit activityMeta + lastMessage in mock data

### Wave 2: Activity Stream (Issues #28-#29)

Files to change:
- `supabase/migrations/003_activity_log.sql` — new table
- `src/lib/adapter.ts` — add subscribeActivity method to OfficeAdapter
- `src/lib/adapters/demo.ts` — mock activity events
- `src/lib/adapters/supabase.ts` — subscribe to activity_log INSERT
- `src/components/hud/ActivityStream.tsx` — new component

### Wave 3: Audio + Polish (Issue #30)

Files to change:
- `src/components/office-3d/Office3D.tsx` — ambient audio system
