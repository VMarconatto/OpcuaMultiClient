/** =======================================================
@SECTION : Setup Initializer
@FILE : SetupInitializer.ts
@PURPOSE : Gerenciar criação, localização e dimensionamento
dos arquivos de setup (setuptsconfig.json por client)
@LAST_EDIT : 2025-11-10
// =======================================================*/

import fs from "fs";
import path from "path";


export function resolveSetupFilePath(deviceId: string): string {
  const baseName =
    deviceId === "Client01"
      ? "setuptsconfig.json"
      : `${deviceId}_setuptsconfig.json`;

  const candidates = [
    path.join(process.cwd(), "setups", baseName), // preferido (onde o runtime lê)
    path.join(process.cwd(), baseName), // legado na raiz
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.info(`[SetupPath] client=${deviceId} chosen=${p}`);
      return p;
    }
  }

  /**
  @WHY : se não existir ainda, criar no local padrão ./setups 
  */
  const preferred = path.join(process.cwd(), "setups", baseName);
  const dir = path.dirname(preferred);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  console.info(`[SetupPath] client=${deviceId} chosen(new)=${preferred}`);
  return preferred;
}

/**
 * Cria o arquivo de setup se ainda não existir.
 *
 * @remarks
 * - O conteúdo baseia-se no tamanho do `mapMemory`.
 * - Cada entrada é inicializada com limites padrão (0).
 *
 * @param deviceId - Identificador do client (ex.: `Client01`).
 * @param mapMemory - Lista de tags coletadas do OPC UA.
 *
 * @example
 * ```ts
 * createSetupFileIfMissing("Client01", ["ns=3;i=1001", "ns=3;i=1002"]);
 * ```
 */
export function createSetupFileIfMissing(
  deviceId: string,
  mapMemory: string[]
): void {
  const setupFilePath = resolveSetupFilePath(deviceId);

  if (fs.existsSync(setupFilePath)) {
    console.log(
      `Setup já existe para ${deviceId}: ${path.basename(setupFilePath)}`
    );
    return;
  }

  const setupObj: Record<string, any> = {};
  /**
   @WHY : gerar estrutura básica com campos padrão (mínimo/máximo/unidade/SPAlarms)
   */

  for (let i = 0; i < mapMemory.length; i++) {
    const tagName = `Tag_${String(i + 1).padStart(2, "0")}`;
    setupObj[tagName] = {
      mínimo: 0,
      máximo: 0,
      unidade: "",
      SPAlarmL: 0,
      SPAlarmLL: 0,
      SPAlarmH: 0,
      SPAlarmHH: 0,
    };
  }

  fs.writeFileSync(setupFilePath, JSON.stringify(setupObj, null, 2), "utf-8");
  console.log(
    `Criado ${path.basename(setupFilePath)} com ${mapMemory.length} tags.`
  );
}

/**
 * Garante que o arquivo de setup tenha ao menos `desiredCount` entradas.
 *
 * @remarks
 * - Cresce o arquivo de forma **append-only**, sem apagar chaves existentes.
 * - Caso o arquivo não exista, cria um novo já com o número desejado de tags.
 *
 * @param deviceId - Identificador do client (ex.: `Client01`).
 * @param desiredCount - Número mínimo de tags esperadas no setup.
 *
 * @example
 * ```ts
 * ensureSetupCount("Client02", 40);
 * ```
 */
export function ensureSetupCount(
  deviceId: string,
  desiredCount: number
): void {
  const setupFilePath = resolveSetupFilePath(deviceId);
  /**
  @NOTE : se não existir, cria já com o tamanho correto
   */

  if (!fs.existsSync(setupFilePath)) {
    const arr = Array.from({ length: desiredCount });
    createSetupFileIfMissing(deviceId, arr as unknown as string[]);
    return;
  }

  let obj: Record<string, any> = {};

  try {
    obj = JSON.parse(fs.readFileSync(setupFilePath, "utf-8"));
    if (!obj || typeof obj !== "object") obj = {};
  } catch {
    obj = {};
  }

  const keys = Object.keys(obj);
  const before = keys.length;

  if (desiredCount > before) {
    /**     
    @WHY : manter consistência mesmo que mapMemory aumente
     */

    for (let i = before; i < desiredCount; i++) {
      const tagName = `Tag_${String(i + 1).padStart(2, "0")}`;
      if (!(tagName in obj)) {
        obj[tagName] = {
          mínimo: 0,
          máximo: 0,
          unidade: "",
          SPAlarmL: 0,
          SPAlarmLL: 0,
          SPAlarmH: 0,
          SPAlarmHH: 0,
        };
      }
    }

    fs.writeFileSync(setupFilePath, JSON.stringify(obj, null, 2), "utf-8");
    const after = Object.keys(obj).length;
    console.log(
      `${path.basename(setupFilePath)} ajustado de ${before} → ${after} tags.`
    );
  }
}
