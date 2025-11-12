
/**
** =======================================================
@SECTION : Users Types
@FILE : users.types.ts
@PURPOSE : Tipos e payloads para criação/atualização de usuários.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


import { ObjectId } from "mongodb";

/**
 * Perfil de usuário armazenado na coleção `users`.
 *
 * @remarks
 * - `companyEmail` deve ser armazenado **sempre em minúsculas**.
 * - `passwordHash` nunca deve ser exposto em respostas de API.
 * - `userLevel` possui valores usuais (`admin`, `user`, `viewer`), mas aceita string
 *   para compatibilidade retroativa.
 */
export interface UserProfile {
  _id?: ObjectId | string;       /** @NOTE : pode vir de ObjectId ou já serializado*/
  fullName: string;
  jobTitle?: string;                 /** @WHY : normalizar para minúsculas facilita buscas*/
  companyEmail: string;             
  contactNumber?: string;
  userLevel?: "admin" | "user" | "viewer" | string;
  createdAt?: Date;
  updatedAt?: Date;                   /** @WARN : nunca retornar em respostas*/
  passwordHash?: string;            
}

/**
 * Campos aceitos no payload de criação de usuário.
 */
export type CreateUserPayload = Pick<
  UserProfile,
  "fullName" | "jobTitle" | "companyEmail" | "contactNumber" | "userLevel"
>;

/**
 * Payload de atualização parcial (patch).
 */
export type UpdateUserPayload = Partial<CreateUserPayload>;
