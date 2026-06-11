import { useState } from "react";
import { Link } from "react-router-dom";
import {
  aggregateMoves,
  CATEGORY_LABEL,
  fmtDate,
  fuzzyMatch,
  inDateRange,
  useSessions,
} from "../lib";
import type { MoveCategory } from "../types";

type SortKey = "drilled" | "recent" | "name";

export default function MoveSummary() {
  const { sessions, error } = useSessions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("drilled");
  const [category, setCategory] = useState<"all" | MoveCategory>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (error) return <p style={{ color: "var(--belt-red)" }}>{error}</p>;
  if (!sessions) return <p aria-busy="true">Loading moves…</p>;

  const moves = aggregateMoves(sessions)
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
            new Date(b.lastDrilled).getTime() -
            new Date(a.lastDrilled).getTime()
          );
        case "name":
          return a.moveName.localeCompare(b.moveName);
        default:
          return b.timesDrilled - a.timesDrilled;
      }
    });

  return (
    <>
      <h2>Moves drilled</h2>

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
            No drills logged yet. Add some from the <Link to="/log">Log</Link>.
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
                <td>{fmtDate(m.lastDrilled)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
