import { randomUUID } from "node:crypto";
import { Router } from "express";
import { semanticErrors, validateSessionInput } from "../schema.js";
import * as store from "../storage.js";
import type { Session, SessionInput } from "../types.js";

export const sessionsRouter = Router();

function materialize(id: string, input: SessionInput): Session {
  return {
    id,
    start: input.start,
    end: input.end,
    notes: input.notes,
    drills: input.drills.map((d) => ({ ...d, id: d.id ?? randomUUID() })),
    rolls: input.rolls.map((r) => ({ ...r, id: r.id ?? randomUUID() })),
  };
}

function validate(body: unknown): { input?: SessionInput; errors?: unknown } {
  if (!validateSessionInput(body)) {
    return { errors: validateSessionInput.errors };
  }
  const extra = semanticErrors(body);
  if (extra.length > 0) {
    return { errors: extra.map((message) => ({ message })) };
  }
  return { input: body };
}

// GET /api/sessions — list all sessions, newest first
sessionsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await store.listSessions());
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions — create a session
sessionsRouter.post("/", async (req, res, next) => {
  try {
    const { input, errors } = validate(req.body);
    if (!input) return res.status(400).json({ error: "Invalid session", details: errors });
    const session = await store.createSession(materialize(randomUUID(), input));
    await store.upsertPartnersByName(session.rolls.map((r) => r.partnerName));
    res.status(201).location(`/api/sessions/${session.id}`).json(session);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id — fetch one session
sessionsRouter.get("/:id", async (req, res, next) => {
  try {
    const session = await store.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sessions/:id — replace a session
sessionsRouter.put("/:id", async (req, res, next) => {
  try {
    const { input, errors } = validate(req.body);
    if (!input) return res.status(400).json({ error: "Invalid session", details: errors });
    const updated = await store.updateSession(
      req.params.id,
      materialize(req.params.id, input)
    );
    if (!updated) return res.status(404).json({ error: "Session not found" });
    await store.upsertPartnersByName(updated.rolls.map((r) => r.partnerName));
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:id — remove a session
sessionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const removed = await store.deleteSession(req.params.id);
    if (!removed) return res.status(404).json({ error: "Session not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
