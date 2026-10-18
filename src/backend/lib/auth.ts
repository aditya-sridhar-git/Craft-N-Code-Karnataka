import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Store, Teacher } from "@/backend/db/store";

/*
 * Teacher sign-in. Passwords are hashed with scrypt (Node's built-in, memory-hard KDF) and a random
 * salt. A session is a random token in an HttpOnly cookie; the database keeps only its SHA-256.
 */

export const SESSION_COOKIE = "taproot_teacher";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

const scryptAsync = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** A hash that never matches, checked when an email isn't registered so both cases take as long. */
let decoy: Promise<string> | null = null;
export const decoyHash = () => (decoy ??= hashPassword(randomBytes(12).toString("hex")));

export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const newId = () => randomBytes(12).toString("base64url");

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

const cookieAttributes = (maxAge: number) =>
  `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

/** Starts a session for a teacher; returns the Set-Cookie header value. */
export async function startSession(store: Store, teacherId: string) {
  const token = newToken();
  await store.createSession(tokenHash(token), teacherId, new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000));
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes(SESSION_DAYS * 24 * 60 * 60)}`;
}

export async function endSession(store: Store, req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) await store.deleteSession(tokenHash(token));
  return `${SESSION_COOKIE}=; ${cookieAttributes(0)}`;
}

export async function currentTeacher(store: Store, req: Request): Promise<Teacher | null> {
  const token = readCookie(req, SESSION_COOKIE);
  return token ? store.sessionTeacher(tokenHash(token)) : null;
}

/**
 * Requests that change data must come from this site's own pages. Together with SameSite=Lax
 * cookies and JSON bodies, this blocks cross-site request forgery.
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers, and server-to-server tests
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
