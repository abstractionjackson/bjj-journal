import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtDateShort, inDateRange, useSessions } from "../lib";

type SortKey = "recent" | "oldest";

export default function RollSummary() {
  const { sessions } = useSessions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const q = query.trim().toLowerCase();
  const allRolls = sessions
    .filter((s) => inDateRange(s.start, from, to))
    .flatMap((s) =>
      s.rolls
        .filter((r) => !q || r.partnerName.toLowerCase().includes(q))
        .map((r) => ({ session: s, roll: r }))
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.session.start.localeCompare(b.session.start)
        : b.session.start.localeCompare(a.session.start)
    );

  const filtering = Boolean(q || from || to);

  return (
    <>
      <h2>Rolls</h2>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search partners…"
          aria-label="Search partners"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Sort rolls"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest first</option>
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

      {allRolls.length === 0 ? (
        filtering ? (
          <p>No rolls match the current filters.</p>
        ) : (
          <p>
            No rolls logged yet. Add some from the <Link to="/log">Log</Link>.
          </p>
        )
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Partner</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allRolls.map(({ session, roll }) => (
              <tr key={`${session.id}-${roll.id}`}>
                <td>{fmtDateShort(session.start)}</td>
                <td>
                  <Link to={`/partners/${encodeURIComponent(roll.partnerName)}`}>
                    {roll.partnerName}
                  </Link>
                </td>
                <td>{roll.notes || <span className="muted">—</span>}</td>
                <td>
                  <Link to={`/rolls/${session.id}/${roll.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
