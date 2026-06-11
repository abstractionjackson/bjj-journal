import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import NoteContent from "../components/NoteContent";
import { CATEGORY_LABEL, durationMinutes, fmtDate, fmtDuration, fmtTime } from "../lib";
import type { Session } from "../types";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getSession(id)
      .then(setSession)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load session")
      );
  }, [id]);

  if (error) return <p style={{ color: "var(--belt-red)" }}>{error}</p>;
  if (!session) return <p aria-busy="true">Loading session…</p>;

  return (
    <>
      <p>
        <Link to="/log">← Back to log</Link>
      </p>
      <hgroup>
        <h2>{fmtDate(session.start)}</h2>
        <p>
          {fmtTime(session.start)}–{fmtTime(session.end)} ·{" "}
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
      {session.drills.length === 0 ? (
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
            {session.drills.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link to={`/moves/${encodeURIComponent(d.moveName)}`}>
                    {d.moveName}
                  </Link>
                </td>
                <td>
                  <span className={`badge ${d.moveCategory}`}>
                    {CATEGORY_LABEL[d.moveCategory]}
                  </span>
                </td>
              </tr>
            ))}
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
