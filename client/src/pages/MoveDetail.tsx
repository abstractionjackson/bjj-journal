import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import NoteContent from "../components/NoteContent";
import {
  CATEGORY_LABEL,
  fmtDateShort,
  moveStats,
  sessionName,
  sessionPositions,
  useMoves,
  useSessions,
} from "../lib";
import { store } from "../store";
import type { MoveCategory } from "../types";

export default function MoveDetail() {
  const { name } = useParams<{ name: string }>();
  const { sessions } = useSessions();
  const { moves: catalog, reload } = useMoves();

  const decoded = decodeURIComponent(name ?? "");
  const move = moveStats(sessions, catalog).find(
    (m) => m.moveName.toLowerCase() === decoded.toLowerCase()
  );
  const positions = sessionPositions(sessions);

  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<MoveCategory>(
    move?.moveCategory ?? "attack"
  );
  const [notes, setNotes] = useState(move?.notes ?? "");

  if (!move) {
    return (
      <>
        <p>
          <Link to="/moves">← Back to moves</Link>
        </p>
        <p>No move named “{decoded}”.</p>
      </>
    );
  }

  function startEdit() {
    if (!move) return;
    setCategory(move.moveCategory);
    setNotes(move.notes);
    setEditing(true);
  }

  function save() {
    store.updateMove(move!.moveName, { category, notes });
    setEditing(false);
    reload();
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

      {editing ? (
        <article>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MoveCategory)}
            >
              <option value="attack">Attack</option>
              <option value="defense">Defense</option>
              <option value="transition">Transition</option>
            </select>
          </label>
          <label>
            Notes
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key details, grips, common mistakes…"
            />
          </label>
          <div className="row-actions">
            <button onClick={save}>Save</button>
            <button
              className="secondary"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </article>
      ) : (
        <>
          {move.notes ? (
            <article className="notes-article">
              <strong>Notes</strong>
              <NoteContent text={move.notes} />
            </article>
          ) : (
            <p className="muted">No notes yet.</p>
          )}
          <button className="outline" onClick={startEdit}>
            Edit move
          </button>
        </>
      )}

      <h3>Sessions featuring this move</h3>
      {move.sessions.length === 0 ? (
        <p className="muted">This move hasn't been drilled in any session yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Session</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {move.sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/sessions/${s.id}`}>
                    {sessionName(s, positions.get(s.id) ?? 0)}
                  </Link>
                </td>
                <td>{fmtDateShort(s.start)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
