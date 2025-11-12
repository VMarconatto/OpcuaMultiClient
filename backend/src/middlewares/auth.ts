/**
** =======================================================
@SECTION : Auth — JWT Middleware
@FILE : src/middlewares/auth.ts
@PURPOSE : Assinar e validar tokens JWT para proteger rotas Express sem alterar a lógica original.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

// src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";

// use este import se seu tsconfig tem "esModuleInterop": true
import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
// se NÃO usa esModuleInterop, troque por:
// import * as jwt from "jsonwebtoken";
// type JwtPayload = jwt.JwtPayload;
// type Secret = jwt.Secret;
// type SignOptions = jwt.SignOptions;

/** Segredo do JWT; use variável de ambiente em produção. */
const JWT_SECRET: Secret = process.env.JWT_SECRET || "change-me";
/** Tempo de expiração; aceita formatos do jsonwebtoken (ex.: "1h", 3600). */
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN as any) || "1h";

/**
 * Claims padrão que esperamos no token de acesso.
 */
 type AuthClaims = JwtPayload & {
  userId: string;
  email: string;
};

/**
 * Assina um token de acesso com `userId` e `email`.
 *
 * @param payload Objeto com `userId` e `email` do usuário autenticado
 * @returns Token JWT assinado (string)
 */
export function signAccessToken(payload: { userId: string; email: string }): string {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  // tipando secret + options, o TS para de confundir com o overload de callback
  return jwt.sign(payload, JWT_SECRET, opts);
}

/**
 * Middleware de proteção de rota baseado em Bearer Token.
 *
 * Comportamento:
 * - Lê o cabeçalho `Authorization: Bearer <token>`.
 * - Valida e decodifica o token usando `JWT_SECRET`.
 * - Garante que existam `userId` e `email` no payload.
 * - Expõe `req.auth = { userId, email }` para rotas posteriores.
 * - Responde 401 para token ausente, inválido ou expirado.
 *
 * @example
 * app.get("/api/secure", ensureAuth, (req, res) => {
 *   const { userId } = (req as any).auth; // já tipado/adicionado pelo middleware
 *   res.json({ ok: true, userId });
 * });
 */
export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthClaims;
    if (!decoded?.userId || !decoded?.email) {
      return res.status(401).json({ error: "Token inválido" });
    }
    (req as any).auth = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
