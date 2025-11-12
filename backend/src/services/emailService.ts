
/**
** =======================================================
@SECTION : Email Service
@FILE : emailService.ts
@PURPOSE : Enviar alertas por e-mail via SMTP (Gmail ou serviço configurado via ENV).
@LAST_EDIT : 2025-11-10
** =======================================================
 */

import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let transporter: Transporter;

/**
 * Cria o transporte SMTP autenticado para envio de e-mails.
 *
 * @remarks
 * - Requer variáveis de ambiente:
 *   - `ALERT_EMAIL_USER` → remetente (e-mail da conta)
 *   - `ALERT_EMAIL_PASS` → senha ou App Password
 * - Para Gmail, é obrigatório usar **App Password** se 2FA estiver ativo.
 */
function createTransporter(): Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS,
    },
  });
}

/**
 * Envia um e-mail de alerta com corpo de texto simples.
 *
 * @param subject - Assunto do e-mail.
 * @param body - Corpo da mensagem em texto puro.
 * @param to - (Opcional) Endereço(s) de destino; se ausente, usa `ALERT_EMAIL_DESTINATION`.
 *
 * @example
 * ```ts
 * await sendEmailAlert("Alerta de Pressão", "Pressão acima do limite", "alarmes@suaempresa.com");
 * ```
 */
export async function sendEmailAlert(
  subject: string,
  body: string,
  to?: string
): Promise<void> {
  try {
    /**
    @WHY : lazy init evita recriar o transporter em cada chamada
     */

    if (!transporter) transporter = createTransporter();

    const toAddress = to || process.env.ALERT_EMAIL_DESTINATION;
    if (!toAddress) {
      throw new Error(
        "Destinatário não definido (ALERT_EMAIL_DESTINATION ausente e parâmetro 'to' vazio)."
      );
    }

    if (!process.env.ALERT_EMAIL_USER) {
      throw new Error(
        "Remetente não configurado (ALERT_EMAIL_USER ausente)."
      );
    }

    const info = await transporter.sendMail({
      from: `"OPCUA Alertas" <${process.env.ALERT_EMAIL_USER}>`,
      to: toAddress,
      subject,
      text: body,
    });

    console.log("Email enviado com sucesso:", info.messageId);
  } catch (error) {
    console.error("Falha ao enviar email:", error);
  }
}
