import { exampleDocument } from "./exampleData";
import type { Partner, Session, SessionInput } from "./types";

/** Example builds (VITE_EXAMPLE=true) seed demo data under a separate key. */
export const EXAMPLE_MODE = import.meta.env.VITE_EXAMPLE === "true";

const DATA_KEY = EXAMPLE_MODE ? "bjj-journal.example" : "bjj-journal.data";

const GENERIC_PARTNER: Partner = { id: "generic", name: "Generic" };

export interface Document {
  sessions: Session[];
  partners: Partner[];
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

let cache: Document | null = null;

function load(): Document {
  if (cache) return cache;
  let doc: Document | null = null;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Document>;
      doc = {
        sessions: parsed.sessions ?? [],
        partners: parsed.partners ?? [],
      };
    }
  } catch {
    // Corrupted storage: fall through and start fresh.
  }
  if (!doc) {
    doc = EXAMPLE_MODE ? exampleDocument() : { sessions: [], partners: [] };
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
  return {
    id,
    start: input.start,
    end: input.end,
    notes: input.notes,
    drills: input.drills.map((d) => ({ ...d, id: d.id ?? uuid() })),
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
  if (input.drills.some((d) => d.moveName.trim() === "")) {
    throw new Error("Every drill needs a move name.");
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
  const doc = parsed as Partial<Document>;
  if (!Array.isArray(doc.sessions)) {
    throw new Error("Missing sessions array.");
  }
  const sessions: Session[] = doc.sessions.map((s, i) => {
    if (typeof s !== "object" || s === null) {
      throw new Error(`Session ${i + 1} is not an object.`);
    }
    if (typeof s.start !== "string" || typeof s.end !== "string") {
      throw new Error(`Session ${i + 1} is missing start/end datetimes.`);
    }
    return {
      id: typeof s.id === "string" ? s.id : uuid(),
      start: s.start,
      end: s.end,
      notes: typeof s.notes === "string" ? s.notes : "",
      drills: (Array.isArray(s.drills) ? s.drills : []).map((d) => ({
        id: typeof d.id === "string" ? d.id : uuid(),
        moveName: String(d.moveName ?? ""),
        moveCategory: ["attack", "defense", "transition"].includes(d.moveCategory)
          ? d.moveCategory
          : "attack",
      })),
      rolls: (Array.isArray(s.rolls) ? s.rolls : []).map((r) => ({
        id: typeof r.id === "string" ? r.id : uuid(),
        partnerName: String(r.partnerName ?? ""),
        notes: typeof r.notes === "string" ? r.notes : "",
      })),
    };
  });
  const partners: Partner[] = (Array.isArray(doc.partners) ? doc.partners : [])
    .filter((p): p is Partner => typeof p?.name === "string")
    .map((p) => ({ id: typeof p.id === "string" ? p.id : uuid(), name: p.name }));
  const result: Document = { sessions, partners };
  upsertPartnersByName(
    result,
    sessions.flatMap((s) => s.rolls.map((r) => r.partnerName))
  );
  return result;
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

  /** Pretty JSON of the whole journal, for download/backup. */
  exportJson(): string {
    return JSON.stringify(load(), null, 2);
  },

  /** Replace the whole journal with an exported document. */
  importJson(text: string): { sessions: number; partners: number } {
    const doc = parseDocument(text);
    if (!doc.partners.some((p) => p.id === GENERIC_PARTNER.id)) {
      doc.partners.unshift({ ...GENERIC_PARTNER });
    }
    persist(doc);
    return { sessions: doc.sessions.length, partners: doc.partners.length };
  },
};
