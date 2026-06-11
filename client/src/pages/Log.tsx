import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import SessionForm from "../components/SessionForm";
import { durationMinutes, fmtDate, fmtDuration, fmtTime, useSessions } from "../lib";
import type { Session, SessionInput } from "../types";

export default function Log() {
  const { sessions, error, reload } = useSessions();
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = useState<Session | null>(null);

  if (error) return <p style={{ color: "var(--belt-red)" }}>{error}</p>;
  if (!sessions) return <p aria-busy="true">Loading sessions…</p>;

  async function handleCreate(input: SessionInput) {
    await api.createSession(input);
    setMode("idle");
    await reload();
  }

  async function handleUpdate(input: SessionInput) {
    if (!editing) return;
    await api.updateSession(editing.id, input);
    setMode("idle");
    setEditing(null);
    await reload();
  }

  async function handleDelete(s: Session) {
    if (!window.confirm(`Delete the session from ${fmtDate(s.start)}?`)) return;
    await api.deleteSession(s.id);
    await reload();
  }

  return (
    <>
      <h2>Session log</h2>

      {mode === "idle" && (
        <button onClick={() => setMode("create")}>Log a session</button>
      )}
      {mode === "create" && (
        <SessionForm onSubmit={handleCreate} onCancel={() => setMode("idle")} />
      )}
      {mode === "edit" && editing && (
        <SessionForm
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => {
            setMode("idle");
            setEditing(null);
          }}
        />
      )}

      {sessions.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>
          No sessions yet. Log your first one above.
        </p>
      ) : (
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Drills</th>
              <th>Rolls</th>
              <th>Actions</th>
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
                  <div className="row-actions">
                    <button
                      className="outline"
                      onClick={() => {
                        setEditing(s);
                        setMode("edit");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="secondary outline"
                      onClick={() => void handleDelete(s)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
