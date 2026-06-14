import { Link, useParams } from "react-router-dom";
import Clock from "../components/Clock";
import { dateKey, sessionName, sessionPositions, useSessions } from "../lib";

/** yyyy-mm-dd -> a readable local date heading. */
function fmtDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DatePage() {
  const { date = "" } = useParams<{ date: string }>();
  const { sessions } = useSessions();
  const positions = sessionPositions(sessions);
  const onDate = sessions.filter((s) => dateKey(s.start) === date);

  return (
    <>
      <p>
        <Link to="/sessions">← All sessions</Link>
      </p>
      <h2>{fmtDateLabel(date)}</h2>

      {onDate.length === 0 ? (
        <p className="muted">No sessions logged on this date.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Time</th>
              <th>Drills</th>
              <th>Rolls</th>
            </tr>
          </thead>
          <tbody>
            {onDate.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/sessions/${s.id}`}>
                    {sessionName(s, positions.get(s.id) ?? 0)}
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
  );
}
