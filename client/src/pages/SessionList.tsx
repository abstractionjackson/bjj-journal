import { useState } from "react";
import { Link } from "react-router-dom";
import Clock from "../components/Clock";
import {
  dateKey,
  fmtDate,
  fmtDateShort,
  fuzzyMatch,
  sessionName,
  sessionPositions,
  useSessions,
} from "../lib";

export default function SessionList() {
  const { sessions } = useSessions();
  const [query, setQuery] = useState("");

  const positions = sessionPositions(sessions);
  const filtered = sessions.filter((s) => {
    const name = sessionName(s, positions.get(s.id) ?? 0);
    return fuzzyMatch(query, name) || fuzzyMatch(query, fmtDate(s.start));
  });

  return (
    <>
      <h2>All sessions</h2>
      {sessions.length === 0 ? (
        <p>
          Nothing logged yet. Head to the <Link to="/log">Log</Link> to record
          your first session.
        </p>
      ) : (
        <>
          <div className="filter-bar">
            <input
              type="search"
              placeholder="Search by name or date…"
              aria-label="Search sessions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <p>No sessions match the current search.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Drills</th>
                  <th>Rolls</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/sessions/${s.id}`}>
                        {sessionName(s, positions.get(s.id) ?? 0)}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/dates/${dateKey(s.start)}`}>
                        {fmtDateShort(s.start)}
                      </Link>
                    </td>
                    <td>
                      <Clock start={s.start} end={s.end} />
                    </td>
                    <td>{s.drills.length}</td>
                    <td>{s.rolls.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
