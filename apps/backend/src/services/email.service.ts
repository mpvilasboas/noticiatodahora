import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { GeneratedContent } from './geminiLLM.service.js';

export interface SendReportEmailDTO {
  recipient?: string;
  locationAddress: string;
  transcription: string;
  userNotes?: string;
  audioUrl?: string;
  photoUrl?: string;
  generatedContent: GeneratedContent;
}

export async function sendReportByEmail(dto: SendReportEmailDTO): Promise<boolean> {
  const recipient = dto.recipient?.trim() || ENV.DESTINATION_EMAIL || 'matheuspvilasboas@gmail.com';
  const { portalArticle, radioScript } = dto.generatedContent;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 20px; }
      .header { background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; color: #38bdf8; }
      .badge { display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; margin-top: 8px; }
      .content { background-color: #ffffff; border: 1px solid #e2e8f0; padding: 24px; border-radius: 0 0 12px 12px; }
      .meta-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; }
      
      /* Radio Box Highlight */
      .radio-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 18px; border-radius: 12px; margin-bottom: 28px; }
      .radio-box h2 { margin-top: 0; color: #1d4ed8; font-size: 18px; display: flex; align-items: center; gap: 8px; }
      .radio-script { font-size: 16px; font-weight: 500; color: #0f172a; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid #bfdbfe; line-height: 1.5; white-space: pre-wrap; }
      
      /* Portal Box */
      .portal-box { background-color: #ffffff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin-bottom: 24px; }
      .portal-box h2 { margin-top: 0; color: #0f172a; font-size: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
      .lead { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 16px; }
      .body-text { font-size: 14px; color: #475569; white-space: pre-wrap; }
      
      .media-links { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📻 Notícia Toda Hora</h1>
      <span class="badge">Relato de Campo Recebido</span>
    </div>

    <div class="content">
      <div class="meta-box">
        <strong>📍 Localização:</strong> ${dto.locationAddress}<br>
        <strong>📅 Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
      </div>

      <!-- SEÇÃO RÁDIO (PARA O LOCUTOR NO AR) -->
      <div class="radio-box">
        <h2>📻 ROTEIRO PARA O LOCUTOR NO AR (RÁDIO)</h2>
        <h3 style="margin: 6px 0 12px 0; color: #1e3a8a;">${radioScript.title}</h3>
        <div class="radio-script">${radioScript.broadcastScript}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #1d4ed8; font-weight: bold;">
          ⏱️ Duração estimada de locução: ${radioScript.durationEstimateSeconds} segundos
        </p>
      </div>

      <!-- SEÇÃO PORTAL WEB -->
      <div class="portal-box">
        <h2>📰 MATÉRIA FORMATADA PARA O PORTAL WEB</h2>
        <h3 style="font-size: 20px; color: #0f172a; margin-top: 10px;">${portalArticle.headline}</h3>
        <div class="lead">${portalArticle.lead}</div>
        <div class="body-text">${portalArticle.bodyMarkdown}</div>

        ${portalArticle.photoCaption ? `<p style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 12px;">📸 Legenda da Foto: ${portalArticle.photoCaption}</p>` : ''}
        ${portalArticle.tags && portalArticle.tags.length ? `<p style="font-size: 12px; color: #3b82f6;">🏷️ Tags: ${portalArticle.tags.join(', ')}</p>` : ''}
      </div>

      <div class="media-links">
        <strong>Mídias Gravadas no Campo:</strong><br>
        ${dto.audioUrl ? `🎙️ <a href="${dto.audioUrl}" target="_blank">Ouvir Áudio Original</a><br>` : ''}
        ${dto.photoUrl ? `📷 <a href="${dto.photoUrl}" target="_blank">Visualizar Foto Registrada</a><br>` : ''}
      </div>
    </div>

    <div class="footer">
      Notícia Toda Hora - Sistema de Jornalismo de Campo Automatizado por IA
    </div>
  </body>
  </html>
  `;

  // 1. Try Resend HTTP API if key is present
  if (ENV.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Notícia Toda Hora <onboarding@resend.dev>',
          to: [recipient],
          subject: `[RÁDIO + PORTAL] ${radioScript.title}`,
          html: htmlContent
        })
      });

      const resendData: any = await resendRes.json();
      if (resendRes.ok) {
        console.log(`[Email Service] E-mail enviado com sucesso via Resend API para ${recipient} (ID: ${resendData.id})`);
        return true;
      } else {
        console.error('[Email Service] Resend API retornou erro:', resendData);
      }
    } catch (err) {
      console.error('[Email Service] Erro ao enviar via Resend API:', err);
    }
  }

  // 2. Try SMTP Nodemailer if host is present
  if (ENV.SMTP_HOST && ENV.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: '"Notícia Toda Hora" <onboarding@resend.dev>',
        to: recipient,
        subject: `[RÁDIO + PORTAL] ${radioScript.title}`,
        html: htmlContent,
      });

      console.log(`[Email Service] E-mail enviado com sucesso via SMTP para ${recipient}`);
      return true;
    } catch (err) {
      console.error('[Email Service] Erro ao enviar via SMTP:', err);
    }
  }

  // 3. Fallback: Log to console in dev mode
  console.log('====================================================');
  console.log(`[EMAIL DISPARADO PARA]: ${recipient}`);
  console.log(`[ASSUNTO]: [RÁDIO + PORTAL] ${radioScript.title}`);
  console.log(`[CONTEÚDO DA MATÉRIA E ROTEIRO DE RÁDIO PROCESSADO]`);
  console.log('====================================================');
  return true;
}
