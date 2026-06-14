import { exampleDocument } from "./exampleData";
import type {
  Move,
  MoveCategory,
  MoveInput,
  Partner,
  Session,
  SessionInput,
} from "./types";

/** Example builds (VITE_EXAMPLE=true) seed demo data under a separate key. */
export const EXAMPLE_MODE = import.meta.env.VITE_EXAMPLE === "true";

const DATA_KEY = EXAMPLE_MODE ? "bjj-journal.example" : "bjj-journal.data";

const GENERIC_PARTNER: Partner = { id: "generic", name: "Generic" };

const CATEGORIES: MoveCategory[] = ["attack", "defense", "transition"];

export interface Document {
  sessions: Session[];
  partners: Partner[];
  moves: Move[];
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function coerceCategory(value: unknown): MoveCategory {
  return CATEGORIES.includes(value as MoveCategory)
    ? (value as MoveCategory)
    : "attack";
}

/** Add a move to the catalog if its name is new (case-insensitive). */
function upsertMove(
  doc: Document,
  name: string,
  category: MoveCategory = "attack",
  notes = ""
): void {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  if (!key) return;
  if (doc.moves.some((m) => m.name.trim().toLowerCase() === key)) return;
  doc.moves.push({ name: trimmed, category, notes });
}

/**
 * Normalize a raw drill into the current shape, migrating the legacy
 * single-move form ({ moveName, moveCategory }) into a moves[] reference and
 * registering any referenced move in the catalog.
 */
function normalizeDrill(raw: unknown, doc: Document): Session["drills"][number] {
  const d = (typeof raw === "object" && raw ? raw : {}) as Record<string, unknown>;
  const id = typeof d.id === "string" ? d.id : uuid();
  if (Array.isArray(d.moveNames)) {
    const moveNames = d.moveNames
      .filter((n): n is string => typeof n === "string" && n.trim() !== "")
      .map((n) => n.trim());
    moveNames.forEach((n) => upsertMove(doc, n));
    return { id, moveNames };
  }
  // Legacy: a drill carried a single move name + category inline.
  if (typeof d.moveName === "string" && d.moveName.trim() !== "") {
    const name = d.moveName.trim();
    upsertMove(doc, name, coerceCategory(d.moveCategory));
    return { id, moveNames: [name] };
  }
  return { id, moveNames: [] };
}

/** Build a normalized Document from arbitrary parsed JSON (lenient). */
function hydrate(parsed: Partial<Document> | null): Document {
  const doc: Document = { sessions: [], partners: [], moves: [] };
  // Seed the catalog first so existing category/notes survive normalization.
  if (Array.isArray(parsed?.moves)) {
    for (const m of parsed!.moves) {
      if (typeof m?.name === "string" && m.name.trim() !== "") {
        upsertMove(doc, m.name, coerceCategory(m.category), typeof m.notes === "string" ? m.notes : "");
      }
    }
  }
  if (Array.isArray(parsed?.partners)) {
    doc.partners = parsed!.partners
      .filter((p): p is Partner => typeof p?.name === "string")
      .map((p) => ({ id: typeof p.id === "string" ? p.id : uuid(), name: p.name }));
  }
  if (Array.isArray(parsed?.sessions)) {
    doc.sessions = parsed!.sessions.map((s) => {
      const raw = (typeof s === "object" && s ? s : {}) as Record<string, unknown>;
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      return {
        id: typeof raw.id === "string" ? raw.id : uuid(),
        ...(name ? { name } : {}),
        start: typeof raw.start === "string" ? raw.start : "",
        end: typeof raw.end === "string" ? raw.end : "",
        notes: typeof raw.notes === "string" ? raw.notes : "",
        drills: (Array.isArray(raw.drills) ? raw.drills : []).map((d) => normalizeDrill(d, doc)),
        rolls: (Array.isArray(raw.rolls) ? raw.rolls : []).map((r) => {
          const rr = (typeof r === "object" && r ? r : {}) as Record<string, unknown>;
          return {
            id: typeof rr.id === "string" ? rr.id : uuid(),
            partnerName: String(rr.partnerName ?? ""),
            notes: typeof rr.notes === "string" ? rr.notes : "",
          };
        }),
      };
    });
  }
  upsertPartnersByName(doc, doc.sessions.flatMap((s) => s.rolls.map((r) => r.partnerName)));
  return doc;
}

let cache: Document | null = null;

function load(): Document {
  if (cache) return cache;
  let doc: Document | null = null;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      doc = hydrate(JSON.parse(raw) as Partial<Document>);
    }
  } catch {
    // Corrupted storage: fall through and start fresh.
  }
  if (!doc) {
    doc = EXAMPLE_MODE ? exampleDocument() : { sessions: [], partners: [], moves: [] };
  }
  // The Generic partner always exists so unidentified partners can be logged.
  if (!doc.partners.some((p) => p.id === GENERIC_PARTNER.id)) {
    doc.partners.unshift({ ...GENERIC_PARTNER });
  }
  cache = doc;
  return doc;
}

function persist(doc: Document): void {
  cache = doc;
  localStorage.setItem(DATA_KEY, JSON.stringify(doc));
}

