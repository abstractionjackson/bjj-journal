import { Link, useParams } from "react-router-dom";
import {
  aggregateMoves,
  CATEGORY_LABEL,
  durationMinutes,
  fmtDate,
  fmtDuration,
  useSessions,
} from "../lib";

export default function MoveDetail() {
  const { name } = useParams<{ name: string }>();
  const { sessions, error } = useSessions();

  if (error) return <p style={{ color: "var(--belt-red)" }}>{error}</p>;
  if (!sessions) return <p aria-busy="true">Loading move…</p>;

  const decoded = decodeURIComponent(name ?? "");
  const move = aggregateMoves(sessions).find(
    (m) => m.moveName.toLowerCase() === decoded.toLowerCase()
  );

  if (!move) {
    return (
      <>
        <p>
          <Link to="/moves">← Back to moves</Link>
        </p>
        <p>No drills found for “{decoded}”.</p>
      </>
    );
  }

  return (
    <>
      <p>
        <Link to="/moves">← Back to moves</Link>
      </p>
      <hgroup>
        <h2>{move.moveName}</h2>
        <p>
          <span className={`badge ${move.moveCategory}`}>
            {CATEGORY_LABEL[move.moveCategory]}
          </span>{" "}
          · drilled {move.timesDrilled}{" "}
          {move.timesDrilled === 1 ? "time" : "times"} across{" "}
          {move.sessions.length}{" "}
          {move.sessions.length === 1 ? "session" : "sessions"}
        </p>
      </hgroup>

      <h3>Sessions featuring this move</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Duration</th>
            <th>Session notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {move.sessions.map((s) => (
            <tr key={s.id}>
              <td>{fmtDate(s.start)}</td>
              <td>{fmtDuration(durationMinutes(s))}</td>
              <td>{s.notes || <span className="muted">—</span>}</td>
              <td>
                <Link to={`/sessions/${s.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
