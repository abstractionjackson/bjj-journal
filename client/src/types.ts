export type MoveCategory = "attack" | "defense" | "transition";

export interface Move {
  /** Primary key; unique case-insensitively. */
  name: string;
  category: MoveCategory;
  notes: string;
}

export interface MoveInput {
  name: string;
  category: MoveCategory;
  notes: string;
}

export interface Drill {
  id: string;
  /** References Move.name entries in the catalog. */
  moveNames: string[];
}

export interface Roll {
  id: string;
  partnerName: string;
  notes: string;
}

export interface Session {
  id: string;
  /** Optional custom name; when absent a default "Session #N" is derived from position. */
  name?: string;
  start: string;
  end: string;
  drills: Drill[];
  rolls: Roll[];
  notes: string;
}

export interface Partner {
  id: string;
  name: string;
}

export interface SessionInput {
  name?: string;
  start: string;
  end: string;
  drills: Array<{ id?: string; moveNames: string[] }>;
  rolls: Array<{ id?: string; partnerName: string; notes: string }>;
  notes: string;
}