function materialize(id: string, input: SessionInput): Session {
  const name = input.name?.trim();
  return {
    id,
    ...(name ? { name } : {}),
    start: input.start,
    end: input.end,
    notes: input.notes,
    drills: input.drills.map((d) => ({
      id: d.id ?? uuid(),
      moveNames: d.moveNames.map((n) => n.trim()).filter((n) => n !== ""),
    })),
    rolls: input.rolls.map((r) => ({ ...r, id: r.id ?? uuid() })),
  };
}

function validate(input: SessionInput): void {
  if (!input.start || !input.end) {
    throw new Error("Start and end times are required.");
  }
  if (new Date(input.end).getTime() < new Date(input.start).getTime()) {
    throw new Error("Session end must not be before session start.");
  }
  if (input.rolls.some((r) => r.partnerName.trim() === "")) {
    throw new Error("Every roll needs a partner name.");
  }
}

/** Register any partner names not seen before (e.g. from logged rolls). */
function upsertPartnersByName(doc: Document, names: string[]): void {
  const existing = new Set(doc.partners.map((p) => p.name.trim().toLowerCase()));
  for (const raw of names) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (key === "" || existing.has(key)) continue;
    doc.partners.push({ id: uuid(), name });
    existing.add(key);
  }
}

/** Minimal shape check for imported documents; throws with a readable message. */
function parseDocument(text: string): Document {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Expected a JSON object with a sessions array.");
  }
  const raw = parsed as Partial<Document>;
  if (!Array.isArray(raw.sessions)) {
    throw new Error("Missing sessions array.");
  }
  raw.sessions.forEach((s, i) => {
    if (typeof s !== "object" || s === null) {
      throw new Error(`Session ${i + 1} is not an object.`);
    }
    if (typeof s.start !== "string" || typeof s.end !== "string") {
      throw new Error(`Session ${i + 1} is missing start/end datetimes.`);
    }
  });
  return hydrate(raw);
}

export const store = {
  listSessions(): Session[] {
    return [...load().sessions].sort((a, b) => b.start.localeCompare(a.start));
  },

  getSession(id: string): Session | undefined {
    return load().sessions.find((s) => s.id === id);
  },

  createSession(input: SessionInput): Session {
    validate(input);
    const doc = load();
    const session = materialize(uuid(), input);
    doc.sessions.push(session);
    session.drills.forEach((d) => d.moveNames.forEach((n) => upsertMove(doc, n)));
    upsertPartnersByName(doc, session.rolls.map((r) => r.partnerName));
    persist(doc);
    return session;
  },

  updateSession(id: string, input: SessionInput): Session {
    validate(input);
    const doc = load();
    const idx = doc.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Session not found.");
    const session = materialize(id, input);
    doc.sessions[idx] = session;
    session.drills.forEach((d) => d.moveNames.forEach((n) => upsertMove(doc, n)));
    upsertPartnersByName(doc, session.rolls.map((r) => r.partnerName));
    persist(doc);
    return session;
  },

  deleteSession(id: string): void {
    const doc = load();
    doc.sessions = doc.sessions.filter((s) => s.id !== id);
    persist(doc);
  },

  listPartners(): Partner[] {
    return [...load().partners].sort((a, b) => {
      if (a.id === GENERIC_PARTNER.id) return -1;
      if (b.id === GENERIC_PARTNER.id) return 1;
      return a.name.localeCompare(b.name);
    });
  },

  listMoves(): Move[] {
    return [...load().moves].sort((a, b) => a.name.localeCompare(b.name));
  },

  getMove(name: string): Move | undefined {
    const key = name.trim().toLowerCase();
    return load().moves.find((m) => m.name.trim().toLowerCase() === key);
  },

  createMove(input: MoveInput): Move {
    const name = input.name.trim();
    if (!name) throw new Error("A move needs a name.");
    const doc = load();
    const key = name.toLowerCase();
    if (doc.moves.some((m) => m.name.trim().toLowerCase() === key)) {
      throw new Error(`A move named "${name}" already exists.`);
    }
    const move: Move = { name, category: coerceCategory(input.category), notes: input.notes ?? "" };
    doc.moves.push(move);
    persist(doc);
    return move;
  },

  /** Edit a move's category and notes (the name is its identity and stays fixed). */
  updateMove(name: string, input: Pick<MoveInput, "category" | "notes">): Move {
    const doc = load();
    const key = name.trim().toLowerCase();
    const move = doc.moves.find((m) => m.name.trim().toLowerCase() === key);
    if (!move) throw new Error("Move not found.");
    move.category = coerceCategory(input.category);
    move.notes = input.notes ?? "";
    persist(doc);
    return move;
  },

  /** Pretty JSON of the whole journal, for download/backup. */
  exportJson(): string {
    return JSON.stringify(load(), null, 2);
  },

  /** Replace the whole journal with an exported document. */
  importJson(text: string): { sessions: number; partners: number; moves: number } {
    const doc = parseDocument(text);
    if (!doc.partners.some((p) => p.id === GENERIC_PARTNER.id)) {
      doc.partners.unshift({ ...GENERIC_PARTNER });
    }
    persist(doc);
    return {
      sessions: doc.sessions.length,
      partners: doc.partners.length,
      moves: doc.moves.length,
    };
  },
};
