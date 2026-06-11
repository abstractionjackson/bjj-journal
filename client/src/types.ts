export type MoveCategory = "attack" | "defense" | "transition";

export interface Drill {
  id: string;
  moveName: string;
  moveCategory: MoveCategory;
}

export interface Roll {
  id: string;
  partnerName: string;
  notes: string;
}

export interface Session {
  id: string;
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
  start: string;
  end: string;
  drills: Array<{ id?: string; moveName: string; moveCategory: MoveCategory }>;
  rolls: Array<{ id?: string; partnerName: string; notes: string }>;
  notes: string;
}
