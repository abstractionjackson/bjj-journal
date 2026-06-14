import { useCallback, useState } from "react";
import { store } from "./store";
import type { Move, MoveCategory, Session } from "./types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() =>
    store.listSessions()
  );
  const reload = useCallback(() => setSessions(store.listSessions()), []);
  return { sessions, reload };
}

export function useMoves() {
  const [moves, setMoves] = useState<Move[]>(() => store.listMoves());
  const reload = useCallback(() => setMoves(store.listMoves()), []);
  return { moves, reload };
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Compact day/month for tight table cells, e.g. "09/06". */
export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Local-time yyyy-mm-dd for an ISO datetime, used as a per-day key/route param. */
export function dateKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Position is fixed by chronology: the earliest session is #1. Returns a map of
 * session id -> position so a stable number is available without storing it.
 */
export function sessionPositions(sessions: Session[]): Map<string, number> {
  const map = new Map<string, number>();
  [...sessions]
    .sort((a, b) => a.start.localeCompare(b.start))
    .forEach((s, i) => map.set(s.id, i + 1));
  return map;
}

/** Custom name if set, otherwise the position-derived default "Session #N". */
export function sessionName(session: Session, position: number): string {
  const custom = session.name?.trim();
  return custom ? custom : `Session #${position}`;
}

export function durationMinutes(s: Session): number {
  return Math.max(
    0,
    Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000)
  );
}

export function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export interface MoveStats {
  moveName: string;
  moveCategory: MoveCategory;
  notes: string;
  timesDrilled: number;
  lastDrilled: string | null;
  sessions: Session[];
}

/**
 * Stats for every move in the catalog, joined with how often it was drilled.
 * Catalog moves that have never been drilled appear with timesDrilled 0 so they
 * stay visible on the Moves page. Drilled moves missing from the catalog (e.g.
 * legacy data mid-migration) are included defensively.
 */
export function moveStats(sessions: Session[], moves: Move[]): MoveStats[] {
  const map = new Map<string, MoveStats>();
  for (const m of moves) {
    map.set(m.name.trim().toLowerCase(), {
      moveName: m.name,
      moveCategory: m.category,
      notes: m.notes,
      timesDrilled: 0,
      lastDrilled: null,
      sessions: [],
    });
  }
  for (const s of sessions) {
    for (const d of s.drills) {
      for (const rawName of d.moveNames) {
        const key = rawName.trim().toLowerCase();
        if (!key) continue;
        let stat = map.get(key);
        if (!stat) {
          stat = {
            moveName: rawName,
            moveCategory: "attack",
            notes: "",
            timesDrilled: 0,
            lastDrilled: null,
            sessions: [],
          };
          map.set(key, stat);
        }
        stat.timesDrilled += 1;
        if (!stat.lastDrilled || s.start > stat.lastDrilled) {
          stat.lastDrilled = s.start;
        }
        if (!stat.sessions.some((es) => es.id === s.id)) {
          stat.sessions.push(s);
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => b.timesDrilled - a.timesDrilled);
}

export interface PartnerStats {
  partnerName: string;
  rollCount: number;
  lastRolled: string;
}

export function aggregatePartners(sessions: Session[]): PartnerStats[] {
  const map = new Map<string, PartnerStats>();
  for (const s of sessions) {
    for (const r of s.rolls) {
      const key = r.partnerName.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.rollCount += 1;
        if (s.start > existing.lastRolled) existing.lastRolled = s.start;
      } else {
        map.set(key, {
          partnerName: r.partnerName,
          rollCount: 1,
          lastRolled: s.start,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.rollCount - a.rollCount);
}

/** Case-insensitive match: substring first, then subsequence (fuzzy). */
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

/** Is `iso` within the inclusive [from, to] range of yyyy-mm-dd date strings (local time)? Empty bounds are open. */
export function inDateRange(iso: string, from: string, to: string): boolean {
  const d = new Date(iso);
  if (from && d < new Date(`${from}T00:00:00`)) return false;
  if (to && d > new Date(`${to}T23:59:59.999`)) return false;
  return true;
}

export const CATEGORY_LABEL: Record<MoveCategory, string> = {
  attack: "Attack",
  defense: "Defense",
  transition: "Transition",
};
