import { Link, useParams } from "react-router-dom";
import NoteContent from "../components/NoteContent";
import { fmtDate, fmtTime } from "../lib";
import { store } from "../store";

export default function RollDetail() {
  const { sessionId, rollId } = useParams<{
    sessionId: string;
    rollId: string;
  }>();
  const session = sessionId ? store.getSession(sessionId) : undefined;

  const roll = session?.rolls.find((r) => r.id === rollId);
  if (!session || !roll) {
    return (
      <>
        <p>
          <Link to="/rolls">← Back to rolls</Link>
        </p>
        <p>Roll not found in this session.</p>
      </>
    );
  }

  return (
    <>
      <p>
        <Link to="/rolls">← Back to rolls</Link>
      </p>
      <hgroup>
        <h2>
          Roll with{" "}
          <Link to={`/partners/${encodeURIComponent(roll.partnerName)}`}>
            {roll.partnerName}
          </Link>
        </h2>
        <p>
          {fmtDate(session.start)} · session {fmtTime(session.start)}–
          {fmtTime(session.end)}
        </p>
      </hgroup>

      <article className="notes-article">
        <strong>Roll notes</strong>
        {roll.notes ? (
          <NoteContent text={roll.notes} />
        ) : (
          <p style={{ marginBottom: 0 }}>
            <span className="muted">No notes for this roll.</span>
          </p>
        )}
      </article>

      <p>
        <Link to={`/sessions/${session.id}`}>View the full session →</Link>
      </p>
    </>
  );
}
