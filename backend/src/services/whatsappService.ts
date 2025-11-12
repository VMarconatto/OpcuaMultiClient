
/**
** =======================================================
@SECTION : WhatsApp Service
@FILE : whatsappService.ts
@PURPOSE : Enviar mensagens de alerta via API oficial do WhatsApp (360Dialog).
@LAST_EDIT : 2025-11-10
** =======================================================
 */


import axios from "axios";

// -------------------------------------------------------
// Configuração via ENV
// -------------------------------------------------------
const API_URL = "https://waba.360dialog.io/v1/messages";
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN!;
const TO_PHONE = "55XXXXXXXXXXX"; // Substitua pelo número de destino completo (DDI + DDD)

/**
 * Envia uma mensagem de texto via API WhatsApp Business (360Dialog).
 *
 * @param body - Texto da mensagem.
 *
 * @remarks
 * - É necessário configurar a variável de ambiente `WHATSAPP_API_TOKEN`.
 * - O número de destino deve estar no formato E.164 (`55` + DDD + número).
 * - Para mensagens ricas (imagem, template, etc.), a estrutura do corpo deve ser ajustada.
 *
 * @example
 * ```ts
 * await sendWhatsAppMessage("Alerta: pressão fora dos limites!");
 * ```
 */

export async function sendWhatsAppMessage(body: string): Promise<void> {
  try {
    /**
    @WHY : usa endpoint oficial do 360Dialog (conector do WhatsApp Business)
    */
    
    await axios.post(
      API_URL,
      {
        to: TO_PHONE,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📲 Alerta enviado via WhatsApp");
  } catch (error) {
    /**
    @NOTE : não relança o erro para evitar crash do scheduler
    */
    
    console.error(`❌ Erro ao enviar mensagem WhatsApp: ${error}`);
  }
}
