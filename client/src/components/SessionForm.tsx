import { useState } from "react";
import { store } from "../store";
import type { Move, MoveCategory, Partner, Session, SessionInput } from "../types";

interface Props {
  initial?: Session;
  onSubmit: (input: SessionInput) => Promise<void>;
  onCancel: () => void;
}

interface DrillRow {
  id?: string;
  moveNames: string[];
}

interface RollRow {
  id?: string;
  partnerName: string;
  notes: string;
}

/** ISO string or Date -> value usable by <input type="datetime-local"> (local time). */
function toLocalInput(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Editor for one drill: pick moves from the catalog or create a new one inline. */
function DrillEditor({
  moveNames,
  onAddMove,
  onRemoveMove,
  onRemoveDrill,
}: {
  moveNames: string[];
  onAddMove: (name: string, category: MoveCategory) => void;
  onRemoveMove: (name: string) => void;
  onRemoveDrill: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<MoveCategory>("attack");

  function add() {
    if (draft.trim() === "") return;
    onAddMove(draft, category);
    setDraft("");
  }

  return (
    <fieldset className="drill-row">
      <div className="drill-moves">
        {moveNames.length === 0 ? (
          <span className="muted">No moves yet — add from the catalog or create one.</span>
        ) : (
          moveNames.map((name) => (
            <span className="move-chip" key={name.toLowerCase()}>
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => onRemoveMove(name)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <div className="drill-add">
        <input
          placeholder="Move name"
          aria-label="Move name"
          list="move-options"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <select
          aria-label="Category for new move"
          title="Category (used when creating a new move)"
          value={category}
          onChange={(e) => setCategory(e.target.value as MoveCategory)}
        >
          <option value="attack">Attack</option>
          <option value="defense">Defense</option>
          <option value="transition">Transition</option>
        </select>
        <button type="button" className="outline" onClick={add}>
          Add move
        </button>
        <button type="button" className="secondary" onClick={onRemoveDrill}>
          Remove drill
        </button>
      </div>
    </fieldset>
  );
}

export default function SessionForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [start, setStart] = useState(
    initial ? toLocalInput(initial.start) : ""
  );
  const [end, setEnd] = useState(initial ? toLocalInput(initial.end) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [drills, setDrills] = useState<DrillRow[]>(
    initial?.drills.map((d) => ({ id: d.id, moveNames: [...d.moveNames] })) ?? []
  );
  const [rolls, setRolls] = useState<RollRow[]>(initial?.rolls ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [partners] = useState<Partner[]>(() => store.listPartners());
  // Catalog of known moves, refreshed when a new move is created inline.
  const [moves, setMoves] = useState<Move[]>(() => store.listMoves());

  // Default the end to one hour after the start; never touch an end the user
  // already set. Runs on blur, not change: the picker fires change as soon as
  // the date is chosen (with a default time), before the user picks the time.
  function handleStartBlur() {
    if (start && !end) {
      const d = new Date(start);
      d.setHours(d.getHours() + 1);
      setEnd(toLocalInput(d));
    }
  }

  /** Add a move to a drill, creating it in the catalog first if it's new. */
  function addMoveToDrill(i: number, rawName: string, category: MoveCategory) {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    const existing = moves.find(
      (m) => m.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    const canonical = existing?.name ?? trimmed;
    if (!existing) {
      try {
        store.createMove({ name: trimmed, category, notes: "" });
        setMoves(store.listMoves());
      } catch {
        // A race with an identical name: ignore and reference it by name anyway.
      }
    }
    setDrills((ds) =>
      ds.map((d, j) => {
        if (j !== i) return d;
        if (d.moveNames.some((n) => n.toLowerCase() === canonical.toLowerCase())) {
          return d;
        }
        return { ...d, moveNames: [...d.moveNames, canonical] };
      })
    );
  }

  function removeMoveFromDrill(i: number, name: string) {
    setDrills((ds) =>
      ds.map((d, j) =>
        j === i
          ? { ...d, moveNames: d.moveNames.filter((n) => n !== name) }
          : d
      )
    );
  }

  function updateRoll(i: number, patch: Partial<RollRow>) {
    setRolls((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    setError(null);
    if (!start || !end) {
      setError("Start and end times are required.");
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError("End time must not be before start time.");
      return;
    }
    const cleanDrills = drills.filter((d) => d.moveNames.length > 0);
    const cleanRolls = rolls.filter((r) => r.partnerName.trim() !== "");
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim() || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        notes,
        drills: cleanDrills,
        rolls: cleanRolls,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <article>
      <h3>{initial ? "Edit session" : "Log a session"}</h3>
      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional — defaults to Session #N"
        />
      </label>
      <div className="grid">
        <label>
          Start
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onBlur={handleStartBlur}
            required
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
      </div>

      <datalist id="move-options">
        {moves.map((m) => (
          <option key={m.name} value={m.name} />
        ))}
      </datalist>

      <h4>Drills</h4>
      {drills.length === 0 && (
        <p className="muted">No drills yet. Add the moves you worked on.</p>
      )}
      {drills.map((d, i) => (
        <DrillEditor
          key={i}
          moveNames={d.moveNames}
          onAddMove={(n, c) => addMoveToDrill(i, n, c)}
          onRemoveMove={(n) => removeMoveFromDrill(i, n)}
          onRemoveDrill={() => setDrills((ds) => ds.filter((_, j) => j !== i))}
        />
      ))}
      <button
        type="button"
        className="outline"
        onClick={() => setDrills((ds) => [...ds, { moveNames: [] }])}
      >
        Add drill
      </button>

      <h4>Rolls</h4>
      <datalist id="partner-options">
        {partners.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>
      {rolls.length === 0 && (
        <p className="muted">No rolls yet. Add each round and how it went.</p>
      )}
      {rolls.map((r, i) => (
        <fieldset className="item-row" key={i}>
          <input
            placeholder="Partner name"
            aria-label="Partner name"
            list="partner-options"
            value={r.partnerName}
            onChange={(e) => updateRoll(i, { partnerName: e.target.value })}
          />
          <input
            placeholder="Notes"
            aria-label="Roll notes"
            value={r.notes}
            onChange={(e) => updateRoll(i, { notes: e.target.value })}
          />
          <button
            type="button"
            className="secondary"
            onClick={() => setRolls((rs) => rs.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="outline"
        onClick={() => setRolls((rs) => [...rs, { partnerName: "", notes: "" }])}
      >
        Add roll
      </button>

      <label style={{ marginTop: "1rem" }}>
        Session notes
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you take away from this session?"
        />
      </label>

      {error && <p style={{ color: "var(--belt-red)" }}>{error}</p>}

      <div className="row-actions" style={{ marginTop: "1rem" }}>
        <button onClick={() => void submit()} disabled={busy}>
          {busy ? "Saving…" : "Save session"}
        </button>
        <button className="secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </article>
  );
}
