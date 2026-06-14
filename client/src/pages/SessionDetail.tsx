import { Link, useParams } from "react-router-dom";
import NoteContent from "../components/NoteContent";
import {
  CATEGORY_LABEL,
  dateKey,
  durationMinutes,
  fmtDate,
  fmtDuration,
  fmtTime,
  sessionName,
  sessionPositions,
} from "../lib";
import { store } from "../store";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const session = id ? store.getSession(id) : undefined;
  const position = session
    ? sessionPositions(store.listSessions()).get(session.id) ?? 0
    : 0;
  const moveCategory = new Map(
    store.listMoves().map((m) => [m.name.toLowerCase(), m.category])
  );
  // Moves drilled this session, de-duplicated across drills, order preserved.
  const drilledMoves = session
    ? [...new Set(session.drills.flatMap((d) => d.moveNames))]
    : [];

  if (!session) {
    return (
      <>
        <p>
          <Link to="/log">← Back to log</Link>
        </p>
        <p>Session not found.</p>
      </>
    );
  }

  return (
    <>
      <p>
        <Link to="/log">← Back to log</Link>
      </p>
      <hgroup>
        <h2>{sessionName(session, position)}</h2>
        <p>
          <Link to={`/dates/${dateKey(session.start)}`}>
            {fmtDate(session.start)}
          </Link>{" "}
          · {fmtTime(session.start)}–{fmtTime(session.end)} ·{" "}
          {fmtDuration(durationMinutes(session))} on the mat
        </p>
      </hgroup>

      {session.notes && (
        <article className="notes-article">
          <strong>Session notes</strong>
          <NoteContent text={session.notes} />
        </article>
      )}

      <h3>Drills</h3>
      {drilledMoves.length === 0 ? (
        <p className="muted">No drills logged for this session.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Move</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {drilledMoves.map((moveName) => {
              const category = moveCategory.get(moveName.toLowerCase()) ?? "attack";
              return (
                <tr key={moveName.toLowerCase()}>
                  <td>
                    <Link to={`/moves/${encodeURIComponent(moveName)}`}>
                      {moveName}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${category}`}>
                      {CATEGORY_LABEL[category]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3>Rolls</h3>
      {session.rolls.length === 0 ? (
        <p className="muted">No rolls logged for this session.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Partner</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {session.rolls.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/partners/${encodeURIComponent(r.partnerName)}`}>
                    {r.partnerName}
                  </Link>
                </td>
                <td>{r.notes || <span className="muted">—</span>}</td>
                <td>
                  <Link to={`/rolls/${session.id}/${r.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
