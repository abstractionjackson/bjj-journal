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
  /** ISO 8601 datetime */
  start: string;
  /** ISO 8601 datetime */
  end: string;
  drills: Drill[];
  rolls: Roll[];
  notes: string;
}

export interface Partner {
  id: string;
  name: string;
}

/** Fallback partner for rolls where the user couldn't identify who they rolled with. */
export const GENERIC_PARTNER: Partner = { id: "generic", name: "Generic" };

export interface PartnerInput {
  name: string;
}

/** Payload accepted on create/update — ids are assigned server-side. */
export interface SessionInput {
  start: string;
  end: string;
  drills: Array<Omit<Drill, "id"> & { id?: string }>;
  rolls: Array<Omit<Roll, "id"> & { id?: string }>;
  notes: string;
}
