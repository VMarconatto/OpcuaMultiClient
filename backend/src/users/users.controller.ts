
/**
** =======================================================
@SECTION : Users Controller
@FILE : users.controller.ts
@PURPOSE : Controlador principal para CRUD de usuários na coleção MongoDB.
@LAST_EDIT : 2025-11-10
** =======================================================
 */


import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import { getUsersCollection } from "./users.collection.js";
import {
  assertCreateUserPayload,
  sanitizeForInsert,
  sanitizeForUpdate,
} from "./users.validate.js";

/**
 * Cria um conjunto de manipuladores Express para operações CRUD de usuários.
 *
 * @param db - Instância ativa do MongoDB usada para acessar a coleção `users`.
 * @returns Objeto contendo métodos CRUD (`create`, `update`, `getById`, `getByEmail`, `remove`).
 *
 * @remarks
 * Cada método segue o padrão REST e retorna respostas JSON padronizadas:
 * - 2xx → sucesso
 * - 4xx → erro de validação ou recurso não encontrado
 * - 5xx → erro interno
 *
 * @example
 * ```ts
 * app.use("/users", usersController(db));
 * ```
 */
export function usersController(db: Db) {
  return {
    /**
    ** =======================================================
    @SECTION : POST /users
    ** =======================================================
     */

    create: async (req: Request, res: Response) => {
      try {
        assertCreateUserPayload(req.body);
        const payload = sanitizeForInsert(req.body);
        const coll = await getUsersCollection(db);
        const email = payload.companyEmail;

           /**
    ** =======================================================
    @WHY : upsert permite atualizar se já existir ou criar novo documento
    ** =======================================================
     */
        await coll.updateOne(
          { companyEmail: email },
          {
            $set: { ...payload, updatedAt: new Date() },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        const doc = await coll.findOne({ companyEmail: email });
        return res.status(201).json(doc);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("E11000"))
          return res.status(409).json({ error: "E-mail já cadastrado." });
        return res
          .status(400)
          .json({ error: err?.message ?? "Erro ao criar usuário." });
      }
    },
    /**
    ** =======================================================
    @SECTION : PUT /users/:id
    ** =======================================================
     */

    update: async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "id inválido" });

      try {
        const patch = sanitizeForUpdate(req.body || {});
        const coll = await getUsersCollection(db);
        /**
        @WHY : atualiza somente os campos enviados (patch parcial)
        */
    
        const r = await coll.updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...patch, updatedAt: new Date() } }
        );

        if (r.matchedCount === 0)
          return res.status(404).json({ error: "Usuário não encontrado." });

        const updated = await coll.findOne({ _id: new ObjectId(id) });
        return res.json(updated);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("E11000"))
          return res.status(409).json({ error: "E-mail já cadastrado." });
        return res
          .status(400)
          .json({ error: err?.message ?? "Erro ao atualizar usuário." });
      }
    },
    /**
    ** =======================================================
    @SECTION: GET /users/:id
    ** =======================================================
    */
 
    getById: async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "id inválido" });

      const coll = await getUsersCollection(db);
      const doc = await coll.findOne({ _id: new ObjectId(id) });

      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    },

    /**
    ** =======================================================
    @SECTION : GET /users?email=...
    ** =======================================================
    */

    getByEmail: async (req: Request, res: Response) => {
      const email = String(req.query.email || "").trim().toLowerCase();
      if (!email)
        return res.status(400).json({ error: "email é obrigatório" });

      const coll = await getUsersCollection(db);
      const doc = await coll.findOne({ companyEmail: email });

      if (!doc) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(doc);
    },

    /**
    ** =======================================================
    @SECTION : DELETE /users/:id
    ** =======================================================
    */

    remove: async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "id inválido" });

      const coll = await getUsersCollection(db);
      const { deletedCount } = await coll.deleteOne({ _id: new ObjectId(id) });

      if (!deletedCount)
        return res.status(404).json({ error: "Usuário não encontrado." });

      return res.status(204).send();
    },
  };
}
