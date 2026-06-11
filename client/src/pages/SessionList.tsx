import { Link } from "react-router-dom";
import {
  durationMinutes,
  fmtDate,
  fmtDuration,
  fmtTime,
  useSessions,
} from "../lib";

export default function SessionList() {
  const { sessions } = useSessions();

  return (
    <>
      <h2>All sessions</h2>
      {sessions.length === 0 ? (
        <p>
          Nothing logged yet. Head to the <Link to="/log">Log</Link> to record
          your first session.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Drills</th>
              <th>Rolls</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/sessions/${s.id}`}>{fmtDate(s.start)}</Link>
                </td>
                <td>
                  {fmtTime(s.start)}–{fmtTime(s.end)}
                </td>
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
