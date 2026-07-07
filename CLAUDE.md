@AGENTS.md

# One Task View — Project Guide

## What this is
A personal productivity app that wraps the Todoist API into a focused task interface. Deployed on Vercel, auto-deploys on push to `main`. Only accessible to Rajeev (protected by Vercel Authentication + `APP_PASSWORD` cookie gate).

## Project root
`/Users/rajeev/todoist-focus/`

## Stack
- Next.js 16.2.6 App Router (uses `proxy.ts` instead of `middleware.ts` — do NOT create a `middleware.ts`)
- TypeScript, Tailwind CSS v4
- Todoist REST API v1 (server-side only via `/app/api/`)
- Vercel Edge Config (`@vercel/edge-config`) for cross-device persistence
- No database, no auth library

## Local dev
```
cd /Users/rajeev/todoist-focus
npm run dev -- -p 3002   # port 3000 is taken
```
No `APP_PASSWORD` needed locally — gate is skipped when env var is unset.

## Deploy
```
git add .
git commit -m "..."
git push origin main   # Vercel picks it up automatically
```
Always run `npx tsc --noEmit && npm run build` before pushing.

## Key file map
```
app/
  page.tsx                  # root → renders <FocusView />
  layout.tsx
  login/page.tsx            # password gate UI
  api/
    auth/route.ts           # POST: validates APP_PASSWORD, sets otv_auth cookie
    tasks/route.ts          # GET: fetch tasks by project_id
    tasks/[id]/close/       # POST: complete a task
    tasks/[id]/reschedule/  # POST: reschedule a task
    projects/route.ts       # GET: all projects
    labels/route.ts         # GET: all labels
    stats/route.ts          # GET: productivity stats from Todoist
    trend-log/route.ts      # GET/POST: daily backlog snapshots in Edge Config
    task-snapshot/route.ts  # GET/POST: task ID sets for accurate added count

components/
  FocusView.tsx             # main shell — tabs, filters, state orchestration
  TaskCard.tsx              # single task display
  TabBar.tsx                # 6-tab navigation
  AllTasksView.tsx          # All Tasks tab
  OverdueManager.tsx        # Overdue tab
  VSQuickView.tsx           # Quick VS tab
  VSBracketView.tsx         # Bracket tab
  AnalyticsView.tsx         # Analytics tab (trend graph + stats)
  StatsWidget.tsx           # desktop sidebar stats + trend graph
  MobileStats.tsx           # mobile stats + trend graph
  TrendGraph.tsx            # SVG trend graph component
  FilterBar.tsx             # project/label/priority filters
  ActionButtons.tsx         # done/skip/reschedule buttons
  PomodoroTimer.tsx

hooks/
  useTaskQueue.ts           # core task fetching, filtering, skip/done logic
  useDailyLog.ts            # trend log: syncs to Edge Config, computes added/done
  useStats.ts               # fetches /api/stats
  useProjects.ts
  useLabels.ts
  useOverdueTasks.ts

proxy.ts                    # auth gate (Next.js 16 uses this instead of middleware.ts)
lib/types.ts                # TodoistTask, TodoistProject, LogEntry, etc.
```

## Key conventions
- **Recurring tasks**: use `task.due?.is_recurring` — NOT `task.labels.includes('♻️🤓')` (old pattern, broken)
- **Waiting tasks**: `task.labels.includes('really_waiting')`
- **Focus tasks**: not recurring AND not waiting
- **focusCount**: number of focus tasks — what the trend graph tracks
- **Task sorting**: by due date → priority (P1=4 highest) → day_order

## Cross-device persistence (Edge Config)
Two keys stored in Vercel Edge Config:
- `trend-log`: `Record<date, {count, completed}>` — daily backlog snapshots, last 90 days. Merge rule: lower count wins (best growth narrative). Never write count=0.
- `task-snapshot`: `{date, ids[], prevDate, prevIds[]}` — today's and yesterday's task IDs. Used to compute accurate `added` count (new IDs not seen yesterday).

Writes go via `PATCH https://api.vercel.com/v1/edge-config/{id}/items` using `VERCEL_TOKEN`. Reads use `@vercel/edge-config` SDK.

## Environment variables
| Variable | Where | Purpose |
|----------|-------|---------|
| `TODOIST_API_TOKEN` | Vercel + local | Todoist API access |
| `APP_PASSWORD` | Vercel only | Inner password gate (skip locally) |
| `VERCEL_TOKEN` | Vercel (Prod+Preview) + local `.env.local` | Edge Config writes |
| `EDGE_CONFIG` | Auto-set by Vercel | Edge Config read URL |

## Agent skills — use proactively

These skills are available and should be suggested at the right moments. Don't wait for Rajeev to ask.

| When | Do this |
|------|---------|
| After finishing a feature | Ask: "Want me to run `/verify` to confirm it works in the browser?" |
| Before pushing | Ask: "Should I run `/qa` for a quick pass first?" |
| After `git push origin main` | Immediately run the `vercel-build-monitor` scheduled agent to check deployment status. Report ✅ READY, 🔨 BUILDING, or ❌ ERROR. |
| Something looks broken | Suggest `/investigate` |
| Code review before merging | Suggest `/review` |
| End of a session | Check the backlog below and ask: "Want to tackle anything from the backlog next?" |

To run the Vercel build monitor after pushing:
```bash
curl -s "https://api.vercel.com/v6/deployments?projectId=prj_bkViz2ieVYlocXXChVkvYZoLSEBz&teamId=team_B2pwiv1A2rTbj7TuNywoLyzC&limit=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```
Parse `state`: READY ✅ / BUILDING 🔨 / ERROR ❌. If building, poll every 15s up to 3 times.

## Backlog
- [ ] Mobile tab bar horizontal scroll fix
- [ ] Animations & polish
- [x] Trend data persistence across devices (done — Edge Config)
- [x] Hide recurring fix (done — use `due.is_recurring`)
- [x] Password gate (done — `proxy.ts` + Vercel Auth)
