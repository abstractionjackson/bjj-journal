import { useEffect, useState } from "react";
import { api } from "../api";
import type { MoveCategory, Partner, Session, SessionInput } from "../types";

interface Props {
  initial?: Session;
  onSubmit: (input: SessionInput) => Promise<void>;
  onCancel: () => void;
}

interface DrillRow {
  id?: string;
  moveName: string;
  moveCategory: MoveCategory;
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

export default function SessionForm({ initial, onSubmit, onCancel }: Props) {
  const [start, setStart] = useState(
    initial ? toLocalInput(initial.start) : ""
  );
  const [end, setEnd] = useState(initial ? toLocalInput(initial.end) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [drills, setDrills] = useState<DrillRow[]>(initial?.drills ?? []);
  const [rolls, setRolls] = useState<RollRow[]>(initial?.rolls ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    api.listPartners().then(setPartners).catch(() => {});
  }, []);

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

  function updateDrill(i: number, patch: Partial<DrillRow>) {
    setDrills((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
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
    const cleanDrills = drills.filter((d) => d.moveName.trim() !== "");
    const cleanRolls = rolls.filter((r) => r.partnerName.trim() !== "");
    setBusy(true);
    try {
      await onSubmit({
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

      <h4>Drills</h4>
      {drills.length === 0 && (
        <p className="muted">No drills yet. Add the moves you worked on.</p>
      )}
      {drills.map((d, i) => (
        <fieldset className="item-row" key={i}>
          <input
            placeholder="Move name"
            aria-label="Move name"
            value={d.moveName}
            onChange={(e) => updateDrill(i, { moveName: e.target.value })}
          />
          <select
            aria-label="Move category"
            value={d.moveCategory}
            onChange={(e) =>
              updateDrill(i, { moveCategory: e.target.value as MoveCategory })
            }
          >
            <option value="attack">Attack</option>
            <option value="defense">Defense</option>
            <option value="transition">Transition</option>
          </select>
          <button
            type="button"
            className="secondary"
            onClick={() => setDrills((ds) => ds.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="outline"
        onClick={() =>
          setDrills((ds) => [...ds, { moveName: "", moveCategory: "attack" }])
        }
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
