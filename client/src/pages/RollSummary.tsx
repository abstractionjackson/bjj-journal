import { useState } from "react";
import { Link } from "react-router-dom";
import { aggregatePartners, fmtDate, inDateRange, useSessions } from "../lib";

type SortKey = "rolls" | "recent";

export default function RollSummary() {
  const { sessions, error } = useSessions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("rolls");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (error) return <p style={{ color: "var(--belt-red)" }}>{error}</p>;
  if (!sessions) return <p aria-busy="true">Loading rolls…</p>;

  const q = query.trim().toLowerCase();
  const visibleSessions = sessions
    .filter((s) => inDateRange(s.start, from, to))
    .map((s) => ({
      ...s,
      rolls: s.rolls.filter(
        (r) => !q || r.partnerName.toLowerCase().includes(q)
      ),
    }));

  const partners = aggregatePartners(visibleSessions);
  if (sort === "recent") {
    partners.sort(
      (a, b) =>
        new Date(b.lastRolled).getTime() - new Date(a.lastRolled).getTime()
    );
  }

  const allRolls = visibleSessions.flatMap((s) =>
    s.rolls.map((r) => ({ session: s, roll: r }))
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
          aria-label="Sort partners"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="rolls">Most rolls</option>
          <option value="recent">Recently rolled</option>
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

      <h3>Partners</h3>
      {partners.length === 0 ? (
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
              <th>Partner</th>
              <th>Rolls</th>
              <th>Last rolled</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.partnerName.toLowerCase()}>
                <td>
                  <Link to={`/partners/${encodeURIComponent(p.partnerName)}`}>
                    {p.partnerName}
                  </Link>
                </td>
                <td>{p.rollCount}</td>
                <td>{fmtDate(p.lastRolled)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {allRolls.length > 0 && (
        <>
          <h3>All rolls</h3>
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
                  <td>{fmtDate(session.start)}</td>
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
        </>
      )}
    </>
  );
}
