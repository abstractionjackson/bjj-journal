import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import SessionForm from "../components/SessionForm";
import { durationMinutes, fmtDate, fmtDuration, fmtTime, useSessions } from "../lib";
import { store } from "../store";
import type { Session, SessionInput } from "../types";

export default function Log() {
  const { sessions, reload } = useSessions();
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = useState<Session | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleCreate(input: SessionInput) {
    store.createSession(input);
    setMode("idle");
    reload();
  }

  async function handleUpdate(input: SessionInput) {
    if (!editing) return;
    store.updateSession(editing.id, input);
    setMode("idle");
    setEditing(null);
    reload();
  }

  function handleDelete(s: Session) {
    if (!window.confirm(`Delete the session from ${fmtDate(s.start)}?`)) return;
    store.deleteSession(s.id);
    reload();
  }

  function handleExport() {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bjj-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    if (
      !window.confirm(
        "Importing replaces everything currently in your journal. Continue?"
      )
    ) {
      return;
    }
    try {
      const { sessions: count } = store.importJson(await file.text());
      setDataMessage(`Imported ${count} session${count === 1 ? "" : "s"}.`);
      reload();
    } catch (err) {
      setDataMessage(
        `Import failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
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
                      onClick={() => handleDelete(s)}
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

      <h3 style={{ marginTop: "2rem" }}>Your data</h3>
      <p className="muted">
        The journal lives in this browser's localStorage. Export it as JSON to
        back it up or move it to another machine; import a previously exported
        file to restore it.
      </p>
      <div className="row-actions">
        <button className="outline" onClick={handleExport}>
          Export JSON
        </button>
        <button className="outline" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
      </div>
      {dataMessage && <p>{dataMessage}</p>}
    </>
  );
}
