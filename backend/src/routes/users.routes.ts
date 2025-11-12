/**
** =======================================================
@SECTION : Users Routes (eager & lazy)
@FILE : users.routes.ts
@PURPOSE : Rotas REST para CRUD de usuários, em duas variantes:
1) eager (DB já passado na montagem) e 2) lazy (DB resolvido por closure).
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { Router } from "express";
import { ObjectId, Db } from "mongodb";
import argon2 from "argon2";
import {
  assertCreateUserPayload,
  sanitizeForInsert,
  sanitizeForUpdate,
} from "../users/users.validate.js";
import { getUsersCollection } from "../users/users.collection.js";

/**
@NOTE : projeção que oculta o hash nas respostas
*/
const projectionNoSecret = { projection: { passwordHash: 0 } } as const;

// -------------------------------------------------------
// Helpers internos
// -------------------------------------------------------

/** Gera hash seguro (argon2id). */
async function hashPassword(raw: string) {
  return argon2.hash(raw, { type: argon2.argon2id });
}

/** Extrai `password` do corpo, validando string não vazia. */
function getRawPassword(body: any): string | null {
  if (typeof body?.password === "string") {
    const p = body.password.trim();
    return p.length ? p : null;
  }
  return null;
}

/**
 * Versão “eager” (DB já disponível na montagem).
 *
 * @param db - Instância ativa do MongoDB.
 * @returns Router configurado com rotas /users (CRUD).
 */
export function makeUsersRoutes(db: Db) {
  const router = Router();

  // -----------------------------------------------------
  // CREATE — POST /users  (create-only; 409 se e-mail já existir)
  // -----------------------------------------------------
  router.post("/users", async (req, res) => {
    try {
      assertCreateUserPayload(req.body);
      const payload = sanitizeForInsert(req.body);

      const rawPassword = getRawPassword(req.body);
      if (!rawPassword || rawPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "password é obrigatório e deve ter ao menos 8 caracteres." });
      }

      const coll = await getUsersCollection(db);
      const email = String(payload.companyEmail).toLowerCase().trim();

      const doc = {
        ...payload,
        companyEmail: email,
        passwordHash: await hashPassword(rawPassword),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const ins = await coll.insertOne(doc);
        const user = await coll.findOne(
          { _id: ins.insertedId },
          projectionNoSecret
        );
        return res.status(201).json(user);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("E11000")) {
          return res.status(409).json({ error: "E-mail já cadastrado." });
        }
        throw err;
      }
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao criar usuário." });
    }
  });

  // -----------------------------------------------------
  // UPDATE — PUT /users/:id  (re-hash se password informado)
  // -----------------------------------------------------
  router.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });

    try {
      const patch = sanitizeForUpdate(req.body || {});
      if (patch.companyEmail) {
        patch.companyEmail = String(patch.companyEmail).toLowerCase().trim();
      }

      const rawPassword = getRawPassword(req.body);
      const toSet: any = { ...patch, updatedAt: new Date() };
      if (rawPassword) {
        if (rawPassword.length < 8) {
          return res
            .status(400)
            .json({ error: "password deve ter ao menos 8 caracteres." });
        }
        toSet.passwordHash = await hashPassword(rawPassword);
      }

      const coll = await getUsersCollection(db);
      const r = await coll.updateOne(
        { _id: new ObjectId(id) },
        { $set: toSet }
      );
      if (r.matchedCount === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });

      const updated = await coll.findOne(
        { _id: new ObjectId(id) },
        projectionNoSecret
      );
      return res.json(updated);
    } catch (err: any) {
      if (String(err?.message || "").includes("E11000")) {
        return res.status(409).json({ error: "E-mail já cadastrado." });
      }
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao atualizar usuário." });
    }
  });

  // -----------------------------------------------------
  // READ — GET /users/:id
  // -----------------------------------------------------
  router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });

    try {
      const coll = await getUsersCollection(db);
      const doc = await coll.findOne(
        { _id: new ObjectId(id) },
        projectionNoSecret
      );
      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao buscar usuário." });
    }
  });

  // -----------------------------------------------------
  // READ — GET /users?email=...
  // -----------------------------------------------------
  router.get("/users", async (req, res) => {
    try {
      const email = String(req.query.email || "").toLowerCase().trim();
      if (!email) return res.status(400).json({ error: "email é obrigatório" });

      const coll = await getUsersCollection(db);
      const doc = await coll.findOne({ companyEmail: email }, projectionNoSecret);
      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao buscar por e-mail." });
    }
  });

  // -----------------------------------------------------
  // DELETE — /users/:id
  // -----------------------------------------------------
  router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });

    try {
      const coll = await getUsersCollection(db);
      const { deletedCount } = await coll.deleteOne({
        _id: new ObjectId(id),
      });
      if (!deletedCount)
        return res.status(404).json({ error: "Usuário não encontrado." });
      return res.status(204).send();
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao deletar usuário." });
    }
  });

  return router;
}

