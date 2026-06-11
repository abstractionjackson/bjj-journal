import { Link } from "react-router-dom";
import {
  aggregateMoves,
  aggregatePartners,
  durationMinutes,
  fmtDate,
  fmtDuration,
  useSessions,
} from "../lib";

export default function Home() {
  const { sessions } = useSessions();

  const totalMinutes = sessions.reduce((sum, s) => sum + durationMinutes(s), 0);
  const totalRolls = sessions.reduce((sum, s) => sum + s.rolls.length, 0);
  const moves = aggregateMoves(sessions);
  const partners = aggregatePartners(sessions);
  const recent = sessions.slice(0, 5);

  return (
    <>
      <h2>Training summary</h2>
      <div className="stat-grid">
        <article>
          <span className="value">{sessions.length}</span>
          <span className="label">Sessions</span>
        </article>
        <article>
          <span className="value">{fmtDuration(totalMinutes)}</span>
          <span className="label">Mat time</span>
        </article>
        <article>
          <span className="value">{moves.length}</span>
          <span className="label">Moves drilled</span>
        </article>
        <article>
          <span className="value">{totalRolls}</span>
          <span className="label">Rolls</span>
        </article>
        <article>
          <span className="value">{partners.length}</span>
          <span className="label">Partners</span>
        </article>
      </div>

      <hgroup>
        <h3>Recent sessions</h3>
        <p>
          <Link to="/sessions">View all sessions →</Link>
        </p>
      </hgroup>
      {recent.length === 0 ? (
        <p>
          Nothing logged yet. Head to the <Link to="/log">Log</Link> to record
          your first session.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Duration</th>
              <th>Drills</th>
              <th>Rolls</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id}>
                <td>{fmtDate(s.start)}</td>
                <td>{fmtDuration(durationMinutes(s))}</td>
                <td>{s.drills.length}</td>
                <td>{s.rolls.length}</td>
                <td>
                  <Link to={`/sessions/${s.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
