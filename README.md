# One Task View

A focused front-end for [Todoist](https://todoist.com) that shows you **one task at a time**.

Todoist is excellent at capture and lousy at focus: open it on a busy day and you get a wall of
forty things, which is a reliable way to do none of them. One Task View sits on top of the same
data and shows a single task, with everything else deliberately out of sight until you deal with it.

Built for my own ADHD brain, and shared in case it fits yours.

## What it does

- **Focus view** — one task, full screen. Complete it, reschedule it, or skip it, then the next one appears.
- **Pomodoro timer** — start a timer against the task in front of you.
- **Overdue manager** — bulk-triage the backlog that builds up when you stop looking, instead of scrolling it.
- **All tasks view** — the full list with a completion trend, for when you do want the wide angle.
- **Analytics** — a daily log of what you actually finished, not just what you planned.
- **Family view** — shared tasks split out from personal ones.
- **Mobile-first layout** — usable one-handed on a phone.

Everything writes straight back to Todoist, so your data stays where it already lives. This is a
different lens on it, not another place to keep things.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Todoist REST API v1 · Vercel Edge Config for
cross-device state. No database, no auth library, no accounts.

## Running it yourself

```bash
npm install
cp .env.example .env.local   # add your own Todoist API token
npm run dev
```

Get a token from Todoist → Settings → Integrations → Developer. It is read server-side only
(`process.env.TODOIST_API_TOKEN`) and never reaches the browser; every Todoist call goes through
`/app/api/` routes. No token is committed to this repository.

To deploy, set `TODOIST_API_TOKEN` in your host's environment. `APP_PASSWORD` is optional: set it to
put a simple password gate in front of the app, leave it unset locally and the gate is skipped.

## Status

Personal project, used daily, built in the open. Issues and forks welcome; I'm not promising a
roadmap.

---

Built by [Rajeev Idnani](https://www.linkedin.com/in/rajeev-idnani).