/**
 * Versão “lazy”: as rotas ficam disponíveis desde o boot, mas retornam 503
 * enquanto o DB de usuários não estiver pronto.
 *
 * @param getDb - Closure que retorna `Db | null`.
 * @returns Router Express.
 */
export function makeUsersRoutesLazy(getDb: () => Db | null) {
  const router = Router();

  // Guard: bloqueia acesso enquanto o DB não estiver pronto
  router.use((req, res, next) => {
    const db = getDb();
    if (!db) {
      return res.status(503).json({
        error:
          "Banco de dados de usuários não está pronto. Tente novamente em instantes.",
      });
    }
    (req as any).__usersDb = db;
    next();
  });

  // CREATE /users (create-only; 409 se e-mail já existir)
  router.post("/users", async (req, res) => {
    try {
      assertCreateUserPayload(req.body);
      const payload = sanitizeForInsert(req.body);

      const rawPassword = getRawPassword(req.body);
      if (!rawPassword || rawPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "password é obrigatório e deve ter ao menos 8 caracteres." });
      }

      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);
      const email = String(payload.companyEmail).toLowerCase().trim();

      const doc = {
        ...payload,
        companyEmail: email,
        passwordHash: await hashPassword(rawPassword),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const ins = await coll.insertOne(doc);
        const user = await coll.findOne(
          { _id: ins.insertedId },
          projectionNoSecret
        );
        return res.status(201).json(user);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("E11000")) {
          return res.status(409).json({ error: "E-mail já cadastrado." });
        }
        throw err;
      }
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao criar usuário." });
    }
  });

  // UPDATE /users/:id (updatedAt; re-hash se password)
  router.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });
    try {
      const patch = sanitizeForUpdate(req.body || {});
      if (patch.companyEmail)
        patch.companyEmail = String(patch.companyEmail).toLowerCase().trim();

      const rawPassword = getRawPassword(req.body);
      const toSet: any = { ...patch, updatedAt: new Date() };
      if (rawPassword) {
        if (rawPassword.length < 8) {
          return res
            .status(400)
            .json({ error: "password deve ter ao menos 8 caracteres." });
        }
        toSet.passwordHash = await hashPassword(rawPassword);
      }

      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);
      const r = await coll.updateOne(
        { _id: new ObjectId(id) },
        { $set: toSet }
      );
      if (r.matchedCount === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });
      const updated = await coll.findOne(
        { _id: new ObjectId(id) },
        projectionNoSecret
      );
      return res.json(updated);
    } catch (err: any) {
      if (String(err?.message || "").includes("E11000")) {
        return res.status(409).json({ error: "E-mail já cadastrado." });
      }
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao atualizar usuário." });
    }
  });

  // READ by id — GET /users/:id
  router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });
    try {
      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);
      const doc = await coll.findOne(
        { _id: new ObjectId(id) },
        projectionNoSecret
      );
      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao buscar usuário." });
    }
  });

  // READ by email — GET /users?email=...
  router.get("/users", async (req, res) => {
    try {
      const email = String(req.query.email || "").toLowerCase().trim();
      if (!email) return res.status(400).json({ error: "email é obrigatório" });
      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);
      const doc = await coll.findOne(
        { companyEmail: email },
        projectionNoSecret
      );
      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao buscar por e-mail." });
    }
  });

  // DELETE /users/:id
  router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "id inválido" });
    try {
      const db: Db = (req as any).__usersDb;
      const coll = await getUsersCollection(db);
      const { deletedCount } = await coll.deleteOne({
        _id: new ObjectId(id),
      });
      if (!deletedCount)
        return res.status(404).json({ error: "Usuário não encontrado." });
      return res.status(204).send();
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err?.message ?? "Erro ao deletar usuário." });
    }
  });

  return router;
}

export default makeUsersRoutes;
