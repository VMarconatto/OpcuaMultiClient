/**
** =======================================================
@SECTION : Auth Routes
@FILE : auth.routes.ts
@PURPOSE : Rotas de autenticação (login/logout/me) com sessões em memória e cookies assinados.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { Router, type Request, type Response } from "express";
import type { Db } from "mongodb";
import argon2 from "argon2";
import { getUsersCollection } from "../users/users.collection.js";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";

// -------------------------------------------------------
// Sessões em memória (sid → Session)
// -------------------------------------------------------
type Session = { userId: string; email: string; createdAt: number; expiresAt: number };
const SESSIONS = new Map<string, Session>();
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000); // 1h

/** Lê o cookie de sessão (sid) assinado ou não. */
function readSid(req: Request): string | null {
  const c = (req as any).signedCookies || (req as any).cookies || {};
  const sid = c?.sid;
  return typeof sid === "string" && sid ? sid : null;
}

/** Retorna a sessão ativa (se ainda válida) */
function getActiveSession(req: Request): { sid: string; s: Session } | null {
  const sid = readSid(req);
  if (!sid) return null;
  const s = SESSIONS.get(sid);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    SESSIONS.delete(sid);
    return null;
  }
  return { sid, s };
}

/** Define cookie de sessão */
function setSessionCookie(res: Response, sid: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    signed: true,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

/** Remove cookie de sessão */
function clearSessionCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("sid", { httpOnly: true, sameSite: "lax", secure: isProd, signed: true, path: "/" });
}

/**
** =======================================================
@SECTION : Roteador principal (lazy load)
** =======================================================
*/

/**
 * Cria e retorna rotas de autenticação.
 *
 * @param getDb - Função que devolve o `Db` ativo (ou null, se indisponível).
 * @returns Router Express configurado.
 *
 * @remarks
 * - Sessões são mantidas em memória (`Map`) com TTL (1h por padrão).
 * - Cookies são assinados; use `COOKIE_SECRET` no `.env`.
 */
export function makeAuthRoutesLazy(getDb: () => Db | null) {
  const router = Router();

  // -------------------------------------------------------
  // Guard: bloqueia rotas se DB não estiver pronto
  // -------------------------------------------------------
  router.use((req, res, next) => {
    const db = getDb();
    if (!db) {
      return res.status(503).json({
        error: "Banco de dados de usuários não está pronto. Tente novamente em instantes.",
      });
    }
    (req as any).__usersDb = db;
    next();
  });

  /** Remove sessão anterior (se houver) antes de criar nova. */
  function ensureSingleSession(req: Request, res: Response, next: Function) {
    const active = getActiveSession(req);
    if (active) {
      SESSIONS.delete(active.sid);
      clearSessionCookie(res);
    }
    next();
  }

  /**
  ** -------------------------------------------------------
  @SECTION : POST /auth/login
  ** -------------------------------------------------------
  */

  router.post("/login", ensureSingleSession, async (req, res) => {
    const rawEmail =
      typeof req.body?.email === "string"
        ? req.body.email
        : typeof req.body?.companyEmail === "string"
        ? req.body.companyEmail
        : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!rawEmail.trim() || !password) {
      return res.status(400).json({ error: "email/companyEmail e password são obrigatórios" });
    }

    const email = rawEmail.trim().toLowerCase();
    const db: Db = (req as any).__usersDb;
    const coll = await getUsersCollection(db);

    const user = await coll.findOne(
      { companyEmail: email },
      { projection: { passwordHash: 1, fullName: 1, companyEmail: 1, createdAt: 1, updatedAt: 1 } }
    );

    if (!user) return res.status(404).json({ error: "e-mail não encontrado" });
    if (!user.passwordHash)
      return res.status(400).json({ error: "Usuário não possui passwordHash cadastrado" });

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return res.status(401).json({ error: "senha inválida" });
    /**
    @WHY : login idempotente — sempre substitui sessão anterior
    */
    
    const sid = randomUUID();
    SESSIONS.set(sid, {
      userId: String(user._id),
      email: user.companyEmail,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    setSessionCookie(res, sid);

    const { passwordHash, ...safe } = user as any;
    return res.status(200).json({ user: safe });
  });

  /**
  ** -------------------------------------------------------
  @SECTION : POST /auth/logout
  ** -------------------------------------------------------
  */

  router.post("/logout", (req, res) => {
    const active = getActiveSession(req);
    if (active) SESSIONS.delete(active.sid);
    clearSessionCookie(res);
    return res.status(204).send();
  });

  /**
  ** -------------------------------------------------------
  @SECTION : GET /auth/me
  ** -------------------------------------------------------
  */
 
  router.get("/me", async (req, res) => {
    const active = getActiveSession(req);
    if (!active) return res.status(401).json({ error: "não autenticado" });

    try {
      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);

      const user = await coll.findOne(
        { _id: new ObjectId(active.s.userId) },
        { projection: { passwordHash: 0 } }
      );

      if (!user) return res.status(401).json({ error: "sessão inválida" });
      return res.json({ user });
    } catch (e) {
      return res.status(500).json({ error: "falha ao carregar usuário" });
    }
  });

  return router;
}

export default makeAuthRoutesLazy;
