/**
** =======================================================
@SECTION : Users Collection Helper
@FILE : users.collection.ts
@PURPOSE : Retornar a coleção de usuários e garantir índices no MongoDB.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import type { Db, Collection } from "mongodb";
import type { UserProfile } from "./users.types.js";
import { ensureUsersIndexes } from "./users.indexes.js";

const COLLECTION_NAME = "users"; //  coleção fixa do módulo

/**
 * Retorna a coleção `users` e garante índices obrigatórios.
 *
 * @remarks
 * - A função é chamada dentro de rotas /users e /auth.
 * - Os índices são garantidos via `ensureUsersIndexes`.
 *
 * @param db - Instância ativa do MongoDB (`Db`).
 * @returns Promessa com a Collection tipada `UserProfile`.
 *
 * @example
 * ```ts
 * const coll = await getUsersCollection(db);
 * const user = await coll.findOne({ email: "admin@example.com" });
 * ```
 */
export async function getUsersCollection(
  db: Db
): Promise<Collection<UserProfile>> {
  /**
  @WHY : sempre garantir que a coleção tenha índices consistentes
  */
  const coll = db.collection<UserProfile>(COLLECTION_NAME);
  await ensureUsersIndexes(coll);
  return coll;
}
