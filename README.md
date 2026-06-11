# BJJ Journal

A structured training log for Brazilian Jiu-Jitsu. Log sessions with the drills you worked and the rounds you rolled, then review your history by session, by move, or by partner.

## Stack

| Layer      | Choice |
|------------|--------|
| Frontend   | React + TypeScript (Vite), PicoCSS |
| Backend    | Node.js + TypeScript, Express |
| Storage    | JSON document (`server/data/sessions.json`) |
| Validation | JSON Schema via Ajv |
| API        | REST |
| Auth       | HTTP Basic Auth |

## Getting started

```bash
npm install          # installs root, server, and client workspaces
npm run dev          # runs API (:3001) and Vite dev server (:5173) together
```

Open http://localhost:5173 and sign in. Default credentials are `admin` / `changeme`; override them with environment variables:

```bash
BJJ_USER=jack BJJ_PASS=s3cret npm run dev
```

### Production build

```bash
npm run build        # compiles server to server/dist and client to client/dist
npm start            # serves API + built client from :3001
```

## Data model

```
Session
├── id: string (UUID, server-assigned)
├── start: datetime (ISO 8601)
├── end: datetime (ISO 8601)
├── notes: string (Markdown or Org-mode)
├── drills: Drill[]
│   ├── id: string
│   ├── moveName: string
│   └── moveCategory: "attack" | "defense" | "transition"
└── rolls: Roll[]
    ├── id: string
    ├── partnerName: string
    └── notes: string

Partner
├── id: string (UUID, or "generic" for the built-in fallback)
└── name: string (unique, case-insensitive)
```

Partners are auto-registered whenever a session is saved — any partner name not yet in the store is added. A built-in **Generic** partner (id `generic`) is always present so rolls with an unknown partner can still be logged. Partners are stored alongside sessions in the same JSON document.

## REST API

All `/api` routes require Basic Auth.

### Sessions

| Method | Path                 | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/api/sessions`      | List sessions (newest first) |
| POST   | `/api/sessions`      | Create a session             |
| GET    | `/api/sessions/:id`  | Fetch one session            |
| PUT    | `/api/sessions/:id`  | Replace a session            |
| DELETE | `/api/sessions/:id`  | Delete a session             |

### Partners

| Method | Path                  | Description                                    |
|--------|-----------------------|------------------------------------------------|
| GET    | `/api/partners`       | List all partners (Generic first, then A–Z)    |
| POST   | `/api/partners`       | Create a partner (409 if name already exists)  |
| GET    | `/api/partners/:id`   | Fetch one partner                              |

Request bodies for POST/PUT are validated against a JSON Schema (`server/src/schema.ts`); invalid payloads return `400` with Ajv error details.

Example — create a session:

```bash
curl -u admin:changeme -X POST http://localhost:3001/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "start": "2026-06-11T18:30:00Z",
    "end": "2026-06-11T20:00:00Z",
    "notes": "Good rounds.",
    "drills": [{ "moveName": "Arm Drag", "moveCategory": "attack" }],
    "rolls": [{ "partnerName": "Nick", "notes": "Got the back." }]
  }'
```

## Frontend pages

- **Home** — summary stats (sessions, mat time, moves, rolls, partners) and recent sessions (links to full session list)
- **Sessions** — complete session table with date, time, duration, drill and roll counts
- **Log** — sessions data table with create / edit / delete
- **Session detail** — full drills and rolls for one session, notes rendered as Markdown or Org
- **Moves** — every move drilled, with fuzzy search, sort, category filter, and date-range filter
- **Move detail** — sessions where a given move was drilled
- **Rolls** — partner summary (search, sort, date-range filter) plus every individual roll with partner links
- **Roll detail** — one roll with its notes rendered as Markdown or Org, linked back to its session
- **Partner detail** — all rolls with a given partner, linked to their sessions and individual roll pages

Notes fields on session and roll detail pages are rendered by a dependency-free inline renderer that auto-detects Markdown vs Org-mode format and supports headings, lists, blockquotes, fenced code blocks, bold/italic/code, and links (only `http(s)` targets are followed).

## Project layout

```
bjj-journal/
├── server/              Express + Ajv REST API
│   ├── src/
│   │   ├── index.ts              app entrypoint (also serves client build)
│   │   ├── auth.ts               Basic Auth middleware
│   │   ├── schema.ts             JSON Schema + validators (sessions, partners)
│   │   ├── storage.ts            JSON document store (atomic writes)
│   │   ├── types.ts              data model (Session, Drill, Roll, Partner)
│   │   └── routes/
│   │       ├── sessions.ts
│   │       └── partners.ts
│   └── data/sessions.json        the JSON document (includes partners array)
└── client/              React + PicoCSS SPA
    └── src/
        ├── api.ts                fetch client w/ Basic Auth
        ├── lib.ts                data hook, formatting, aggregation, fuzzyMatch, inDateRange
        ├── types.ts              client-side types (Session, Partner, …)
        ├── pages/
        │   ├── Home.tsx
        │   ├── Log.tsx
        │   ├── SessionList.tsx
        │   ├── SessionDetail.tsx
        │   ├── MoveSummary.tsx
        │   ├── MoveDetail.tsx
        │   ├── RollSummary.tsx
        │   ├── RollDetail.tsx
        │   └── PartnerDetail.tsx
        └── components/
            ├── Login.tsx
            ├── SessionForm.tsx
            └── NoteContent.tsx   Markdown / Org-mode note renderer
```

## Notes & next steps

- The JSON store keeps everything in one file with atomic writes — fine for a single user, easy to migrate to SQLite/Postgres later by swapping `storage.ts`.
- Basic Auth sends credentials on every request; run behind HTTPS in any real deployment.
- Possible additions: roll outcomes (sub for/against), gi vs no-gi tagging, move taxonomy, charts on the Home page.
