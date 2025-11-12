
/**
** @SECTION : PKI Helpers
** @FILE : pkiUtils.ts
** @PURPOSE : Garantir diretórios/artefatos PKI do cliente OPC UA,
**            gerar certificado self-signed se ausente e promover
**            certificados rejeitados para a store de confiáveis.
** @LAST_EDIT : 2025-11-10
 * ```
 */
import path from "path";
import fs from "fs";
import os from "os";

import { OPCUACertificateManager } from "node-opcua";

/**
 * Garante uma PKI por par (deviceId, endpoint), preserva material existente,
 * inicializa o gerenciador de certificados do `node-opcua`, gera um certificado
 * self-signed se não houver, e move certificados rejeitados para a store de confiáveis.
 *
 * @param deviceId - Identificador lógico do cliente OPC UA (ex.: "Client01").
 * @param endpoint - Endpoint do servidor OPC UA (parte do nome do diretório PKI).
 * @returns Objeto com caminhos absolutos para `certFile` e `keyFile`.
 *
 * @remarks
 * - `automaticallyAcceptUnknownCertificate: true` acelera *labs/dev*. Em produção,
 *   avalie uma política de confiança com aprovação manual e auditoria.
 * - O layout padrão do `OPCUACertificateManager` utiliza subpastas `own`, `trusted` e `rejected`.
 * - Esta função **não apaga** material PKI existente (operamos de forma idempotente).
 *
 * @example
 * ```ts
 * const { certFile, keyFile } = await ensureClientPKI("Client01", "opc.tcp://127.0.0.1:4840");
 * console.log(certFile, keyFile);
 * ```
 */
export async function ensureClientPKI(deviceId: string, endpoint: string) {
  // -------------------------------------------------------
  // Diretórios e caminhos calculados por cliente/endpoint
  // -------------------------------------------------------
  const sanitizedDeviceId = deviceId.replace(/[^a-zA-Z0-9]/g, "_");
  const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, "_");
  const pkiDir = path.resolve("config/pki", `${sanitizedDeviceId}_${sanitizedEndpoint}`);
  const certFile = path.join(pkiDir, "own/certs/self_signed_certificate.pem");
  const keyFile = path.join(pkiDir, "own/private/private_key.pem");


  // -------------------------------------------------------
  /**
  ** @WHY : não destruir chaves/certificados já emitidos
  */
  // -------------------------------------------------------
  if (!fs.existsSync(pkiDir)) {
    fs.mkdirSync(pkiDir, { recursive: true });
    console.log(`Diretório PKI criado: ${pkiDir}`);
  } else {
    console.log(`Diretório PKI já existe: ${pkiDir} (preservado)`);
  }
  
  // -------------------------------------------------------
  /** Inicialização do gerenciador de certificados
  ** @NOTE : rootFolder aponta para o diretório isolado do cliente
  */
  // -------------------------------------------------------

  const certificateManager = new OPCUACertificateManager({
    automaticallyAcceptUnknownCertificate: true, // ver @remarks (produção)
    rootFolder: pkiDir
  });

  await certificateManager.initialize();

  // -------------------------------------------------------
  /** Emissão de certificado self-signed (se ausente)
  ** @WHY : alguns servidores exigem apresentação de certificado do cliente
  */
  // -------------------------------------------------------
  const applicationUri = `urn:${deviceId}`;
  console.log(`Verificando certificado self-signed com applicationUri: ${applicationUri}`);

  if (!fs.existsSync(certFile)) {
    console.log(`Gerando novo certificado self-signed para ${applicationUri}`);
    await certificateManager.createSelfSignedCertificate({
      applicationUri,
      subject: "/CN=OpcuaClient",
      dns: [os.hostname()],
      validity: 365,
      startDate: new Date(),
    });
  }
  // -------------------------------------------------------
  /** Promoção de certificados rejeitados → trusted
  ** @WHY : facilita bootstrap em ambientes controlados (labs/dev)
  ** @WARN : em produção, prefira processo de aprovação manual
  */
  // -------------------------------------------------------
  const rejectedDir = path.join(pkiDir, "rejected");
  const trustedDir = path.join(pkiDir, "trusted/certs");

  if (fs.existsSync(rejectedDir)) {
    const rejectedFiles = fs.readdirSync(rejectedDir);
    for (const file of rejectedFiles) {
      const source = path.join(rejectedDir, file);
      const destination = path.join(trustedDir, file);
      fs.renameSync(source, destination);
      console.log(`✅ Certificado do servidor movido para trusted: ${file}`);
    }
  }

  // -------------------------------------------------------
  //  Listagem útil para auditoria de execução
  // -------------------------------------------------------
  console.log(
    "Arquivos PKI no diretório:",
    fs.readdirSync(pkiDir, { withFileTypes: true }).map(f => f.name)
  );
  console.log(
    "Arquivos em own/certs:",
    fs.existsSync(path.join(pkiDir, "own/certs")) ? fs.readdirSync(path.join(pkiDir, "own/certs")) : []
  );
  console.log(
    "Arquivos em own/private:",
    fs.existsSync(path.join(pkiDir, "own/private")) ? fs.readdirSync(path.join(pkiDir, "own/private")) : []
  );

  return { certFile, keyFile };
}
