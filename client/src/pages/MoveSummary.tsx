import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CATEGORY_LABEL,
  fmtDate,
  fuzzyMatch,
  inDateRange,
  moveStats,
  useMoves,
  useSessions,
} from "../lib";
import { store } from "../store";
import type { MoveCategory } from "../types";

type SortKey = "drilled" | "recent" | "name";

export default function MoveSummary() {
  const { sessions } = useSessions();
  const { moves: catalog, reload } = useMoves();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("drilled");
  const [category, setCategory] = useState<"all" | MoveCategory>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MoveCategory>("attack");
  const [newNotes, setNewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    try {
      store.createMove({ name: newName, category: newCategory, notes: newNotes });
      setNewName("");
      setNewCategory("attack");
      setNewNotes("");
      setAdding(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add move.");
    }
  }

  const moves = moveStats(sessions, catalog)
    .filter((m) => fuzzyMatch(query, m.moveName))
    .filter((m) => category === "all" || m.moveCategory === category)
    .filter(
      (m) =>
        (!from && !to) || m.sessions.some((s) => inDateRange(s.start, from, to))
    )
    .sort((a, b) => {
      switch (sort) {
        case "recent":
          return (
            new Date(b.lastDrilled ?? 0).getTime() -
            new Date(a.lastDrilled ?? 0).getTime()
          );
        case "name":
          return a.moveName.localeCompare(b.moveName);
        default:
          return b.timesDrilled - a.timesDrilled;
      }
    });

  return (
    <>
      <hgroup>
        <h2>Moves</h2>
        <p>Your move catalog — including moves you haven't drilled yet.</p>
      </hgroup>

      {adding ? (
        <article>
          <h3>New move</h3>
          <div className="grid">
            <label>
              Name
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Triangle Choke"
              />
            </label>
            <label>
              Category
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MoveCategory)}
              >
                <option value="attack">Attack</option>
                <option value="defense">Defense</option>
                <option value="transition">Transition</option>
              </select>
            </label>
          </div>
          <label>
            Notes
            <textarea
              rows={3}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Key details, grips, common mistakes…"
            />
          </label>
          {error && <p style={{ color: "var(--belt-red)" }}>{error}</p>}
          <div className="row-actions">
            <button onClick={handleCreate}>Save move</button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </article>
      ) : (
        <button onClick={() => setAdding(true)}>Add move</button>
      )}

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search moves…"
          aria-label="Search moves"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Sort moves"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="drilled">Most drilled</option>
          <option value="recent">Recently drilled</option>
          <option value="name">Name (A–Z)</option>
        </select>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value as "all" | MoveCategory)}
        >
          <option value="all">All categories</option>
          <option value="attack">Attack</option>
          <option value="defense">Defense</option>
          <option value="transition">Transition</option>
        </select>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {moves.length === 0 ? (
        query || category !== "all" || from || to ? (
          <p>No moves match the current filters.</p>
        ) : (
          <p>
            No moves yet. Add one above, or log a drill from the{" "}
            <Link to="/log">Log</Link>.
          </p>
        )
      ) : (
        <table>
          <thead>
            <tr>
              <th>Move</th>
              <th>Category</th>
              <th>Times drilled</th>
              <th>Last drilled</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.moveName.toLowerCase()}>
                <td>
                  <Link to={`/moves/${encodeURIComponent(m.moveName)}`}>
                    {m.moveName}
                  </Link>
                </td>
                <td>
                  <span className={`badge ${m.moveCategory}`}>
                    {CATEGORY_LABEL[m.moveCategory]}
                  </span>
                </td>
                <td>{m.timesDrilled}</td>
                <td>
                  {m.lastDrilled ? (
                    fmtDate(m.lastDrilled)
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
