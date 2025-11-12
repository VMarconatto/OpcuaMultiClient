
/**
** =======================================================
@SECTION : Users Collection Indexes
@FILE : users.indexes.ts
@PURPOSE : Garantir a criação de índices essenciais na coleção de usuários.
@LAST_EDIT : 2025-11-10
** =======================================================
 */

import type { Collection } from "mongodb";
import type { UserProfile } from "./users.types.js";

let ensured = false;

/**
 * Garante que os índices necessários da coleção `users` sejam criados.
 *
 * @remarks
 * - Executa apenas **uma vez por ciclo de processo** (controlado via flag `ensured`).
 * - Cria índice único em `companyEmail` para evitar duplicidade.
 *
 * @param coll - Coleção tipada `Collection<UserProfile>`.
 * @example
 * ```ts
 * await ensureUsersIndexes(db.collection("users"));
 * ```
 */
export async function ensureUsersIndexes(
  coll: Collection<UserProfile>
): Promise<void> {
  if (ensured) return;
/**
@WHY : evitar e-mails duplicados dentro do mesmo tenant
*/
 
  await coll.createIndex(
    { companyEmail: 1 },
    { unique: true, name: "uniq_companyEmail" }
  );

  ensured = true;
}
