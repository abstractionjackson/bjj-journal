import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERIC_PARTNER, type Partner, type Session } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR =
  process.env.DATA_DIR ?? path.resolve(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");

interface Document {
  sessions: Session[];
  partners: Partner[];
}

let cache: Document | null = null;
// Serialize writes so concurrent requests can't interleave file I/O.
let writeQueue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Document> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Document>;
    cache = { sessions: parsed.sessions ?? [], partners: parsed.partners ?? [] };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      cache = { sessions: [], partners: [] };
    } else {
      throw err;
    }
  }
  // The Generic partner always exists so unidentified partners can be logged.
  if (!cache.partners.some((p) => p.id === GENERIC_PARTNER.id)) {
    cache.partners.unshift({ ...GENERIC_PARTNER });
  }
  return cache;
}

async function persist(doc: Document): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(doc, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE); // atomic swap
  });
  await writeQueue;
}

export async function listSessions(): Promise<Session[]> {
  const doc = await load();
  return [...doc.sessions].sort((a, b) => b.start.localeCompare(a.start));
}

export async function getSession(id: string): Promise<Session | undefined> {
  const doc = await load();
  return doc.sessions.find((s) => s.id === id);
}

export async function createSession(session: Session): Promise<Session> {
  const doc = await load();
  doc.sessions.push(session);
  await persist(doc);
  return session;
}

export async function updateSession(
  id: string,
  session: Session
): Promise<Session | undefined> {
  const doc = await load();
  const idx = doc.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  doc.sessions[idx] = session;
  await persist(doc);
  return session;
}

export async function deleteSession(id: string): Promise<boolean> {
  const doc = await load();
  const before = doc.sessions.length;
  doc.sessions = doc.sessions.filter((s) => s.id !== id);
  if (doc.sessions.length === before) return false;
  await persist(doc);
  return true;
}

export async function listPartners(): Promise<Partner[]> {
  const doc = await load();
  return [...doc.partners].sort((a, b) => {
    if (a.id === GENERIC_PARTNER.id) return -1;
    if (b.id === GENERIC_PARTNER.id) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  const doc = await load();
  return doc.partners.find((p) => p.id === id);
}

export async function findPartnerByName(
  name: string
): Promise<Partner | undefined> {
  const doc = await load();
  const key = name.trim().toLowerCase();
  return doc.partners.find((p) => p.name.trim().toLowerCase() === key);
}

export async function createPartner(partner: Partner): Promise<Partner> {
  const doc = await load();
  doc.partners.push(partner);
  await persist(doc);
  return partner;
}

/** Register any partner names not seen before (e.g. from logged rolls). */
export async function upsertPartnersByName(names: string[]): Promise<void> {
  const doc = await load();
  const existing = new Set(doc.partners.map((p) => p.name.trim().toLowerCase()));
  let added = false;
  for (const raw of names) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (key === "" || existing.has(key)) continue;
    doc.partners.push({ id: randomUUID(), name });
    existing.add(key);
    added = true;
  }
  if (added) await persist(doc);
}
