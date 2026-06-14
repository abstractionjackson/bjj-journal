import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Clock from "../components/Clock";
import SessionForm from "../components/SessionForm";
import {
  dateKey,
  fmtDate,
  fmtDateShort,
  fuzzyMatch,
  sessionName,
  sessionPositions,
  useSessions,
} from "../lib";
import { store } from "../store";
import type { Session, SessionInput } from "../types";

export default function Log() {
  const { sessions, reload } = useSessions();
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = useState<Session | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const positions = sessionPositions(sessions);
  const filtered = sessions.filter((s) => {
    const name = sessionName(s, positions.get(s.id) ?? 0);
    return fuzzyMatch(query, name) || fuzzyMatch(query, fmtDate(s.start));
  });

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
    const label = sessionName(s, positions.get(s.id) ?? 0);
    if (!window.confirm(`Delete ${label} (${fmtDate(s.start)})?`)) return;
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
        <>
          <div className="filter-bar" style={{ marginTop: "1rem" }}>
            <input
              type="search"
              placeholder="Search by name or date…"
              aria-label="Search sessions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <p>No sessions match the current search.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Drills</th>
                  <th>Rolls</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/sessions/${s.id}`}>
                        {sessionName(s, positions.get(s.id) ?? 0)}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/dates/${dateKey(s.start)}`}>
                        {fmtDateShort(s.start)}
                      </Link>
                    </td>
                    <td>
                      <Clock start={s.start} end={s.end} />
                    </td>
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
        </>
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
