import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import type { MoveCategory, Session } from "./types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setSessions(await api.listSessions());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load sessions");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sessions, error, reload };
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
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
  timesDrilled: number;
  lastDrilled: string;
  sessions: Session[];
}

export function aggregateMoves(sessions: Session[]): MoveStats[] {
  const map = new Map<string, MoveStats>();
  for (const s of sessions) {
    for (const d of s.drills) {
      const key = d.moveName.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.timesDrilled += 1;
        if (s.start > existing.lastDrilled) {
          existing.lastDrilled = s.start;
          existing.moveCategory = d.moveCategory;
        }
        if (!existing.sessions.some((es) => es.id === s.id)) {
          existing.sessions.push(s);
        }
      } else {
        map.set(key, {
          moveName: d.moveName,
          moveCategory: d.moveCategory,
          timesDrilled: 1,
          lastDrilled: s.start,
          sessions: [s],
        });
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
