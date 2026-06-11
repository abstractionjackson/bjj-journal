import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const USER = process.env.BJJ_USER ?? "admin";
const PASS = process.env.BJJ_PASS ?? "changeme";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (sep > -1 && safeEqual(user, USER) && safeEqual(pass, PASS)) {
      return next();
    }
  }
  res
    .status(401)
    .set("WWW-Authenticate", 'Basic realm="bjj-journal", charset="UTF-8"')
    .json({ error: "Authentication required" });
}
