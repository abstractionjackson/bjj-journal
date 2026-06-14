# BJJ Journal

A structured training log for Brazilian Jiu-Jitsu. Log sessions with the drills you worked and the rounds you rolled, then review your history by session, by move, or by partner.

BJJ Journal is a pure front-end app: it runs entirely in your browser, stores your journal in localStorage, and needs no server, no account, and no sign-in. It is built for a single user — you.

**Live example:** <https://abstractionjackson.github.io/bjj-journal/> — the same app seeded with six months of realistic demo data.

## Stack

| Layer    | Choice                                |
|----------|---------------------------------------|
| UI       | React + TypeScript (Vite), PicoCSS    |
| State    | In-browser store (`client/src/store.ts`) |
| Storage  | `localStorage`, with JSON export/import |
| Routing  | React Router                          |

## Running it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/abstractionjackson/bjj-journal.git
cd bjj-journal
npm install
npm run dev          # Vite dev server on http://localhost:5173
```

Open http://localhost:5173 and start logging — there is nothing else to set up.

### Production build

```bash
npm run build        # builds the static site to client/dist
npm run preview      # serves the built site locally
```

`client/dist` is a fully static site; host it anywhere that serves files (GitHub Pages, Netlify, a USB stick).

### Example build

```bash
npm run build:example
```

Builds the site in example mode: it seeds six months of deterministic mock training data (under a separate localStorage key, so it never touches a real journal) and shows a banner linking back to this repo. This is what the GitHub Actions workflow deploys to GitHub Pages on every push.

## Your data

The journal lives in your browser's localStorage under the key `bjj-journal.data`. On the **Log** page:

- **Export JSON** downloads the whole journal (sessions + partners) as a dated JSON file — use it for backups or to move between machines/browsers.
- **Import JSON** restores a previously exported file, replacing whatever is currently stored.

Clearing site data in your browser deletes the journal, so export now and then.

## Data model

```json
{
  "sessions": [
    {
      "id":     "uuid",
      "name":   "Session #42 (optional — defaults to position)",
      "start":  "2026-06-11T18:30:00",
      "end":    "2026-06-11T20:00:00",
      "notes":  "Markdown or Org-mode text",
      "drills": [
        {
          "id":        "uuid",
          "moveNames": ["Armbar from Guard", "Triangle Choke"]
        }
      ],
      "rolls": [
        {
          "id":          "uuid",
          "partnerName": "Marcus",
          "notes":       "Got the back off a scramble."
        }
      ]
    }
  ],
  "moves": [
    {
      "name":     "Armbar from Guard",
      "category": "attack | defense | transition",
      "notes":    "Markdown or Org-mode text"
    }
  ],
  "partners": [
    { "id": "uuid",    "name": "Marcus" },
    { "id": "generic", "name": "Generic" }
  ]
}
```

A session's `name` is optional; when omitted it falls back to `Session #N`, where the position `N` is fixed by chronology (earliest session is #1). Each drill references moves by name from the **moves** catalog, which carries each move's category and notes. Moves and partners are both auto-registered whenever a session is saved — any move or partner name not yet in the store is added (older journals with inline `moveName`/`moveCategory` drills are migrated automatically on load and import). A built-in **Generic** partner is always present so rolls with an unknown partner can still be logged.

## Pages

- **Home** — summary stats (sessions, mat time, moves, rolls, partners) and a monthly training calendar; days with sessions link to their date page
- **Sessions** — complete session table with name, date, time (clock visualization), drill and roll counts, plus name/date search
- **Log** — sessions data table with create / edit / delete (multi-move drills, inline move creation), plus JSON export/import
- **Session detail** — moves drilled and rolls for one session, notes rendered as Markdown or Org
- **Date page** — every session logged on a given date
- **Moves** — the move catalog (including moves not yet drilled), with fuzzy search, sort, category filter, date-range filter, and add-move
- **Move detail** — a move's category and editable notes, and the sessions where it was drilled
- **Rolls** — every individual roll, with partner search, sort, and date-range filter
- **Partners** — the partner catalog with roll counts and last-rolled date
- **Roll detail** — one roll with its notes rendered as Markdown or Org, linked back to its session
- **Partner detail** — all rolls with a given partner, linked to their sessions and individual roll pages

Notes fields on session and roll detail pages are rendered by a dependency-free inline renderer that auto-detects Markdown vs Org-mode format and supports headings, lists, blockquotes, fenced code blocks, bold/italic/code, and links (only `http(s)` targets are followed).

## Project layout

```
bjj-journal/
├── .github/workflows/pages.yml   builds the example site for GitHub Pages
└── client/                       React + PicoCSS SPA
    ├── public/favicon.svg
    └── src/
        ├── store.ts              localStorage-backed store + export/import
        ├── exampleData.ts        deterministic 6-month demo dataset
        ├── lib.ts                data hook, formatting, aggregation, fuzzyMatch, inDateRange
        ├── types.ts              data model (Session, Drill, Move, Roll, Partner)
        ├── pages/
        │   ├── Home.tsx
        │   ├── Log.tsx
        │   ├── SessionList.tsx
        │   ├── SessionDetail.tsx
        │   ├── DatePage.tsx
        │   ├── MoveSummary.tsx
        │   ├── MoveDetail.tsx
        │   ├── RollSummary.tsx
        │   ├── RollDetail.tsx
        │   ├── Partners.tsx
        │   └── PartnerDetail.tsx
        └── components/
            ├── SessionForm.tsx
            ├── Clock.tsx         12-hour clock visualization of a session's time range
            └── NoteContent.tsx   Markdown / Org-mode note renderer
```

## Deployment

`.github/workflows/pages.yml` builds the example site (`npm run build:example`) and deploys it to GitHub Pages on every push to `master`. To deploy your own copy, fork the repo, enable Pages (Settings → Pages → Source: GitHub Actions), and push.

## Notes & next steps

- All state goes through `client/src/store.ts`; swapping localStorage for another backend later means changing that one file.
- Possible additions: roll outcomes (sub for/against), gi vs no-gi tagging, move taxonomy, charts on the Home page.
