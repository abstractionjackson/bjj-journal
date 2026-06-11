import { randomUUID } from "node:crypto";
import { Router } from "express";
import { validatePartnerInput } from "../schema.js";
import * as store from "../storage.js";

export const partnersRouter = Router();

// GET /api/partners — list all partners, Generic first then alphabetical
partnersRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await store.listPartners());
  } catch (err) {
    next(err);
  }
});

// POST /api/partners — create a partner (names are unique, case-insensitive)
partnersRouter.post("/", async (req, res, next) => {
  try {
    if (!validatePartnerInput(req.body)) {
      return res
        .status(400)
        .json({ error: "Invalid partner", details: validatePartnerInput.errors });
    }
    const name = req.body.name.trim();
    if (!name) {
      return res.status(400).json({
        error: "Invalid partner",
        details: [{ message: "Name must not be blank." }],
      });
    }
    const existing = await store.findPartnerByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ error: "Partner already exists", partner: existing });
    }
    const partner = await store.createPartner({ id: randomUUID(), name });
    res.status(201).location(`/api/partners/${partner.id}`).json(partner);
  } catch (err) {
    next(err);
  }
});

// GET /api/partners/:id — fetch one partner
partnersRouter.get("/:id", async (req, res, next) => {
  try {
    const partner = await store.getPartner(req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    res.json(partner);
  } catch (err) {
    next(err);
  }
});
