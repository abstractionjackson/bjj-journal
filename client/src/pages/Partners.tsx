import { useState } from "react";
import { Link } from "react-router-dom";
import { aggregatePartners, fmtDateShort, useSessions } from "../lib";
import { store } from "../store";

export default function Partners() {
  const { sessions } = useSessions();
  const [query, setQuery] = useState("");

  // Roll stats keyed by lowercase partner name, joined onto the full catalog.
  const stats = new Map(
    aggregatePartners(sessions).map((p) => [p.partnerName.toLowerCase(), p])
  );
  const q = query.trim().toLowerCase();
  const partners = store
    .listPartners()
    .filter((p) => !q || p.name.toLowerCase().includes(q));

  return (
    <>
      <h2>Partners</h2>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search partners…"
          aria-label="Search partners"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {partners.length === 0 ? (
        <p>No partners match the current search.</p>
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
            {partners.map((p) => {
              const stat = stats.get(p.name.toLowerCase());
              return (
                <tr key={p.id}>
                  <td>
                    <Link to={`/partners/${encodeURIComponent(p.name)}`}>
                      {p.name}
                    </Link>
                  </td>
                  <td>{stat?.rollCount ?? 0}</td>
                  <td>
                    {stat ? (
                      fmtDateShort(stat.lastRolled)
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
