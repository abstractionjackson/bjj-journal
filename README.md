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

```
Session
├── id: string (UUID)
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

Partners are auto-registered whenever a session is saved — any partner name not yet in the store is added. A built-in **Generic** partner is always present so rolls with an unknown partner can still be logged.

## Pages

- **Home** — summary stats (sessions, mat time, moves, rolls, partners) and recent sessions (links to full session list)
- **Sessions** — complete session table with date, time, duration, drill and roll counts
- **Log** — sessions data table with create / edit / delete, plus JSON export/import
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
├── .github/workflows/pages.yml   builds the example site for GitHub Pages
└── client/                       React + PicoCSS SPA
    ├── public/favicon.svg
    └── src/
        ├── store.ts              localStorage-backed store + export/import
        ├── exampleData.ts        deterministic 6-month demo dataset
        ├── lib.ts                data hook, formatting, aggregation, fuzzyMatch, inDateRange
        ├── types.ts              data model (Session, Drill, Roll, Partner)
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
            ├── SessionForm.tsx
            └── NoteContent.tsx   Markdown / Org-mode note renderer
```

## Deployment

`.github/workflows/pages.yml` builds the example site (`npm run build:example`) and deploys it to GitHub Pages on every push to `master`. To deploy your own copy, fork the repo, enable Pages (Settings → Pages → Source: GitHub Actions), and push.

## Notes & next steps

- All state goes through `client/src/store.ts`; swapping localStorage for another backend later means changing that one file.
- Possible additions: roll outcomes (sub for/against), gi vs no-gi tagging, move taxonomy, charts on the Home page.
