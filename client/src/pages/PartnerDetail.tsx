import { Link, useParams } from "react-router-dom";
import { fmtDate, fmtDateShort, fmtTime, useSessions } from "../lib";

export default function PartnerDetail() {
  const { name } = useParams<{ name: string }>();
  const { sessions } = useSessions();

  const decoded = decodeURIComponent(name ?? "");
  const rolls = sessions.flatMap((s) =>
    s.rolls
      .filter((r) => r.partnerName.toLowerCase() === decoded.toLowerCase())
      .map((r) => ({ session: s, roll: r }))
  );

  if (rolls.length === 0) {
    return (
      <>
        <p>
          <Link to="/partners">← Back to partners</Link>
        </p>
        <p>No rolls found with “{decoded}”.</p>
      </>
    );
  }

  const partnerName = rolls[0].roll.partnerName;
  const lastRolled = rolls[0].session.start;

  return (
    <>
      <p>
        <Link to="/rolls">← Back to rolls</Link>
      </p>
      <hgroup>
        <h2>{partnerName}</h2>
        <p>
          {rolls.length} {rolls.length === 1 ? "roll" : "rolls"} · last rolled{" "}
          {fmtDate(lastRolled)}
        </p>
      </hgroup>

      <h3>Rolls with this partner</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Session</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rolls.map(({ session, roll }) => (
            <tr key={`${session.id}-${roll.id}`}>
              <td>{fmtDateShort(session.start)}</td>
              <td>
                <Link to={`/sessions/${session.id}`}>
                  {fmtTime(session.start)}–{fmtTime(session.end)}
                </Link>
              </td>
              <td>{roll.notes || <span className="muted">—</span>}</td>
              <td>
                <Link to={`/rolls/${session.id}/${roll.id}`}>View roll</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
