import { Ajv, type ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";

// ajv-formats ships CJS; unwrap the default export under NodeNext interop.
const addFormats = ((addFormatsModule as { default?: unknown }).default ??
  addFormatsModule) as (ajv: Ajv) => Ajv;
import type { PartnerInput, SessionInput } from "./types.js";

export const sessionInputSchema = {
  $id: "https://bjj-journal.local/schemas/session-input.json",
  type: "object",
  additionalProperties: false,
  required: ["start", "end", "drills", "rolls", "notes"],
  properties: {
    start: { type: "string", format: "date-time" },
    end: { type: "string", format: "date-time" },
    notes: { type: "string" },
    drills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["moveName", "moveCategory"],
        properties: {
          id: { type: "string" },
          moveName: { type: "string", minLength: 1 },
          moveCategory: { enum: ["attack", "defense", "transition"] },
        },
      },
    },
    rolls: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["partnerName", "notes"],
        properties: {
          id: { type: "string" },
          partnerName: { type: "string", minLength: 1 },
          notes: { type: "string" },
        },
      },
    },
  },
} as const;

export const partnerInputSchema = {
  $id: "https://bjj-journal.local/schemas/partner-input.json",
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1 },
  },
} as const;

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateSessionInput: ValidateFunction<SessionInput> =
  ajv.compile<SessionInput>(sessionInputSchema);

export const validatePartnerInput: ValidateFunction<PartnerInput> =
  ajv.compile<PartnerInput>(partnerInputSchema);

/** Extra semantic check JSON Schema can't express: end must not precede start. */
export function semanticErrors(input: SessionInput): string[] {
  const errors: string[] = [];
  if (new Date(input.end).getTime() < new Date(input.start).getTime()) {
    errors.push("Session end must not be before session start.");
  }
  return errors;
}
