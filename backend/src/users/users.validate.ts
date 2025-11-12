/**
** =======================================================
@SECTION : Users Validation & Sanitization
@FILE : users.validate.ts
@PURPOSE : Validar e sanitizar payloads de criação/atualização de usuários.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import type { CreateUserPayload, UpdateUserPayload } from "./users.types.js";

// -------------------------------------------------------
// Helpers internos
// -------------------------------------------------------

/**
 * Verifica se um valor é string não vazia, caso contrário lança erro.
 *
 * @param v - Valor a validar.
 * @param field - Nome do campo (para mensagem de erro).
 * @throws Error quando o campo não é string não vazia.
 */
function reqString(v: any, field: string) {
  if (typeof v !== "string" || !v.trim())
    throw new Error(`${field} é obrigatório e deve ser string não vazia`);
}

// -------------------------------------------------------
// Regras de validação
// -------------------------------------------------------

/**
 * Garante que o corpo da requisição de criação seja válido.
 *
 * @param body - Objeto enviado na criação do usuário.
 * @throws Error se o payload for inválido.
 * @example
 * ```ts
 * assertCreateUserPayload(req.body); // lança erro se inválido
 * ```
 */
export function assertCreateUserPayload(body: any): asserts body is CreateUserPayload {
  if (!body || typeof body !== "object") throw new Error("Payload inválido.");

  reqString(body.fullName, "fullName");
  reqString(body.companyEmail, "companyEmail");

  if (body.jobTitle != null && typeof body.jobTitle !== "string")
    throw new Error("jobTitle deve ser string");
  if (body.contactNumber != null && typeof body.contactNumber !== "string")
    throw new Error("contactNumber deve ser string");
  if (body.userLevel != null && typeof body.userLevel !== "string")
    throw new Error("userLevel deve ser string");
}

// -------------------------------------------------------
// Sanitização (criação e atualização)
// -------------------------------------------------------

/**
 * Normaliza o payload de criação:
 * - `companyEmail` → minúsculas
 * - `string` → `.trim()`
 * - Campos opcionais ausentes → `undefined`
 *
 * @param b - Payload original.
 * @returns Payload sanitizado pronto para persistência.
 */
export function sanitizeForInsert(b: CreateUserPayload): CreateUserPayload {
  return {
    fullName: String(b.fullName).trim(),
    jobTitle: b.jobTitle != null ? String(b.jobTitle).trim() : undefined,
    companyEmail: String(b.companyEmail).trim().toLowerCase(),
    contactNumber: b.contactNumber != null ? String(b.contactNumber).trim() : undefined,
    userLevel: b.userLevel != null ? String(b.userLevel).trim() : undefined,
  };
}

/**
 * Sanitiza um patch de atualização:
 * - Apenas campos string são aceitos e passam por `.trim()`
 * - `companyEmail` → minúsculas
 *
 * @param b - Objeto parcial recebido no update.
 * @returns Patch sanitizado com somente campos válidos.
 */
export function sanitizeForUpdate(b: any): UpdateUserPayload {
  const p: UpdateUserPayload = {};
  if (typeof b?.fullName === "string") p.fullName = b.fullName.trim();
  if (typeof b?.jobTitle === "string") p.jobTitle = b.jobTitle.trim();
  if (typeof b?.companyEmail === "string") p.companyEmail = b.companyEmail.trim().toLowerCase();
  if (typeof b?.contactNumber === "string") p.contactNumber = b.contactNumber.trim();
  if (typeof b?.userLevel === "string") p.userLevel = b.userLevel.trim();
  return p;
}
